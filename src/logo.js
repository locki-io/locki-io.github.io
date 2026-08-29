// logo.js — entry for logo.html: the double torus, the cube, the loop a human closes.
import { initLogo } from './lifprasir/logo.js';

function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  const list = document.getElementById('stream'), hold = document.getElementById('hold'), hud = document.getElementById('director');
  if (director) hud.hidden = false;
  const push = (text, cls) => { const li = document.createElement('li'); li.textContent = text; if (cls) li.className = cls; list.appendChild(li); requestAnimationFrame(() => li.classList.add('on')); };

  push('two tori, joined along a neck — a surface of genus 2', 'math');
  push('from one of them, a cube was subtracted: the seed', 'math');
  push('the thread rides over the O and under the C — it crosses the neck twice, at +z and −z', 'math');
  push('a figure-eight that never meets itself');

  initLogo(document.getElementById('logo'), {
    director, autoClose: params.has('autoclose'), startAt: parseFloat(params.get('t') || '0') || 0, closeSkip: parseFloat(params.get('cs') || '0') || 0,
    onKeyframes: (keys, what) => { document.getElementById('keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`; document.getElementById('keys').textContent = JSON.stringify(keys); },
    onStop: () => { push('— and stops at the gap. The loop does not close itself.'); hold.hidden = false; },
    onClose: () => { hold.hidden = true; push('a hand closes it: the C becomes an O'); },
    onClosed: () => { push('∞ — one loop, without intersection, with a human in it', 'math'); },
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
