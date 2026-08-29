// main.js — homepage entry. Grows the Red Thread behind the hero.
import { initLifprasirTree } from './lifprasir/tree.js';

// Inline onclick in index.html calls this; as a module, it must be global.
window.smoothScrollToValue = function smoothScrollToValue() {
  document.querySelector('#section2').scrollIntoView({ behavior: 'smooth' });
};

function start() {
  const container = document.getElementById('lifprasir-canvas');
  if (container) initLifprasirTree(container);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
