/**
 * App under test: APP_URL when given, otherwise a Vite dev server started here on a free port.
 * @returns {Promise<{ url: string, close: () => Promise<void> }>}
 */
async function startApp() {
  if (process.env.APP_URL) return { url: process.env.APP_URL.replace(/\/$/, ''), close: async () => {} };
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  await server.listen();
  return { url: `http://127.0.0.1:${server.httpServer.address().port}`, close: () => server.close() };
}

module.exports = { startApp };
