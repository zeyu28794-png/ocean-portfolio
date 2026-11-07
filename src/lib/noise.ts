import { mulberry32 } from './rand'

/**
 * Small deterministic value-noise + fbm used for the seabed heightfield.
 * Evaluated on the CPU once, so the terrain is free at runtime — and rocks
 * can be planted on the exact same surface.
 */

const PERM = (() => {
  const rnd = mulberry32(1337)
  const p = new Uint8Array(512)
  const base = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255]
  return p
})()

const fade = (t: number) => t * t * (3 - 2 * t)

const grad2 = (hash: number, x: number, y: number) => {
  switch (hash & 3) {
    case 0:
      return x + y
    case 1:
      return -x + y
    case 2:
      return x - y
    default:
      return -x - y
  }
}

export function noise2(x: number, y: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const xf = x - xi
  const yf = y - yi
  const u = fade(xf)
  const v = fade(yf)
  const a = PERM[(xi & 255) + PERM[yi & 255]]
  const b = PERM[(xi + 1 & 255) + PERM[yi & 255]]
  const c = PERM[(xi & 255) + PERM[(yi + 1) & 255]]
  const d = PERM[(xi + 1 & 255) + PERM[(yi + 1) & 255]]
  const x1 = grad2(a, xf, yf) + u * (grad2(b, xf - 1, yf) - grad2(a, xf, yf))
  const x2 =
    grad2(c, xf, yf - 1) + u * (grad2(d, xf - 1, yf - 1) - grad2(c, xf, yf - 1))
  return (x1 + v * (x2 - x1)) * 0.5
}

export function fbm2(x: number, y: number, octaves = 4): number {
  let amp = 0.5
  let freq = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += noise2(x * freq, y * freq) * amp
    norm += amp
    amp *= 0.5
    freq *= 2.03
  }
  return sum / norm
}

/** seabed relief, in world units, relative to the floor plane datum */
export function seabedHeight(x: number, z: number): number {
  const ridge = fbm2(x * 0.0052, z * 0.0052, 4) * 24
  const dune = fbm2(x * 0.028, z * 0.028, 3) * 2.4
  const canyon = -Math.pow(Math.max(0, noise2(x * 0.0016, z * 0.0016) * 2), 2) * 18
  return ridge + dune + canyon
}

/** fine ripple banding, exposed for the shader-free CPU path */
export function seabedRipples(x: number, z: number): number {
  return Math.sin(x * 0.35 + noise2(x * 0.01, z * 0.01) * 6) * 0.5 + 0.5
}
