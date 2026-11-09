import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  ShaderMaterial,
  Vector3,
} from 'three'
import { oceanState } from '../../lib/ocean'

/**
 * Bubbles that stream from the mouse cursor while the camera is underwater.
 * The <Canvas> is pointer-events:none, so we listen on `window` and unproject
 * the cursor into world space ourselves. A fixed pool of additive sprites is
 * recycled round-robin — no allocations in the frame loop.
 *
 * The pool + geometry live at module scope (like `oceanState` / `ATMOS`): they
 * are mutable every-frame state, not React state, and there is a single scene.
 */

const MAX = 120

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uPixelRatio;
  varying float vAlpha;

  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-mv.z, 0.6);
    gl_PointSize = aSize * uPixelRatio * (26.0 / dist);
    vAlpha = aAlpha * smoothstep(52.0, 14.0, dist);
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.08, d);
    float rim = smoothstep(0.46, 0.33, d) * smoothstep(0.14, 0.30, d);
    float a = (core * 0.30 + rim) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(vec3(0.80, 0.94, 0.96), a);
  }
`

type Sim = {
  pos: Float32Array
  size: Float32Array
  alpha: Float32Array
  life: Float32Array
  maxLife: Float32Array
  speed: Float32Array
  phase: Float32Array
}

function makeSim(): Sim {
  const pos = new Float32Array(MAX * 3)
  const size = new Float32Array(MAX)
  const alpha = new Float32Array(MAX)
  const life = new Float32Array(MAX)
  const maxLife = new Float32Array(MAX)
  const speed = new Float32Array(MAX)
  const phase = new Float32Array(MAX)
  for (let i = 0; i < MAX; i++) {
    pos[i * 3 + 0] = 0
    pos[i * 3 + 1] = -999
    pos[i * 3 + 2] = 0
    size[i] = 1
    alpha[i] = 0
    life[i] = 0
    maxLife[i] = 1
    speed[i] = 1
    phase[i] = Math.random()
  }
  return { pos, size, alpha, life, maxLife, speed, phase }
}

function makeGeometry(sim: Sim): BufferGeometry {
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(sim.pos, 3))
  g.setAttribute('aSize', new BufferAttribute(sim.size, 1))
  g.setAttribute('aAlpha', new BufferAttribute(sim.alpha, 1))
  g.boundingSphere = null
  return g
}

const sim = makeSim()
const geometry = makeGeometry(sim)

export function CursorBubbles({ reduced }: { reduced: boolean }) {
  const mouse = useRef({ x: 0, y: 0, active: false })
  const time = useRef(0)
  const spawnIndex = useRef(0)
  const spawnAcc = useRef(0)
  const target = useRef(new Vector3())
  const ndc = useRef(new Vector3())
  const dir = useRef(new Vector3())
  const mat = useRef<ShaderMaterial>(null)

  useEffect(() => {
    if (reduced) return
    const onMove = (e: PointerEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1
      mouse.current.active = true
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [reduced])

  useFrame(({ camera, gl }, delta) => {
    const dt = Math.min(delta, 0.05)
    time.current += dt
    const t = time.current
    const { pos, size, alpha, life, maxLife, speed, phase } = sim

    const underwater = oceanState.underwaterAmount
    const canSpawn = !reduced && mouse.current.active && underwater > 0.12

    // resolve the cursor ray to a point a fixed distance in front of the camera
    if (canSpawn) {
      ndc.current.set(mouse.current.x, mouse.current.y, 0.5).unproject(camera)
      dir.current.copy(ndc.current).sub(camera.position).normalize()
      target.current.copy(camera.position).addScaledVector(dir.current, 26)
    }

    for (let i = 0; i < MAX; i++) {
      if (life[i] > 0) {
        life[i] -= dt
        if (life[i] <= 0) {
          alpha[i] = 0
          pos[i * 3 + 1] = -999
        } else {
          pos[i * 3 + 1] += speed[i] * dt
          pos[i * 3 + 0] += Math.sin(t * 1.8 + phase[i] * 6.2831) * dt * 0.7
          pos[i * 3 + 2] += Math.cos(t * 1.4 + phase[i] * 5.1) * dt * 0.7
          const age = maxLife[i] - life[i]
          alpha[i] = Math.min(1, age / 0.15, life[i] / 0.35)
        }
      }
    }

    if (canSpawn) {
      spawnAcc.current += 1.5
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1
        const i = spawnIndex.current
        spawnIndex.current = (spawnIndex.current + 1) % MAX
        const r = Math.random
        pos[i * 3 + 0] = target.current.x + (r() - 0.5) * 2.4
        pos[i * 3 + 1] = target.current.y + (r() - 0.5) * 2.4
        pos[i * 3 + 2] = target.current.z + (r() - 0.5) * 2.4
        size[i] = 1.6 + r() * 2.8
        speed[i] = 0.9 + r() * 1.6
        maxLife[i] = 0.9 + r() * 0.8
        life[i] = maxLife[i]
        alpha[i] = 0
        phase[i] = r()
      }
    }

    geometry.attributes.position.needsUpdate = true
    geometry.attributes.aSize.needsUpdate = true
    geometry.attributes.aAlpha.needsUpdate = true

    if (mat.current) {
      const pr = gl.getPixelRatio()
      if (mat.current.uniforms.uPixelRatio.value !== pr) mat.current.uniforms.uPixelRatio.value = pr
    }
  })

  if (reduced) return null

  return (
    <points geometry={geometry} frustumCulled={false} renderOrder={6}>
      <shaderMaterial
        ref={mat}
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={{ uPixelRatio: { value: 1 } }}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </points>
  )
}
