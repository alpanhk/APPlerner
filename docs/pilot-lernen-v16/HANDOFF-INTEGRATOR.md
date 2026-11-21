# Handoff kandidat Pilot Lernen v1.6 — 21 Nov 2026

**Penulis:** Asisten Director (fallback mekanis). Agent 1 kehabisan kuota; Agent 2 gagal memproses mandat alih kerja, jadi AD menyalin EXE yang sudah di-build dan mencatat bukti. Tidak ada kode produk yang ditulis AD dalam langkah ini.

## Identitas kandidat
- EXE: `outputs/pilot-lernen-v16/kandidat-qa/lernen-app-qa.exe`
- SHA-256: `d805a8fcde6c195a7e07a589a41a349b299095dbb2fe5ff45c58cb20b058f390`
- Ukuran: 98.514.432 byte
- Sumber: `src-tauri/target-pilot-v16/release/lernen-app.exe` (build normal)
- WIB salinan: 19:30:44

## Bukti build jalur normal
- `build-normal.log`: `$ tsc && vite build`.
- `build-kandidat.log`: `$ tauri "build" "--no-bundle" "--config" "src-tauri/tauri.pilot-v16-qa.conf.json"`.
- Log akhir: `Finished release profile [optimized] target(s) in 25m 33s`, `Built application at: src-tauri/target-pilot-v16/release/lernen-app.exe`.
- Tidak ada proses build/GUI tersisa pada saat verifikasi AD.

## Basis integrasi
- Workspace: `.`, HEAD `c45e0dd` + perubahan lokal dipertahankan.
- Rute normal aktif: `src/main.tsx` → `src/DesktopEntry.tsx` → `src/arena/App.tsx` (terverifikasi dari `main.tsx`).
- Acuan: GitHub `c2d3509` / `src/klab/novel` dan contoh `5d51337`; tidak di-reset atau ditimpa.

## Yang bisa dicoba
1. Mulai → pilih salah satu dari empat avatar → dengar contoh suara → isi nama → Mulai cerita → jawab Mia.
2. Latih keterampilan → Peron berubah → baca tiket → dengar pengumuman → tanya petugas → tulis pesan ke Mia → jurnal.

## Batas jujur
- Ini kandidat Windows dengan profil QA terisolasi. Pintasan pengguna, EXE lama, paket pilot 21 Nov, dan data peserta tidak diubah.
- QA U01–U12 **belum dijalankan** pada hash ini; status produk tetap `LAYAK BERSYARAT`.
- Telaah pengajar, hasil peserta, dan target >80% per level tetap PENDING.

Dikirim ke QA untuk eksekusi U01–U12 pada hash EXE di atas.
