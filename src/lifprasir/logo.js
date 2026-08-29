// logo.js — the double torus: O and C, the cube that was subtracted, and the loop
// that will not close itself.
//
// Two tori joined along a neck (a genus-2 surface — the "double torus", the
// connected sum of two tori). One is whole: the O. From the other a cube has
// been subtracted at its far end: the C. Read from the front, the two tubes
// are the two characters stuck together. The cube is the seed.
//
// The red thread rides the surface in a figure-eight — over the O, under the
// C — and crosses the neck twice, once at +z and once at −z: a lemniscate that
// never intersects itself. It runs around the O, over onto the C, and STOPS at
// the gap. The loop does not close itself. A human closes it: one gesture, the
// gap shuts, the C becomes an O, the thread runs ∞.
//
// Primary sources (Huginn, 2026-08-29): three@0.156.1 TorusGeometry(radius,
// tube, radialSegments, tubularSegments, arc) — the arc is the subtraction;
// torus (R + r sinθ)cosφ … ; genus-2 surface = connected sum of two tori.

import * as THREE from 'three';
import { createDirector } from './director.js';

const R = 1.6, r = 0.5;                 // major and minor radii, both tori
const NECK = 0.75 * r;                  // how far the tori overlap: the neck of the connected sum
const CUBE = 2 * r * 0.92;              // the subtracted cube: the tube's diameter, almost
const GAP = (CUBE * 1.25) / R;          // the arc the cube took out of the C (radians)
const H = r + 0.045;                    // the thread rides just on the surface
const THREAD_R = 0.045;
const CLOSE_SECONDS = 1.6;
const SPARK_PERIOD = 6.0;               // seconds for the spark to run the whole ∞

const ease = (s) => s * s * (3 - 2 * s);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// The ∞ path. O centred at A (left), C at B (right), the neck at x = 0.
// O: angle a from 0 (the neck) counter-clockwise, rising from −H to +H in the first quarter, then over the top.
// C: angle b from π (the neck) clockwise, falling from +H to −H in the first quarter, then under.
// The two neck crossings are at +H and −H: no intersection.
function infinityPoints(A, B, samples = 240) {
  const pts = [];
  const rise = (k) => ease(clamp01(k / (Math.PI / 2)));
  for (let i = 0; i < samples; i++) {                       // the O, over the top
    const a = (i / samples) * Math.PI * 2;
    pts.push(new THREE.Vector3(A.x + R * Math.cos(a), A.y + R * Math.sin(a), -H + 2 * H * rise(a)));
  }
  for (let i = 0; i < samples; i++) {                       // the C, under, clockwise
    const b = Math.PI - (i / samples) * Math.PI * 2;
    const k = (i / samples) * Math.PI * 2;
    // near the gap (k = π) the thread climbs from under the tube onto its outer rim — into the open, where it will stop
    const m = ease(clamp01(1 - Math.abs(k - Math.PI) / (Math.PI / 2)));
    const under = H - 2 * H * rise(k);
    pts.push(new THREE.Vector3(B.x + (R + H * m) * Math.cos(b), B.y + (R + H * m) * Math.sin(b), under * (1 - m)));
  }
  return pts;
}

export function initLogo(container, { director = false, cameraPath = null, onKeyframes, onStop, onClose, onClosed, autoClose = false, startAt = 0, closeSkip = 0 } = {}) {
  if (!container) return { dispose() {} };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  const lookTarget = new THREE.Vector3(0, 0, 0);
  camera.position.set(0.9, -0.5, 10.6); lookTarget.set(0.9, 0, 0); camera.lookAt(lookTarget);   // read from the front: O C — the stream keeps the right
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  const dir = createDirector({ camera, dom: renderer.domElement, act: 'logo', target: lookTarget, director, cameraPath, onKeyframes });

  scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x100a12, 0.5));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.2); key.position.set(-8, 8, 6); scene.add(key); // top-left
  const rim = new THREE.DirectionalLight(0x4f7dff, 0.6); rim.position.set(6, -4, -6); scene.add(rim);

  // --- the two tori ------------------------------------------------------------
  const A = new THREE.Vector3(-(R - NECK / 2), 0, 0), B = new THREE.Vector3(R - NECK / 2, 0, 0);
  const torusMat = new THREE.MeshPhysicalMaterial({ color: 0x1b2bff, emissive: 0x0a12a0, emissiveIntensity: 0.5, roughness: 0.35, metalness: 0.1,
    transparent: true, opacity: 0.36, side: THREE.DoubleSide, depthWrite: false });   // glass enough to see the thread pass behind the C
  const O = new THREE.Mesh(new THREE.TorusGeometry(R, r, 28, 140), torusMat); O.position.copy(A); scene.add(O);
  const C = new THREE.Mesh(new THREE.TorusGeometry(R, r, 28, 140, Math.PI * 2 - GAP), torusMat.clone()); C.position.copy(B); scene.add(C);
  // the arc of a TorusGeometry starts at angle 0 (+x); centre the gap on +x — the far end from the O
  C.rotation.z = GAP / 2;
  function setGap(g) {                                       // rebuild the C for a new gap (cheap: 28 × 140)
    C.geometry.dispose();
    C.geometry = new THREE.TorusGeometry(R, r, 28, 140, Math.PI * 2 - g);
    C.rotation.z = g / 2;
  }

  // --- the cube that was subtracted: the seed, sitting in the gap ---------------
  const cubeMat = new THREE.LineBasicMaterial({ color: 0x8fc6ff, transparent: true, opacity: 0.95 });
  const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE)), cubeMat);
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE * 0.5, CUBE * 0.5, CUBE * 0.5)), cubeMat.clone());
  const cubeGroup = new THREE.Group(); cubeGroup.add(cube, inner); cubeGroup.position.set(B.x + R, 0, 0); scene.add(cubeGroup);

  // --- the thread: the ∞, as a tube; drawn only as far as it has run --------------
  const pts = infinityPoints(A, B);
  const curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
  const TUB = 480, RAD = 10;
  const tubeGeo = new THREE.TubeGeometry(curve, TUB, THREAD_R, RAD, true);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff2a3a });
  const thread = new THREE.Mesh(tubeGeo, coreMat); scene.add(thread);
  const halo = new THREE.Mesh(new THREE.TubeGeometry(curve, TUB, THREAD_R * 3.2, RAD, true),
    new THREE.MeshBasicMaterial({ color: 0xff5a4a, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  scene.add(halo);
  // where along the path is the gap's near edge? measured on the curve itself, not assumed
  const GAP_AT = (() => { const e = new THREE.Vector3(B.x + (R + H) * Math.cos(GAP / 2), B.y + (R + H) * Math.sin(GAP / 2), 0); let best = 1e9, bu = 0.72;
    for (let u = 0.55; u < 0.95; u += 0.0005) { const d = curve.getPointAt(u).distanceTo(e); if (d < best) { best = d; bu = u; } } return bu; })();
  const perSeg = tubeGeo.index.count / TUB;
  function drawTo(f) {                                       // the thread exists only as far as it has run
    const n = Math.floor(clamp01(f) * TUB) * perSeg;
    thread.geometry.setDrawRange(0, n); halo.geometry.setDrawRange(0, n);
  }
  drawTo(0);
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffb8a8, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  spark.scale.setScalar(0.5); scene.add(spark);
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,200,190,.5)'); g.addColorStop(1, 'rgba(255,120,100,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }

  // --- the human in the loop --------------------------------------------------------
  let stopped = false, closeAt = null, closed = false, t0 = null, closeWanted = false;
  function closeLoop() {
    if (!stopped || closeAt !== null || closeWanted) return;
    closeWanted = true;                                      // the frame stamps it with its own clock
    window.removeEventListener('keydown', onGesture); window.removeEventListener('pointerdown', onGesture);
    onClose && onClose();
  }
  function onGesture(e) { if (dir.active && e.type === 'keydown' && /^[keKE]$/.test(e.key)) return; closeLoop(); }

  function resize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  window.addEventListener('resize', resize);

  let raf = 0;
  const RUN_SECONDS = SPARK_PERIOD * GAP_AT;                 // the first run: from the neck to the gap
  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const now = nowMs / 1000; if (t0 === null) t0 = now - (startAt || 0);
    const t = now - t0;
    if (closeWanted && closeAt === null) closeAt = now - (closeSkip || 0);   // closeSkip: testing — pretend the hand came this many seconds ago
    let f;                                                   // the spark's fraction along the ∞
    if (closeAt === null) {
      f = Math.min(GAP_AT, (t / RUN_SECONDS) * GAP_AT);
      drawTo(f);
      if (f >= GAP_AT && !stopped) {                         // the thread stops at the gap
        stopped = true; onStop && onStop();
        window.addEventListener('keydown', onGesture); window.addEventListener('pointerdown', onGesture);
        if (autoClose) setTimeout(closeLoop, 900);
      }
    } else {
      const k = ease(clamp01((now - closeAt) / CLOSE_SECONDS));
      setGap(GAP * (1 - k));                                 // the C closes into an O
      cubeMat.opacity = 1 - k; inner.material.opacity = (1 - k) * 0.7; cubeGroup.rotation.y = k * Math.PI / 2;
      cubeGroup.scale.setScalar(1 - 0.35 * k);
      const gone = now - closeAt;
      f = gone < CLOSE_SECONDS ? GAP_AT : ((GAP_AT + (gone - CLOSE_SECONDS) / SPARK_PERIOD) % 1);
      drawTo(gone < CLOSE_SECONDS ? GAP_AT : (gone - CLOSE_SECONDS) / SPARK_PERIOD >= 1 - GAP_AT ? 1 : GAP_AT + (gone - CLOSE_SECONDS) / SPARK_PERIOD);
      if (!closed && (gone - CLOSE_SECONDS) / SPARK_PERIOD >= 1 - GAP_AT) { closed = true; drawTo(1); onClosed && onClosed(); }
    }
    spark.position.copy(curve.getPointAt(f));
    spark.material.opacity = 0.6 + 0.4 * Math.sin(now * 2 * Math.PI);   // 60 BPM
    // a slow turn so the depth of the two crossings can be seen
    const spin = dir.active ? 0 : Math.sin(now * 0.25) * 0.28;
    [O, C, thread, halo, cubeGroup].forEach((o) => { o.rotation.x = spin; });
    C.rotation.z = (closeAt === null ? GAP : GAP * (1 - ease(clamp01((now - closeAt) / CLOSE_SECONDS)))) / 2;
    dir.update(t);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return { closeLoop, dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); dir.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}
