// logo.js — entry for logo.html: the double torus, the cube, the loop a human closes.
import { initLogo } from './lifprasir/logo.js';

async function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  let cameraPath = null;
  try { const r = await fetch('/camera/logo.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  if (!Array.isArray(cameraPath) || params.has('front')) cameraPath = null;   // ?front: the reading view, ignoring the authored path
  const list = document.getElementById('stream'), hold = document.getElementById('hold'), hud = document.getElementById('director');
  if (director) hud.hidden = false;
  const push = (text, cls) => { const li = document.createElement('li'); li.textContent = text; if (cls) li.className = cls; list.appendChild(li); requestAnimationFrame(() => li.classList.add('on')); };

  push('two tori, joined along a neck — a surface of genus 2', 'math');
  push('from one of them, a cube was subtracted: the seed', 'math');
  push('one path runs both — a figure-eight the surface carries without meeting itself', 'math');

  const api = initLogo(document.getElementById('logo'), {
    director, autoClose: params.has('autoclose'), startAt: parseFloat(params.get('t') || '0') || 0, closeSkip: parseFloat(params.get('cs') || '0') || 0,
    cameraPath: director ? null : cameraPath,
    distance: parseFloat(params.get('d')) || undefined,
    onDistance: (d, inR, inr) => { const el = document.getElementById('distval'); if (el) el.textContent = `d = ${d.toFixed(2)} · ${inR.toFixed(2)} R · ${inr.toFixed(2)} r`; },
    onKeyframes: (keys, what) => { document.getElementById('keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`; document.getElementById('keys').textContent = JSON.stringify(keys); },
    onStop: () => { push('— and stops at the gap. The loop does not close itself.'); hold.hidden = false; },
    onClose: () => { hold.hidden = true; push('a hand closes it: the C becomes an O'); },
    onClosed: () => { push('∞ — one loop, without intersection, with a human in it', 'math'); },
  });

  // the operator's slider: the distance between the two centres
  const slider = document.getElementById('dist');
  if (slider) {
    slider.max = (2 * (api.R + api.r)).toFixed(2); slider.step = '0.01'; slider.value = api.distance.toFixed(2);
    slider.addEventListener('input', () => api.setDistance(parseFloat(slider.value)));
    const nudge = (dd) => { slider.value = Math.max(0, Math.min(parseFloat(slider.max), api.distance + dd)).toFixed(2); api.setDistance(parseFloat(slider.value)); };
    window.addEventListener('keydown', (e) => {
      if (e.key === '+' || e.key === '=' || e.key === ']') nudge(+0.05);
      else if (e.key === '-' || e.key === '_' || e.key === '[') nudge(-0.05);
    });
  }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
