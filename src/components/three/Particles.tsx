import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, type ShaderMaterial } from 'three'
import { ATMOS } from './shaders/common'
import { oceanState } from '../../lib/ocean'
import type { QualitySettings } from '../../lib/runtime'
import { mulberry32 } from '../../lib/rand'

/**
 * Marine snow + bubbles in one draw call.
 * Particles live in a box that follows the camera, so the water always feels
 * particulate without ever paying for more than a few hundred sprites.
 */

const vert = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aKind;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uOpacity;

  varying float vAlpha;
  varying float vKind;

  void main() {
    vec3 p = position;

    p.x += sin(uTime * 0.31 + aPhase * 6.2831) * 0.85;
    p.z += cos(uTime * 0.27 + aPhase * 5.113) * 0.85;

    // slow rise, wrapped inside the 80-unit-tall box
    p.y = mod(p.y + uTime * aSpeed + aPhase * 80.0, 80.0) - 40.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = max(-mv.z, 0.6);

    gl_PointSize = aSize * uPixelRatio * (26.0 / dist);
    vAlpha = uOpacity * smoothstep(44.0, 14.0, dist) * smoothstep(0.8, 3.5, dist);
    vKind = aKind;
    gl_Position = projectionMatrix * mv;
  }
`

const frag = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;
  varying float vKind;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.06, d);
    float rim = smoothstep(0.46, 0.33, d) * smoothstep(0.16, 0.33, d) * vKind;
    float a = (core * (1.0 - vKind) + (rim + core * 0.32) * vKind) * vAlpha;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
  }
`

export function Particles({ quality }: { quality: QualitySettings }) {
  const group = useRef<Group>(null)
  const mat = useRef<ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const n = quality.snow
    const rnd = mulberry32(777)
    const pos = new Float32Array(n * 3)
    const size = new Float32Array(n)
    const phase = new Float32Array(n)
    const speed = new Float32Array(n)
    const kind = new Float32Array(n)

    for (let i = 0; i < n; i++) {
      const bubble = rnd() > 0.88
      pos[i * 3 + 0] = (rnd() - 0.5) * 74
      pos[i * 3 + 1] = (rnd() - 0.5) * 80
      pos[i * 3 + 2] = (rnd() - 0.5) * 74
      size[i] = bubble ? 1.8 + rnd() * 2.6 : 0.7 + rnd() * 1.5
      phase[i] = rnd()
      speed[i] = bubble ? 1.6 + rnd() * 1.5 : 0.1 + rnd() * 0.3
      kind[i] = bubble ? 1 : 0
    }

    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSize', new BufferAttribute(size, 1))
    g.setAttribute('aPhase', new BufferAttribute(phase, 1))
    g.setAttribute('aSpeed', new BufferAttribute(speed, 1))
    g.setAttribute('aKind', new BufferAttribute(kind, 1))
    g.boundingSphere = null
    return g
  }, [quality.snow])

  const uniforms = useMemo(
    () => ({
      uTime: ATMOS.uTime,
      uPixelRatio: { value: 1 },
      uOpacity: { value: 0 },
      uColor: { value: ATMOS.uSunColor.value.clone().lerp(ATMOS.uMid.value, 0.6) },
    }),
    [],
  )

  useFrame(({ camera, gl }) => {
    if (group.current) group.current.position.copy(camera.position)
    const m = mat.current
    if (m) {
      m.uniforms.uOpacity.value =
        0.6 * oceanState.underwaterAmount * Math.min(1, Math.max(0, 1 - oceanState.depth / 95))
      const pr = gl.getPixelRatio()
      if (m.uniforms.uPixelRatio.value !== pr) m.uniforms.uPixelRatio.value = pr
    }
  })

  return (
    <group ref={group}>
      <points geometry={geometry} frustumCulled={false} renderOrder={5}>
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </points>
    </group>
  )
}
