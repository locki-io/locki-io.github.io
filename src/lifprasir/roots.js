// roots.js — Act II opens: under the tree, one becomes two.
//
// Where Act I left us: from above, the green ground, the pin where the thread
// pierces it — a point, pulsing at rest, 60 to the minute. From far below a
// ring rises, grey and white — dew, after the fire, before any season has a
// colour. As it nears the ground it DIVIDES: one becomes two. Líf and
// Lífþrasir — the two who survived inside the tree. They stay below, under the
// ground, and hold it from beneath.
//
// Then the camera comes round to the operator's keyframe, and in the corner
// of the frame the mark appears: the two rings, the C, the cube that was taken
// out — the logo, recognised. The evolution of it all is the frame's content.
//
// The roots — the humans — come next, on this stage.

import * as THREE from 'three';
import { createDirector } from './director.js';

const FLOOR_Y = 0.9;            // Act I's ground
const BPM = 60;                 // the point at rest
const R = 0.4, r = 0.125;       // the rings — a quarter of the logo's: the roots growing down are what matters next
const DEEP = -10;               // where the ring rises from
const BELOW = FLOOR_Y - 0.9;    // where it stays: under the ground, seen through it
const DIST = 2 * R;             // the two centres, 2R apart — friction in the middle

const ease = (s) => s * s * (3 - 2 * s);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function initRoots(container, {
  beats = [],                   // [{ u, id, line, cls }] — the act's data: what is said, when
  director = false, cameraPath = null, onKeyframes,
  onBeat, onHold, onGesture, onMark, onTime, onSeek,
  startAt = 0,
} = {}) {
  if (!container) return { seek() {}, duration: 0, dispose() {} };
  const T = {};
  beats.forEach((b) => { T[b.id] = b.u; });
  const RISE_START = T.rise ?? 2, RISE_END = T.divide ?? 8, DIVIDE_END = (T.divide ?? 8) + 4, MARK_AT = T.mark ?? 16, HOLD_AT = T.hold ?? 20;
  const DURATION = HOLD_AT + 2;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 200);
  const lookTarget = new THREE.Vector3(0, 1.5, 0);
  camera.position.set(0, 15.003, 0); camera.lookAt(lookTarget);                 // where Act I left the eye
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  const dir = createDirector({ camera, dom: renderer.domElement, act: 'roots', target: lookTarget, director, cameraPath, onKeyframes });

  scene.add(new THREE.AmbientLight(0x2233ff, 0.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 0.9); key.position.set(-8, 8, 6); scene.add(key);   // top-left
  const under = new THREE.PointLight(0xffffff, 30, 30); under.position.set(0, BELOW - 1, 0); scene.add(under);

  // --- the ground, the pin, the grass — as Act I left them ------------------------
  const glowMap = (() => { const s = 64, c = document.createElement('canvas'); c.width = c.height = s; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(200,210,255,0.8)'); g.addColorStop(1, 'rgba(120,120,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s); return new THREE.CanvasTexture(c); })();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x17a34a, transparent: true, opacity: 0.38, depthWrite: false, side: THREE.DoubleSide }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; scene.add(floor);
  const pin = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color: 0xff3344, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  pin.position.set(0, FLOOR_Y + 0.02, 0); scene.add(pin);
  // the red thread — it does not leave: from the pin, straight up, out of the frame
  const THREAD_H = 60;
  const coreGeo = new THREE.CylinderGeometry(0.035, 0.035, THREAD_H, 12, 1, true); coreGeo.translate(0, THREAD_H / 2, 0);
  const haloGeo = new THREE.CylinderGeometry(0.2, 0.2, THREAD_H, 16, 1, true); haloGeo.translate(0, THREAD_H / 2, 0);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const thread = new THREE.Group();
  thread.add(new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0xff2a3a })), new THREE.Mesh(haloGeo, haloMat));
  thread.position.set(0, 0, 0); scene.add(thread);
  const GRASS = 700;
  const bladeGeo = new THREE.PlaneGeometry(0.05, 1, 1, 5);
  { const p = bladeGeo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i) + 0.5; p.setX(i, p.getX(i) * (1 - y * 0.85)); p.setZ(i, y * y * 0.35); p.setY(i, y); } bladeGeo.computeVertexNormals(); }
  const grass = new THREE.InstancedMesh(bladeGeo, new THREE.MeshBasicMaterial({ color: 0x5cff8a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }), GRASS);
  scene.add(grass);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  function sway(t) {
    for (let i = 0; i < GRASS; i++) {
      const rad = 0.5 + hash(i * 3 + 1) * 6.5, a = hash(i * 3 + 2) * Math.PI * 2;
      e3.set(0, hash(i * 3 + 3) * Math.PI * 2, Math.sin(t * 1.3 + hash(i * 11 + 9) * Math.PI * 2) * 0.12); q.setFromEuler(e3);
      v3.set(Math.cos(a) * rad, FLOOR_Y, Math.sin(a) * rad); s3.set(1, 0.5 + hash(i * 7 + 5) * 1.3, 1);
      m4.compose(v3, q, s3); grass.setMatrixAt(i, m4);
    }
    grass.instanceMatrix.needsUpdate = true;
  }

  // --- the rings: grey-white, dew after the fire ---------------------------------
  const dew = new THREE.MeshStandardMaterial({ color: 0xdedede, emissive: 0x6a6a6a, emissiveIntensity: 0.5, roughness: 0.55, metalness: 0.05 });
  const ringGeo = new THREE.TorusGeometry(R, r, 28, 120);
  const one = new THREE.Mesh(ringGeo, dew), two = new THREE.Mesh(ringGeo, dew);
  one.rotation.x = Math.PI / 2; two.rotation.x = Math.PI / 2;                    // flat: seen from above as rings around the pin
  one.visible = two.visible = false; scene.add(one, two);

  // --- the hold ----------------------------------------------------------------------
  let holding = false, held = false, fired = {}, t0 = null, holdStart = null, holdAccum = 0, marked = false;
  function gesture(e) {
    if (e.type === 'keydown' && (e.key.startsWith('Arrow') || (dir.active && /^[keKE]$/.test(e.key)))) return;
    if (e.type === 'pointerdown' && e.target && e.target.closest && e.target.closest('.bar, .knob')) return;
    if (!holding) return;
    holding = false; window.removeEventListener('keydown', gesture); window.removeEventListener('pointerdown', gesture);
    onGesture && onGesture();
  }
  function resize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  window.addEventListener('resize', resize);

  let START = Math.max(0, +startAt || 0), lastNow = 0;
  function seek(u) {
    u = Math.max(0, Math.min(DURATION, u));
    START = u; t0 = lastNow; holdAccum = 0; holding = false; held = false; fired = {}; marked = false;
    window.removeEventListener('keydown', gesture); window.removeEventListener('pointerdown', gesture);
    onSeek && onSeek(u);
  }

  let raf = 0;
  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const now = nowMs / 1000; lastNow = now; if (t0 === null) t0 = now;
    let u = START + (now - t0 - holdAccum);
    if (holding) { holdAccum += now - holdStart; holdStart = now; u = HOLD_AT; }

    // the beats: catch-up safe
    beats.forEach((b) => { if (u >= b.u && !fired[b.id]) { fired[b.id] = true; onBeat && onBeat(b); } });

    // the point at rest
    const pulse = 1 + Math.sin(now * 2 * Math.PI * BPM / 60) * 0.18;
    pin.scale.set(0.28 * pulse, 0.28 * pulse, 1);
    sway(now);
    haloMat.opacity = 0.32 + 0.08 * Math.sin(now * 2 * Math.PI * BPM / 60);   // the thread at rest, one beat per second

    // one ring rises from the deep
    const rise = ease(clamp01((u - RISE_START) / (RISE_END - RISE_START)));
    const y = DEEP + (BELOW - DEEP) * rise;
    // …and divides: one becomes two, 2R apart
    const div = ease(clamp01((u - RISE_END) / (DIVIDE_END - RISE_END)));
    one.visible = two.visible = u >= RISE_START;
    one.position.set(-DIST / 2 * div, y, 0); two.position.set(DIST / 2 * div, y, 0);
    // a breath of the membrane: the rings swell as they part, then settle
    const swell = 1 + Math.sin(Math.PI * div) * 0.12;
    one.scale.setScalar(swell); two.scale.setScalar(swell);
    one.rotation.z = div * 0.0; two.rotation.z = 0;
    under.intensity = 30 * rise;

    if (u >= MARK_AT && !marked) { marked = true; onMark && onMark(); }

    if (!holding && u >= HOLD_AT && !held) {
      holding = true; held = true; holdStart = now;
      window.addEventListener('keydown', gesture); window.addEventListener('pointerdown', gesture);
      onHold && onHold();
    }

    const shown = holding ? HOLD_AT : Math.min(u, DURATION);
    onTime && onTime(shown);
    dir.update(shown);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    seek, duration: DURATION, holdAt: HOLD_AT,
    dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('keydown', gesture); window.removeEventListener('pointerdown', gesture); dir.dispose(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
