import { useId } from 'react'
import type { Project } from '../../config/site'

/**
 * Procedural cover art. Four motifs, one per project — no stock imagery, all
 * drawn from the same cartographic vocabulary as the rest of the site.
 */

const VB_W = 400
const VB_H = 260

function Tide() {
  return (
    <>
      {Array.from({ length: 17 }, (_, i) => {
        const baseY = 18 + i * 14
        const amp = 5 + Math.sin(i * 1.7) * 4.5 + i * 0.35
        const pts = Array.from({ length: 44 }, (_, k) => {
          const x = (k / 43) * VB_W
          const y =
            baseY +
            Math.sin(k * 0.34 + i * 0.85) * amp * 0.6 +
            Math.sin(k * 0.15 + i * 0.4) * amp * 0.4
          return `${x.toFixed(1)},${y.toFixed(1)}`
        }).join(' ')
        const hero = i === 8
        return (
          <polyline
            key={i}
            points={pts}
            fill="none"
            stroke={hero ? '#e0a071' : 'rgba(214,232,232,0.55)'}
            strokeWidth={hero ? 1.1 : 0.6}
            opacity={hero ? 0.95 : 0.34 + Math.abs(8 - i) * 0.02}
          />
        )
      })}
    </>
  )
}

function Coastline() {
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const r = 24 + i * 15
        const pts = Array.from({ length: 56 }, (_, k) => {
          const a = (k / 56) * Math.PI * 2
          const rr =
            r *
            (1 +
              0.17 * Math.sin(a * 3 + i * 0.62) +
              0.08 * Math.sin(a * 7 - i * 1.1) +
              0.04 * Math.sin(a * 13 + i * 0.3))
          return `${(200 + Math.cos(a) * rr * 1.35).toFixed(1)},${(132 + Math.sin(a) * rr * 0.8).toFixed(1)}`
        }).join(' ')
        return (
          <polygon
            key={i}
            points={pts}
            fill="none"
            stroke={i === 4 ? 'rgba(232,246,244,0.85)' : 'rgba(214,232,232,0.5)'}
            strokeWidth={i === 4 ? 1.05 : 0.55}
            opacity={0.24 + (10 - i) * 0.05}
          />
        )
      })}
      <circle cx="200" cy="132" r="2" fill="#e0a071" />
    </>
  )
}

function Island() {
  const cols = 26
  const rows = 16
  return (
    <>
      {Array.from({ length: rows * cols }, (_, i) => {
        const cx = i % cols
        const cy = Math.floor(i / cols)
        const x = 14 + (cx / (cols - 1)) * (VB_W - 28)
        const y = 16 + (cy / (rows - 1)) * (VB_H - 32)
        const d = Math.hypot((x - 232) / 1.35, y - 118) / 78
        const r = Math.max(0.45, 2.1 - d * 2.0)
        const warm = d < 0.55
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={r}
            fill={warm ? '#e0a071' : 'rgba(214,232,232,0.75)'}
            opacity={warm ? 0.95 : 0.42}
          />
        )
      })}
      <circle cx="232" cy="118" r="72" fill="none" stroke="rgba(232,246,244,0.35)" strokeWidth="0.7" />
      <circle cx="232" cy="118" r="98" fill="none" stroke="rgba(232,246,244,0.18)" strokeWidth="0.6" />
    </>
  )
}

function Abyss() {
  const uid = useId()
  const beam = `beam-${uid}`
  const strata = `strata-${uid}`
  return (
    <>
      <defs>
        <linearGradient id={beam} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe6c2" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffe6c2" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={strata} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(214,232,232,0.55)" />
          <stop offset="100%" stopColor="rgba(214,232,232,0.05)" />
        </linearGradient>
      </defs>
      <rect x="252" y="0" width="52" height={VB_H} fill={`url(#${beam})`} opacity="0.55" />
      {Array.from({ length: 22 }, (_, i) => {
        const y = 14 + Math.pow(i / 21, 1.5) * (VB_H - 24)
        return (
          <line
            key={i}
            x1={0}
            x2={VB_W}
            y1={y}
            y2={y}
            stroke={`url(#${strata})`}
            strokeWidth={i % 5 === 0 ? 1 : 0.5}
            opacity={0.1 + (i / 22) * 0.7}
          />
        )
      })}
      <line x1="0" x2={VB_W} y1={VB_H - 40} y2={VB_H - 40} stroke="#e0a071" strokeWidth="0.9" opacity="0.6" />
    </>
  )
}

const MOTIFS = { 1: Tide, 2: Coastline, 3: Island, 4: Abyss } as const

export function CoverArt({ motif }: { motif: Project['motif'] }) {
  const Motif = MOTIFS[motif]
  return (
    <svg viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* crop marks */}
      <g stroke="rgba(238,244,242,0.3)" strokeWidth="0.7">
        <path d="M12 20 L12 12 L20 12" fill="none" />
        <path d={`M${VB_W - 20} 12 L${VB_W - 12} 12 L${VB_W - 12} 20`} fill="none" />
        <path d={`M12 ${VB_H - 20} L12 ${VB_H - 12} L20 ${VB_H - 12}`} fill="none" />
        <path d={`M${VB_W - 20} ${VB_H - 12} L${VB_W - 12} ${VB_H - 12} L${VB_W - 12} ${VB_H - 20}`} fill="none" />
      </g>
      <Motif />
    </svg>
  )
}
