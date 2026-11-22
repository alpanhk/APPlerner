// Isolated visual review preview for LANJUT-PILOT-01 (Agent 4a).
// Own port, cache and output directory; does not touch 3a's QA port/EXE.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  cacheDir: 'node_modules/.vite-lanjut-pilot',
  base: './',
  server: { host: '127.0.0.1', port: 1427, strictPort: true },
  build: {
    manifest: 'manifest.json',
    outDir: 'outputs/lanjut-pilot-01/preview-dist',
    emptyOutDir: false,
    rollupOptions: { input: 'frontend-preview/pilot.html' },
  },
});
