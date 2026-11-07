/**
 * Three-free runtime state.
 * The DOM layer (nav, depth meter, hero) reads from here, so importing this
 * module never drags three.js into the initial bundle.
 */

export const clamp = (v: number, min: number, max: number) => (v < min ? min : v > max ? max : v)

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1)
  return t * t * (3 - 2 * t)
}

/** frame-rate independent damping factor */
export const damp = (lambda: number, dt: number) => 1 - Math.exp(-lambda * dt)

/* ------------------------------------------------------------------ */
/* scroll                                                              */
/* ------------------------------------------------------------------ */

export const scroll = {
  raw: 0,
  /** damped by the camera rig */
  smooth: 0,
  velocity: 0,
}

export const runtime = {
  /** metres below the surface, written by the 3D driver */
  depth: 0,
  /** 1 above water, 0 below */
  above: 1,
  /** true once the WebGL scene has mounted */
  ready: false,
}

export function readScrollProgress(): number {
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  if (max <= 0) return 0
  return clamp(window.scrollY / max, 0, 1)
}

/**
 * Normalised scroll progress of every `[data-section]` anchor.
 * The camera path is authored in "section units" (index + local fraction) and
 * resolved through these stops, so each keyframe always lines up with the
 * section that owns it — no hard-coded pixel math.
 */
export function readSectionStops(): number[] {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-section]'))
  if (!els.length) return []
  const doc = document.documentElement
  const max = Math.max(1, doc.scrollHeight - window.innerHeight)
  return els.map((el) => {
    const top = el.getBoundingClientRect().top + window.scrollY
    return clamp(top / max, 0, 1)
  })
}

/* ------------------------------------------------------------------ */
/* quality                                                             */
/* ------------------------------------------------------------------ */

export type Quality = 'high' | 'medium' | 'low'

export type QualitySettings = {
  oceanSegments: number
  floorSegments: number
  snow: number
  fish: number
  shafts: number
  rocks: number
  dpr: [number, number]
}

const PRESETS: Record<Quality, QualitySettings> = {
  high: {
    oceanSegments: 220,
    floorSegments: 168,
    snow: 1500,
    fish: 150,
    shafts: 14,
    rocks: 90,
    dpr: [1, 1.75],
  },
  medium: {
    oceanSegments: 150,
    floorSegments: 132,
    snow: 900,
    fish: 96,
    shafts: 10,
    rocks: 64,
    dpr: [1, 1.5],
  },
  low: {
    oceanSegments: 104,
    floorSegments: 96,
    snow: 460,
    fish: 54,
    shafts: 6,
    rocks: 36,
    dpr: [1, 1.25],
  },
}

export function qualitySettings(q: Quality): QualitySettings {
  return PRESETS[q]
}

export function detectQuality(): Quality {
  if (typeof window === 'undefined') return 'medium'
  const w = window.innerWidth
  const coarse = window.matchMedia('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  if (w < 760 || cores <= 4 || mem <= 4) return 'low'
  if (coarse || w < 1280 || cores <= 6) return 'medium'
  return 'high'
}

/* ------------------------------------------------------------------ */
/* capability                                                          */
/* ------------------------------------------------------------------ */

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

/** reduced motion, read without React so the 3D layer can use it too */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
