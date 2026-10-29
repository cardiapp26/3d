// Welcome page (src/home): every card opens an existing page, has a thumbnail and bilingual
// text; the root entry loads the welcome router; the anatomy menu link carries a 3D route.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DOMAINS, HOME_MODULES, BADGES, HOME_TEXT, DRTR_APPS } from '../src/home/home-data.js';
import { SITE_MODULES } from '../src/site-modules.js';

const root = new URL('../', import.meta.url);
const bilingual = (o, ctx) => assert.ok(o?.tr?.trim() && o?.en?.trim(), `${ctx} must be bilingual`);

assert.ok(HOME_MODULES.length >= 14, 'every module has a card');
const ids = new Set();
for (const m of HOME_MODULES) {
  assert.ok(!ids.has(m.id), `duplicate card ${m.id}`);
  ids.add(m.id);
  assert.ok(DOMAINS.some((d) => d.id === m.domain), `${m.id}: known domain`);
  bilingual(m.name, `${m.id}.name`);
  bilingual(m.kicker, `${m.id}.kicker`);
  assert.ok(m.points.length >= 2, `${m.id}: at least two points`);
  m.points.forEach((p, i) => bilingual(p, `${m.id}.points[${i}]`));
  if (m.badge) assert.ok(BADGES[m.badge], `${m.id}: known badge`);
  const thumb = new URL(`src/home/thumbs/${m.thumb}.webp`, root);
  assert.ok(fs.existsSync(thumb), `${m.id}: thumbnail exists`);
  assert.ok(fs.statSync(thumb).size < 80_000, `${m.id}: thumbnail is small`);
  // Page cards point at an existing page; the 3D anatomy card carries a route.
  const page = m.path.split('#')[0].replace(/^\.\//, '');
  assert.ok(fs.existsSync(new URL(`${page}index.html`, root)), `${m.id}: ${m.path} exists`);
  if (m.path.includes('#')) assert.match(m.path, /^\.\/#\/mode\/[a-z]+$/, `${m.id}: 3D route`);
}
// Every menu page of the site header has a card.
for (const mod of SITE_MODULES) {
  for (const page of mod.pages || [mod]) {
    assert.ok(HOME_MODULES.some((m) => m.id === page.id), `site page ${page.id} has a welcome card`);
  }
}
assert.match(SITE_MODULES.find((m) => m.id === 'anatomy').path, /#\/mode\/anatomy$/, 'anatomy menu link opens the 3D route, not the welcome page');
DOMAINS.forEach((d) => bilingual(d.label, `domain ${d.id}`));
for (const key of ['title', 'heroTitle', 'heroLead', 'heroCta', 'howTitle', 'disclaimer']) bilingual(HOME_TEXT[key], key);
HOME_TEXT.faq.forEach((f, i) => { bilingual(f.q, `faq ${i}.q`); bilingual(f.a, `faq ${i}.a`); });

// DRTR platform links: the home page first, then every app; https on drtr.uk, bilingual text,
// a small local thumbnail.
assert.equal(DRTR_APPS.length, 14, 'DRTR platform lists 14 entries');
assert.equal(new URL(DRTR_APPS[0].url).host, 'drtr.uk', 'the drtr.uk home page comes first');
for (const key of ['navDrtr', 'drtrTitle', 'drtrLead', 'drtrNewTab']) bilingual(HOME_TEXT[key], key);
const appIds = new Set();
const appHosts = new Set();
for (const app of DRTR_APPS) {
  assert.ok(!appIds.has(app.id), `duplicate DRTR app ${app.id}`);
  appIds.add(app.id);
  const url = new URL(app.url);
  assert.equal(url.protocol, 'https:', `${app.id}: https`);
  assert.match(url.host, /^([a-z0-9-]+\.)?drtr\.uk$/, `${app.id}: on drtr.uk`);
  assert.ok(!appHosts.has(url.host), `${app.id}: unique host`);
  appHosts.add(url.host);
  if (typeof app.name === 'string') assert.ok(app.name.trim(), `${app.id}: name`);
  else bilingual(app.name, `${app.id}.name`);
  bilingual(app.description, `${app.id}.description`);
  for (const l of ['tr', 'en']) assert.ok(app.description[l].length <= 90, `${app.id}.description.${l} is short`);
  const thumb = new URL(`src/home/apps/${app.thumb}.webp`, root);
  assert.ok(fs.existsSync(thumb), `${app.id}: thumbnail exists`);
  assert.ok(fs.statSync(thumb).size < 60_000, `${app.id}: thumbnail is small`);
}

const html = fs.readFileSync(new URL('index.html', root), 'utf8');
assert.match(html, /src="\/src\/home\/home\.js"/, 'root loads the welcome router');
assert.match(html, /<div id="app"><\/div>/, 'root keeps the 3D mount point');
const router = fs.readFileSync(new URL('src/home/home.js', root), 'utf8');
assert.match(router, /import\('\.\.\/main\.js'\)/, '3D shell is loaded lazily');
for (const file of ['src/home/home.js', 'src/home/home-data.js', 'src/home/home.css', 'index.html']) {
  assert.ok(!fs.readFileSync(new URL(file, root), 'utf8').includes('\u2014'), `${file} has no em dash`);
}
console.log(`PASS welcome page: ${HOME_MODULES.length} module cards with thumbnails and pages, ${DRTR_APPS.length} DRTR platform links, 3D routes kept, bilingual text`);
