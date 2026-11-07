import { Color } from 'three'
import { clamp, lerp, runtime, smoothstep } from './runtime'

/* ------------------------------------------------------------------ */
/* underwater atmosphere — the three.js side of the shared state       */
/* ------------------------------------------------------------------ */

type FogStop = { y: number; color: Color; density: number }

/** camera height → water colour / fog density (surface first, abyss last) */
const FOG_STOPS: FogStop[] = [
  { y: 40, color: new Color('#c6d4c9'), density: 0.0018 },
  { y: 3, color: new Color('#b6c9c1'), density: 0.0024 },
  { y: -0.5, color: new Color('#2a6b7a'), density: 0.0085 },
  { y: -12, color: new Color('#14566a'), density: 0.0112 },
  { y: -32, color: new Color('#072c3c'), density: 0.0142 },
  { y: -58, color: new Color('#03161f'), density: 0.0168 },
  { y: -95, color: new Color('#020e15'), density: 0.019 },
]

export const oceanState = {
  time: 0,
  y: 0,
  depth: 0,
  above: 1,
  fogColor: new Color('#c6d4c9'),
  fogDensity: 0.002,
  underwaterAmount: 0,
}

let scan = 0

/** Sample the water column for a given camera height. Allocation-free. */
export function sampleAtmosphere(y: number) {
  let i = 0
  while (i < FOG_STOPS.length - 2 && y < FOG_STOPS[i + 1].y) i++
  scan = i

  const a = FOG_STOPS[scan]
  const b = FOG_STOPS[scan + 1]
  const t = clamp((a.y - y) / (a.y - b.y || 1), 0, 1)

  oceanState.fogColor.copy(a.color).lerp(b.color, t)
  oceanState.fogDensity = lerp(a.density, b.density, t)
  oceanState.y = y
  oceanState.depth = Math.max(0, -y)
  oceanState.above = y > 0 ? 1 : 0
  oceanState.underwaterAmount = smoothstep(0.6, -3.5, y)

  runtime.depth = oceanState.depth
  runtime.above = oceanState.above
}
