import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error type error without @types/node package
import process from "node:process";
// @ts-expect-error type error without @types/node package
import fs from "node:fs";
const host = process.env.TAURI_DEV_HOST;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    // PILOT-AGENT-1: public/a1-story adalah arsip audio bab (~360 MB) milik
    // jalur pembangkitan; bundel hanya memakai klip yang diimpor dari
    // src/klab/novel/assets. Pada Vite 8 (rolldown), salinan public/ terjadi
    // pada hook closeBundle plugin INTERNAL yang berjalan SETELAH plugin
    // pengguna, sehingga penghapusan sinkron langsung akan tertimpa salinan
    // ulang. Solusi: jadwalkan penghapusan lewat timer — berjalan setelah
    // seluruh hook selesai, tetap sebelum proses keluar (tauri menunggu
    // proses build selesai sebelum membaca dist). Jalur dev tidak terpengaruh.
    {
      name: "buang-a1-story-dari-dist",
      apply: "build",
      closeBundle() {
        setTimeout(() => {
          try {
            fs.rmSync("dist/a1-story", { recursive: true, force: true });
            console.log("[buang-a1-story] dist/a1-story dibuang — arsip 360 MB tidak ikut EXE");
          } catch (error) {
            console.warn("[buang-a1-story] gagal membersihkan dist/a1-story:", error);
          }
        }, 0);
      },
    },
  ],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
