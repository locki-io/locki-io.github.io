// roots.js — entry for roots.html: Act II on the stage (forge #4).
// The stage mounts the six common elements; this act supplies its scene and its data.
import { mountStage, loadSeasons } from './lifprasir/stage.js';
import { initRoots } from './lifprasir/roots.js';

async function start() {
  const params = new URLSearchParams(location.search);
  const director = params.has('director');
  let story = null, cameraPath = null;
  try { story = await (await fetch('/story/roots.json')).json(); } catch (e) { console.warn('no story for the roots', e); }
  try { const r = await fetch('/camera/roots.json'); if (r.ok) cameraPath = await r.json(); } catch (e) {}
  if (!Array.isArray(cameraPath)) cameraPath = null;
  const seasons = await loadSeasons();

  const stage = mountStage(document.getElementById('stage'), {
    act: 'roots', name: (story && story.name) || 'Act II · the roots', seasons, seasonId: story && story.season, director,
  });

  const beats = (story && story.beats) || [];
  const api = initRoots(stage.scene, {
    beats, director, cameraPath: director ? null : cameraPath, onKeyframes: stage.onKeyframes,
    startAt: parseFloat(params.get('t') || '0') || 0,
    onBeat: (b) => { if (b.line) stage.push(b.line, b.cls || ''); if (b.season) stage.setSeason(b.season); },
    onMark: () => stage.revealMark(),
    onHold: () => stage.showHold(story && story.hold ? story.hold : { verb: 'join', hint: 'the roots are next · any key, or touch' }),
    onGesture: () => { stage.hideHold(); stage.push((story && story.hold && story.hold.after) || '— the hand is here.', 'door'); },
    onTime: (u) => stage.tick(u),
    onSeek: () => { stage.clearStream(); stage.hideHold(); },
  });
  stage.mountBar({ duration: api.duration, seek: api.seek, step: 2,
    marks: beats.filter((b) => b.mark).map((b) => ({ u: b.u, label: b.mark, cls: b.id === 'hold' ? 'door' : '' })) });
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start) : start();
