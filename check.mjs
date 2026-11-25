// Self-check: every link has a view and every opener has a dialog. Run: node check.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const html = readFileSync(new URL('docs/index.html', import.meta.url), 'utf8');
const all = (re) => [...html.matchAll(re)].map((m) => m[1]);
const views = all(/data-view="([^"]*)"/g);
const dialogs = all(/<dialog id="([^"]+)"/g);
for (const r of all(/href="#\/([^"]*)"/g)) assert(views.includes(r), `no view for #/${r}`);
for (const d of all(/data-open="([^"]+)"/g)) assert(dialogs.includes(d), `no dialog "${d}"`);
assert.equal(views.length, 6);
assert.equal(dialogs.length, 4);
console.log('ok');
