// void.js — Act 0, void → 0: four books open, and their words become light.
//
// Black. One point. Four books rise out of the dark, one after the other, and
// open. Each line of the STREAM is typed onto the open page — a real book,
// streaming text — and when a line is complete its letters lift off the paper
// as light and drift to the point. Human experience, parsed as light.
//
// When the fourth book has spoken the act HOLDS: nothing moves until the player
// makes the first gesture — the YAWP (any key, click or touch). The shockwave
// jolts the gathered light, which folds into the twelve edges of a cube: the
// tesseract's first outline, the 0 from which the seed (Act I) is minted.
//
// Everything is data: the books, their lines, `source:` and `consent:` come from
// public/story/void.json; the camera path from public/camera/void.json.

import * as THREE from 'three';
import { createDirector } from './director.js';

// --- timeline (seconds) --------------------------------------------------------
const PRE = 1.4;            // the point alone in the dark
const SLIDE = 1.0;          // a book rises out of the void
const OPEN = 1.5;           // the cover swings open
const CPS = 30;             // characters typed per second — a human reading pace
const LINE_GAP = 0.55;      // breath between two lines
const BOOK_GAP = 1.0;       // breath between two books
const SHOCK = 1.3;          // the yawp's shockwave
const FOLD_START = 0.35, FOLD = 1.9;   // light folds into the cube's edges
const CUBE_IN = 1.8, CUBE_FADE = 1.2;  // the outline appears
const SINK_START = 0.6, SINK = 1.8;    // the books go back into the dark
const DONE_AT = 5.2;        // → follow the thread into the seed

const BOOK_H_MAX = 1.2;     // book height in scene units; width follows the cover's aspect
const COL_H_MAX = 6.0;      // the column must fit the frame — more books, smaller books
let BOOK_H = BOOK_H_MAX;
const COL_X = -3.7;         // the books stand in a column on the left; the stream is on the right
const COL_GAP = 0.22;
const COL_Y = 0.5;          // the column's centre, a little under the point so the top book clears the title
const THICK = 0.14;
const POINT = new THREE.Vector3(0, 0.9, 1.1);    // the point of power — the 0, between the books and the stream
const CUBE = 0.9;           // side of the cube the light folds into

// Deterministic, like the tree and the grass: the same light every time.
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const ease = (s) => s * s * (3 - 2 * s);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// --- the page: a canvas that types ------------------------------------------
const PAGE_W = 512, PAGE_H = 704, MARGIN = 40, FONT = '30px Georgia, "Times New Roman", serif', LINE_H = 40;

function layoutBook(book) {
  // Wrap each stream line into rows that fit the page. Returns rows with the
  // index of the stream line they belong to and their pixel geometry.
  const c = document.createElement('canvas'); c.width = PAGE_W; c.height = PAGE_H;
  const ctx = c.getContext('2d'); ctx.font = FONT;
  const maxW = PAGE_W - 2 * MARGIN;
  const rows = []; let y = MARGIN + 92;
  book.lines.forEach((text, li) => {
    const words = text.split(' '); let row = '';
    const push = (s) => { rows.push({ li, text: s, y, w: ctx.measureText(s).width }); y += LINE_H; };
    for (const w of words) {
      const cand = row ? row + ' ' + w : w;
      if (ctx.measureText(cand).width > maxW && row) { push(row); row = w; } else row = cand;
    }
    if (row) push(row);
    y += 10; // a breath between lines
  });
  return rows;
}

function drawPage(ctx, book, rows, typed /* chars typed per stream line */) {
  ctx.fillStyle = '#f1e8d3'; ctx.fillRect(0, 0, PAGE_W, PAGE_H);
  // faint paper grain, deterministic
  ctx.fillStyle = 'rgba(120,100,70,0.05)';
  for (let i = 0; i < 260; i++) ctx.fillRect(hash(i) * PAGE_W, hash(i + 991) * PAGE_H, 2, 2);
  ctx.fillStyle = '#5a4e3c'; ctx.font = '600 15px Georgia, serif'; ctx.textAlign = 'center';
  ctx.fillText(book.author.toUpperCase(), PAGE_W / 2, MARGIN + 30);
  ctx.font = 'italic 17px Georgia, serif'; ctx.fillText(book.title, PAGE_W / 2, MARGIN + 56);
  ctx.textAlign = 'left'; ctx.font = FONT; ctx.fillStyle = '#2b2620';
  // rows: fully typed for complete lines, partial for the current one
  let consumed = {}; // chars consumed per stream line while walking rows
  for (const r of rows) {
    const done = typed[r.li] || 0, before = consumed[r.li] || 0;
    const n = Math.max(0, Math.min(r.text.length, done - before));
    consumed[r.li] = before + r.text.length + 1; // +1 for the space swallowed at the wrap
    if (n > 0) ctx.fillText(r.text.slice(0, n), MARGIN, r.y);
    if (n > 0 && n < r.text.length) { // the cursor
      const cw = ctx.measureText(r.text.slice(0, n)).width;
      ctx.fillStyle = '#b8543f'; ctx.fillRect(MARGIN + cw + 2, r.y - 22, 3, 28); ctx.fillStyle = '#2b2620';
    }
  }
}

function coverFallback(book) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 768;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1a1620'; ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = 'rgba(255,220,180,.35)'; ctx.lineWidth = 3; ctx.strokeRect(24, 24, 464, 720);
  ctx.fillStyle = '#f1e2c4'; ctx.textAlign = 'center'; ctx.font = '600 44px Georgia, serif';
  const words = book.title.split(' '); let line = '', y = 300;
  for (const w of words) { const cand = line ? line + ' ' + w : w; if (ctx.measureText(cand).width > 420 && line) { ctx.fillText(line, 256, y); y += 54; line = w; } else line = cand; }
  ctx.fillText(line, 256, y);
  ctx.font = '24px Georgia, serif'; ctx.fillStyle = 'rgba(241,226,196,.7)'; ctx.fillText(book.author, 256, y + 80);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { texture: t, aspect: 512 / 768 };
}

function spriteTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const ctx = c.getContext('2d'); const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

export function initVoid(container, {
  books = [],
  director = false, cameraPath = null, onKeyframes,
  onBookOpen, onLine, onHold, onYawp, onFold, onDone,
  autoYawp = false,   // testing: sound the yawp by itself after the hold
  speed = 1,          // testing: run the timeline faster (never in the story itself)
  startAt = 0,        // testing: begin the timeline at this second ('hold' = just before the hold)
  yawpSkip = 0,       // testing: when autoYawp fires, pretend it happened this many seconds ago
} = {}) {
  if (!container || !books.length) return () => {};
  BOOK_H = Math.min(BOOK_H_MAX, (COL_H_MAX - (books.length - 1) * COL_GAP) / books.length);
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 1.0, 9.6);
  const lookTarget = new THREE.Vector3(0, 0.9, 0);
  camera.lookAt(lookTarget);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const dir = createDirector({ camera, dom: renderer.domElement, act: 'void', target: lookTarget, director, cameraPath, onKeyframes });

  // --- light: the dark, and the point ---------------------------------------
  scene.add(new THREE.HemisphereLight(0x9fb0ff, 0x1a0f0a, 0.45));
  const key = new THREE.DirectionalLight(0xfff1dc, 0.9); key.position.set(3, 6, 6); scene.add(key);
  const pointLight = new THREE.PointLight(0x7fb8ff, 6, 12, 2); pointLight.position.copy(POINT); scene.add(pointLight);
  const glowTex = spriteTexture();
  const orb = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0x9fd0ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  orb.position.copy(POINT); orb.scale.setScalar(0.35); scene.add(orb);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  core.position.copy(POINT); scene.add(core);

  // --- the books --------------------------------------------------------------
  const loader = new THREE.TextureLoader();
  // a column on the left, top to bottom, centred on the point's height
  const colH = books.length * BOOK_H + (books.length - 1) * COL_GAP;
  const slots = books.map((_, i) => COL_Y + colH / 2 - BOOK_H / 2 - i * (BOOK_H + COL_GAP));
  const rigs = books.map((book, i) => {
    const rows = layoutBook(book);
    const canvas = document.createElement('canvas'); canvas.width = PAGE_W; canvas.height = PAGE_H;
    const ctx = canvas.getContext('2d');
    const pageTex = new THREE.CanvasTexture(canvas); pageTex.colorSpace = THREE.SRGBColorSpace;
    const typed = book.lines.map(() => 0);
    drawPage(ctx, book, rows, typed);

    const group = new THREE.Group();
    const ySlot = slots[i];
    group.position.set(COL_X - 5, ySlot, -0.6);      // starts far out in the void on the left, unseen
    group.visible = false;
    group.rotation.y = 0.22;                         // turned a little toward the point
    scene.add(group);

    const coverMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0.02 });
    const insideMat = new THREE.MeshStandardMaterial({ color: 0xe9dfc8, roughness: 0.95, emissive: 0x9a8b70, emissiveIntensity: 0.22 });
    const rig = { book, rows, ctx, pageTex, typed, group, coverMat, ySlot, w: BOOK_H * 0.62, built: false, opened: false, fired: book.lines.map(() => false), sunk: false };

    function build(aspect) {
      const w = BOOK_H * aspect; rig.w = w;
      // pages block (the closed book's body); its top face at z=+THICK/2 is the right-hand page
      const block = new THREE.Mesh(new THREE.BoxGeometry(w - 0.03, BOOK_H - 0.03, THICK), new THREE.MeshStandardMaterial({ color: 0xefe6d0, roughness: 0.9 }));
      block.position.set(0, 0, 0); group.add(block);
      const page = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.09, BOOK_H - 0.09),
        new THREE.MeshStandardMaterial({ map: pageTex, emissiveMap: pageTex, emissive: 0xfff3dc, emissiveIntensity: 0.28, roughness: 0.95 }));
      page.position.set(0, 0, THICK / 2 + 0.002); group.add(page); rig.page = page;
      // back cover
      const back = new THREE.Mesh(new THREE.PlaneGeometry(w, BOOK_H), new THREE.MeshStandardMaterial({ color: 0x2a2226, roughness: 0.9, side: THREE.DoubleSide }));
      back.position.set(0, 0, -THICK / 2 - 0.004); group.add(back);
      // spine
      const spine = new THREE.Mesh(new THREE.BoxGeometry(0.02, BOOK_H, THICK + 0.01), new THREE.MeshStandardMaterial({ color: 0x2a2226, roughness: 0.9 }));
      spine.position.set(-w / 2, 0, 0); group.add(spine);
      // front cover, hinged at the spine: pivot at x=-w/2, cover extends +w
      const pivot = new THREE.Group(); pivot.position.set(-w / 2, 0, THICK / 2 + 0.006); group.add(pivot); rig.pivot = pivot;
      const front = new THREE.Mesh(new THREE.PlaneGeometry(w, BOOK_H), coverMat); front.position.set(w / 2, 0, 0.004); pivot.add(front);
      const inside = new THREE.Mesh(new THREE.PlaneGeometry(w, BOOK_H), insideMat); inside.position.set(w / 2, 0, -0.002); inside.rotation.y = Math.PI; pivot.add(inside);
      rig.built = true;
    }
    const fb = coverFallback(book);
    loader.load(book.cover,
      (tex) => { tex.colorSpace = THREE.SRGBColorSpace; coverMat.map = tex; coverMat.needsUpdate = true; build(tex.image.width / tex.image.height); },
      undefined,
      () => { coverMat.map = fb.texture; coverMat.needsUpdate = true; build(fb.aspect); });
    return rig;
  });

  // --- the script: every event has its moment on the timeline -----------------
  let t = PRE;
  rigs.forEach((rig) => {
    rig.tSlide = t; t += SLIDE;
    rig.tOpen = t; t += OPEN;
    rig.lineT = rig.book.lines.map((text, li) => {
      const chars = rig.rows.filter((r) => r.li === li).reduce((a, r) => a + r.text.length + 1, 0);
      const start = t; t += chars / (reduceMotion ? CPS * 3 : CPS) + LINE_GAP;
      return { start, end: t - LINE_GAP, chars };
    });
    t += BOOK_GAP;
  });
  const HOLD_AT = t;
  const START = startAt === 'hold' ? Math.max(0, HOLD_AT - 1) : Math.max(0, +startAt || 0);

  // --- the light: one pool of points, budgeted per line -----------------------
  const perLine = rigs.flatMap((rig) => rig.book.lines.map((s) => Math.min(70, Math.max(14, Math.round(s.length * 0.9)))));
  const TOTAL = perLine.reduce((a, b) => a + b, 0);
  const pos = new Float32Array(TOTAL * 3), col = new Float32Array(TOTAL * 3);
  const P = []; // particle state
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  pGeo.setDrawRange(0, 0);
  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    map: glowTex, size: 0.075, vertexColors: true, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  scene.add(points);
  const warm = new THREE.Color(0xffd28a), blue = new THREE.Color(0x8fc6ff), white = new THREE.Color(0xffffff);
  let used = 0, gathered = 0;
  const tmpV = new THREE.Vector3(), tmpC = new THREE.Color();

  // the cube the light folds into — 12 edges of a cube around the point
  const h = CUBE / 2, C = [[-h,-h,-h],[h,-h,-h],[h,h,-h],[-h,h,-h],[-h,-h,h],[h,-h,h],[h,h,h],[-h,h,h]];
  const EDGES = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
  function edgePoint(k, s, out) { const [a, b] = EDGES[k]; return out.set(C[a][0] + (C[b][0]-C[a][0])*s, C[a][1] + (C[b][1]-C[a][1])*s, C[a][2] + (C[b][2]-C[a][2])*s); }

  function emitLine(rig, li, now) {
    const idx = rigs.indexOf(rig);
    const n = perLine[rigs.slice(0, idx).reduce((a, r) => a + r.book.lines.length, 0) + li];
    const rows = rig.rows.filter((r) => r.li === li);
    if (!rig.page || !rows.length) return;
    const pw = rig.w - 0.09, ph = BOOK_H - 0.09;
    for (let j = 0; j < n && used < TOTAL; j++) {
      const r = rows[Math.floor(hash(used * 7 + 1) * rows.length)];
      const px = MARGIN + hash(used * 3 + 2) * r.w, py = r.y - 10 + (hash(used * 5 + 3) - 0.5) * 16;
      tmpV.set((px / PAGE_W - 0.5) * pw, (0.5 - py / PAGE_H) * ph, 0.02).applyMatrix4(rig.page.matrixWorld);
      const seed = used;
      P.push({
        t0: now + hash(seed * 11 + 5) * 0.9, dur: 2.4 + hash(seed * 13 + 7) * 1.6,
        sx: tmpV.x, sy: tmpV.y, sz: tmpV.z,
        jx: (hash(seed * 17 + 9) - 0.5) * 0.5, jy: (hash(seed * 19 + 11) - 0.5) * 0.5, jz: (hash(seed * 23 + 13) - 0.5) * 0.5,
        arc: (hash(seed * 29 + 15) - 0.5) * 1.6, spin: 0.25 + hash(seed * 31 + 17) * 0.5,
        edge: Math.floor(hash(seed * 37 + 19) * 12), s: hash(seed * 41 + 21), arrived: false,
      });
      pos[used * 3] = tmpV.x; pos[used * 3 + 1] = tmpV.y; pos[used * 3 + 2] = tmpV.z;
      col[used * 3] = warm.r; col[used * 3 + 1] = warm.g; col[used * 3 + 2] = warm.b;
      used++;
    }
    pGeo.setDrawRange(0, used);
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  // --- the yawp: shockwave + fold ---------------------------------------------
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.92, 1.0, 96),
    new THREE.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.copy(POINT); scene.add(ring);
  const cubeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE, CUBE, CUBE));
  const cubeMat = new THREE.LineBasicMaterial({ color: 0x5fb0ff, transparent: true, opacity: 0 });
  const cube = new THREE.LineSegments(cubeGeo, cubeMat); cube.position.copy(POINT); scene.add(cube);
  const inner = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(CUBE * 0.5, CUBE * 0.5, CUBE * 0.5)), cubeMat.clone()); inner.position.copy(POINT); scene.add(inner);
  const cubeGroup = new THREE.Group(); cubeGroup.position.copy(POINT); scene.add(cubeGroup);
  scene.remove(cube); scene.remove(inner); cube.position.set(0, 0, 0); inner.position.set(0, 0, 0); cubeGroup.add(cube, inner);

  let holding = false, held = false, yawpAt = null, done = false, foldFired = false;
  function yawp() {
    if (!holding || yawpAt !== null) return;
    yawpAt = performance.now() / 1000 - (yawpSkip || 0);
    holding = false;
    window.removeEventListener('keydown', onGesture); window.removeEventListener('pointerdown', onGesture);
    onYawp && onYawp();
  }
  function onGesture(e) {
    if (dir.active && e.type === 'keydown' && /^[keKE]$/.test(e.key)) return; // the director's keys stay the director's
    yawp();
  }

  // --- resize ------------------------------------------------------------------
  function resize() {
    const w = container.clientWidth, hh = container.clientHeight;
    camera.aspect = w / hh; camera.updateProjectionMatrix(); renderer.setSize(w, hh);
  }
  window.addEventListener('resize', resize);

  // --- the loop ----------------------------------------------------------------
  let t0 = null, holdStart = null, holdAccum = 0, raf = 0;
  const clock = { now: 0 };
  function frame(nowMs) {
    raf = requestAnimationFrame(frame);
    const now = nowMs / 1000; clock.now = now;
    if (t0 === null) t0 = now;
    // timeline u: seconds of story, minus the time spent holding for the yawp
    let u = START + (now - t0 - holdAccum) * speed;
    if (holding) { holdAccum += now - holdStart; holdStart = now; u = HOLD_AT; }

    // books rise, open, type
    rigs.forEach((rig) => {
      if (!rig.built) return;
      const rise = ease(clamp01((u - rig.tSlide) / SLIDE));
      rig.group.visible = rise > 0;
      let x = COL_X - 5 + rise * 5;                    // in from the void on the left, to its place in the column
      const open = ease(clamp01((u - rig.tOpen) / OPEN));
      rig.pivot.rotation.y = -open * Math.PI * 0.92;
      if (open > 0 && !rig.opened) { rig.opened = true; onBookOpen && onBookOpen(rig.book); }
      // the closed book turns toward the point; the open one faces the reader
      rig.group.rotation.y = 0.22 * (1 - open) + 0.08;
      // after the yawp the books go back into the void
      let y = rig.ySlot;
      if (yawpAt !== null) {
        const sk = ease(clamp01((now - yawpAt - SINK_START) / SINK));
        x -= sk * 6; y -= sk * 0.6;
      }
      rig.group.position.set(x, y, rig.group.position.z);
      rig.group.updateMatrixWorld(true); // the light must leave the page where the page IS — even in a catch-up frame
      let changed = false;
      rig.lineT.forEach((L, li) => {
        const n = Math.max(0, Math.min(L.chars, Math.floor((u - L.start) * (reduceMotion ? CPS * 3 : CPS))));
        if (n !== rig.typed[li]) { rig.typed[li] = n; changed = true; }
        if (u >= L.end && !rig.fired[li]) { // catch-up safe: fires once, even after a long frame gap
          rig.fired[li] = true; rig.typed[li] = L.chars; changed = true;
          onLine && onLine(rig.book, li, rig.book.lines[li]);
          emitLine(rig, li, now);
        }
      });
      if (changed) { drawPage(rig.ctx, rig.book, rig.rows, rig.typed); rig.pageTex.needsUpdate = true; }
    });

    // hold for the yawp
    if (!holding && yawpAt === null && u >= HOLD_AT && !held) {
      holding = true; held = true; holdStart = now;
      window.addEventListener('keydown', onGesture); window.addEventListener('pointerdown', onGesture);
      onHold && onHold();
      if (autoYawp) setTimeout(yawp, 900);
    }

    // the light
    gathered = 0;
    const ty = yawpAt === null ? -1 : now - yawpAt;
    for (let i = 0; i < used; i++) {
      const p = P[i]; let k = clamp01((now - p.t0) / p.dur);
      let x, y, z;
      if (ty >= FOLD_START) { // fold: from wherever it is to its place on an edge
        const f = ease(clamp01((ty - FOLD_START) / FOLD));
        edgePoint(p.edge, p.s, tmpV);
        const spin = now * 0.35; // the cube turns slowly, as the seed will
        const rx = tmpV.x * Math.cos(spin) - tmpV.z * Math.sin(spin), rz = tmpV.x * Math.sin(spin) + tmpV.z * Math.cos(spin);
        const ex = POINT.x + rx, ey = POINT.y + tmpV.y, ez = POINT.z + rz;
        if (!p.foldFrom) p.foldFrom = [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
        x = p.foldFrom[0] + (ex - p.foldFrom[0]) * f; y = p.foldFrom[1] + (ey - p.foldFrom[1]) * f; z = p.foldFrom[2] + (ez - p.foldFrom[2]) * f;
        tmpC.copy(blue).lerp(white, 0.35 * f);
      } else if (k < 1) { // in flight: page → point, on a gentle arc
        const e = ease(k);
        const a = Math.sin(Math.PI * k) * p.arc;
        x = p.sx + (POINT.x + p.jx - p.sx) * e + a * 0.4;
        y = p.sy + (POINT.y + p.jy - p.sy) * e + Math.sin(Math.PI * k) * 0.35;
        z = p.sz + (POINT.z + p.jz - p.sz) * e - a * 0.2;
        tmpC.copy(warm).lerp(blue, e);
      } else { // gathered: a slow swirl around the point; jolted by the yawp
        gathered++;
        const ang = now * p.spin, jolt = ty >= 0 && ty < SHOCK ? 1 + Math.sin(Math.PI * clamp01(ty / SHOCK)) * 2.2 : 1;
        const cx = p.jx * Math.cos(ang) - p.jz * Math.sin(ang), cz = p.jx * Math.sin(ang) + p.jz * Math.cos(ang);
        x = POINT.x + cx * jolt; y = POINT.y + p.jy * jolt + Math.sin(now * 0.7 + i) * 0.03; z = POINT.z + cz * jolt;
        tmpC.copy(blue);
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
      col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
    }
    if (used) { pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true; }

    // the point grows with what it has gathered
    const g = TOTAL ? gathered / TOTAL : 0;
    const pulse = 1 + Math.sin(now * 2 * Math.PI) * 0.06; // 60 BPM — rest
    orb.scale.setScalar((0.35 + g * 1.3) * pulse);
    pointLight.intensity = 6 + g * 26;
    core.material.color.setRGB(1, 1, 1);

    // the yawp
    if (ty >= 0) {
      const s = clamp01(ty / SHOCK);
      ring.scale.setScalar(0.05 + ease(s) * 14);
      ring.material.opacity = (1 - s) * 0.9;
      ring.lookAt(camera.position);
      const c = clamp01((ty - CUBE_IN) / CUBE_FADE);
      cube.material.opacity = c * 0.9; inner.material.opacity = c * 0.6;
      cubeGroup.rotation.y = now * 0.35; cubeGroup.rotation.x = Math.sin(now * 0.2) * 0.15;
      orb.scale.setScalar((0.35 + g * 1.3) * pulse * (1 - 0.6 * c));
      if (ty >= FOLD_START + FOLD && !foldFired) { foldFired = true; onFold && onFold(); }
      if (ty >= DONE_AT && !done) { done = true; onDone && onDone(); }
    }

    dir.update(holding ? HOLD_AT : Math.min(u, HOLD_AT + (ty > 0 ? ty : 0)));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return function dispose() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', onGesture); window.removeEventListener('pointerdown', onGesture);
    dir.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
  };
}
