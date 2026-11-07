import { clamp } from './runtime'

export type CamKey = {
  /** authored in "section units": index + local fraction (0..1) */
  at: number
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

/**
 * The dive. One continuous path from the shoreline (y ≈ +11) down to the
 * abyssal plain (y ≈ −52), where it holds for the closing shot.
 *
 * Keyframes are linear in scroll space on purpose: the camera never backtracks,
 * so the surface is pierced exactly once and the descent reads as one motion.
 */
export const CAM_KEYS: CamKey[] = [
  // ── 00 Home — over the water, horizon high in frame
  { at: 0.0, pos: [0, 11.5, 30], look: [0, 4.8, -70], fov: 54 },
  { at: 0.55, pos: [0, 7.6, 21], look: [0, 3.9, -70], fov: 54 },

  // ── 01 About — glide down to the surface, then break through it
  { at: 1.08, pos: [0, 2.8, 13.5], look: [0, 2.5, -70], fov: 52 },
  { at: 1.55, pos: [0, 0.85, 9.5], look: [0, 2.1, -80], fov: 50 },
  { at: 1.98, pos: [0, -2.6, 7.2], look: [0, 7.5, -38], fov: 57 },

  // ── 02 Projects — shallow shelf
  { at: 2.16, pos: [0, -6.5, 4.5], look: [0, -2.5, -46], fov: 58 },
  { at: 2.7, pos: [0, -19, 2.2], look: [0, -15, -46], fov: 58 },
  { at: 2.99, pos: [0, -25, 1.2], look: [0, -20.5, -46], fov: 58 },

  // ── 03 Journey — the descent
  { at: 3.2, pos: [0, -38, 0.4], look: [0, -33, -46], fov: 56 },
  { at: 3.85, pos: [0, -51, 0], look: [0, -46, -46], fov: 54 },

  // ── 04 Contact — hold the abyssal depth, no ascent
  { at: 4.3, pos: [0, -51, 0.4], look: [0, -46, -46], fov: 54 },
  { at: 4.78, pos: [0, -52, 0.2], look: [0, -46, -46], fov: 54 },
  { at: 5.0, pos: [0, -52, 0], look: [0, -46, -46], fov: 54 },
]

export type PathKey = {
  p: number
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

/** Resolve section-unit keyframes into scroll-progress keyframes. */
export function buildPath(stops: number[]): PathKey[] {
  const n = stops.length
  if (n < 2) return CAM_KEYS.map((k) => ({ ...k, p: clamp(k.at / 5, 0, 1) }))

  const toProgress = (at: number) => {
    // `at` runs 0..n where section i spans [i, i+1]. `at === n` means the very
    // end of the last section, so fold it back to index n-1 with frac 1 — the
    // old code left idx = n and frac = 0, which mapped the final keyframe to
    // the *start* of the last section and scrambled the closing ascent.
    const idx = Math.min(Math.floor(at), n - 1)
    const frac = at - idx
    const start = stops[idx]
    const end = idx + 1 < n ? stops[idx + 1] : 1
    return start + (end - start) * clamp(frac, 0, 1)
  }

  return CAM_KEYS.map((k) => ({
    p: clamp(toProgress(k.at), 0, 1),
    pos: k.pos,
    look: k.look,
    fov: k.fov,
  })).sort((a, b) => a.p - b.p)
}

export type Sampled = {
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
}

const out: Sampled = { pos: [0, 0, 0], look: [0, 0, 0], fov: 54 }

/** Linear sample of the path — motion is then smoothed by the damped follower. */
export function samplePath(path: PathKey[], p: number): Sampled {
  if (!path.length) return out
  let i = 0
  while (i < path.length - 2 && p > path[i + 1].p) i++
  const a = path[i]
  const b = path[i + 1] ?? a
  const span = b.p - a.p
  const t = span > 1e-6 ? clamp((p - a.p) / span, 0, 1) : 0

  out.pos[0] = a.pos[0] + (b.pos[0] - a.pos[0]) * t
  out.pos[1] = a.pos[1] + (b.pos[1] - a.pos[1]) * t
  out.pos[2] = a.pos[2] + (b.pos[2] - a.pos[2]) * t
  out.look[0] = a.look[0] + (b.look[0] - a.look[0]) * t
  out.look[1] = a.look[1] + (b.look[1] - a.look[1]) * t
  out.look[2] = a.look[2] + (b.look[2] - a.look[2]) * t
  out.fov = a.fov + (b.fov - a.fov) * t
  return out
}
