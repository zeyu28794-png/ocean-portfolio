import { useEffect, useState, type RefObject } from 'react'
import { runtime } from '../lib/runtime'

/** Writes the live depth into a text node without ever re-rendering React. */
export function useDepthReadout(ref: RefObject<HTMLElement | null>, zeroLabel = '0.0') {
  useEffect(() => {
    let raf = 0
    let last = ''
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const el = ref.current
      if (!el) return
      const d = runtime.depth
      const txt = d < 0.08 ? zeroLabel : d.toFixed(1)
      if (txt !== last) {
        last = txt
        el.textContent = txt
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [ref, zeroLabel])
}

/** Which section owns the middle of the viewport. */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    let raf = 0
    let queued = false

    const measure = () => {
      queued = false
      const mid = window.innerHeight * 0.42
      let current = ids[0] ?? ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (!el) continue
        if (el.getBoundingClientRect().top <= mid) current = id
      }
      setActive((prev) => (prev === current ? prev : current))
    }

    const onScroll = () => {
      if (queued) return
      queued = true
      raf = requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ids])

  return active
}
