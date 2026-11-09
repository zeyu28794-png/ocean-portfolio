import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { site } from '../../config/site'
import { prefersReducedMotion } from '../../lib/runtime'

export function Hero() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (prefersReducedMotion()) return

    // wait until the sea is actually on screen, so the wordmark reveals into
    // the scene instead of into an empty gradient
    let started = false
    let timer = 0
    const ctxRef = { current: null as gsap.Context | null }

    const start = () => {
      if (started) return
      started = true
      // on very slow devices it is better for the intro to catch up in real
      // time than to crawl frame by frame behind a starving rAF loop
      gsap.ticker.lagSmoothing(false)
      ctxRef.current = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.from('[data-hero="meta"]', { y: 14, opacity: 0, duration: 1.1, delay: 0.35 })
        .from(
          '[data-hero="title"]',
          { y: 90, opacity: 0, duration: 1.5, ease: 'expo.out' },
          '-=0.85',
        )
        .from('[data-hero="rule"]', { scaleX: 0, opacity: 0, duration: 1.3, transformOrigin: 'left' }, '-=1.1')
        .from(
          '[data-hero="line"]',
          { y: 24, opacity: 0, duration: 0.9, stagger: 0.08 },
          '-=1.0',
        )
        .from('[data-hero="foot"]', { y: 14, opacity: 0, duration: 0.9 }, '-=0.7')
    }, el)
    }

    timer = window.setTimeout(start, 1600)
    window.addEventListener('ocean:ready', start, { once: true })

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('ocean:ready', start)
      ctxRef.current?.revert()
    }
  }, [])

  // hero copy leaves the stage as the dive starts
  useEffect(() => {
    if (prefersReducedMotion()) return
    const el = root.current?.querySelector<HTMLElement>('.hero-inner')
    if (!el) return
    let raf = 0
    const tick = () => {
      raf = requestAnimationFrame(tick)
      const y = window.scrollY
      const limit = window.innerHeight * 0.9
      const p = Math.min(1, y / limit)
      el.style.opacity = String(1 - p * 0.95)
      el.style.transform = `translate3d(0, ${-y * 0.14}px, 0)`
      if (y > limit * 1.4) el.style.visibility = 'hidden'
      else el.style.visibility = 'visible'
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section id="home" data-section ref={root} className="hero veil-soft">
      <div className="hero-inner">
        <div className="hero-meta" data-hero="meta">
          <span>{site.meta[0]}</span>
          <i />
          <span>{site.year}</span>
          <span>{site.meta[1]}</span>
        </div>

        <h1 className="hero-title" data-hero="title">
          {site.wordmark}
          <i>.</i>
        </h1>

        <div className="hero-rule" data-hero="rule" />

        <div className="hero-row">
          <div className="hero-tagline">
            <p className="tagline-en" data-hero="line">
              {site.tagline.en}
            </p>
            <p className="tagline-zh" data-hero="line">
              {site.tagline.zh}
            </p>
          </div>

          <div className="hero-actions" data-hero="line">
            <button className="btn" onClick={() => go('about')} type="button">
              Explore
              <i aria-hidden="true">↓</i>
            </button>
            <a
              className="btn"
              href="#projects"
              onClick={(e) => {
                e.preventDefault()
                go('projects')
              }}
            >
              Selected works <i aria-hidden="true">↗</i>
            </a>
          </div>
        </div>

        <div className="hero-foot" data-hero="foot">
          <span>
            {site.name} · {site.role}
          </span>
          <a
            className="scroll-cue"
            href="#about"
            onClick={(e) => {
              e.preventDefault()
              go('about')
            }}
          >
            Scroll to descend <em />
          </a>
          <span>Surface · 0.0 m</span>
        </div>
      </div>
    </section>
  )
}
