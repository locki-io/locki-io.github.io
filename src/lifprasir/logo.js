// logo.js — O C: two tori, one cut. The loop that will not close itself.
//
// Two tori joined along a neck — a surface of genus 2, the connected sum of
// two tori. One is whole: the O. From the other a cube has been subtracted at
// its far end: the C. The cube is the seed. Read from the front, the two tubes
// are the two characters stuck together.
//
// A spark runs the two circles as one path — the figure-eight the surface
// carries — and STOPS at the gap. The loop does not close itself. A human
// closes it: one gesture, the arc shuts, the C becomes an O, the spark runs ∞.
//
// KISS (Ò Capistaine, 2026-08-29): the subtraction is one constructor argument —
// TorusGeometry(radius, tube, radialSegments, tubularSegments, arc), verified in
// three@0.156.1. No CSG, no drawn thread: the flow is a point, the surface is
// the logo.

import * as THREE from 'three';
import { createDirector } from './director.js';

const R = 1.6, r = 0.5;                 // major and minor radii, both tori
const NECK = 2 * r;                     // the tubes overlap by one diameter: centres 2R apart — the lens in the middle (operator: "like this")
const CUBE = 2 * r * 0.92;              // the subtracted cube: the tube's diameter, almost
const GAP = (CUBE * 1.25) / R;          // the arc the cube took out of the C (radians)
const JOIN = 0.22;                      // radians: the spark blends from one circle to the other over this window at the neck
const CLOSE_SECONDS = 1.6;
const LAP_SECONDS = 6.0;                // seconds for the spark to run both circles

const ease = (s) => s * s * (3 - 2 * s);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function initLogo(container, { director = false, cameraPath = null, onKeyframes, onStop, onClose, onClosed, autoClose = false, startAt = 0, closeSkip = 0 } = {}) {
  if (!container) return { dispose() {} };
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  const lookTarget = new THREE.Vector3(0.9, 0, 0);
  lookTarget.set(1.4, 0, 0); camera.position.set(1.4, -0.5, 11.4); camera.lookAt(lookTarget);   // read from the front: O C — the stream keeps the right
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  const dir = createDirector({ camera, dom: renderer.domElement, act: 'logo', target: lookTarget, director, cameraPath, onKeyframes });

  scene.add(new THREE.HemisphereLight(0xffd0c8, 0x100a12, 0.45));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.3); key.position.set(-8, 8, 6); scene.add(key);   // top-left
  const rim = new THREE.DirectionalLight(0xff5a4a, 0.5); rim.position.set(6, -4, -6); scene.add(rim);

  // --- the two tori: the logo, red ----------------------------------------------
  const A = new THREE.Vector3(-(R - NECK / 2), 0, 0), B = new THREE.Vector3(R - NECK / 2, 0, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0xff2a3a, emissive: 0x7a0f18, emissiveIntensity: 0.45, roughness: 0.4, metalness: 0.05 });
  const O = new THREE.Mesh(new THREE.TorusGeometry(R, r, 28, 140), mat); O.position.copy(A); scene.add(O);
  const C = new THREE.Mesh(new THREE.TorusGeometry(R, r, 28, 140, Math.PI * 2 - GAP), mat); C.position.copy(B); scene.add(C);
  function setGap(g) {                                                    // the arc IS the subtraction; the C's arc starts at +x, so centre the gap there
    C.geometry.dispose(); C.geometry = new THREE.TorusGeometry(R, r, 28, 140, Math.PI * 2 - g); C.rotation.z = g / 2;
  }
  setGap(GAP);

  // --- the cube that was subtracted: the seed, sitting in the gap ----------------
  const cubeMat = new THREE.LineBasicMaterial({ color: 0x8fc6ff, transparent: true, opacity: 0.95 });
  const cube = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE)), cubeMat);
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE * 0.5, CUBE * 0.5, CUBE * 0.5)), cubeMat.clone());
  const cubeGroup = new THREE.Group(); cubeGroup.add(cube, inner); cubeGroup.position.set(B.x + R, 0, 0); scene.add(cubeGroup);

  // --- the flow: a spark on the two circles ----------------------------------------
  // f ∈ [0,1): the O from the neck, counter-clockwise; then the C from the neck, clockwise. The neck is an S over ±JOIN.
  const onO = (a) => new THREE.Vector3(A.x + R * Math.cos(a), A.y + R * Math.sin(a), r + 0.02);
  const onC = (k) => new THREE.Vector3(B.x + R * Math.cos(Math.PI - k), B.y + R * Math.sin(Math.PI - k), r + 0.02);
  function pathAt(f) {
    f = ((f % 1) + 1) % 1;
    if (f < 0.5) {
      const a = f * 2 * Math.PI * 2;
      if (a < JOIN) return onC(Math.PI * 2 - JOIN + a).lerp(onO(a), ease(a / JOIN));
      if (a > Math.PI * 2 - JOIN) return onO(a).lerp(onC(a - (Math.PI * 2 - JOIN)), ease((a - (Math.PI * 2 - JOIN)) / JOIN));
      return onO(a);
    }
    return onC((f - 0.5) * 2 * Math.PI * 2);
  }
  const GAP_AT = 0.75 - (GAP / 2) / (Math.PI * 2) * 0.5;                // the gap's near edge, on the C's circle
  const spark = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xfff1dc, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  spark.scale.setScalar(0.9); scene.add(spark);
  const sparkLight = new THREE.PointLight(0xffd0c8, 8, 6, 2); scene.add(sparkLight);
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,220,200,.55)'); g.addColorStop(1, 'rgba(255,120,100,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
  }

  // --- the human in the loop ----------------------------------------------------------
  let stopped = false, closeWanted = false, closeAt = null, closed = false, t0 = null;
  function closeLoop() { if (!stopped || closeWanted) return; closeWanted = true; onClose && onClose(); }
  function onGesture(e) { if (dir.active && e.type === 'keydown' && /^[keKE]$/.test(e.key)) return; closeLoop(); }
  function resize() { const w = container.clientWidth, h = container.clientHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
  window.addEventListener('resize', resize);

  let raf = 0;
  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const now = nowMs / 1000; if (t0 === null) t0 = now - (startAt || 0);
    const t = now - t0;
    if (closeWanted && closeAt === null) closeAt = now - (closeSkip || 0);   // stamped with the frame's own clock
    let f;
    if (closeAt === null) {
      f = Math.min(GAP_AT, t / LAP_SECONDS);                                // the first lap: from the neck to the gap
      if (f >= GAP_AT && !stopped) {                                        // the spark stops at the gap
        stopped = true; onStop && onStop();
        window.addEventListener('keydown', onGesture); window.addEventListener('pointerdown', onGesture);
        if (autoClose) setTimeout(closeLoop, 900);
      }
    } else {
      const k = ease(clamp01((now - closeAt) / CLOSE_SECONDS));
      setGap(GAP * (1 - k));                                                // the C closes into an O; the cube is taken back into the tube
      cubeMat.opacity = 1 - k; inner.material.opacity = (1 - k) * 0.7; cubeGroup.scale.setScalar(1 - 0.35 * k); cubeGroup.rotation.y = k * Math.PI / 2;
      const gone = now - closeAt - CLOSE_SECONDS;
      f = gone < 0 ? GAP_AT : GAP_AT + gone / LAP_SECONDS;                  // and the spark runs ∞
      if (!closed && gone > 0 && f >= 1) { closed = true; onClosed && onClosed(); }
    }
    spark.position.copy(pathAt(f)); sparkLight.position.copy(spark.position);
    spark.material.opacity = 0.7 + 0.3 * Math.sin(now * 2 * Math.PI);      // 60 BPM
    const spin = dir.active ? 0 : Math.sin(now * 0.25) * 0.28;             // a slow turn, so the surface shows its depth
    [O, C, cubeGroup].forEach((o) => { o.rotation.x = spin; });
    dir.update(t);
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return { closeLoop, dispose() { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('keydown', onGesture); window.removeEventListener('pointerdown', onGesture); dir.dispose(); renderer.dispose(); renderer.domElement.remove(); } };
}
