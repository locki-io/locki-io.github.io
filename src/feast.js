// feast.js — the Bragarfull as the landing page (forge #8).
// The nineteen seated on the kosmos table; the red thread once around every seat;
// the portal; Skál!; Ragnarök burning outside the circle.
//
// Seat rows are derived from the census (the skill registry) + each agent's SKILL.md
// CTG Trait — a change there is a change here (forge #8, Archi's D2: the copy is
// named, and walked at each tide that touches a CTG).
//
// The faces are gated (Proþreynir likeness watch, forge #8): until cleared, each
// seat wears its initial. Drop `<id>.jpg` (360) and `<id>-full.jpg` (720) into
// public/assets/vaettir/ and the faces appear — the code asks for them already.

const seats = [
  // [id, brand, kind, trait]
  ["brathi", "Braþi", "the skald · cadence", "holds the bragarfull — <em>the right rhythm, the right form, the right witnesses</em>; the meter broken only on purpose"],
  ["ithunn", "Iþunn", "the apple-keeper · freshness", "one apple offered, one gone grey in the box — <em>does what we have kept still carry its value?</em>"],
  ["mithir", "Miþir", "the well-guardian · knowledge", "<em>docs match code, blog matches truth</em>; the well is kept clear so the reflections don't scatter"],
  ["archi", "Archi", "the arche-keeper · governance", "the plumb line against the stone — <em>does practice match the promise?</em>"],
  ["forsethi", "Forseþi", "the impartial judge · neutrality", "impartiality by construction — <em>no entity gains an advantage from ordering, coverage or tone</em>"],
  ["prothreynir", "Proþreynir", "the proof-tester · legal", "his hand on the open bond — <em>the action is legally allowed before it binds</em>"],
  ["heimthallr", "Heimþallr", "the watchman · the boundary", "Gjallarhorn lowered — <em>every crossing of the realm's boundary has passed a gate that can report its refusals</em>"],
  ["thorr", "Þorr", "the hammer-bearer · the strike", "Mjölnir down, the handle short — <em>the strike is single, precise, declared; the aim is given</em>"],
  ["valthyria", "Valþyria", "the chooser · decisions", "a fan of lots in one hand, one lifted in the other — <em>weigh the whole field, then cut</em>"],
  ["dummith", "Dummiþ", "the crash-tester · the arena", "kintsugi fractures glowing — <em>the crash is deliberate, drawn, and conclusive; the record is precise</em>"],
  ["huginn", "Huginn", "the raven of thought · the forest", "the orb shows the forest, not his face — <em>flies out to the unknown, returns with what it saw</em>"],
  ["muninn", "Muninn", "the raven of memory · measurement", "the orb shows the hall — <em>every prompt carries a KPI, traced over time; the delta measured, never vibed</em>"],
  ["kvathir", "Kvaþir", "the mead · retrieval", "mead poured, falling as text; the rebuilt net — <em>the right knowledge surfaces for the right query</em>"],
  ["njorthr", "Njorþr", "the harbor-lord · cost", "the net of counted fish — <em>the spend is known, and its ceiling is defended</em>"],
  ["ratatoth", "Ratatoþ", "the squirrel · maps", "drawing the wire with his fingertip — <em>connections are drawn before anything is built</em>"],
  ["ocapistaine", "Ò Capistaine", "the navigator · methodology", "the route as a chain of short legs — <em>steers by reading the currents, not by force</em>"],
  ["lothi", "Loþi", "the boundary-crosser · handoff", "a key held out that is not his — <em>what crosses the human-tool boundary arrives in a form the operator can use</em>"],
  ["niove", "Niove", "the tide · appearance", "a face forming in the wave she cradles — <em>the realm's work stays perceivable, derived, never invented</em>"],
  ["mithir", "Miþir0", "the scribe-at-root · skill canon", "Miþir's own face, by declaration — <em>each SKILL faithful to the canon or carrying a declared override</em>"],
];

const FACE_DIR = "/assets/vaettir/";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// --- the sidebar: responsive, the Bragarfull first --------------------------------
const burger = document.getElementById("burger"), scrim = document.getElementById("scrim");
function nav(open) {
  document.body.classList.toggle("nav-open", open);
  burger.setAttribute("aria-expanded", String(open));
  scrim.hidden = !open;
}
burger.addEventListener("click", () => nav(!document.body.classList.contains("nav-open")));
scrim.addEventListener("click", () => nav(false));

// --- the seats on the ellipse ------------------------------------------------------
const table = document.getElementById("table");
const card = document.getElementById("cardbody");
const n = seats.length;
seats.forEach((s, i) => {
  const t = -Math.PI / 2 + (i / n) * Math.PI * 2;               // Braþi at the head (top)
  const x = Math.cos(t) * 47, y = Math.sin(t) * 46;             // percent of the table box
  const el = document.createElement("div");
  el.className = "seat" + (i === 0 ? " head" : "");
  el.style.setProperty("--x", x + "%");
  el.style.setProperty("--y", y + "%");
  el.innerHTML = `<button type="button" aria-label="${s[1]}, ${s[2]}">
      <img class="face" src="${FACE_DIR}${s[0]}.jpg" alt="">
      <svg class="horn" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4c2 0 4 1 5 3l9 12c1 1 3 1 4-1s0-4-2-4L9 6C7 4 5 3 3 4z" fill="#d9a441" stroke="#120f2b" stroke-width="1.2"/></svg>
    </button><div class="name">${s[1]}</div>`;
  const img = el.querySelector(".face");
  img.addEventListener("error", () => {                          // the gate: no face yet — the initial holds the seat
    const rune = document.createElement("div");
    rune.className = "face-rune"; rune.textContent = s[1][0];
    img.replaceWith(rune);
  });
  el.querySelector("button").addEventListener("click", () => speak(s, el));
  table.appendChild(el);
});

function speak(s, el) {
  document.querySelectorAll(".seat.raised").forEach((e) => e.classList.remove("raised"));
  el.classList.add("raised");
  card.innerHTML = `<b>${s[2]}</b><h2>${s[1]}</h2><p>${s[3]}</p>`;
  openPortal(seats.indexOf(s), el);
}

// --- the portal --------------------------------------------------------------------
const portal = document.getElementById("portal"), portrait = document.getElementById("portrait"), runeFull = document.getElementById("rune-full");
let current = -1, returnTo = null;
portrait.addEventListener("error", () => { portrait.hidden = true; runeFull.hidden = false; });
function showSeat(i) {
  current = (i + n) % n;
  const s = seats[current];
  portrait.hidden = false; runeFull.hidden = true; runeFull.textContent = s[1][0];
  portrait.src = `${FACE_DIR}${s[0]}-full.jpg`;
  portrait.alt = `${s[1]}, ${s[2]} — the full portrait`;
  document.getElementById("plate-kind").textContent = s[2];
  document.getElementById("plate-name").textContent = s[1];
  document.getElementById("plate-trait").innerHTML = s[3];
  const seatEls = document.querySelectorAll(".seat");
  seatEls.forEach((e) => e.classList.remove("raised"));
  seatEls[current].classList.add("raised");
  card.innerHTML = `<b>${s[2]}</b><h2>${s[1]}</h2><p>${s[3]}</p>`;
}
function openPortal(i, el) {
  returnTo = el ? el.querySelector("button") : null;
  showSeat(i);
  portal.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("close").focus();
}
function closePortal() {
  portal.hidden = true;
  document.body.style.overflow = "";
  if (returnTo) returnTo.focus();
}
document.getElementById("close").addEventListener("click", closePortal);
document.getElementById("prev").addEventListener("click", () => showSeat(current - 1));
document.getElementById("next").addEventListener("click", () => showSeat(current + 1));
portal.addEventListener("click", (e) => { if (e.target === portal) closePortal(); });
document.addEventListener("keydown", (e) => {
  if (portal.hidden) return;
  if (e.key === "Escape") closePortal();
  else if (e.key === "ArrowLeft") showSeat(current - 1);
  else if (e.key === "ArrowRight") showSeat(current + 1);
});

// --- Skál! -------------------------------------------------------------------------
function skal() {
  const all = [...document.querySelectorAll(".seat")];
  all.forEach((e) => e.classList.remove("raised"));
  table.classList.remove("cheering");
  all.forEach((e, i) => setTimeout(() => e.classList.add("raised"), reduce ? 0 : 90 * i));
  setTimeout(() => table.classList.add("cheering"), reduce ? 0 : 90 * n + 120);
  setTimeout(() => { all.forEach((e) => e.classList.remove("raised")); table.classList.remove("cheering"); }, reduce ? 1600 : 90 * n + 2600);
}
document.getElementById("skal").addEventListener("click", skal);
setTimeout(skal, 700);

// --- Ragnarök: the season burns outside the circle ---------------------------------
// Ember particles born on the rim of the world, rising and dying — the fire tests
// the house; the table holds. Reduced motion: one still glow, no loop.
(function fire() {
  const canvas = document.getElementById("fire");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, cx = 0, cy = 0, rx = 0, ry = 0;
  function size() {
    const r = canvas.getBoundingClientRect();
    W = canvas.width = Math.floor(r.width * Math.min(devicePixelRatio, 2));
    H = canvas.height = Math.floor(r.height * Math.min(devicePixelRatio, 2));
    cx = W / 2; cy = H / 2;
    rx = W * 0.46; ry = H * 0.45;                    // just outside the world's edge
  }
  size(); addEventListener("resize", size);
  const COLORS = ["#c1121f", "#e05d0e", "#d9a441"];  // the season's accent → ember → mead
  if (reduce) {                                       // a still ring of heat
    const g = ctx.createRadialGradient(cx, cy, Math.min(rx, ry) * 0.9, cx, cy, Math.min(rx, ry) * 1.08);
    g.addColorStop(0, "rgba(193,18,31,0)"); g.addColorStop(0.55, "rgba(224,93,14,.28)"); g.addColorStop(1, "rgba(193,18,31,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Math.min(rx, ry) * 1.2, 0, Math.PI * 2); ctx.fill();
    return;
  }
  const P = [];
  function spawn() {
    const a = Math.random() * Math.PI * 2;
    P.push({
      a, r: 1,
      x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry,
      vx: Math.cos(a) * 0.15 + (Math.random() - 0.5) * 0.3,
      vy: -(0.4 + Math.random() * 0.9),
      life: 1, decay: 0.008 + Math.random() * 0.014,
      size: 1.2 + Math.random() * 2.6,
      c: COLORS[(Math.random() * COLORS.length) | 0],
    });
  }
  let raf = 0, visible = true;
  document.addEventListener("visibilitychange", () => { visible = !document.hidden; });
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) spawn();
    ctx.globalCompositeOperation = "lighter";
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.x += p.vx * devicePixelRatio; p.y += p.vy * devicePixelRatio;
      p.vy -= 0.006; p.vx += (Math.random() - 0.5) * 0.12;      // heat rises, flames waver
      p.life -= p.decay;
      if (p.life <= 0) { P.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life) * 0.55;
      ctx.fillStyle = p.c;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life * devicePixelRatio, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  raf = requestAnimationFrame(frame);
})();
