import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Two pages: the 3D simulator (index.html) and the EPS laboratory (eps/index.html).
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: { main: page('./index.html'), eps: page('./eps/index.html') },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) {
            return 'vendor-three';
          }
        }
      }
    }
  }
});
