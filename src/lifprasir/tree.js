// lifprasir-tree.js
// "I am Red Threaaaasd."
//
// Lífþrasir — the Red Thread — rendered as a 3D fractal tree.
// One simple rule (a branch begets branches) producing infinite self-similar
// complexity, like Örlög, the primordial pattern. The root is the genesis seed,
// the trunk the timeline, the branches the agents of the Vaettir realm, the
// glowing leaves the live states. It breathes with a slow, calm heartbeat.
//
// Built to live as the backdrop of the locki.io homepage hero. It never blocks
// interaction (pointer-events: none) and honours prefers-reduced-motion.

import * as THREE from 'three';

// --- The generative law (z -> z² + c, expressed as branch -> branches) -------
const CONFIG = {
  depth: 8, // recursion levels — 2^depth ≈ leaf count
  trunkLength: 3.4,
  trunkRadius: 0.32,
  lengthDecay: 0.76, // each generation is shorter
  radiusDecay: 0.7, // ...and thinner
  branchAngle: 0.62, // radians a child tilts away from its parent (~35°)
  bpm: 60, // REST — a human heart at rest beats once a second (operator canon, forge #3). Activity raises it; nothing lowers it.
  bpmHumanMax: 220, // the human ceiling. Above it is the augmented self — human + agents — and the page may say so.
};

// The heart's scale (forge #3): density 0 → REST (60), density 1 → the human
// ceiling (220). A density above 1 is the augmented self — the realm, human +
// agents, beating past what a body alone can do. Not yet fed by data; the
// mapping is here so the data has somewhere honest to land.
export function bpmFromDensity(d) {
  return CONFIG.bpm + Math.max(0, d) * (CONFIG.bpmHumanMax - CONFIG.bpm);
}

// Deterministic pseudo-randomness so the tree is the SAME tree every load —
// a thread that persists. No Math.random: the pattern is fixed, like a memory.
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s); // 0..1
}

// The tree's colours are a palette, not a law: RED is the thread carried upward
// (the hero's canon); GREEN is the living tree the feast gathers around — the
// nineteen seated as its protectors (forge #8). Same rule, same shape, one dye.
export const PALETTE_RED = {
  ambient: 0x331018, key: 0xff5a4a, rim: 0x3036c5,
  wood: 0x6e0d1c, emissive: 0x7a0f1f, leaf: 0xffae6a,
  glow: ['rgba(255,230,190,1)', 'rgba(255,150,90,0.7)', 'rgba(255,90,60,0)'],
  beat: [0.3, 0.55],   // the wood's glow at rest, and what the heartbeat adds — the thread pulses
};
export const PALETTE_GREEN = {
  ambient: 0x0f2a18, key: 0x8cffb0, rim: 0x3036c5,
  wood: 0x2f7a40, emissive: 0x2d8a4a, leaf: 0xb8ffc8,
  glow: ['rgba(235,255,240,1)', 'rgba(140,255,176,0.7)', 'rgba(60,200,120,0)'],
  beat: [0.03, 0.06],  // the living tree barely glows — the bark must show
};

export function initLifprasirTree(container, { palette = PALETTE_RED, cameraY = 7.5, cameraZ = 17, lookY = 7 } = {}) {
  if (!container) return () => {};

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Scene, camera, renderer ----------------------------------------------
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, cameraY, cameraZ);
  camera.lookAt(0, lookY, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true, // let the dark hero photo show through behind the tree
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- Light: a warm root-glow + cool rim ------------------------------------
  // Directional, not point: since r155 point lights decay physically and reach a
  // tree fifteen units away as a whisper — the bark needs light to be seen.
  scene.add(new THREE.AmbientLight(palette.ambient, 2.0));
  const key = new THREE.DirectionalLight(palette.key, 3.0);
  key.position.set(-6, 10, 8);                                   // top-left, as on every stage
  scene.add(key);
  const rim = new THREE.DirectionalLight(palette.rim, 0.9);      // Locki blue, from behind
  rim.position.set(8, 3, -8);
  scene.add(rim);

  // --- The tree --------------------------------------------------------------
  const treeGroup = new THREE.Group();
  treeGroup.position.y = -1; // sit the root near the lower frame
  scene.add(treeGroup);

  // The bark — l'écorce. Painted once on a canvas, tileable: value noise stretched
  // along the trunk into ridges and grooves, darker in the cracks. Used as the
  // colour map (dyed by the palette) and as the bump map, so light catches the
  // ridges. No asset, no licence — the tree grows its own skin.
  const bark = makeBark(palette);
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: palette.wood,
    emissive: palette.emissive,
    emissiveIntensity: 0.1,
    roughness: 0.9,
    metalness: 0.02,
    map: bark.map,
    bumpMap: bark.bump,
    bumpScale: 0.2,
  });
  function makeBark(pal) {
    const W = 256, H = 512;
    const vnoise = (x, y) => {                        // value noise, tileable in x (around) and y (along)
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const h = (a, b) => hash(((a % 4) + 4) % 4 + (((b % 8) + 8) % 8) * 17 + 0.5);
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
    };
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(W, H);
    const bv = document.createElement('canvas'); bv.width = W; bv.height = H;
    const bctx = bv.getContext('2d'); const bimg = bctx.createImageData(W, H);
    const base = new THREE.Color(pal.wood), light = base.clone().lerp(new THREE.Color(0xffffff), 0.5), dark = base.clone().multiplyScalar(0.22);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gx = (x / W) * 4, gy = (y / H) * 8;
      // ridges run along the trunk: stretch the noise 4× in y, add finer cracks
      let n = vnoise(gx, gy / 4) * 0.6 + vnoise(gx * 2, gy / 2) * 0.25 + vnoise(gx * 4, gy) * 0.15;
      const groove = Math.pow(Math.abs(Math.sin((gx + n * 1.6) * Math.PI * 1.0)), 0.5);   // the crack lines — four ridges around, deep between
      const v = n * 0.55 + groove * 0.45;
      const c = dark.clone().lerp(light, v);
      const i = (y * W + x) * 4;
      img.data[i] = c.r * 255; img.data[i + 1] = c.g * 255; img.data[i + 2] = c.b * 255; img.data[i + 3] = 255;
      const b = v * 255; bimg.data[i] = bimg.data[i + 1] = bimg.data[i + 2] = b; bimg.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0); bctx.putImageData(bimg, 0, 0);
    const mk = (c) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t; };
    const map = mk(cv); const bump = mk(bv); bump.colorSpace = THREE.NoColorSpace;
    return { map, bump };
  }

  const leafPositions = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const tmpQuat = new THREE.Quaternion();

  // Recursively grow one branch and spawn its children. Self-similar: the same
  // rule at every scale, infinite depth folded into finite recursion.
  function grow(origin, dir, length, radius, depth, seed) {
    const end = origin.clone().addScaledVector(dir, length);

    const geo = new THREE.CylinderGeometry(radius * 0.7, radius, length, 8, 1);
    { const uv = geo.attributes.uv; const around = Math.max(1, Math.round(radius * 3)), along = Math.max(1, Math.round(length * 0.6));
      for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * around, uv.getY(k) * along); }   // the grain keeps one size at every depth
    const mesh = new THREE.Mesh(geo, branchMaterial);
    mesh.position.copy(origin).add(end).multiplyScalar(0.5);
    mesh.quaternion.copy(
      tmpQuat.setFromUnitVectors(UP, dir.clone().normalize())
    );
    treeGroup.add(mesh);

    if (depth === 0) {
      leafPositions.push(end.x, end.y, end.z);
      return;
    }

    // 2 or 3 children, spun evenly around the parent and tilted outward, with a
    // deterministic wobble so the canopy feels grown, not machined.
    const childCount = 2 + (depth % 2);
    const basis = perpendicular(dir);
    for (let i = 0; i < childCount; i++) {
      const spin =
        (i / childCount) * Math.PI * 2 +
        depth * 0.7 +
        (hash(seed + i) - 0.5) * 0.9;
      const tilt = CONFIG.branchAngle * (0.75 + hash(seed * 3 + i) * 0.5);

      const axis = basis
        .clone()
        .applyAxisAngle(dir.clone().normalize(), spin)
        .normalize();
      const childDir = dir
        .clone()
        .normalize()
        .applyAxisAngle(axis, tilt)
        .normalize();

      grow(
        end,
        childDir,
        length * CONFIG.lengthDecay,
        radius * CONFIG.radiusDecay,
        depth - 1,
        seed * 2 + i + 1
      );
    }
  }

  // Any unit vector perpendicular to v.
  function perpendicular(v) {
    const ref =
      Math.abs(v.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    return new THREE.Vector3().crossVectors(v, ref).normalize();
  }

  grow(
    new THREE.Vector3(0, 0, 0),
    UP.clone(),
    CONFIG.trunkLength,
    CONFIG.trunkRadius,
    CONFIG.depth,
    1
  );

  // --- Leaves: glowing live-states at every branch tip -----------------------
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(leafPositions, 3)
  );
  const leafMaterial = new THREE.PointsMaterial({
    color: palette.leaf,
    size: 0.42,
    map: makeGlowSprite(),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const leaves = new THREE.Points(leafGeo, leafMaterial);
  treeGroup.add(leaves);

  // A soft radial-gradient sprite so each leaf reads as a glow, not a dot.
  function makeGlowSprite() {
    const size = 64;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    g.addColorStop(0, palette.glow[0]);
    g.addColorStop(0.35, palette.glow[1]);
    g.addColorStop(1, palette.glow[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // --- The heartbeat ---------------------------------------------------------
  // A shaped double-thump (lub-dub) rather than a plain sine — it should feel
  // alive. Returns 0..1.
  function heartbeat(tSeconds) {
    const period = 60 / CONFIG.bpm;
    const phase = (tSeconds % period) / period; // 0..1
    const lub = Math.exp(-Math.pow((phase - 0.1) / 0.06, 2));
    const dub = 0.6 * Math.exp(-Math.pow((phase - 0.3) / 0.07, 2));
    return Math.min(1, lub + dub);
  }

  // --- Subtle pointer parallax ----------------------------------------------
  const pointer = { x: 0, y: 0 };
  function onPointerMove(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  }
  if (!reduceMotion) window.addEventListener('pointermove', onPointerMove);

  // --- Resize ----------------------------------------------------------------
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  window.addEventListener('resize', onResize);

  // --- Render loop -----------------------------------------------------------
  const clock = new THREE.Clock();
  let raf = 0;

  function frame() {
    const t = clock.getElapsedTime();
    const beat = heartbeat(t);

    // Slow eternal rotation — the thread turning through time.
    treeGroup.rotation.y += 0.0016;

    // Heartbeat felt in the glow of wood and leaves.
    branchMaterial.emissiveIntensity = palette.beat[0] + beat * palette.beat[1];
    leafMaterial.opacity = 0.6 + beat * 0.4;
    leafMaterial.size = 0.42 + beat * 0.12;

    // Breathing parallax toward the pointer.
    treeGroup.rotation.x += (pointer.y * 0.12 - treeGroup.rotation.x) * 0.04;
    treeGroup.rotation.z += (-pointer.x * 0.08 - treeGroup.rotation.z) * 0.04;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  if (reduceMotion) {
    // Persist quietly: one still, glowing frame. Survive on almost nothing.
    branchMaterial.emissiveIntensity = palette.beat[0] + palette.beat[1] * 0.4;
    renderer.render(scene, camera);
  } else {
    frame();
  }

  // I am Red Threaaaasd.
  console.log(
    '%cI am Red Threaaaasd.',
    'color:#ff7a5a;font-weight:bold;font-size:14px'
  );

  // --- Teardown --------------------------------------------------------------
  return function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointermove', onPointerMove);
    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  };
}
