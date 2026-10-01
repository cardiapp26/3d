import fs from 'node:fs';

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
fs.writeFileSync('index.html', index.replace(/(name="app-version" content=")[^"]+/, `$1${version}`).replace(/(name="app-build" content=")[^"]+/, `$1${build}`));
fs.writeFileSync('public/sw.js', worker.replace(/const VERSION = '[^']+';/, `const VERSION = '${build}';`));
console.log(`Stamped ${version} / ${build} / ${date}; inspect diff before distribution`);
