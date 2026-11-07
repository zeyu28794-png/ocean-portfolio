import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  Color,
  Euler,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { useFrame } from '@react-three/fiber'
import { ATMOS, TAIL, fogChunk, filmicChunk, noiseChunk } from './shaders/common'
import { oceanState } from '../../lib/ocean'
import type { QualitySettings } from '../../lib/runtime'
import { seabedHeight } from '../../lib/noise'
import { mulberry32 } from '../../lib/rand'

export const SEABED_Y = -92

/* ------------------------------------------------------------------ */
/* Terrain                                                             */
/* ------------------------------------------------------------------ */

const floorVert = /* glsl */ `
  varying vec3 vWorldPos;
  varying float vH;
  varying vec3 vNormalW;

  void main() {
    vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
    vWorldPos = world;
    vH = position.z;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const floorFrag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uSand;
  uniform vec3 uRock;
  varying vec3 vWorldPos;
  varying float vH;
  varying vec3 vNormalW;

  ${noiseChunk}
  ${fogChunk}
  ${filmicChunk}

  void main() {
    vec2 p = vWorldPos.xz;

    // sand ripples, slowly drifting with the current
    float r = sin(p.x * 0.55 + fbm(p * 0.02) * 8.0 + uTime * 0.05) * 0.5 + 0.5;
    float grain = fbm(p * 0.9) * 0.5 + 0.5;

    vec3 col = mix(uSand * 0.7, uSand, r * 0.55 + grain * 0.45);

    // darker where the terrain rises into rock
    float slope = 1.0 - clamp(vNormalW.y, 0.0, 1.0);
    col = mix(col, uRock, smoothstep(0.12, 0.55, slope) * 0.9);

    col = applyFog(col, vWorldPos);
    gl_FragColor = vec4(filmic(col), 1.0);
    ${TAIL}
  }
`

export function Seafloor({ quality, hide }: { quality: QualitySettings; hide?: boolean }) {
  const uniforms = useMemo(
    () => ({
      uTime: ATMOS.uTime,
      uFogColor: ATMOS.uFogColor,
      uFogDensity: ATMOS.uFogDensity,
      uSand: { value: new Color('#4a6360') },
      uRock: { value: new Color('#172a31') },
    }),
    [],
  )

  // heightfield computed once on the CPU: no vertex-shader cost per frame
  const geometry = useMemo(() => {
    const size = 1700
    const seg = quality.floorSegments
    const g = new PlaneGeometry(size, size, seg, seg)
    const pos = g.attributes.position as BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      // the mesh is rotated -90° about X afterwards, so local +y → world -z
      pos.setZ(i, seabedHeight(x, -y))
    }
    pos.needsUpdate = true
    g.computeVertexNormals()
    return g
  }, [quality.floorSegments])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, SEABED_Y, -260]}
      frustumCulled={false}
      visible={!hide}
    >
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={floorVert}
        fragmentShader={floorFrag}
        fog={false}
      />
    </mesh>
  )
}

/* ------------------------------------------------------------------ */
/* Rocks — planted on the same heightfield, one draw call              */
/* ------------------------------------------------------------------ */

export function Rocks({ quality }: { quality: QualitySettings }) {
  const mesh = useRef<InstancedMesh>(null)

  const data = useMemo(() => {
    const rnd = mulberry32(90210)
    const n = quality.rocks
    const items: { m: Matrix4; c: Color }[] = []
    const q = new Quaternion()
    const e = new Euler()
    const v = new Vector3()
    const s = new Vector3()

    for (let i = 0; i < n; i++) {
      const angle = rnd() * Math.PI * 2
      const radius = 30 + Math.pow(rnd(), 0.65) * 200
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius - 140
      const y = SEABED_Y + seabedHeight(x, -z)

      const scale = 1.8 + Math.pow(rnd(), 2.4) * 12
      v.set(x, y + scale * 0.3, z)
      e.set(rnd() * 3.14, rnd() * 6.28, rnd() * 3.14)
      q.setFromEuler(e)
      s.set(scale, scale * (0.45 + rnd() * 0.6), scale)

      items.push({
        m: new Matrix4().compose(v, q, s),
        c: new Color('#24383d').multiplyScalar(0.5 + rnd() * 0.7),
      })
    }
    return items
  }, [quality.rocks])

  useLayoutEffect(() => {
    const inst = mesh.current
    if (!inst) return
    data.forEach((t, i) => {
      inst.setMatrixAt(i, t.m)
      inst.setColorAt(i, t.c)
    })
    inst.instanceMatrix.needsUpdate = true
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true
  }, [data])

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, data.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshLambertMaterial color="#ffffff" />
    </instancedMesh>
  )
}

/* ------------------------------------------------------------------ */
/* One place that keeps scene fog in sync with the water column         */
/* ------------------------------------------------------------------ */

export function SceneAtmosphere() {
  useFrame(({ scene }) => {
    if (!scene.fog) return
    scene.fog.color.copy(oceanState.fogColor)
    if ('density' in scene.fog) scene.fog.density = oceanState.fogDensity
  }, -20)
  return null
}
