import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// @ts-expect-error type error without @types/node package
import process from "node:process";
// @ts-expect-error type error without @types/node package
import fs from "node:fs";
// @ts-expect-error type error without @types/node package
import path from "node:path";
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
            // Audit 21 Nov: resolver arena memuat BASE_URL + "a1-story/...".
            // Kembalikan HANYA aset yang direferensikan (daftar di
            // scripts/a1-story-required.json) agar avatar PNG, klip "Hallo!",
            // gambar bab, dan audio prolog benar-benar ada di EXE — tanpa
            // membawa seluruh arsip ~529 MB.
            const required = JSON.parse(
              fs.readFileSync("scripts/a1-story-required.json", "utf8"),
            ) as string[];
            let copied = 0;
            for (const rel of required) {
              const from = path.join("public", "a1-story", rel);
              const to = path.join("dist", "a1-story", rel);
              if (!fs.existsSync(from)) continue;
              fs.mkdirSync(path.dirname(to), { recursive: true });
              fs.copyFileSync(from, to);
              copied++;
            }
            console.log(
              `[buang-a1-story] arsip dibuang; ${copied}/${required.length} aset required dikembalikan ke dist/a1-story`,
            );
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
    allowedHosts: [".e2b.app"],
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
