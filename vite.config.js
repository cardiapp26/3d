import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// Independent entries share the build and language preference.
const page = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: true } : {},
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: page('./index.html'),
        eps: page('./eps/index.html'),
        pharmacology: page('./pharmacology/index.html'),
        ecg: page('./ecg/index.html'),
        angio: page('./angio/index.html'),
        echo: page('./echo/index.html'),
        exam: page('./exam/index.html'),
        hemo: page('./hemo/index.html'),
        epAnatomy: page('./eps/anatomy/index.html'),
        angio3d: page('./angio/3d/index.html'),
        angioPhysiology: page('./angio/physiology/index.html'),
        angioIvus: page('./angio/ivus/index.html'),
        angioCarotid: page('./angio/carotid/index.html'),
        angioPeripheral: page('./angio/peripheral/index.html')
      },
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
