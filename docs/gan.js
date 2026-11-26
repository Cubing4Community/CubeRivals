// GAN smart cube over Web Bluetooth. Decryption is handled by gan-web-bluetooth (MIT).
const LIB = 'https://cdn.jsdelivr.net/npm/gan-web-bluetooth@3.0.2/+esm';
const MAC = /^([0-9A-F]{2}:){5}[0-9A-F]{2}$/;
const KEY = 'cubeup.mac'; // kept in this browser only, never in the repo

const $ = (id) => document.getElementById(id);
const form = $('cube-form');
const input = $('cube-mac');
const button = $('cube-connect');
let lib, conn, moves = [];

try { input.value = localStorage.getItem(KEY) ?? ''; } catch { /* storage blocked */ }

// Load early: the Bluetooth picker must open soon after the click.
const load = () => (lib ??= import(LIB).catch((err) => { lib = undefined; throw err; }));
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-open="pair"]')) load().catch(console.error);
});

const say = (text) => { $('cube-message').textContent = text; };
function status(text) {
  document.querySelectorAll('[data-cube-status]').forEach((el) => { el.textContent = text; });
}

function disconnected() {
  conn = undefined;
  button.textContent = 'Connect';
  status('Not connected');
  $('cube-battery').textContent = '—';
}

function onEvent(event) {
  if (event.type === 'MOVE') {
    moves = [...moves, event.move].slice(-12);
    $('cube-moves').textContent = moves.join(' ');
  } else if (event.type === 'BATTERY') {
    $('cube-battery').textContent = `${event.batteryLevel}%`;
  } else if (event.type === 'DISCONNECT') {
    disconnected();
    say('Cube disconnected.');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  button.disabled = true;
  try {
    if (conn) {
      await conn.disconnect();
      disconnected();
      say('Cube disconnected.');
      return;
    }
    if (!navigator.bluetooth) {
      say('This browser has no Web Bluetooth. Use Chrome or Edge. On Linux, also enable experimental web platform features.');
      return;
    }
    const mac = input.value.trim().toUpperCase();
    if (mac && !MAC.test(mac)) {
      say('The MAC address should look like AB:12:34:56:78:9A.');
      return;
    }
    say('Wake your cube, then choose it in the Bluetooth list.');
    const { connectGanCube } = await load();
    conn = await connectGanCube(async () => mac || null);
    moves = [];
    $('cube-moves').textContent = '—';
    conn.events$.subscribe(onEvent);
    status(`Connected: ${conn.deviceName}`);
    button.textContent = 'Disconnect';
    say('Connected. Turn a face to check. No moves means the MAC address is wrong.');
    try { if (mac) localStorage.setItem(KEY, mac); } catch { /* storage blocked */ }
    await conn.sendCubeCommand({ type: 'REQUEST_BATTERY' });
  } catch (err) {
    console.error(err);
    if (err.name === 'NotFoundError') say('No cube chosen.');
    else say(`Could not connect: ${err.message}`);
  } finally {
    button.disabled = false;
  }
});
