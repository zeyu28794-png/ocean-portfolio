import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  type ShaderMaterial,
} from 'three'
import { ATMOS, TAIL, fogChunk, filmicChunk } from './shaders/common'
import { oceanState } from '../../lib/ocean'
import type { QualitySettings } from '../../lib/runtime'
import { mulberry32 } from '../../lib/rand'

/**
 * Fish schools. All motion happens in the vertex shader from a per-instance
 * phase, so 150 fish cost one draw call and zero per-frame CPU work.
 * Each school is a horizontal band; a band only becomes visible when the camera
 * is near its depth, which keeps the density believable instead of a swarm.
 */

const vert = /* glsl */ `
  attribute vec3 aCenter;
  attribute float aPhase;
  attribute float aScale;
  attribute float aBand;

  uniform float uTime;
  uniform float uCamY;

  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vFade;
  varying float vBelly;

  vec3 orbit(float t, vec3 c, float ph) {
    float a = t + ph;
    return c + vec3(
      sin(a * 0.62) * 9.0 + sin(a * 1.31 + 1.7) * 2.2,
      sin(a * 0.86 + ph * 2.0) * 1.5,
      cos(a * 0.54) * 8.0 + cos(a * 0.29 + 0.6) * 2.6
    );
  }

  void main() {
    float t = uTime * 3.2;
    vec3 p0 = orbit(t, aCenter, aPhase);
    vec3 p1 = orbit(t + 0.14, aCenter, aPhase);

    vec3 fwd = normalize(p1 - p0 + vec3(0.0001, 0.0, 0.0));
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
    vec3 up = cross(fwd, right);

    vec3 local = position * aScale;

    // tail wiggle, stronger toward the tail
    float wig = sin(uTime * 6.5 + aPhase * 6.2831 + local.z * 2.0) * 0.05 * (0.4 - local.z);
    local.x += wig;

    vec3 world = p0 + right * local.x + up * local.y + fwd * local.z;

    vNormalW = normalize(right * normal.x + up * normal.y + fwd * normal.z);
    vWorld = world;
    vBelly = position.y;
    vFade = smoothstep(26.0, 9.0, abs(uCamY - aBand));

    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const frag = /* glsl */ `
  uniform vec3 uBack;
  uniform vec3 uBelly;
  uniform vec3 uSunDir;
  uniform float uOpacity;

  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vFade;
  varying float vBelly;

  ${fogChunk}
  ${filmicChunk}

  void main() {
    vec3 N = normalize(vNormalW);
    vec3 V = normalize(cameraPosition - vWorld);

    float ndl = clamp(dot(N, uSunDir) * 0.5 + 0.5, 0.0, 1.0);
    float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.5);

    vec3 base = mix(uBelly, uBack, smoothstep(-0.06, 0.09, vBelly));
    vec3 col = base * (0.42 + 0.5 * ndl) + base * rim * 0.4;

    col = applyFog(col, vWorld);
    float a = vFade * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(filmic(col), a);
    ${TAIL}
  }
`

const SCHOOLS = [
  { y: -9, x: 0, z: -22 },
  { y: -27, x: 7, z: -30 },
  { y: -45, x: -5, z: -26 },
  { y: -62, x: 2, z: -18 },
]

function buildGeometry(count: number) {
  // low-poly fish: tapered body + tail fin, +z is forward
  const v = [
    0, 0, 0.55,
    0, 0.1, 0.08,
    0.05, 0, 0.02,
    0, -0.1, 0.08,
    -0.05, 0, 0.02,
    0, 0, -0.36,
    0, 0.2, -0.62,
    0, -0.2, -0.62,
  ]
  const idx = [
    0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 1,
    1, 5, 2, 2, 5, 3, 3, 5, 4, 4, 5, 1,
    1, 6, 5, 2, 5, 7, 3, 7, 5, 4, 5, 6,
    5, 6, 7,
  ]

  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(new Float32Array(v), 3))
  g.setIndex(idx)
  g.computeVertexNormals()

  const rnd = mulberry32(20260205)
  const center = new Float32Array(count * 3)
  const phase = new Float32Array(count)
  const scale = new Float32Array(count)
  const band = new Float32Array(count)

  for (let i = 0; i < count; i++) {
    const s = SCHOOLS[i % SCHOOLS.length]
    center[i * 3 + 0] = s.x + (rnd() - 0.5) * 7
    center[i * 3 + 1] = s.y + (rnd() - 0.5) * 3
    center[i * 3 + 2] = s.z + (rnd() - 0.5) * 9
    phase[i] = rnd() * 6.2831
    scale[i] = 0.4 + rnd() * 0.5
    band[i] = s.y
  }

  g.setAttribute('aCenter', new InstancedBufferAttribute(center, 3))
  g.setAttribute('aPhase', new InstancedBufferAttribute(phase, 1))
  g.setAttribute('aScale', new InstancedBufferAttribute(scale, 1))
  g.setAttribute('aBand', new InstancedBufferAttribute(band, 1))
  return g
}

export function FishSchool({ quality }: { quality: QualitySettings }) {
  const mesh = useRef<InstancedMesh>(null)
  const mat = useRef<ShaderMaterial>(null)
  const count = quality.fish
  const geometry = useMemo(() => buildGeometry(count), [count])

  const uniforms = useMemo(
    () => ({
      uTime: ATMOS.uTime,
      uCamY: { value: 0 },
      uFogColor: ATMOS.uFogColor,
      uFogDensity: ATMOS.uFogDensity,
      uSunDir: ATMOS.uSunDir,
      uBack: { value: new Color('#1e3641') },
      uBelly: { value: new Color('#7d9494') },
      uOpacity: { value: 1 },
    }),
    [],
  )

  useFrame(({ camera }) => {
    const m = mat.current
    if (!m) return
    m.uniforms.uCamY.value = camera.position.y
    m.uniforms.uOpacity.value = Math.min(1, oceanState.underwaterAmount * 1.8)
  })

  return (
    <instancedMesh ref={mesh} args={[geometry, undefined, count]} frustumCulled={false} renderOrder={3}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vert}
        fragmentShader={frag}
        transparent
        depthWrite={false}
        side={2}
        fog={false}
      />
    </instancedMesh>
  )
}
