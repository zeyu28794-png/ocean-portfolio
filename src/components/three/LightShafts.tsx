import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, Group, Mesh, type ShaderMaterial } from 'three'
import { ATMOS } from './shaders/common'
import { oceanState } from '../../lib/ocean'
import type { QualitySettings } from '../../lib/runtime'
import { mulberry32 } from '../../lib/rand'

/**
 * Volumetric light shafts. Additive, camera-facing ribbons under the surface.
 * They fade out with depth and are fully hidden above water — no draw when the
 * camera is at the shoreline, which is also where they cost the most fill rate.
 */

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uSeed;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    float x = abs(vUv.x - 0.5);
    // soft band with a ragged edge
    float edge = smoothstep(0.5, 0.02, x);
    float wobble = 0.72 + 0.28 * sin(vUv.y * 5.0 + uTime * 0.35 + uSeed * 9.0)
                        * sin(vUv.y * 2.3 - uTime * 0.21 + uSeed * 4.0);

    float top = smoothstep(0.0, 0.18, vUv.y);        // fade right at the surface
    float bottom = 1.0 - smoothstep(0.45, 1.0, vUv.y); // dissolve with depth
    float edgeY = smoothstep(0.0, 0.06, vUv.y) * (1.0 - smoothstep(0.97, 1.0, vUv.y));

    float a = edge * wobble * top * bottom * edgeY * uOpacity;
    gl_FragColor = vec4(uColor, a);
  }
`

type Shaft = { x: number; z: number; w: number; h: number; rot: number; seed: number }

export function LightShafts({ quality }: { quality: QualitySettings }) {
  const group = useRef<Group>(null)
  const mats = useRef<(ShaderMaterial | null)[]>([])
  const meshes = useRef<(Mesh | null)[]>([])

  const shafts = useMemo<Shaft[]>(() => {
    const rnd = mulberry32(4242)
    return Array.from({ length: quality.shafts }, () => ({
      x: (rnd() - 0.5) * 110,
      z: (rnd() - 0.5) * 90 - 20,
      w: 6 + rnd() * 22,
      h: 55 + rnd() * 55,
      rot: (rnd() - 0.5) * 0.5,
      seed: rnd(),
    }))
  }, [quality.shafts])

  const uniformsList = useMemo(
    () =>
      shafts.map((s) => ({
        uTime: ATMOS.uTime,
        uOpacity: { value: 0 },
        uSeed: { value: s.seed },
        uColor: { value: new Color('#ffe2b8') },
      })),
    [shafts],
  )

  useFrame(({ camera }, dt) => {
    const g = group.current
    if (!g) return
    g.position.set(camera.position.x, 0, camera.position.z)

    const depth = oceanState.depth
    const fade = Math.max(0, 1 - depth / 62) * oceanState.underwaterAmount
    const op = fade * fade * 0.22

    g.visible = op > 0.002

    for (let i = 0; i < shafts.length; i++) {
      const m = mats.current[i]
      if (m) m.uniforms.uOpacity.value = op

      const mesh = meshes.current[i]
      if (!mesh) continue
      const wx = camera.position.x + shafts[i].x
      const wz = camera.position.z + shafts[i].z
      mesh.rotation.y = Math.atan2(camera.position.x - wx, camera.position.z - wz) + shafts[i].rot
    }
    void dt
  })

  return (
    <group ref={group}>
      {shafts.map((s, i) => (
        <mesh
          key={i}
          ref={(el) => {
            meshes.current[i] = el
          }}
          position={[s.x, -s.h / 2 + 1.5, s.z]}
          frustumCulled={false}
          renderOrder={4}
        >
          <planeGeometry args={[s.w, s.h]} />
          <shaderMaterial
            ref={(el) => {
              mats.current[i] = el
            }}
            uniforms={uniformsList[i]}
            vertexShader={vert}
            fragmentShader={frag}
            transparent
            depthWrite={false}
            blending={2}
            side={2}
            fog={false}
          />
        </mesh>
      ))}
    </group>
  )
}
