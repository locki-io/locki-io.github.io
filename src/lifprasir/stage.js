// stage.js — the stage: the six elements common to every act (forge #4).
//
//   1 the frame        the rounded boundary — the edition's skin; wears the season's accent as --season
//   2 the bar          the timeline, scrubbable; marks are the act's own data
//   3 the season line  the title IS the season (public/story/seasons.json); the act's name one line down
//   4 the scene        the point of attention — the only element an act owns
//   5 the stream       what is happening, one datum per beat
//   6 the hold         the invitation — names the gesture, carries the door line
//   7 the ledger       what remains — Muninn's: achievements and learnings, ticked by the acts' beats (public/story/ledger.json)
//   hidden, named:     the director (orbit · K · E), the knobs, the handoff
//
// An act provides its scene and its data; everything else is mounted here, once.

import { mountTimeline } from './timeline.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export async function loadSeasons() {
  try { const r = await fetch('/story/seasons.json'); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}
// the season a date falls in: the last season begun (from: <= date); a gap between seasons keeps the previous one (default:)
export function seasonAt(seasons, iso) {
  if (!seasons || !iso) return null;
  const t = Date.parse(iso); let found = null;
  seasons.seasons.forEach((s) => { if (s.from && Date.parse(s.from) <= t) found = s; });
  return found;
}
export async function loadLedger() {
  try { const r = await fetch('/story/ledger.json'); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

export function mountStage(root, { act = 'act', name = '', seasons = null, seasonId = null, logo = '/assets/pLogo_white.png', director = false, ledger = null, ticked = [] } = {}) {
  root.classList.add('stage');
  root.innerHTML = '';
  const frame = el('div', 'frame');
  const mark = el('div', 'mark'); mark.innerHTML = `<img src="${logo}" alt="locki" />`; mark.hidden = true;
  const bar = el('div', 'bar', `<div class="tl-track"><div class="tl-fill"></div><div class="tl-knob"></div></div><div class="tl-marks"></div>`);
  const head = el('div', 'titles', `<h1 class="season"></h1><p class="act"></p>`);
  const scene = el('div', 'scene'); scene.setAttribute('aria-hidden', 'true');
  const stream = el('ol', 'stream'); stream.setAttribute('aria-label', 'what is happening');
  const hold = el('div', 'hold', `<div class="door"></div><b class="verb"></b><span class="hint"></span>`); hold.hidden = true; hold.setAttribute('aria-live', 'polite');
  const ledgerEl = el('ol', 'ledger'); ledgerEl.setAttribute('aria-label', 'what remains');
  const knobs = el('div', 'knobs'); knobs.hidden = true;                    // hidden, named: an act's controls (a slider, a key legend)
  bar.hidden = true;                                                          // element 2 is none until an act mounts it
  const hud = el('aside', 'director', `<b>director</b> — orbit with the mouse · <kbd>K</kbd> capture keyframe · <kbd>E</kbd> export path → <code>public/camera/${act}.json</code><div class="keycount">0 keyframes</div><pre class="keys"></pre>`); hud.hidden = !director;
  frame.append(mark, bar, head, scene, stream, hold, ledgerEl, knobs, hud);
  root.append(frame);

  const seasonH = head.querySelector('.season'), actP = head.querySelector('.act');
  actP.textContent = name;
  let current = null;
  function setSeason(id) {
    if (!seasons || id === current) return;
    const s = seasons.seasons.find((x) => x.id === id); if (!s) return;
    current = id;
    seasonH.textContent = `${s.emoji ? s.emoji + ' ' : ''}${s.label} · ${s.name}${s.date ? ' · ' + s.date : ''}`;
    root.style.setProperty('--season', s.accent);
    root.dataset.season = id;
  }
  setSeason(seasonId || (seasons && seasons.current));
  function setSeasonAt(iso) { const s = seasonAt(seasons, iso); if (s) setSeason(s.id); }

  function push(text, cls) {
    const li = el('li', cls || '', null); li.textContent = text; stream.appendChild(li);
    requestAnimationFrame(() => li.classList.add('on'));
    while (stream.children.length > 14) stream.removeChild(stream.firstChild);
  }
  function showHold({ door = '', verb = '', hint = 'any key, or touch' } = {}) {
    hold.querySelector('.door').textContent = door; hold.querySelector('.verb').textContent = verb; hold.querySelector('.hint').textContent = hint;
    hold.hidden = false; root.classList.add('holding');
  }
  function hideHold() { hold.hidden = true; root.classList.remove('holding'); }
  function revealMark() { mark.hidden = false; requestAnimationFrame(() => mark.classList.add('on')); }

  // 7 · the ledger: one box per entry; tick(id) / untick(id); at most seven shown, the ticked ones first
  const boxes = new Map();
  const ticks = new Set();
  function renderLedger() {
    if (!ledger) return;
    const entries = ledger.entries.filter((e) => boxes.has(e.id) || ticks.has(e.id) || e.act === undefined);
    const visible = ledger.entries.filter((e) => ticks.has(e.id)).slice(-7);
    ledgerEl.innerHTML = '';
    visible.forEach((e) => { const li = el('li', 'done ' + (e.kind || ''), `<span class="box">✓</span><span class="kind">${e.kind || ''}</span><span class="text"></span>`); li.querySelector('.text').textContent = e.text; ledgerEl.appendChild(li); requestAnimationFrame(() => li.classList.add('on')); });
    ledgerEl.hidden = visible.length === 0;
  }
  function tick(id) { if (!ledger || ticks.has(id)) return; ticks.add(id); renderLedger(); }
  function untickAfter(keep) { ticks.clear(); keep.forEach((id) => ticks.add(id)); renderLedger(); }
  ledgerEl.hidden = true;
  ticked.forEach((id) => ticks.add(id)); renderLedger();

  let timeline = null;
  function mountBar({ duration, marks, seek, step }) { bar.hidden = false; bar.classList.toggle('dense', (marks || []).length > 8); timeline = mountTimeline(bar, { duration, marks, seek, step }); return timeline; }
  function showKnobs(html) { knobs.innerHTML = html; knobs.hidden = false; root.classList.add('knobbed'); return knobs; }
  // an act's states live on the stage, never on body: yawped · folded · collapsed · born …
  function state(cls, on = true) { root.classList.toggle(cls, !!on); }

  const onKeyframes = (keys, what) => { hud.querySelector('.keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`; hud.querySelector('.keys').textContent = JSON.stringify(keys); };

  // the responsive rule: landscape puts the stream right, portrait below — the CSS does it; the scene may ask which
  const layout = () => (root.clientWidth / root.clientHeight < 1 ? 'portrait' : 'landscape');

  return { frame, scene, stream, hold, hud, ledger: ledgerEl, knobs, showKnobs, state, push, setSeasonAt, showHold, hideHold, revealMark, setSeason, mountBar, tick: (u) => timeline && timeline.tick(u), achieve: tick, resetLedger: untickAfter, onKeyframes, layout, clearStream: () => { stream.innerHTML = ''; } };
}
