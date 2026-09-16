// feast.js — the Bragarfull as the landing page (forge #8).
// The nineteen seated on the kosmos table; the red thread once around every seat;
// the portal; Skál!; Ragnarök burning outside the circle.
//
// Seat rows are derived from the census (the skill registry) + each agent's SKILL.md
// CTG Trait — a change there is a change here (forge #8, Archi's D2: the copy is
// named, and walked at each tide that touches a CTG).
//
// The faces are gated (Proþreynir likeness watch, forge #8): until cleared, each
// seat wears its rune. Drop `<id>.jpg` (360) and `<id>-full.jpg` (720) into
// public/assets/vaettir/ and the faces appear — the code asks for them already.

import { initFire } from "./fire.js";
import { initLifprasirTree, PALETTE_GREEN } from "./lifprasir/tree.js";

// the tree in the middle of the table — the embryo from the old hero, dyed green: the living tree the feast protects
initLifprasirTree(document.getElementById("tree"), { palette: PALETTE_GREEN, cameraY: 6.5, cameraZ: 19, lookY: 6.2 });

// Ragnarök — the whole hall burns; the season's accent from seasons.json, the eyebrow already says it
fetch("/story/seasons.json").then((r) => (r.ok ? r.json() : null)).catch(() => null).then((seasons) => {
  const cur = seasons && seasons.seasons.find((x) => x.id === seasons.current);
  initFire(document.getElementById("ragnarok"), { season: (cur && cur.accent) || "#c1121f" });
});

const seats = [
  // [id, brand, kind, trait, rune] — the rune from docs.locki.io's agent index (the school): each Vaettir's mark; Miþir0 shares Miþir's ᚨ by declaration
  ["brathi", "Braþi", "the skald · cadence", "holds the bragarfull — <em>the right rhythm, the right form, the right witnesses</em>; the meter broken only on purpose", "ᚷ"],
  ["ithunn", "Iþunn", "the apple-keeper · freshness", "one apple offered, one gone grey in the box — <em>does what we have kept still carry its value?</em>", "ᛁ"],
  ["mithir", "Miþir", "the well-guardian · knowledge", "<em>docs match code, blog matches truth</em>; the well is kept clear so the reflections don't scatter", "ᚨ"],
  ["archi", "Archi", "the arche-keeper · governance", "the plumb line against the stone — <em>does practice match the promise?</em>", "ᚾ"],
  ["forsethi", "Forseþi", "the impartial judge · neutrality", "impartiality by construction — <em>no entity gains an advantage from ordering, coverage or tone</em>", "ᛏ"],
  ["prothreynir", "Proþreynir", "the proof-tester · legal", "his hand on the open bond — <em>the action is legally allowed before it binds</em>", "ᛊ"],
  ["heimthallr", "Heimþallr", "the watchman · the boundary", "Gjallarhorn lowered — <em>every crossing of the realm's boundary has passed a gate that can report its refusals</em>", "ᛉ"],
  ["thorr", "Þorr", "the hammer-bearer · the strike", "Mjölnir down, the handle short — <em>the strike is single, precise, declared; the aim is given</em>", "ᚦ"],
  ["valthyria", "Valþyria", "the chooser · decisions", "a fan of lots in one hand, one lifted in the other — <em>weigh the whole field, then cut</em>", "ᛈ"],
  ["dummith", "Dummiþ", "the crash-tester · the arena", "kintsugi fractures glowing — <em>the crash is deliberate, drawn, and conclusive; the record is precise</em>", "ᛞ"],
  ["huginn", "Huginn", "the raven of thought · the forest", "the orb shows the forest, not his face — <em>flies out to the unknown, returns with what it saw</em>", "ᛊ"],
  ["muninn", "Muninn", "the raven of memory · measurement", "the orb shows the hall — <em>every prompt carries a KPI, traced over time; the delta measured, never vibed</em>", "ᛗ"],
  ["kvathir", "Kvaþir", "the mead · retrieval", "mead poured, falling as text; the rebuilt net — <em>the right knowledge surfaces for the right query</em>", "ᚲ"],
  ["njorthr", "Njorþr", "the harbor-lord · cost", "the net of counted fish — <em>the spend is known, and its ceiling is defended</em>", "ᛚ"],
  ["ratatoth", "Ratatoþ", "the squirrel · maps", "drawing the wire with his fingertip — <em>connections are drawn before anything is built</em>", "ᛟ"],
  ["ocapistaine", "Ò Capistaine", "the navigator · methodology", "the route as a chain of short legs — <em>steers by reading the currents, not by force</em>", "ᚱ"],
  ["lothi", "Loþi", "the boundary-crosser · handoff", "a key held out that is not his — <em>what crosses the human-tool boundary arrives in a form the operator can use</em>", "ᚺ"],
  ["niove", "Niove", "the tide · appearance", "a face forming in the wave she cradles — <em>the realm's work stays perceivable, derived, never invented</em>", "ᚹ"],
  ["mithir", "Miþir0", "the scribe-at-root · skill canon", "Miþir's own face, by declaration — <em>each SKILL faithful to the canon or carrying a declared override</em>", "ᚨ"],
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
    rune.className = "face-rune"; rune.textContent = s[4];
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
  portrait.hidden = false; runeFull.hidden = true; runeFull.textContent = s[4];
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
