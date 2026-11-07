import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, Color, DoubleSide, type Group, type ShaderMaterial } from 'three'
import { ATMOS, TAIL, skyChunk, fogChunk, filmicChunk } from './shaders/common'
import { oceanState } from '../../lib/ocean'
import type { QualitySettings } from '../../lib/runtime'

/* ------------------------------------------------------------------ */
/* Sky dome — follows the camera so the horizon always sits at eye      */
/* level, exactly like a sky at infinity.                              */
/* ------------------------------------------------------------------ */

const skyVert = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const skyFrag = /* glsl */ `
  uniform float uUnder;
  uniform vec3 uFogColor;
  varying vec3 vDir;

  ${skyChunk}
  ${filmicChunk}

  void main() {
    vec3 col = skyColor(normalize(vDir));
    // Underwater the sky must dissolve into the water column, otherwise a
    // bright band leaks past the edge of the sea plane.
    col = mix(col, uFogColor, uUnder);
    gl_FragColor = vec4(filmic(col), 1.0);
    ${TAIL}
  }
`

export function Sky({ hide }: { hide?: boolean }) {
  const group = useRef<Group>(null)
  const mat = useRef<ShaderMaterial>(null)

  const uniforms = useMemo(
    () => ({
      uUnder: ATMOS.uUnder,
      uZenith: ATMOS.uZenith,
      uMid: ATMOS.uMid,
      uHorizon: ATMOS.uHorizon,
      uSunDir: ATMOS.uSunDir,
      uSunColor: ATMOS.uSunColor,
      uFogColor: ATMOS.uFogColor,
    }),
    [],
  )

  useFrame(({ camera }) => {
    if (group.current) group.current.position.copy(camera.position)
    if (mat.current) mat.current.uniforms.uUnder.value = oceanState.underwaterAmount
  })

  return (
    <group ref={group} renderOrder={-10} visible={!hide}>
      <mesh frustumCulled={false}>
        <sphereGeometry args={[5200, 40, 24]} />
        <shaderMaterial
          ref={mat}
          uniforms={uniforms}
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          side={BackSide}
          depthWrite={false}
          depthTest={false}
          fog={false}
        />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Ocean surface — Gerstner swell, Snell's window from below           */
/* ------------------------------------------------------------------ */

const waterVert = /* glsl */ `
  uniform float uTime;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vCrest;

  // Gerstner wave: horizontal + vertical displacement, analytic normal
  vec3 gerstner(vec2 p, vec2 dir, float wl, float amp, float speed,
                inout vec3 tangent, inout vec3 binormal) {
    float k = 6.2831853 / wl;
    vec2 d = normalize(dir);
    float f = k * dot(d, p) - uTime * speed;
    float q = amp * k;
    tangent  += vec3(-d.x * d.x * q * sin(f), d.x * q * cos(f), -d.x * d.y * q * sin(f));
    binormal += vec3(-d.x * d.y * q * sin(f), d.y * q * cos(f), -d.y * d.y * q * sin(f));
    return vec3(d.x * amp * cos(f), amp * sin(f), d.y * amp * cos(f));
  }

  void main() {
    vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
    vec2 p = world.xz;

    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    vec3 disp = vec3(0.0);

    disp += gerstner(p, vec2( 1.0,  0.34), 186.0, 0.300, 0.34, tangent, binormal);
    disp += gerstner(p, vec2(-0.55, 1.0 ), 118.0, 0.175, 0.46, tangent, binormal);
    disp += gerstner(p, vec2( 0.86,-0.72),  71.0, 0.100, 0.58, tangent, binormal);
    disp += gerstner(p, vec2(-1.0, -0.28),  39.0, 0.048, 0.72, tangent, binormal);

    world += disp;
    vCrest = clamp(disp.y / 0.62, 0.0, 1.0);
    vNormalW = normalize(cross(binormal, tangent));
    vWorldPos = world;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`

const waterFrag = /* glsl */ `
  uniform float uTime;
  uniform float uDetail;
  uniform vec3  uShallow;
  uniform vec3  uDeep;
  uniform vec3  uScatter;

  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying float vCrest;

  ${skyChunk}
  ${fogChunk}
  ${filmicChunk}

  vec2 ripple(vec2 p, vec2 dir, float wl, float amp, float speed) {
    vec2 d = normalize(dir);
    float k = 6.2831853 / wl;
    float f = k * dot(d, p) - uTime * speed;
    return d * (amp * k * cos(f));
  }

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 Ng = normalize(vNormalW);

    // fine surface detail — lighting only, no displacement
    vec2 p = vWorldPos.xz;
    vec2 g = vec2(0.0);
    g += ripple(p, vec2( 1.0,  0.62), 6.6, 0.052 * uDetail, 2.6);
    g += ripple(p, vec2(-0.72, 1.0 ), 3.2, 0.026 * uDetail, 3.3);
    g += ripple(p, vec2( 0.4, -1.0 ), 1.55, 0.011 * uDetail, 4.1);
    g += ripple(p, vec2(-1.0, -0.45), 0.78, 0.0045 * uDetail, 5.0);

    float dist = length(cameraPosition - vWorldPos);
    float detailFade = 1.0 - clamp(dist / 320.0, 0.0, 1.0);
    vec3 N = normalize(Ng + vec3(-g.x, 0.0, -g.y) * detailFade);

    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);

    vec3 col;

    if (gl_FrontFacing) {
      // ---- seen from above: sky reflection over a deep body of water
      vec3 R = reflect(-V, N);
      R.y = abs(R.y) * 0.92 + 0.02;
      vec3 skyRef = skyColor(R);

      float grazing = 1.0 - ndv;
      vec3 body = mix(uDeep, uShallow, smoothstep(0.02, 0.62, grazing));

      // light pushed through the back of a crest
      float back = clamp(dot(N, -uSunDir) * 0.5 + 0.5, 0.0, 1.0);
      body += uScatter * pow(back, 3.0) * smoothstep(0.1, 0.9, vCrest) * 0.4;

      col = mix(body, skyRef, clamp(fres, 0.0, 0.9));

      vec3 H = normalize(uSunDir + V);
      float ndh = max(dot(N, H), 0.0);
      col += uSunColor * pow(ndh, 420.0) * 2.4 * detailFade;
      col += uSunColor * pow(ndh, 26.0) * 0.09;

      // whisper of foam on the highest crests only
      float foam = smoothstep(0.8, 0.99, vCrest);
      col = mix(col, vec3(0.86, 0.92, 0.92), foam * 0.2);

      col = applyFog(col, vWorldPos);
      gl_FragColor = vec4(filmic(col), 1.0);
      ${TAIL}
      return;
    }

    // ---- seen from below: Snell's window + total internal reflection
    float cosI = clamp(dot(-V, Ng), 0.0, 1.0);
    // water (1.333) → air (1.0), so eta = n1/n2 > 1
    float eta = 1.333;
    float sinT2 = eta * eta * (1.0 - cosI * cosI);

    vec3 win;
    if (sinT2 >= 1.0) {
      // beyond the critical angle (~48.6°) the surface is a dark mirror
      vec3 refl = reflect(-V, Ng);
      vec3 tir = uDeep * 1.15;
      tir = mix(tir, uDeep * 2.1 + uShallow * 0.35, smoothstep(0.0, -0.85, refl.y));
      win = tir;
    } else {
      float cosT = sqrt(1.0 - sinT2);
      // T = eta·I + (eta·cosI − cosT)·N  with I pointing away from the camera
      vec3 I = -V;
      vec3 rd = normalize(eta * I + (eta * cosI - cosT) * Ng);
      vec3 sky = skyColor(rd);
      // the rim of the window is compressed and brighter
      float rim = exp(-pow((cosI - 0.68) * 9.0, 2.0));
      win = sky * (0.42 + 0.58 * cosI) + uSunColor * rim * 0.6;
      win = mix(win, uShallow * 0.85, 0.14);
    }

    float open = smoothstep(0.648, 0.742, cosI);
    vec3 under = mix(uDeep * 1.05 + uShallow * 0.1, win, open);
    under *= 0.9 + 0.2 * vCrest;

    // Near the horizon the light path through the water becomes very long, so
    // the underside dissolves into the water column. Blending on the incidence
    // angle instead of distance keeps this transition perfectly smooth — a
    // distance fog alone produces a visible hard line against the sky.
    float grazing = smoothstep(0.34, 0.04, cosI);
    under = mix(under, uFogColor, grazing * 0.96);

    under = applyFog(under, vWorldPos);
    gl_FragColor = vec4(filmic(under), 1.0);
    ${TAIL}
  }
`

export function OceanSurface({ quality, hide }: { quality: QualitySettings; hide?: boolean }) {
  const uniforms = useMemo(
    () => ({
      uTime: ATMOS.uTime,
      uDetail: ATMOS.uDetail,
      uZenith: ATMOS.uZenith,
      uMid: ATMOS.uMid,
      uHorizon: ATMOS.uHorizon,
      uSunDir: ATMOS.uSunDir,
      uSunColor: ATMOS.uSunColor,
      uFogColor: ATMOS.uFogColor,
      uFogDensity: ATMOS.uFogDensity,
      // dedicated body colours — richer teal than the fog so the sea reads as
      // water rather than as mist, even when the camera is deep below it
      uShallow: { value: new Color('#1f5f70') },
      uDeep: { value: new Color('#07293a') },
      uScatter: { value: new Color('#3f9c9c') },
    }),
    [],
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -1400]} frustumCulled={false} visible={!hide}>
      <planeGeometry args={[5200, 5200, quality.oceanSegments, quality.oceanSegments]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={waterVert}
        fragmentShader={waterFrag}
        side={DoubleSide}
        fog={false}
      />
    </mesh>
  )
}
