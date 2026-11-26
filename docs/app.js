// Cache views for page and dialog navigation.
const views = [...document.querySelectorAll('[data-view]')];
let vsTimer;

// Loaded on demand so navigation still works if the CDN is unreachable.
// shortcut: each browser makes its own scramble; real 1v1 needs a server to send one to both.
let scrambleId = 0;
async function newScramble() {
  const id = ++scrambleId;
  const out = document.getElementById('scramble');
  out.textContent = 'Generating…';
  let text;
  try {
    const { randomScrambleForEvent } = await import('https://cdn.cubing.net/v0/js/cubing/scramble');
    text = (await randomScrambleForEvent('333')).toString();
  } catch (err) {
    console.error(err);
    text = 'Could not generate. Check your connection and reload the page.';
  }
  if (id === scrambleId) out.textContent = text;
}

function route(focus) {
  // Read the hash and use the first view as a fallback.
  const name = location.hash.replace(/^#\/?/, '');
  const view = views.find((v) => v.dataset.view === name) ?? views[0];
  document.querySelectorAll('dialog[open]').forEach((d) => d.close());
  views.forEach((v) => { v.hidden = v !== view; });
  document.querySelectorAll('nav a').forEach((a) => {
    if (a.hash === `#/${view.dataset.view}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.title = `${view.dataset.title} · CubeUp`;
  if (focus) view.querySelector('h1').focus();
  if (view.dataset.view === 'arena') newScramble();
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) {
    const id = opener.dataset.open;
    document.getElementById(id).showModal();
    // VS splash moves to the arena after 2.5s unless it is closed first.
    if (id === 'vs') vsTimer = setTimeout(() => { location.hash = '#/arena'; }, 2500);
  }
  // A link to the current page fires no hashchange, so close its dialog here.
  const link = e.target.closest('dialog a');
  if (link && link.hash === location.hash) link.closest('dialog').close();
});

// Not the dialog's close event: it fires late and could cancel a newer timer.
const vs = document.getElementById('vs');
const stopVs = () => clearTimeout(vsTimer);
vs.querySelector('form').addEventListener('submit', stopVs);
vs.addEventListener('cancel', stopVs);

addEventListener('hashchange', () => { stopVs(); route(true); });
route(false);
