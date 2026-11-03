// front.js — the front of Locki Labs (forge #12): the company dropdown, the phone menu,
// and the language carried on in-page links. No storage: the language lives in the URL.
const $ = (id) => document.getElementById(id);
const dropBtn = $('drop-btn'), panel = $('drop-panel'), burger = $('burger'), menu = $('menu');

function setDrop(open) { dropBtn.setAttribute('aria-expanded', String(open)); panel.hidden = !open; }
dropBtn.addEventListener('click', (e) => { e.stopPropagation(); setDrop(panel.hidden); });
document.addEventListener('click', (e) => { if (!panel.hidden && !e.target.closest('.drop')) setDrop(false); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setDrop(false); setMenu(false); dropBtn.focus(); } });
panel.addEventListener('click', (e) => { if (e.target.closest('a')) { setDrop(false); setMenu(false); } });

function setMenu(open) { burger.setAttribute('aria-expanded', String(open)); menu.classList.toggle('open', open); }
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
menu.addEventListener('click', (e) => { if (e.target.closest('a.menu-link')) setMenu(false); });

// EN is ?lang=en; keep it on the links that stay on this page or go home
if (document.documentElement.dataset.lang === 'en') {
  document.querySelectorAll('a[data-keep-lang]').forEach((a) => {
    const href = a.getAttribute('href');
    a.setAttribute('href', href.startsWith('#') ? `?lang=en${href}` : `${href}?lang=en`);
  });
}
