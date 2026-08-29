// director.js — the operator sets the orbit.
//
// One mechanism for every act: orbit with the mouse, K captures {u, position,
// target} at the current moment of the timeline, E exports the path (console +
// clipboard). The JSON lands in public/camera/<act>.json and becomes DATA the
// act plays back — a camera path authored by a human hand, then versioned.

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const tmp = { a: null, b: null };

export function createDirector({ camera, dom, act, target, director = false, cameraPath = null, onKeyframes }) {
  let controls = null;
  const keyframes = [];
  let currentU = 0;

  function onKey(e) {
    if (!controls) return;
    if (e.key === 'k' || e.key === 'K') {
      keyframes.push({
        u: +currentU.toFixed(2),
        position: camera.position.toArray().map((v) => +v.toFixed(3)),
        target: controls.target.toArray().map((v) => +v.toFixed(3)),
      });
      keyframes.sort((a, b) => a.u - b.u);
      onKeyframes && onKeyframes(keyframes, 'captured');
    } else if (e.key === 'e' || e.key === 'E') {
      const json = JSON.stringify(keyframes, null, 2);
      console.log(`%ccamera path — save as public/camera/${act}.json`, 'color:#ffb8a8;font-weight:bold');
      console.log(json);
      if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {});
      onKeyframes && onKeyframes(keyframes, 'exported');
    }
  }

  function setCam(k, l = null, s = 0) {
    if (!l) {
      camera.position.fromArray(k.position);
      target.fromArray(k.target);
    } else {
      const e = s * s * (3 - 2 * s); // smoothstep between two keyframes
      camera.position.set(
        k.position[0] + (l.position[0] - k.position[0]) * e,
        k.position[1] + (l.position[1] - k.position[1]) * e,
        k.position[2] + (l.position[2] - k.position[2]) * e
      );
      target.set(
        k.target[0] + (l.target[0] - k.target[0]) * e,
        k.target[1] + (l.target[1] - k.target[1]) * e,
        k.target[2] + (l.target[2] - k.target[2]) * e
      );
    }
    camera.lookAt(target);
  }

  function applyPath(u) {
    const p = cameraPath;
    if (!p || !p.length) return false;
    if (u <= p[0].u) { setCam(p[0]); return true; }
    if (u >= p[p.length - 1].u) { setCam(p[p.length - 1]); return true; }
    for (let i = 0; i < p.length - 1; i++) {
      if (u >= p[i].u && u <= p[i + 1].u) {
        const span = p[i + 1].u - p[i].u || 1;
        setCam(p[i], p[i + 1], (u - p[i].u) / span);
        return true;
      }
    }
    return false;
  }

  if (director) {
    controls = new OrbitControls(camera, dom);
    controls.target.copy(target);
    controls.enableDamping = true;
    window.addEventListener('keydown', onKey);
    onKeyframes && onKeyframes(keyframes, 'ready');
  }

  return {
    // called every frame with the act's timeline position
    update(u) {
      currentU = u;
      if (controls) { controls.update(); target.copy(controls.target); return; }
      applyPath(u);
    },
    get active() { return !!controls; },
    dispose() {
      window.removeEventListener('keydown', onKey);
      if (controls) controls.dispose();
    },
  };
}
