// stage.js — the stage: the six elements common to every act (forge #4).
//
//   1 the frame        the rounded boundary — the edition's skin; wears the season's accent as --season
//   2 the bar          the timeline, scrubbable; marks are the act's own data
//   3 the season line  the title IS the season (public/story/seasons.json); the act's name one line down
//   4 the scene        the point of attention — the only element an act owns
//   5 the stream       what is happening, one datum per beat
//   6 the hold         the invitation — names the gesture, carries the door line
//   hidden, named:     the director (orbit · K · E), the knobs, the handoff
//
// An act provides its scene and its data; everything else is mounted here, once.

import { mountTimeline } from './timeline.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export async function loadSeasons() {
  try { const r = await fetch('/story/seasons.json'); if (r.ok) return await r.json(); } catch (e) {}
  return null;
}

export function mountStage(root, { act = 'act', name = '', seasons = null, seasonId = null, logo = '/assets/pLogo_white.png', director = false } = {}) {
  root.classList.add('stage');
  root.innerHTML = '';
  const frame = el('div', 'frame');
  const mark = el('div', 'mark'); mark.innerHTML = `<img src="${logo}" alt="locki" />`; mark.hidden = true;
  const bar = el('div', 'bar', `<div class="tl-track"><div class="tl-fill"></div><div class="tl-knob"></div></div><div class="tl-marks"></div>`);
  const head = el('div', 'titles', `<h1 class="season"></h1><p class="act"></p>`);
  const scene = el('div', 'scene'); scene.setAttribute('aria-hidden', 'true');
  const stream = el('ol', 'stream'); stream.setAttribute('aria-label', 'what is happening');
  const hold = el('div', 'hold', `<div class="door"></div><b class="verb"></b><span class="hint"></span>`); hold.hidden = true; hold.setAttribute('aria-live', 'polite');
  const hud = el('aside', 'director', `<b>director</b> — orbit with the mouse · <kbd>K</kbd> capture keyframe · <kbd>E</kbd> export path → <code>public/camera/${act}.json</code><div class="keycount">0 keyframes</div><pre class="keys"></pre>`); hud.hidden = !director;
  frame.append(mark, bar, head, scene, stream, hold, hud);
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

  let timeline = null;
  function mountBar({ duration, marks, seek, step }) { timeline = mountTimeline(bar, { duration, marks, seek, step }); return timeline; }

  const onKeyframes = (keys, what) => { hud.querySelector('.keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`; hud.querySelector('.keys').textContent = JSON.stringify(keys); };

  // the responsive rule: landscape puts the stream right, portrait below — the CSS does it; the scene may ask which
  const layout = () => (root.clientWidth / root.clientHeight < 1 ? 'portrait' : 'landscape');

  return { frame, scene, stream, hold, hud, push, showHold, hideHold, revealMark, setSeason, mountBar, tick: (u) => timeline && timeline.tick(u), onKeyframes, layout, clearStream: () => { stream.innerHTML = ''; } };
}
