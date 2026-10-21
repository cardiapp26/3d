import fs from 'node:fs';
import path from 'node:path';

/** Every page entry (index.html with release markers), outside dependencies and build output. */
function pageFiles(dir = '.') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git', 'public', 'research'].includes(entry.name) || entry.name.startsWith('.')) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...pageFiles(file));
    else if (entry.name === 'index.html' && /name="app-version"/.test(fs.readFileSync(file, 'utf8'))) out.push(file);
  }
  return out;
}

const [version, description] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+$/.test(version || '') || !description?.trim()) {
  throw new Error('Usage: npm run release:stamp -- VERSION "release description"');
}
const release = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
const revision = Number(release.build.match(/^v(\d+)$/)?.[1]);
if (!Number.isInteger(revision)) throw new Error('Invalid current build revision');
const build = `v${revision + 1}`;
const index = fs.readFileSync('index.html', 'utf8');
const worker = fs.readFileSync('public/sw.js', 'utf8');
if (!/name="app-version" content="[^"]+"/.test(index) || !/name="app-build" content="[^"]+"/.test(index) || !/const VERSION = '[^']+';/.test(worker)) {
  throw new Error('Release markers missing; no files changed');
}
const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
fs.writeFileSync('public/version.json', `${JSON.stringify({ ...release, version, build, date, description }, null, 2)}\n`);
// All pages carry the same stamp; a stale page meta used to look like a pending update.
const pages = pageFiles();
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, html.replace(/(name="app-version" content=")[^"]+/, `$1${version}`).replace(/(name="app-build" content=")[^"]+/, `$1${build}`));
}
fs.writeFileSync('public/sw.js', worker.replace(/const VERSION = '[^']+';/, `const VERSION = '${build}';`));
console.log(`Stamped ${version} / ${build} / ${date} in ${pages.length} pages; inspect diff before distribution`);
