// fire.js — Ragnarök as the whole background: a fullscreen quad, fractal Brownian
// noise shaped into flame that rises from the foot of the page and dies toward the
// top. Written from scratch (no Shadertoy, no library — forge landscape report
// project/report/2026-09-16-fire-and-tree-landscape.md, F1). The season's accent
// is a uniform: another season, another fire.
//
// Reduced motion: one frame, the fire frozen — the house is still tested, quietly.

import * as THREE from 'three';

const vert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const frag = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec3 uSeason;   // the season's accent (Ragnarök: #c1121f)
  uniform vec3 uEmber;    // #e05d0e
  uniform vec3 uMead;     // #d9a441 — the hottest tongue
  uniform vec3 uNight;    // #120f2b — the hall behind the fire
  uniform float uHeat;    // 0..1 — how high the flames climb

  // value noise on an integer lattice — enough for flame, and cheap
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  // fractal Brownian motion: five octaves, each half the amplitude, a little rotation so the layers don't align
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03 + 11.7; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * aspect, uv.y);

    // the flame field: noise carried upward by time, warped by a slower noise (turbulence)
    vec2 q = vec2(fbm(p * 3.0 + vec2(0.0, -uTime * 0.35)), fbm(p * 3.0 + vec2(5.2, -uTime * 0.28)));
    float n = fbm(p * 4.0 + q * 1.6 + vec2(0.0, -uTime * 0.9));

    // shape: hot at the foot, dying toward the top; the tongues are where noise beats the height
    float height = uv.y / max(uHeat, 0.05);
    float flame = n * 1.45 - height * 1.05;
    flame = smoothstep(0.0, 0.55, flame);

    // colour ramp: night → season red → ember → mead, by heat
    vec3 col = uNight;
    col = mix(col, uSeason, smoothstep(0.02, 0.35, flame));
    col = mix(col, uEmber,  smoothstep(0.35, 0.68, flame));
    col = mix(col, uMead,   smoothstep(0.72, 1.0, flame) * 0.85);

    // a low glow at the foot so the fire has ground, and the hall stays night above
    float glow = (1.0 - uv.y) * 0.18 * (0.6 + 0.4 * n);
    col += uSeason * glow;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const hex = (h) => new THREE.Color(h);

export function initFire(canvas, { season = '#c1121f', heat = 0.95 } = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));                 // a full-screen shader: pixels cost, and fire forgives softness
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    uSeason: { value: hex(season) }, uEmber: { value: hex('#e05d0e') }, uMead: { value: hex('#d9a441') }, uNight: { value: hex('#120f2b') },
    uHeat: { value: heat },
  };
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false })));

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w, h);
  }
  resize(); addEventListener('resize', resize);

  let raf = 0, visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });
  function frame(ms) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    uniforms.uTime.value = ms / 1000;
    renderer.render(scene, camera);
  }
  if (reduce) { uniforms.uTime.value = 7.3; renderer.render(scene, camera); }   // one still frame of fire
  else raf = requestAnimationFrame(frame);

  return {
    setSeason(h) { uniforms.uSeason.value.set(h); },
    setHeat(v) { uniforms.uHeat.value = v; },
    dispose() { cancelAnimationFrame(raf); removeEventListener('resize', resize); renderer.dispose(); },
  };
}
