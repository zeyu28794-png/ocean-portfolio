import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, DoubleSide, Group, type ShaderMaterial } from 'three'
import { ATMOS, TAIL, noiseChunk, filmicChunk } from './shaders/common'
import { oceanState } from '../../lib/ocean'

/**
 * Distant headland + lighthouse. Pure silhouette work: a procedural ridge line
 * in the fragment shader instead of geometry, so it costs two quads and reads
 * as real distance through atmospheric haze.
 */

const ridgeVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ridgeFrag = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uHaze;
  uniform float uSeed;
  uniform float uAmp;
  uniform float uBase;
  uniform float uOpacity;
  uniform float uUnder;
  uniform float uMask;
  varying vec2 vUv;

  ${noiseChunk}
  ${filmicChunk}

  void main() {
    float x = vUv.x;
    // 0 = land on the left of the plane, 1 = right, 2 = both
    float mask = uMask < 0.5
      ? smoothstep(0.46, 0.22, x)
      : (uMask < 1.5 ? smoothstep(0.54, 0.80, x)
                     : max(smoothstep(0.42, 0.20, x), smoothstep(0.58, 0.82, x)));

    float n = fbm(vec2(x * 2.6 + uSeed, uSeed * 3.7));
    float n2 = fbm(vec2(x * 11.0 + uSeed * 2.0, uSeed));
    float ridge = uBase + n * uAmp + n2 * uAmp * 0.18 + 0.012 * sin(x * 26.0);

    float inside = smoothstep(ridge, ridge - 0.008, vUv.y);

    // haze increases toward the base of the landmass
    vec3 col = mix(uColor, uHaze, smoothstep(ridge, ridge - 0.28, vUv.y) * 0.75);
    float a = inside * uOpacity * mask * (1.0 - uUnder);
    if (a < 0.004) discard;
    gl_FragColor = vec4(filmic(col), a);
    ${TAIL}
  }
`

function Ridge({
  seed,
  base,
  amp,
  width,
  height,
  y,
  z,
  color,
  haze,
  opacity,
  mask = 2,
}: {
  seed: number
  base: number
  amp: number
  width: number
  height: number
  y: number
  z: number
  color: string
  haze: string
  opacity: number
  mask?: 0 | 1 | 2
}) {
  const mat = useRef<ShaderMaterial>(null)
  const uniforms = useMemo(
    () => ({
      uColor: { value: new Color(color) },
      uHaze: { value: new Color(haze) },
      uSeed: { value: seed },
      uAmp: { value: amp },
      uBase: { value: base },
      uOpacity: { value: opacity },
      uUnder: ATMOS.uUnder,
      uMask: { value: mask },
    }),
    [seed, amp, base, color, haze, opacity, mask],
  )

  useFrame(() => {
    if (mat.current) mat.current.uniforms.uUnder.value = oceanState.underwaterAmount
  })

  return (
    <mesh position={[0, y, z]} frustumCulled={false} renderOrder={-4}>
      <planeGeometry args={[width, height]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={ridgeVert}
        fragmentShader={ridgeFrag}
        transparent
        depthWrite={false}
        side={DoubleSide}
        fog={false}
        toneMapped={false}
      />
    </mesh>
  )
}

export function Headland({ hide }: { hide?: boolean }) {
  const glow = useRef<Group>(null)

  useFrame(({ camera }) => {
    // shore elements only exist above the waterline
    if (glow.current?.parent) {
      glow.current.parent.visible = oceanState.underwaterAmount < 0.4
    }
    // keep the lighthouse glow facing the camera
    if (glow.current) {
      glow.current.rotation.y = Math.atan2(
        camera.position.x - glow.current.position.x,
        camera.position.z - glow.current.position.z,
      )
      glow.current.visible = oceanState.underwaterAmount < 0.5
    }
  })

  return (
    <group visible={!hide}>
      {/* far headland — left third, in front of the sunrise */}
      <Ridge
        seed={3.1}
        base={0.24}
        amp={0.3}
        width={1500}
        height={150}
        y={45}
        z={-430}
        color="#7b9297"
        haze="#cdd6ca"
        opacity={0.5}
        mask={0}
      />
      {/* mid headland — right third, carries the lighthouse */}
      <Ridge
        seed={9.4}
        base={0.2}
        amp={0.27}
        width={1100}
        height={130}
        y={40}
        z={-330}
        color="#41585f"
        haze="#a9bcb4"
        opacity={0.8}
        mask={1}
      />
      {/* near rocks — left edge, framing the view */}
      <Ridge
        seed={17.2}
        base={0.2}
        amp={0.13}
        width={760}
        height={90}
        y={30}
        z={-205}
        color="#22383e"
        haze="#6d8683"
        opacity={0.95}
        mask={0}
      />

      {/* lighthouse on the mid headland */}
      <group position={[250, 0, -322]}>
        <mesh position={[0, 3, 0]}>
          <cylinderGeometry args={[4.2, 9, 12, 7]} />
          <meshBasicMaterial color="#1b2b30" />
        </mesh>
        <mesh position={[0, 20, 0]}>
          <cylinderGeometry args={[1.05, 1.5, 24, 10]} />
          <meshBasicMaterial color="#26363b" />
        </mesh>
        <mesh position={[0, 33, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 1.2, 10]} />
          <meshBasicMaterial color="#101c21" />
        </mesh>
        <mesh position={[0, 34.3, 0]}>
          <cylinderGeometry args={[1.15, 1.15, 1.4, 10]} />
          <meshBasicMaterial color="#ffd8a4" />
        </mesh>
        <group ref={glow} position={[0, 34.3, 0]}>
          <mesh>
            <planeGeometry args={[18, 18]} />
            <shaderMaterial
              vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
              fragmentShader={`varying vec2 vUv;
                void main(){
                  float d = length(vUv - 0.5) * 2.0;
                  float a = pow(max(0.0, 1.0 - d), 2.8) * 0.32;
                  gl_FragColor = vec4(vec3(1.0, 0.82, 0.58), a);
                }`}
              transparent
              depthWrite={false}
              blending={2}
              fog={false}
            />
          </mesh>
        </group>
      </group>
    </group>
  )
}
