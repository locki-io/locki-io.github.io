// logo.js — entry for logo.html: the lab, on the stage (forge #4, #5).
// The double torus, the cube, the loop a human closes. No bar, no ledger — the knobs slot holds the distance slider.
import { initLogo } from './lifprasir/logo.js';
import { mountStage, loadSeasons } from './lifprasir/stage.js';

async function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  let cameraPath = null;
  try { const r = await fetch('/camera/logo.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  if (!Array.isArray(cameraPath) || params.has('front')) cameraPath = null;   // ?front: the reading view, ignoring the authored path
  // the season: the tori wear its accent (docs.locki.io's own list, as data); ?season=<id> previews another
  const seasons = await loadSeasons();
  let season = null;
  if (seasons) { const want = params.get('season') || seasons.current; season = seasons.seasons.find((x) => x.id === want) || seasons.seasons.find((x) => x.current) || null; }
  const toHex = (h) => parseInt(String(h).replace('#', ''), 16);

  const stage = mountStage(document.getElementById('stage'), { act: 'logo', name: 'the lab · O C — the loop that will not close itself', seasons, seasonId: season && season.id, director });
  if (season) stage.push(`${season.emoji || ''} ${season.label} · ${season.name} · ${season.date} — the surface wears the season`, 'math');
  stage.push('two tori, joined along a neck — a surface of genus 2', 'math');
  stage.push('from one of them, a cube was subtracted: the seed', 'math');
  stage.push('one path runs both — a figure-eight the surface carries without meeting itself', 'math');

  // the knobs: the operator's slider, the distance between the two centres
  const knobs = stage.showKnobs(`distance between the centres · <kbd>+</kbd> <kbd>−</kbd>
    <input id="dist" type="range" min="0" max="4.2" step="0.01" value="3.2" aria-label="distance between the two centres" />
    <b id="distval">d = 3.20 · 2.00 R · 6.40 r</b>`);

  const api = initLogo(stage.scene, {
    director, autoClose: params.has('autoclose'), startAt: parseFloat(params.get('t') || '0') || 0, closeSkip: parseFloat(params.get('cs') || '0') || 0,
    cameraPath: director ? null : cameraPath,
    distance: parseFloat(params.get('d')) || undefined,
    color: season ? toHex(season.accent) : 0xc1121f, seedColor: seasons && seasons.seed ? toHex(seasons.seed) : 0x1b2bff,
    onDistance: (d, inR, inr) => { const el = knobs.querySelector('#distval'); if (el) el.textContent = `d = ${d.toFixed(2)} · ${inR.toFixed(2)} R · ${inr.toFixed(2)} r`; },
    onKeyframes: stage.onKeyframes,
    onStop: () => { stage.push('— and stops at the gap. The loop does not close itself.'); stage.showHold({ verb: 'HUMAN IN THE LOOP', hint: 'the thread stopped at the gap — close it · any key, or touch' }); },
    onClose: () => { stage.hideHold(); stage.push('a hand closes it: the C becomes an O'); },
    onClosed: () => { stage.push('∞ — one loop, without intersection, with a human in it', 'math'); },
  });

  const slider = knobs.querySelector('#dist');
  slider.max = (2 * (api.R + api.r)).toFixed(2); slider.step = '0.01'; slider.value = api.distance.toFixed(2);
  slider.addEventListener('input', () => api.setDistance(parseFloat(slider.value)));
  const nudge = (dd) => { slider.value = Math.max(0, Math.min(parseFloat(slider.max), api.distance + dd)).toFixed(2); api.setDistance(parseFloat(slider.value)); };
  window.addEventListener('keydown', (e) => {
    if (e.key === '+' || e.key === '=' || e.key === ']') nudge(+0.05);
    else if (e.key === '-' || e.key === '_' || e.key === '[') nudge(-0.05);
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
