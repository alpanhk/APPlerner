# Catatan build — clone persis visual novel 20261121

- **Kandidat**: `clone-persis-20261121` / `kandidat-r2`, baseline commit `18edbf85fe2249fb12b06c48a1b2ee21057296ad`.
- **EXE**: `lernen-app-qa.exe`, 66.789.376 B, SHA-256 `961e664ac36ff662423d724f83fe739f549d0bdf4a6de7e5ef66a03434a4d062` (diverifikasi ulang). Build normal 15:46:01–15:55:16 WIB.
- **Tinjau mandiri [P]**: SESAI pada hash di atas; 3a 21 PASS / 0 FAIL; regresi CP-CLONE-01 terkonfirmasi. Sisa perbedaan (Perpustakaan 35,3%) ditetapkan sebagai perbedaan lingkungan — font CDN versus TTF offline, dan `soundOn` default — bukan cacat produk; tidak diklaim pixel-identik.
- **Perubahan**: lapisan presentasi referensi di `src/klab/novel/**`, font offline di `src/assets/fonts/`, desain/rencana di `docs/superpowers/`, serta `index.html`/`package.json`/`pnpm-lock.yaml`/`src/main.tsx`/`src/App.tsx`.
- **Bukti ringkas**: laporan tinjau + QA/diff JSON di folder ini. EXE, screenshot QA, `chrome-diff-profile/`, `webview2-profile/`, `db-backup/`, DB, dan `scripts/qa/` sengaja tidak disertakan.
- **Status produk**: LAYAK BERSYARAT; pilot/manusia tetap PENDING.
