import { createServer } from 'vite';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const checks = ['test:resize', 'test:browser', 'test:echo', 'test:mobile', 'test:mitral', 'test:hemo-pv', 'test:atria', 'test:bachmann', 'test:pharmacology-browser', 'test:ep-flow'];
const screenshots = fs.mkdtempSync(path.join(os.tmpdir(), 'cardia-verify-'));
const server = process.env.APP_URL ? null : await createServer({ server: { host: '127.0.0.1', port: 0, strictPort: true }, logLevel: 'error' });
try {
  if (server) await server.listen();
  const url = process.env.APP_URL || `http://127.0.0.1:${server.httpServer.address().port}`;
  for (const check of checks) {
    console.log(`VERIFY ${check} against ${url}`);
    const code = await new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', check], { stdio: 'inherit', env: { ...process.env, APP_URL: url, SHOT_DIR: screenshots } });
      child.once('error', reject);
      child.once('exit', (code, signal) => resolve(signal ? 1 : code));
    });
    if (code !== 0) throw new Error(`${check} failed (exit ${code})`);
  }
  console.log(`PASS browser gate; screenshots: ${screenshots}`);
} finally {
  await server?.close();
}
