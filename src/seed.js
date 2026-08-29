// seed.js — entry for seed.html, the Act I stage.
// The stream on the right is DATA: the mint record of the seed itself.
import { initSeed } from './lifprasir/seed.js';
import { mountTimeline } from './lifprasir/timeline.js';

function readMint(txt) {
  for (const cand of [txt, '{' + txt, '{' + txt + '}']) { try { return JSON.parse(cand); } catch (e) {} }
  return null;
}

async function start() {
  let stream = ['the seed'], mintDate = null;
  try {
    const m = readMint(await (await fetch('/assets/tesseract.mint.json')).text());
    mintDate = m.data_stream.created_on;
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
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  // handed over by the void: where its cube stands on the screen, and how tall
  let intro = null;
  if (params.has('from')) { const [x, y, h] = params.get('from').split(',').map(parseFloat); if ([x, y, h].every((v) => Number.isFinite(v))) intro = { x, y, h }; }
  // the season's pulse — repositories, counts only (scripts/grow-seed-pulse.mjs)
  let pulse = null;
  try { const r = await fetch('/pulse/seed.json'); if (r.ok) pulse = await r.json(); } catch (e) {}
  if (!pulse || !pulse.season) pulse = null;
  let cameraPath = null;
  try { const r = await fetch('/camera/seed.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  const hud = document.getElementById('director');
  if (director) hud.hidden = false;
  const api = initSeed(document.getElementById('seed'), {
    stream,
    director,
    intro,
    onTime: (u) => bar && bar.tick(u),
    onSeek: () => { list.innerHTML = ''; },
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

  // --- the timeline bar: the seed season, marked by repositories --------------------
  // The act's time IS the season: u = 0 is the season's first day, u = duration its last.
  let bar = null;
  {
    const marks = [];
    if (pulse) {
      const t0 = Date.parse(pulse.season.from), t1 = Date.parse(pulse.season.to);
      const at = (iso) => api.duration * Math.max(0, Math.min(1, (Date.parse(iso) - t0) / (t1 - t0)));
      pulse.repos.forEach((r) => {
        const short = r.name.replace(/^locki[-_]?/i, '').replace(/\.locki\.io$/, '') || r.name;
        // a name only for the repositories that carried the season; the small ones keep a tick and a hover title
        marks.push({ u: at(r.born), label: r.commits >= 10 ? short : '', cls: r.commits >= 10 ? '' : 'tick', title: `${r.name} · ${r.commits} commits · ${r.born} → ${r.last}` });
      });
      if (pulse.private && pulse.private.repos) marks.push({ u: 0, label: `${pulse.private.repos} private`, cls: 'private', title: `${pulse.private.commits} commits, names folded` });
      if (mintDate) marks.push({ u: at(mintDate), label: 'mint', cls: 'yawp', title: `the seed is minted · ${mintDate}` });
      marks.sort((a, b) => a.u - b.u);
    } else {
      marks.push({ u: 0, label: 'breathe' }, { u: api.duration * 0.55, label: 'collapse' }, { u: api.duration * 0.62, label: 'birth', cls: 'yawp' });
    }
    bar = mountTimeline(document.getElementById('timeline'), { duration: api.duration, marks, seek: api.seek, step: 3 });
  }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
