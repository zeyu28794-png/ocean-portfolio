import { useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Sky, OceanSurface } from './OceanSurface'
import { Seafloor, Rocks, SceneAtmosphere } from './Seafloor'
import { Headland } from './Headland'
import { LightShafts } from './LightShafts'
import { Particles } from './Particles'
import { CursorBubbles } from './CursorBubbles'
import { FishSchool } from './FishSchool'
import { CameraRig } from './CameraRig'
import { oceanState, sampleAtmosphere } from '../../lib/ocean'
import { detectQuality, qualitySettings, readSectionStops } from '../../lib/runtime'
import { buildPath, type PathKey } from '../../lib/cameraPath'
import { ATMOS } from './shaders/common'

/**
 * Marker written on <html> so you can confirm in DevTools — or from the console
 * with `document.documentElement.dataset.scene` — that the browser really
 * loaded the ocean build. If an older scene ever shows up again:
 *   npm run clean && npm run build && npm run preview
 */
const SCENE_ID = 'ocean-v2'

/** One clock, one atmosphere sample per frame, shared by every material. */
function AtmosphereDriver() {
  useFrame(({ camera, clock }) => {
    ATMOS.uTime.value = clock.elapsedTime
    sampleAtmosphere(camera.position.y)
    ATMOS.uFogColor.value.copy(oceanState.fogColor)
    ATMOS.uFogDensity.value = oceanState.fogDensity
    ATMOS.uUnder.value = oceanState.underwaterAmount
  }, -30)
  return null
}

const HIDE = new Set(
  typeof window === 'undefined'
    ? []
    : (new URLSearchParams(window.location.search).get('hide') ?? '').split(','),
)

export default function OceanExperience({ reduced }: { reduced: boolean }) {
  const quality = useMemo(() => detectQuality(), [])
  const settings = useMemo(() => qualitySettings(quality), [quality])
  const [dpr, setDpr] = useState(settings.dpr[1])
  const [path, setPath] = useState<PathKey[]>(() => buildPath(readSectionStops()))

  useEffect(() => {
    document.documentElement.dataset.scene = SCENE_ID
    console.info('[OCEAN] scene build:', SCENE_ID)
    const onResize = () => setPath(buildPath(readSectionStops()))
    window.addEventListener('resize', onResize)
    // fonts and late layout can still shift section tops
    const t1 = window.setTimeout(onResize, 400)
    const t2 = window.setTimeout(onResize, 1800)
    // rebuild once the webfonts actually land, so the section anchors track the
    // final text metrics instead of the fallback-font layout
    let fontsReady = false
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        fontsReady = true
        onResize()
      })
    }
    return () => {
      window.removeEventListener('resize', onResize)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      void fontsReady
    }
  }, [])

  return (
    <Canvas
      flat
      dpr={dpr}
      gl={{
        antialias: true,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      camera={{ fov: 54, near: 0.4, far: 7000, position: [0, 11.5, 30] }}
      onCreated={({ gl }) => {
        gl.setClearColor('#0a1f2a', 1)
        requestAnimationFrame(() => window.dispatchEvent(new Event('ocean:ready')))
      }}
      style={{ pointerEvents: 'none' }}
    >
      <fogExp2 attach="fog" args={['#c6d4c9', 0.002]} />

      {/* lights only feed the seabed rocks — everything else is shader-lit */}
      <hemisphereLight args={['#93b6bd', '#0a1a20', 1.1]} />
      <directionalLight position={[-40, 120, 40]} intensity={1.5} />

      <AtmosphereDriver />
      <SceneAtmosphere />
      <CameraRig path={path} reduced={reduced} />

      <Sky hide={HIDE.has('sky')} />
      <Headland hide={HIDE.has('land')} />
      <OceanSurface quality={settings} hide={HIDE.has('water')} />

      <Seafloor quality={settings} hide={HIDE.has('floor')} />
      <Rocks quality={settings} />

      <LightShafts quality={settings} />
      <FishSchool quality={settings} />
      <Particles quality={settings} />
      <CursorBubbles reduced={reduced} />

      <PerformanceMonitor
        flipflops={3}
        onDecline={() => setDpr((v) => Math.max(1, v - 0.25))}
        onIncline={() => setDpr((v) => Math.min(settings.dpr[1], v + 0.25))}
      />
    </Canvas>
  )
}
