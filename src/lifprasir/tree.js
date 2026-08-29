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
  bpm: 50, // calm pulse. Excitement would quicken it.
};

// Deterministic pseudo-randomness so the tree is the SAME tree every load —
// a thread that persists. No Math.random: the pattern is fixed, like a memory.
function hash(n) {
  const s = Math.sin(n * 127.1) * 43758.5453;
  return s - Math.floor(s); // 0..1
}

export function initLifprasirTree(container) {
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
  camera.position.set(0, 7.5, 17);
  camera.lookAt(0, 7, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true, // let the dark hero photo show through behind the tree
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // --- Light: a warm root-glow + cool rim ------------------------------------
  scene.add(new THREE.AmbientLight(0x331018, 0.9));
  const key = new THREE.PointLight(0xff5a4a, 70, 80);
  key.position.set(6, 12, 10);
  scene.add(key);
  const rim = new THREE.PointLight(0x3036c5, 40, 80); // Locki blue
  rim.position.set(-10, 4, -6);
  scene.add(rim);

  // --- The tree --------------------------------------------------------------
  const treeGroup = new THREE.Group();
  treeGroup.position.y = -1; // sit the root near the lower frame
  scene.add(treeGroup);

  // Wood material — crimson at the root, the red thread carried upward.
  const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x6e0d1c,
    emissive: 0x7a0f1f,
    emissiveIntensity: 0.35,
    roughness: 0.55,
    metalness: 0.15,
  });

  const leafPositions = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const tmpQuat = new THREE.Quaternion();

  // Recursively grow one branch and spawn its children. Self-similar: the same
  // rule at every scale, infinite depth folded into finite recursion.
  function grow(origin, dir, length, radius, depth, seed) {
    const end = origin.clone().addScaledVector(dir, length);

    const geo = new THREE.CylinderGeometry(radius * 0.7, radius, length, 6, 1);
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
    color: 0xffae6a,
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
    g.addColorStop(0, 'rgba(255,230,190,1)');
    g.addColorStop(0.35, 'rgba(255,150,90,0.7)');
    g.addColorStop(1, 'rgba(255,90,60,0)');
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
    branchMaterial.emissiveIntensity = 0.3 + beat * 0.55;
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
    branchMaterial.emissiveIntensity = 0.5;
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
