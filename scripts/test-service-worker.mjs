import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const handlers = {}, stores = new Map(), requests = [];
let offline = false;
let rejectWrites = false;
const origin = 'https://cardia.test';
const key = r => new URL(typeof r === 'string' ? r : r.url, `${origin}/`).href;
const storage = name => {
  if (!stores.has(name)) stores.set(name, new Map());
  const map = stores.get(name);
  return {
    match: async r => map.get(key(r))?.clone(),
    put: async (r, response) => {
      if (rejectWrites) throw new Error('QuotaExceededError');
      map.set(key(r), response.clone());
    }
  };
};
vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
  URL, Response, location: { origin },
  self: { addEventListener: (name, fn) => { handlers[name] = fn; }, skipWaiting: async () => {}, clients: { claim: async () => {} } },
  caches: {
    open: async name => storage(name), keys: async () => [...stores.keys()],
    delete: async name => stores.delete(name),
    match: async r => { for (const name of stores.keys()) { const found = await storage(name).match(r); if (found) return found; } }
  },
  fetch: async (r, options) => {
    requests.push({ url: key(r), options });
    if (offline) throw new Error('offline');
    return new Response(`fresh:${key(r)}`, { status: 200 });
  }
});
await new Promise(resolve => handlers.install({ waitUntil: p => p.then(resolve) }));
const current = [...stores.keys()].find(name => name.startsWith('cardia-'));
await storage('unrelated-app').put('/models/cardiovascular.glb', new Response('foreign'));
await storage('cardia-old').put('/old', new Response('old'));
await new Promise(resolve => handlers.activate({ waitUntil: p => p.then(resolve) }));
assert.ok(stores.has('unrelated-app'), 'activation preserves other applications caches');
assert.ok(!stores.has('cardia-old'), 'activation retires old Cardia builds');
const request = async (pathname, mode = 'cors') => {
  let response;
  handlers.fetch({ request: { method: 'GET', url: `${origin}${pathname}`, mode }, respondWith: p => { response = p; } });
  return response;
};
for (const pathname of ['/models/cardiovascular.glb', '/draco/draco_decoder.wasm', '/draco/draco_wasm_wrapper.js']) {
  await storage(current).put(pathname, new Response('stale'));
  assert.match(await (await request(pathname)).text(), /^fresh:/, 'fixed names revalidate online');
  assert.equal(requests.at(-1).options?.cache, 'no-cache');
  offline = true;
  assert.match(await (await request(pathname)).text(), /^fresh:/, 'offline uses last successful same-build response');
  offline = false;
}
const hashed = '/assets/index-AbCd1234.js';
await storage(current).put(hashed, new Response('immutable'));
const count = requests.length;
assert.equal(await (await request(hashed)).text(), 'immutable');
assert.equal(requests.length, count, 'hashed asset does not refetch');
assert.match(await (await request('/version.json?_t=1')).text(), /^fresh:/);
assert.equal(requests.at(-1).options?.cache, 'no-store');
rejectWrites = true;
for (const pathname of ['/models/new.glb', '/assets/new-AbCd1234.js']) {
  assert.match(await (await request(pathname)).text(), /^fresh:/, 'storage quota does not discard a successful response');
}
rejectWrites = false;
offline = true;
assert.equal((await request('/assets/missing-12345678.js')).status, 504, 'missing JS never receives HTML shell');
assert.ok((await request('/lesson', 'navigate')).ok, 'offline navigation may use HTML shell');
// Two pages: each offline navigation gets the shell of its own page.
assert.equal(await (await request('/lesson', 'navigate')).text(), `fresh:${origin}/index.html`, 'simulator shell for simulator paths');
assert.equal(await (await request('/eps/?lang=en', 'navigate')).text(), `fresh:${origin}/eps/index.html`, 'EPS shell for EPS paths');
assert.equal(await (await request('/eps', 'navigate')).text(), `fresh:${origin}/eps/index.html`);
assert.equal(await (await request('/epsilon', 'navigate')).text(), `fresh:${origin}/index.html`, 'prefix match stops at the path segment');
assert.ok((await request('/eps/', 'navigate')).ok, 'EPS page precached at install');
console.log('PASS service-worker: fixed names revalidate, hashed assets cache, offline fallback per page (simulator, EPS), isolated cache ownership');
