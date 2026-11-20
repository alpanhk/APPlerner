import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  cacheDir: 'node_modules/.vite-klab-preview',
  base: './',
  server: { host: '127.0.0.1', port: 1425, strictPort: true },
  build: {
    manifest: 'manifest.json',
    outDir: 'outputs/frontend-infrastructure-2026-11-17/dist',
    emptyOutDir: false,
    rollupOptions: { input: 'frontend-preview/index.html' },
  },
});
