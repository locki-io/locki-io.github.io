// timeline.js — the bar above the title: scrub an act forward or back.
//
// One bar for every act. It knows nothing about books or repositories: it is
// given a duration, a list of marks {u, label, cls}, and a seek(u) to call.
// The stage calls tick(u) every frame; the bar moves. Drag, click, or ← →.

export function mountTimeline(root, { duration, marks = [], seek, step = 5 }) {
  if (!root || !duration) return { tick() {}, current: () => 0 };
  const track = root.querySelector('.tl-track'), fill = root.querySelector('.tl-fill'), knob = root.querySelector('.tl-knob'), marksEl = root.querySelector('.tl-marks');
  marksEl.innerHTML = '';
  const M = marks.map((m) => {
    const el = document.createElement('div');
    el.className = 'tl-mark' + (m.cls ? ' ' + m.cls : '');
    el.textContent = m.label;
    if (m.title) el.title = m.title;
    el.style.left = (100 * m.u / duration) + '%';
    marksEl.appendChild(el);
    return { ...m, el };
  });
  let u = 0, lastPct = -1;
  function tick(v) {
    u = v;
    const pct = Math.round(1000 * v / duration) / 10;
    if (pct === lastPct) return; lastPct = pct;
    fill.style.width = pct + '%'; knob.style.left = pct + '%';
    M.forEach((m, i) => m.el.classList.toggle('on', v >= m.u && (i === M.length - 1 || v < M[i + 1].u)));
  }
  function fromEvent(e) {
    const r = track.getBoundingClientRect();
    seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * duration);
  }
  let dragging = false;
  track.addEventListener('pointerdown', (e) => { dragging = true; track.setPointerCapture(e.pointerId); fromEvent(e); });
  track.addEventListener('pointermove', (e) => { if (dragging) fromEvent(e); });
  track.addEventListener('pointerup', () => { dragging = false; });
  track.addEventListener('pointercancel', () => { dragging = false; });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') seek(Math.min(duration, u + step));
    else if (e.key === 'ArrowLeft') seek(Math.max(0, u - step));
  });
  return { tick, current: () => u };
}

// The bar's markup, so every stage's HTML carries the same skeleton.
export const TIMELINE_HTML = `<div class="tl-track"><div class="tl-fill"></div><div class="tl-knob"></div></div><div class="tl-marks"></div>`;
