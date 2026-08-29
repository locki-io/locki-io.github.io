// seed.js — Act I, choreographed: breathe × N → collapse → the thread is born.
//
// The seed is the realm's first minted object — the pTesseract Data NFT
// (2023-10-23), public/assets/tesseract.glb — 15 nested emissive-blue cubes
// with their ±15% breath baked in Blender. Blue is power.
//
// Movement 1 — BREATHE. The seed inflates and deflates N times; each breath is a
//   beat, and on every beat one line of the STREAM appears (on the right).
//   N = stream.length: the seed breathes exactly as long as there is something
//   to say. Nothing decorative — the stream is data.
// Movement 2 — COLLAPSE. The breath stops; the whole seed folds into its own
//   centre — the one point of power — which flares.
// Movement 3 — BIRTH. From that point the RED THREAD glows out and rises,
//   slowly, straight up, from within the ground toward the tree. Then a spark
//   of power rides it upward, endlessly, until the next act.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const BREATH_PERIOD = 50 / 24;  // one baked breath: 50 frames at Blender's 24 fps ≈ 2.08 s
const COLLAPSE_SECONDS = 1.8;
const BIRTH_SECONDS = 6.0;      // slowly
const THREAD_HEIGHT = 60;       // far past the top of the frame — it goes to the tree

export function initSeed(container, { stream = [], onBeat, onCollapse, onBirth } = {}) {
  if (!container) return () => {};
  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = Math.max(1, stream.length);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    42, container.clientWidth / container.clientHeight, 0.1, 200
  );
  camera.position.set(0, 1.2, 13.5);
  camera.lookAt(0, 1.5, 0);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0x2233ff, 0.7));
  const coreLight = new THREE.PointLight(0xffffff, 40, 40);
  scene.add(coreLight);
  const glowMap = makeGlow();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowMap, color: 0xffffff, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  glow.scale.set(1.4, 1.4, 1);
  scene.add(glow);

  // --- the seed --------------------------------------------------------------
  const root = new THREE.Group();
  scene.add(root);
  let mixer = null;
  let t0 = null; // when the seed arrived — the timeline starts here

  new GLTFLoader().load(
    '/assets/tesseract.glb',
    (gltf) => {
      root.add(gltf.scene);
      mixer = new THREE.AnimationMixer(gltf.scene);
      for (const clip of gltf.animations) {
        const a = mixer.clipAction(clip);
        a.setLoop(THREE.LoopRepeat, Infinity);
        a.play();
      }
      t0 = clock.elapsedTime;
      console.log('%cThe seed. You mint — lucky you.', 'color:#4a6bff;font-weight:bold');
    },
    undefined,
    (err) => console.error('The seed failed to load:', err)
  );

  // --- the red thread: the axis. The seed sways around it; it does not sway.
  const thread = new THREE.Group();
  const coreGeo = new THREE.CylinderGeometry(0.035, 0.035, THREAD_HEIGHT, 12, 1, true);
  coreGeo.translate(0, THREAD_HEIGHT / 2, 0);
  const haloGeo = new THREE.CylinderGeometry(0.2, 0.2, THREAD_HEIGHT, 16, 1, true);
  haloGeo.translate(0, THREAD_HEIGHT / 2, 0);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: 0 });
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0xff5a4a, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  thread.add(new THREE.Mesh(coreGeo, coreMat), new THREE.Mesh(haloGeo, haloMat));
  thread.scale.y = 0.0001; // unborn
  scene.add(thread);

  const spark = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowMap, color: 0xffb8a8, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  spark.scale.set(0.6, 0.6, 1);
  spark.visible = false;
  scene.add(spark);

  function makeGlow() {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(200,210,255,0.8)'); g.addColorStop(1, 'rgba(120,120,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    return new THREE.CanvasTexture(c);
  }
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeIn  = (x) => x * x * x;

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // --- the timeline ----------------------------------------------------------
  const BREATH_END = N * BREATH_PERIOD;
  const BIRTH_START = BREATH_END + COLLAPSE_SECONDS;
  let beatsShown = 0, collapsed = false, born = false;

  function setState(u) {
    // The stream keeps time with the breath — and catches up in EVERY phase, so a
    // long frame gap (slow GPU, background tab) can never swallow a line.
    const beat = Math.min(N, Math.floor(u / BREATH_PERIOD) + 1);
    while (beatsShown < beat) { onBeat && onBeat(beatsShown, stream[beatsShown]); beatsShown++; }
    if (u < BREATH_END) {
      // Movement 1 — breathe. One line of the stream per breath.
      root.rotation.y = Math.sin(u * 0.25) * 0.35;
      root.rotation.x = Math.sin(u * 0.18) * 0.18;
      root.scale.setScalar(1);
      root.visible = true;
    } else if (u < BIRTH_START) {
      // Movement 2 — collapse into the point of power.
      if (!collapsed) { collapsed = true; if (mixer) mixer.timeScale = 0; onCollapse && onCollapse(); }
      const k = easeIn((u - BREATH_END) / COLLAPSE_SECONDS);
      root.scale.setScalar(Math.max(0.0001, 1 - k));
      root.rotation.y *= (1 - k * 0.1);
      glow.scale.setScalar(1.4 + 2.4 * k); // the point flares as the seed folds into it
    } else {
      // Movement 3 — birth. The thread glows out from the centre and rises, slowly.
      if (!born) { born = true; root.visible = false; onBirth && onBirth(); }
      const b = easeOut(Math.min(1, (u - BIRTH_START) / BIRTH_SECONDS));
      thread.scale.y = Math.max(0.0001, b);
      coreMat.opacity = Math.min(1, b * 1.6);
      haloMat.opacity = 0.08 + 0.3 * b + 0.06 * Math.sin(u * 2.2) * b;
      glow.scale.setScalar(3.8 - 2.2 * b); // the flare settles into the thread's root
      if (b >= 1) { // the spark rides the thread upward, endlessly
        spark.visible = true;
        const s = ((u - BIRTH_START - BIRTH_SECONDS) % 2.4) / 2.4;
        spark.position.set(0, s * 14, 0);
        spark.material.opacity = 1 - s;
      }
    }
  }

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    if (mixer) mixer.update(dt);
    if (t0 !== null) setState(t - t0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  if (reduceMotion) {
    // one honest still: the thread already born, every line of the stream shown
    stream.forEach((line, i) => onBeat && onBeat(i, line));
    root.visible = false; thread.scale.y = 1; coreMat.opacity = 1; haloMat.opacity = 0.3;
    renderer.render(scene, camera);
  } else {
    frame();
  }

  return function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
