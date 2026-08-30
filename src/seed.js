// seed.js — entry for seed.html: Act I on the stage (forge #4, #5).
// The stream is DATA: the mint record of the seed itself; the bar is the season, marked by repositories.
import { initSeed } from './lifprasir/seed.js';
import { mountStage, loadSeasons, loadLedger } from './lifprasir/stage.js';

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

  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  // handed over by the void: where its cube stands on the screen, and how tall
  let intro = null;
  if (params.has('from')) { const [x, y, h] = params.get('from').split(',').map(parseFloat); if ([x, y, h].every((v) => Number.isFinite(v))) intro = { x, y, h }; }
  // the season's pulse — repositories, counts only (scripts/grow-seed-pulse.mjs)
  let pulse = null;
  try { const r = await fetch('/pulse/seed.json'); if (r.ok) pulse = await r.json(); } catch (e) {}
  if (!pulse || !pulse.season) pulse = null;
  // the act's own story: milerocks — spoken when the thread appears, marked on the season
  let story = null;
  try { const r = await fetch('/story/seed.json'); if (r.ok) story = await r.json(); } catch (e) {}
  // Act I speaks only the milerocks inside its season; later ones stay data for a later act (the ledger keeps them)
  const allMilerocks = (story && story.milerocks) || [];
  let milerocks = allMilerocks;
  if (pulse) milerocks = allMilerocks.filter((m) => Date.parse(m.date) <= Date.parse(pulse.season.to));
  let cameraPath = null;
  try { const r = await fetch('/camera/seed.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  const seasons = await loadSeasons(), ledger = await loadLedger();

  const stage = mountStage(document.getElementById('stage'), { act: 'seed', name: 'Act I · the seed', seasons, seasonId: (story && story.season) || 'multiversx', director, ledger, ticked: [] });
  const opening = () => stage.push('Let us build!', 'head');
  opening();

  // the hold, after the birth: the door to Act II
  let held = false, holdTimer = 0;
  const HOLD = (story && story.hold) || { door: 'You mint — lucky you.', verb: 'the roots', hint: 'Act II · any key, or touch' };
  function gesture(e) {
    if (e.type === 'keydown' && e.key.startsWith('Arrow')) return;
    if (e.type === 'pointerdown' && e.target && e.target.closest && e.target.closest('.bar, .knobs')) return;
    unhold(); if (!params.has('stay')) { stage.frame.classList.add('leaving'); setTimeout(() => { location.href = '/roots.html'; }, 900); }
  }
  function unhold() { window.removeEventListener('keydown', gesture); window.removeEventListener('pointerdown', gesture); stage.hideHold(); clearTimeout(holdTimer); }

  const api = initSeed(stage.scene, {
    stream, director, intro,
    cameraPath: director ? null : cameraPath,
    onKeyframes: stage.onKeyframes,
    onTime: (u) => { stage.tick(u); if (pulse) stage.setSeasonAt(new Date(Date.parse(pulse.season.from) + u / api.duration * (Date.parse(pulse.season.to) - Date.parse(pulse.season.from))).toISOString()); },
    onSeek: () => { stage.clearStream(); stage.state('collapsed', false); stage.state('born', false); stage.resetLedger([]); held = false; unhold(); opening(); },
    onBeat: (i, line) => stage.push(line),
    onCollapse: () => { stage.state('collapsed'); stage.achieve('minted'); },
    onBirth: () => {
      stage.state('born'); stage.achieve('minted');                    // a jump past the collapse still ticks the mint — birth implies it
      milerocks.forEach((m) => stage.push(m.line, 'milerock'));
      stage.achieve('milerock');
      if (!held) { held = true; holdTimer = setTimeout(() => { stage.showHold(HOLD); window.addEventListener('keydown', gesture); window.addEventListener('pointerdown', gesture); }, 6000); }
    },
  });

  // --- the bar: the seed season, marked by repositories --------------------------------
  // The act's time IS the season: u = 0 is the season's first day, u = duration its last.
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
    milerocks.forEach((m) => marks.push({ u: at(m.date), label: 'milerock', cls: 'milerock', title: `${m.line} · ${m.date}${m.precision === 'month' ? ' (month)' : ''}` }));
    marks.sort((a, b) => a.u - b.u);
  } else {
    marks.push({ u: 0, label: 'breathe' }, { u: api.duration * 0.55, label: 'collapse' }, { u: api.duration * 0.62, label: 'birth', cls: 'yawp' });
  }
  stage.mountBar({ duration: api.duration, marks, seek: api.seek, step: 3 });
  // testing: ?t=<seconds> jumps the act once the seed is loaded
  const want = parseFloat(params.get('t'));
  if (Number.isFinite(want)) { const tryIt = () => (api.ready() ? api.seek(want) : setTimeout(tryIt, 100)); tryIt(); }
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
