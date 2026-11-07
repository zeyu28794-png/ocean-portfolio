import { useEffect, useRef } from 'react'
import { runtime } from '../../lib/runtime'
import { useDepthReadout } from '../../hooks/useUiState'

const MAX_DEPTH = 52

/** Vertical depth gauge — the site's one piece of persistent instrumentation. */
export function DepthMeter() {
  const value = useRef<HTMLSpanElement>(null)
  const marker = useRef<HTMLElement>(null)

  useDepthReadout(value, '0.0')

  useEffect(() => {
    let raf = 0
    let last = -1
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = marker.current
      if (!el) return
      const pct = Math.round(Math.min(1, runtime.depth / MAX_DEPTH) * 200) / 2
      if (pct !== last) {
        last = pct
        el.style.top = `${pct}%`
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="depth-meter" aria-hidden="true">
      <span>
        MINUS <b ref={value}>0.0</b> M
      </span>
      <div className="depth-rail">
        <div className="depth-ticks">
          {Array.from({ length: 7 }, (_, i) => (
            <s key={i} />
          ))}
        </div>
        <i ref={marker} style={{ top: '0%' }} />
      </div>
      <span>ABYSS</span>
    </div>
  )
}
