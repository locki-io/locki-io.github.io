// seed.js — entry for seed.html, the Act I stage.
// The stream on the right is DATA: the mint record of the seed itself.
import { initSeed } from './lifprasir/seed.js';

function readMint(txt) {
  for (const cand of [txt, '{' + txt, '{' + txt + '}']) { try { return JSON.parse(cand); } catch (e) {} }
  return null;
}

async function start() {
  let stream = ['the seed'];
  try {
    const m = readMint(await (await fetch('/assets/tesseract.mint.json')).text());
    const ds = m.data_stream, f = (m.data || [])[0] || {};
    stream = [
      `${ds.name}`,
      `minted by ${ds.creator}`,
      `created ${ds.created_on}`,
      `last modified ${ds.last_modified_on}`,
      `${ds.marshalManifest.totalItems} item · nested stream`,
      `${f.name} · ${(f.size / 1024).toFixed(0)} KB`,
      `on IPFS · Lighthouse gateway`,
    ];
  } catch (e) { /* the seed still breathes once, and says its name */ }

  const list = document.getElementById('stream');
  const director = new URLSearchParams(location.search).has('director');
  let cameraPath = null;
  try { const r = await fetch('/camera/seed.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  const hud = document.getElementById('director');
  if (director) hud.hidden = false;
  initSeed(document.getElementById('seed'), {
    stream,
    director,
    cameraPath: director ? null : cameraPath,
    onKeyframes: (keys, what) => {
      document.getElementById('keycount').textContent = `${keys.length} keyframe${keys.length === 1 ? '' : 's'} · ${what}`;
      document.getElementById('keys').textContent = JSON.stringify(keys);
    },
    onBeat: (i, line) => {
      const li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
      requestAnimationFrame(() => li.classList.add('on'));
    },
    onCollapse: () => document.body.classList.add('collapsed'),
    onBirth: () => document.body.classList.add('born'),
  });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
