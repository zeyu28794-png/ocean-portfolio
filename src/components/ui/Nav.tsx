import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { site } from '../../config/site'
import { useDepthReadout, useActiveSection } from '../../hooks/useUiState'

const LINKS = [
  { id: 'home', label: 'Home', n: '00' },
  { id: 'about', label: 'About', n: '01' },
  { id: 'projects', label: 'Projects', n: '02' },
  { id: 'journey', label: 'Journey', n: '03' },
  { id: 'contact', label: 'Contact', n: '04' },
] as const

const IDS = LINKS.map((l) => l.id)

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const depth = useRef<HTMLSpanElement>(null)
  const active = useActiveSection(IDS)

  useDepthReadout(depth)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const jump = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    setOpen(false)
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <header className={`nav-shell ${scrolled ? 'is-scrolled' : ''}`}>
        <a className="brand" href="#home" onClick={(e) => jump(e, 'home')} aria-label="OCEAN, back to top">
          {site.wordmark}
          <i>.</i>
          <small>{site.role}</small>
        </a>

        <nav className="nav-links" aria-label="Main">
          {LINKS.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className={`nav-link ${active === l.id ? 'is-active' : ''}`}
              onClick={(e) => jump(e, l.id)}
              aria-current={active === l.id ? 'page' : undefined}
            >
              {l.label}
              <span />
            </a>
          ))}
        </nav>

        <div className="nav-depth" aria-hidden="true">
          <span>DEPTH</span>
          <b>
            <span ref={depth}>0.0</span> M
          </b>
        </div>

        <button
          className={`nav-burger ${open ? 'is-open' : ''}`}
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? '关闭菜单' : '打开菜单'}
          aria-expanded={open}
        >
          <span />
        </button>
      </header>

      <div className={`nav-sheet ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        {LINKS.map((l, i) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={(e) => jump(e, l.id)}
            style={{ transitionDelay: open ? `${80 + i * 55}ms` : '0ms' }}
            tabIndex={open ? 0 : -1}
          >
            {l.label}
            <em>{l.n}</em>
          </a>
        ))}
      </div>
    </>
  )
}
