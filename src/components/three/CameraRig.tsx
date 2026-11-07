import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, type PerspectiveCamera } from 'three'
import { damp, scroll } from '../../lib/runtime'
import { samplePath, type PathKey } from '../../lib/cameraPath'

/**
 * Scroll → camera. Two layers of smoothing only (scroll progress, then a
 * critically damped follower) so the motion keeps a little inertia without
 * ever feeling like it lags behind the text.
 */
export function CameraRig({ path, reduced }: { path: PathKey[]; reduced: boolean }) {
  const base = useRef(new Vector3(0, 11.5, 30))
  const look = useRef(new Vector3(0, 4.8, -70))
  const target = useRef(new Vector3())
  const targetLook = useRef(new Vector3())
  const fov = useRef(54)
  const ready = useRef(false)

  useFrame(({ camera, clock }, dt) => {
    const d = Math.min(dt, 0.05)
    const delta = scroll.raw - scroll.smooth
    scroll.velocity = Math.abs(delta)
    scroll.smooth += delta * damp(6.5, d)

    const s = samplePath(path, scroll.smooth)
    target.current.set(s.pos[0], s.pos[1], s.pos[2])
    targetLook.current.set(s.look[0], s.look[1], s.look[2])

    if (!ready.current) {
      base.current.copy(target.current)
      look.current.copy(targetLook.current)
      fov.current = s.fov
      ready.current = true
    }

    base.current.lerp(target.current, damp(5.4, d))
    look.current.lerp(targetLook.current, damp(4.6, d))

    // a breath of hand-held motion, mostly for the surface shots
    const t = clock.elapsedTime
    const amp = reduced ? 0 : 1
    const swayX = Math.sin(t * 0.31) * 0.14 * amp
    const swayY = Math.sin(t * 0.23 + 1.7) * 0.09 * amp
    const swayZ = Math.cos(t * 0.19 + 0.4) * 0.1 * amp

    camera.position.set(
      base.current.x + swayX,
      base.current.y + swayY,
      base.current.z + swayZ,
    )
    camera.lookAt(look.current)
    if (!reduced) camera.rotateZ(Math.sin(t * 0.17) * 0.0035)

    if (Math.abs(fov.current - s.fov) > 0.01) {
      fov.current += (s.fov - fov.current) * damp(4, d)
      const cam = camera as PerspectiveCamera
      cam.fov = fov.current
      cam.updateProjectionMatrix()
    }
  })

  return null
}
