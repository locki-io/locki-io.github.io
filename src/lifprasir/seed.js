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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const BREATH_PERIOD = 50 / 24;  // one baked breath: 50 frames at Blender's 24 fps ≈ 2.08 s
const COLLAPSE_SECONDS = 1.8;
const BIRTH_SECONDS = 6.0;      // slowly
const THREAD_HEIGHT = 60;       // far past the top of the frame — it goes to the tree
const FLOOR_Y = 0.9;            // the ground: just above the radiating orb
const GRASS_START = 22.5;       // when the camera has risen above — the grass comes out of the floor
const GRASS_SECONDS = 3.5;
const GRASS_COUNT = 700;

// Deterministic, like the tree: the same field of grass every time. No Math.random.
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

export function initSeed(container, {
  stream = [], onBeat, onCollapse, onBirth,
  director = false,   // operator mode: orbit the camera, capture keyframes (K), export the path (E)
  cameraPath = null,  // [{ u, position:[x,y,z], target:[x,y,z] }] — played along the timeline when present
  onKeyframes,        // director HUD callback
} = {}) {
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
  const lookTarget = new THREE.Vector3(0, 1.5, 0);

  // --- director mode: the operator sets the orbit -----------------------------
  // Orbit with the mouse; K captures {u, position, target}; E exports the path.
  // The exported JSON lands in public/camera/<act>.json and becomes DATA the act
  // plays back — the camera path is authored by a human hand, then versioned.
  let controls = null;
  const keyframes = [];
  let currentU = 0;
  function onKey(e) {
    if (!controls) return;
    if (e.key === 'k' || e.key === 'K') {
      keyframes.push({
        u: +currentU.toFixed(2),
        position: camera.position.toArray().map((v) => +v.toFixed(3)),
        target: controls.target.toArray().map((v) => +v.toFixed(3)),
      });
      keyframes.sort((a, b) => a.u - b.u);
      onKeyframes && onKeyframes(keyframes, 'captured');
    } else if (e.key === 'e' || e.key === 'E') {
      const json = JSON.stringify(keyframes, null, 2);
      console.log('%ccamera path — save as public/camera/seed.json', 'color:#ffb8a8;font-weight:bold');
      console.log(json);
      if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
      onKeyframes && onKeyframes(keyframes, 'exported');
    }
  }
  function applyCameraPath(u) {
    const p = cameraPath;
    if (!p || !p.length) return;
    if (u <= p[0].u) { setCam(p[0]); return; }
    if (u >= p[p.length - 1].u) { setCam(p[p.length - 1]); return; }
    let i = 0; while (u > p[i + 1].u) i++;
    const a = p[i], b = p[i + 1];
    const k = (u - a.u) / Math.max(1e-6, b.u - a.u);
    const e = k * k * (3 - 2 * k); // smoothstep between two human-set keys
    camera.position.set(
      a.position[0] + (b.position[0] - a.position[0]) * e,
      a.position[1] + (b.position[1] - a.position[1]) * e,
      a.position[2] + (b.position[2] - a.position[2]) * e);
    lookTarget.set(
      a.target[0] + (b.target[0] - a.target[0]) * e,
      a.target[1] + (b.target[1] - a.target[1]) * e,
      a.target[2] + (b.target[2] - a.target[2]) * e);
    camera.lookAt(lookTarget);
  }
  function setCam(kf) { camera.position.fromArray(kf.position); lookTarget.fromArray(kf.target); camera.lookAt(lookTarget); }

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  if (director) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(lookTarget);
    controls.enableDamping = true;
    window.addEventListener('keydown', onKey);
    onKeyframes && onKeyframes(keyframes, 'ready');
  }

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

  // --- the floor, the pin, and Leaves of Grass ---------------------------------
  // The ground is a dark, slightly translucent plane just above the orb: its
  // radiance seeps through. Where the thread pierces it, a pin — the few intense
  // pixels seen from above. Around it, transparent grass rises from the floor.
  // "I bequeath myself to the dirt to grow from the grass I love."
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshBasicMaterial({ color: 0x17a34a, transparent: true, opacity: 0.38, depthWrite: false }) // a transparent green ground; the orb still shines through
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  floor.visible = false;
  scene.add(floor);

  const pin = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowMap, color: 0xff3344, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  pin.scale.set(0.28, 0.28, 1);
  pin.position.set(0, FLOOR_Y + 0.02, 0);
  pin.visible = false;
  scene.add(pin);

  // one blade: a tapered strip, bent forward, its base at the origin
  const bladeGeo = new THREE.PlaneGeometry(0.05, 1, 1, 5);
  { const pos = bladeGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) + 0.5;                    // 0 (base) .. 1 (tip)
      pos.setX(i, pos.getX(i) * (1 - y * 0.85));      // taper to the tip
      pos.setZ(i, y * y * 0.35);                      // bend
      pos.setY(i, y);
    }
    bladeGeo.computeVertexNormals(); }
  const grassMat = new THREE.MeshBasicMaterial({
    color: 0x5cff8a, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, // a more intense green
  });
  const grass = new THREE.InstancedMesh(bladeGeo, grassMat, GRASS_COUNT);
  grass.visible = false;
  scene.add(grass);
  const bladeSeed = [];
  for (let i = 0; i < GRASS_COUNT; i++) {
    const r = 0.5 + hash(i * 3 + 1) * 6.5;          // never inside the thread
    const a = hash(i * 3 + 2) * Math.PI * 2;
    bladeSeed.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, yaw: hash(i * 3 + 3) * Math.PI * 2,
                     h: 0.5 + hash(i * 7 + 5) * 1.3, phase: hash(i * 11 + 9) * Math.PI * 2 });
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  function growGrass(g, t) {
    for (let i = 0; i < GRASS_COUNT; i++) {
      const b = bladeSeed[i];
      const gi = Math.max(0, Math.min(1, (g - hash(i) * 0.6) / 0.4)); // each blade on its own beat
      e3.set(0, b.yaw, Math.sin(t * 1.3 + b.phase) * 0.12 * gi);       // sway
      q.setFromEuler(e3);
      v3.set(b.x, FLOOR_Y, b.z);
      s3.set(1, Math.max(0.0001, b.h * gi), 1);
      m4.compose(v3, q, s3);
      grass.setMatrixAt(i, m4);
    }
    grass.instanceMatrix.needsUpdate = true;
  }

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
      haloMat.opacity = 0.08 + 0.3 * b + 0.06 * Math.sin(u * 2 * Math.PI) * b; // the thread at rest: one beat per second (forge #3)
      glow.scale.setScalar(3.8 - 2.2 * b); // the flare settles into the thread's root
      if (b >= 1) { // the spark rides the thread upward, endlessly
        spark.visible = true;
        const s = ((u - BIRTH_START - BIRTH_SECONDS) % 2.4) / 2.4;
        spark.position.set(0, s * 14, 0);
        spark.material.opacity = 1 - s;
      }
      // Movement 4 — from above: the floor, the pin, and the grass coming out of it.
      if (u >= GRASS_START - 1.0) {
        floor.visible = true; pin.visible = true; grass.visible = true;
        const g = easeOut(Math.max(0, Math.min(1, (u - GRASS_START) / GRASS_SECONDS)));
        growGrass(g, u);
        pin.material.opacity = Math.min(1, (u - (GRASS_START - 1.0)));
      }
    }
  }

  const clock = new THREE.Clock();
  let raf = 0;
  function frame() {
    const dt = clock.getDelta();
    const t = clock.elapsedTime;
    if (mixer) mixer.update(dt);
    if (t0 !== null) { currentU = t - t0; setState(currentU); }
    if (controls) controls.update();               // the operator's hand
    else if (t0 !== null) applyCameraPath(currentU); // the authored path, as data
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  if (reduceMotion) {
    // one honest still: the thread already born, every line of the stream shown
    stream.forEach((line, i) => onBeat && onBeat(i, line));
    root.visible = false; thread.scale.y = 1; coreMat.opacity = 1; haloMat.opacity = 0.3;
    floor.visible = true; pin.visible = true; grass.visible = true; growGrass(1, 0);
    if (cameraPath && cameraPath.length) setCam(cameraPath[cameraPath.length - 1]);
    renderer.render(scene, camera);
  } else {
    frame();
  }

  return function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('keydown', onKey);
    if (controls) controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
