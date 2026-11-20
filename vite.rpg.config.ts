// Preview terpisah untuk komponen RPG 4a (port 1432, keluaran sendiri).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  cacheDir: 'node_modules/.vite-rpg',
  base: './',
  server: { host: '127.0.0.1', port: 1432, strictPort: true },
  build: {
    manifest: 'manifest.json',
    outDir: 'outputs/penyelesaian-windows/rpg-preview',
    emptyOutDir: false,
    rollupOptions: { input: 'frontend-preview/rpg.html' },
  },
});
