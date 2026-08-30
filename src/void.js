// void.js — entry for void.html: Act 0 on the stage (forge #4, #5).
// The stage mounts the common elements; the act supplies its scene and its data —
// the five books' own words, with source: and consent:.
import { initVoid } from './lifprasir/void.js';
import { mountStage, loadSeasons, loadLedger } from './lifprasir/stage.js';

async function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  let books = [], door = null;
  try { const story = await (await fetch('/story/void.json')).json(); books = story.books; door = story.door || null; } catch (e) { console.warn('the void has no books', e); }
  let cameraPath = null;
  try { const r = await fetch('/camera/void.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  if (!Array.isArray(cameraPath)) cameraPath = null;
  const seasons = await loadSeasons(), ledger = await loadLedger();

  // the season line: before any season has a colour — the stage's own 'void' entry (dew)
  const stage = mountStage(document.getElementById('stage'), { act: 'void', name: 'Act 0 · void → 0', seasons, seasonId: 'void', director, ledger, ticked: [] });
  const words = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const opening = () => stage.push(`On the shoulders of giants — ${words[books.length] || books.length} books.`, 'head');
  opening();

  const api = initVoid(stage.scene, {
    books, director, cameraPath: director ? null : cameraPath,
    autoYawp: params.has('autoyawp'),
    speed: Math.max(0.1, parseFloat(params.get('speed') || '1')) || 1,
    startAt: params.get('t') === 'hold' ? 'hold' : parseFloat(params.get('t') || '0') || 0,
    yawpSkip: parseFloat(params.get('ty') || '0') || 0,
    onKeyframes: stage.onKeyframes,
    onLayout: (mode) => { stage.frame.dataset.layout = mode; },
    onTime: (u) => stage.tick(u),
    onSeek: () => { stage.clearStream(); stage.hideHold(); stage.state('yawped', false); stage.state('folded', false); opening(); },
    onBookOpen: (b) => stage.push(`— ${b.author}, ${b.title}${b.edition ? ' · ' + b.edition : ''}`, 'book'),
    onLine: (b, i, line) => stage.push(line),
    onHold: () => { if (door) stage.push(door.line, 'door'); stage.showHold({ door: door ? door.line : '', verb: 'YAWP', hint: 'the books have spoken — sound yours · any key, or touch' }); },
    onYawp: () => { stage.hideHold(); stage.state('yawped'); stage.push('YAAAAWP', 'yawp'); },
    onFold: () => { stage.push('— and the light folds into a cube: 0', 'book'); stage.state('folded'); },
    // the handoff: where the cube stands on the screen, and how tall — the seed is born there
    onDone: () => { if (!params.has('stay')) { const f = api.handoff(); stage.frame.classList.add('leaving'); setTimeout(() => { location.href = `/seed.html?from=${f.x.toFixed(3)},${f.y.toFixed(3)},${f.h.toFixed(3)}`; }, 900); } },
  });

  stage.mountBar({ duration: api.duration, seek: api.seek,
    marks: api.marks.map((m) => ({ u: m.u, label: (m.year ? m.year + ' ' : '') + m.label.split(' ').pop(), cls: m.id === 'yawp' ? 'yawp' : '' })) });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
