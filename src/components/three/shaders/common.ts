import { Color, Vector3 } from 'three'

/**
 * Shared atmosphere: one source of truth for sky, water, fog and the sun.
 * Every material reuses these uniform *value objects*, so a single write per
 * frame updates the whole scene without any React re-render.
 */
export const ATMOS = {
  uZenith: { value: new Color('#24526b') },
  uMid: { value: new Color('#7fa5b2') },
  uHorizon: { value: new Color('#f2dcbe') },
  uSunDir: { value: new Vector3(-0.05, 0.09, -1).normalize() },
  uSunColor: { value: new Color('#ffd7a6') },
  uFogColor: { value: new Color('#c6d4c9') },
  uFogDensity: { value: 0.002 },
  uTime: { value: 0 },
  uUnder: { value: 0 },
  uDetail: { value: 1 },
}

/* ------------------------------------------------------------------ */

export const skyChunk = /* glsl */ `
uniform vec3 uZenith;
uniform vec3 uMid;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSunColor;

vec3 skyColor(vec3 dir) {
  vec3 d = normalize(dir);
  float h = d.y;

  vec3 col = mix(uHorizon, uMid, smoothstep(-0.015, 0.26, h));
  col = mix(col, uZenith, smoothstep(0.18, 0.92, h));

  // a low dawn sun: wide bloom, tight inner glow, hard disc
  float sd = clamp(dot(d, uSunDir), -1.0, 1.0);
  float ang = acos(sd);
  col += uSunColor * exp(-ang * 3.2) * 0.14;
  col += uSunColor * exp(-ang * 11.0) * 0.22;
  col += uSunColor * exp(-ang * 46.0) * 0.62;
  col += uSunColor * smoothstep(0.024, 0.008, ang) * 2.2;

  // horizon haze band — keeps the water line soft, like real air
  col = mix(col, uHorizon * 1.04, smoothstep(0.13, -0.01, h) * 0.62);

  // below the horizon: air over water, slightly cooler
  col = mix(col, uHorizon * 0.72, smoothstep(-0.01, -0.16, h) * 0.9);
  return col;
}
`

export const noiseChunk = /* glsl */ `
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p = rot * p * 2.03;
    a *= 0.5;
  }
  return v;
}
`

export const fogChunk = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogDensity;

float fogAmount(float dist) {
  float d = dist * uFogDensity;
  return clamp(1.0 - exp(-d * d), 0.0, 1.0);
}

vec3 applyFog(vec3 color, vec3 worldPos) {
  float dist = length(cameraPosition - worldPos);
  return mix(color, uFogColor, fogAmount(dist));
}
`

/**
 * Filmic response, applied by hand. The renderer runs with toneMapping off
 * (Canvas `flat`) so every custom shader owns its own grade — deterministic,
 * and it keeps the highlight roll-off identical across sky, water and fog.
 */
export const filmicChunk = /* glsl */ `
vec3 filmic(vec3 x) {
  x = max(x, vec3(0.0));
  vec3 c = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
  return clamp(c, 0.0, 1.0);
}
`

/** linear → output colour space */
export const TAIL = /* glsl */ `
  #include <colorspace_fragment>
`
