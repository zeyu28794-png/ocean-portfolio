import { Suspense, lazy, useEffect, useState } from 'react'
import { Nav } from './components/ui/Nav'
import { Hero } from './components/ui/Hero'
import { About } from './components/ui/About'
import { Projects } from './components/ui/Projects'
import { Journey } from './components/ui/Journey'
import { Contact } from './components/ui/Contact'
import { DepthMeter } from './components/ui/DepthMeter'
import { scroll, readScrollProgress, hasWebGL } from './lib/runtime'
import { useReducedMotion } from './hooks/useReducedMotion'
import { site } from './config/site'

// The 3D layer is split out: three.js never lands in the initial payload.
const OceanExperience = lazy(() => import('./components/three/OceanExperience'))

export default function App() {
  const reduced = useReducedMotion()
  // capability probe runs once, during render — it never changes per session
  const [webgl] = useState<boolean | null>(() => hasWebGL())
  // let the text paint before we spin up WebGL
  const [showScene, setShowScene] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setShowScene(true), 60)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      scroll.raw = readScrollProgress()
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  // retire the first-paint gradient once the sea has actually rendered
  useEffect(() => {
    const boot = document.getElementById('boot')
    if (!boot) return
    if (webgl === false) {
      boot.classList.add('gone')
      window.dispatchEvent(new Event('ocean:ready'))
      return
    }
    const done = () => boot.classList.add('gone')
    window.addEventListener('ocean:ready', done, { once: true })
    const safety = window.setTimeout(done, 2600)
    return () => {
      window.removeEventListener('ocean:ready', done)
      window.clearTimeout(safety)
    }
  }, [webgl])

  return (
    <>
      <div className="scene-layer">
        {webgl === false && <div className="no-webgl" />}
        {webgl && showScene && (
          <Suspense fallback={<div className="scene-boot" />}>
            <OceanExperience reduced={reduced} />
          </Suspense>
        )}
      </div>

      <div className="grade" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <Nav />
      <DepthMeter />

      <main className="page">
        <Hero />
        <About />
        <Projects />
        <Journey />
        <Contact />
      </main>

      <footer className="footer">
        <span>{site.footer.left}</span>
        <span>{site.footer.middle}</span>
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' })
          }}
        >
          Back to surface ↑
        </a>
      </footer>
    </>
  )
}
