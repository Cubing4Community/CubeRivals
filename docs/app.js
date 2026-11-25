// Cache views and setup steps for page and dialog navigation.
const views = [...document.querySelectorAll('[data-view]')];
const steps = [...document.querySelectorAll('[data-step]')];

// Show only the requested setup step.
const showStep = (n) => steps.forEach((s, i) => { s.hidden = i !== n; });
let vsTimer;

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
}

document.addEventListener('click', (e) => {
  const opener = e.target.closest('[data-open]');
  if (opener) {
    const id = opener.dataset.open;
    if (id === 'pair') showStep(0);
    document.getElementById(id).showModal();
    // VS splash moves to the arena after 2.5s unless it is closed first.
    if (id === 'vs') vsTimer = setTimeout(() => { location.hash = '#/arena'; }, 2500);
  }
  const next = e.target.closest('[data-next]');
  if (next) {
    const n = steps.indexOf(next.closest('[data-step]')) + 1;
    showStep(n);
    steps[n].querySelector('button, a').focus();
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
