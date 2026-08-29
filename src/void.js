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

  initVoid(document.getElementById('void'), {
    books, director, cameraPath: director ? null : cameraPath,
    autoYawp: params.has('autoyawp'),
    speed: Math.max(0.1, parseFloat(params.get('speed') || '1')) || 1,
    startAt: params.get('t') === 'hold' ? 'hold' : parseFloat(params.get('t') || '0') || 0,
    yawpSkip: parseFloat(params.get('ty') || '0') || 0,
    onKeyframes: (keys, what) => {
      document.getElementById('keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`;
      document.getElementById('keys').textContent = JSON.stringify(keys);
    },
    onBookOpen: (b) => push(`— ${b.author}, ${b.title}${b.edition ? ' · ' + b.edition : ''}`, 'book'),
    onLine: (b, i, line) => push(line),
    onHold: () => { hold.hidden = false; document.body.classList.add('holding'); },
    onYawp: () => { hold.hidden = true; document.body.classList.remove('holding'); document.body.classList.add('yawped'); push('YAAAAWP', 'yawp'); },
    onFold: () => { push('— and the light folds into a cube: 0', 'book'); document.body.classList.add('folded'); },
    onDone: () => { if (!params.has('stay')) { document.body.classList.add('leaving'); setTimeout(() => { location.href = '/seed.html'; }, 900); } },
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
