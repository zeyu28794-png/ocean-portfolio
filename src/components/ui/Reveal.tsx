import { useEffect, useRef, type ReactNode } from 'react'

type RevealProps = {
  children: ReactNode
  /** stagger offset in ms */
  delay?: number
  className?: string
}

/**
 * Content reveal. IntersectionObserver only — no scroll listeners, no per-frame
 * layout reads, and it unobserves after the first pass.
 */
export function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in')
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`reveal ${className}`.trim()}
      style={{ ['--delay' as string]: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
