// void.js — entry for void.html, the Act 0 stage (void → 0).
// The stream on the right is DATA: the four books' own words, with source and consent.
import { initVoid } from './lifprasir/void.js';

async function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  let books = [];
  try { books = (await (await fetch('/story/void.json')).json()).books; } catch (e) { console.warn('the void has no books', e); }
  let cameraPath = null;
  try { const r = await fetch('/camera/void.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  if (!Array.isArray(cameraPath)) cameraPath = null;

  const list = document.getElementById('stream');
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const h1 = document.querySelector('.title h1');
  if (h1 && books.length) h1.textContent = `Before the seed, ${words[books.length] || books.length} books.`;
  const hud = document.getElementById('director');
  const hold = document.getElementById('hold');
  if (director) hud.hidden = false;

  const push = (text, cls) => {
    const li = document.createElement('li'); li.textContent = text; if (cls) li.className = cls;
    list.appendChild(li); requestAnimationFrame(() => li.classList.add('on'));
    while (list.children.length > 14) list.removeChild(list.firstChild); // the stream scrolls; nothing is lost — it is in the JSON
  };

  const api = initVoid(document.getElementById('void'), {
    books, director, cameraPath: director ? null : cameraPath,
    autoYawp: params.has('autoyawp'),
    speed: Math.max(0.1, parseFloat(params.get('speed') || '1')) || 1,
    startAt: params.get('t') === 'hold' ? 'hold' : parseFloat(params.get('t') || '0') || 0,
    yawpSkip: parseFloat(params.get('ty') || '0') || 0,
    onKeyframes: (keys, what) => {
      document.getElementById('keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`;
      document.getElementById('keys').textContent = JSON.stringify(keys);
    },
    onLayout: (mode) => { document.body.dataset.layout = mode; },
    onTime: (u) => tick(u),
    onSeek: (u) => { list.innerHTML = ''; tick(u); },
    onBookOpen: (b) => push(`— ${b.author}, ${b.title}${b.edition ? ' · ' + b.edition : ''}`, 'book'),
    onLine: (b, i, line) => push(line),
    onHold: () => { hold.hidden = false; document.body.classList.add('holding'); },
    onYawp: () => { hold.hidden = true; document.body.classList.remove('holding'); document.body.classList.add('yawped'); push('YAAAAWP', 'yawp'); },
    onFold: () => { push('— and the light folds into a cube: 0', 'book'); document.body.classList.add('folded'); },
    onDone: () => { if (!params.has('stay')) { document.body.classList.add('leaving'); setTimeout(() => { location.href = '/seed.html'; }, 900); } },
  });

  // --- the timeline bar: scrub the act forward or back ---------------------------
  const tl = document.getElementById('timeline'), fill = tl.querySelector('.tl-fill'), knob = tl.querySelector('.tl-knob'), marksEl = tl.querySelector('.tl-marks');
  const track = tl.querySelector('.tl-track');
  const marks = api.marks.map((m) => {
    const el = document.createElement('div'); el.className = 'tl-mark' + (m.id === 'yawp' ? ' yawp' : ''); el.textContent = m.label.split(' ').pop();
    el.style.left = (100 * m.u / api.duration) + '%'; marksEl.appendChild(el); return { ...m, el };
  });
  let lastPct = -1;
  function tick(u) {
    const pct = Math.round(1000 * u / api.duration) / 10;
    if (pct === lastPct) return; lastPct = pct;
    fill.style.width = pct + '%'; knob.style.left = pct + '%';
    marks.forEach((m, i) => m.el.classList.toggle('on', u >= m.u && (i === marks.length - 1 || u < marks[i + 1].u)));
  }
  function seekFromEvent(e) {
    const r = track.getBoundingClientRect();
    api.seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * api.duration);
  }
  let dragging = false;
  track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); seekFromEvent(e); });
  track.addEventListener('pointermove', (e) => { if (dragging) seekFromEvent(e); });
  track.addEventListener('pointerup', () => { dragging = false; });
  track.addEventListener('pointercancel', () => { dragging = false; });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') api.seek(currentU() + 5);
    else if (e.key === 'ArrowLeft') api.seek(currentU() - 5);
  });
  function currentU() { return (parseFloat(fill.style.width) || 0) / 100 * api.duration; }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
