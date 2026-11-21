# Clone persis tampilan referensi visual novel — 21 Nov 2026

## Intent / why
Pengguna membandingkan EXE hasil port dengan aplikasi referensi `<referensi-visual-novel-20261121>` dan menyatakan tampilannya belum sama. Ia menyetujui opsi 1: **ganti lapisan presentasi aplikasi agar tampilan identik dengan referensi**, dengan data yang tidak masuk dalam referensi disiapkan untuk pengembangan berikutnya (tidak dihapus, tidak ditampilkan sekarang). Status produk tetap `LAYAK BERSYARAT` sampai pilot manusia.

## Goals
- Saat EXE dibuka, layar yang tampil adalah **persis** alur referensi: Title → CharacterCreator → Stage/Story → ResultScreen, dengan panel Jurnal/Perpustakaan/Riwayat/Pengaturan/Modal.
- Komponen, kelas CSS, aset, palet, tipografi, dan transisi mengikuti referensi apa adanya (pixel/screen-level, bukan hanya "serupa").
- Data/progres SQLite, backup/restore, preferensi, dan modul materi/SRS/statistik/catatan tetap ada di kode sebagai modul tidur + adaptor terdokumentasi untuk fase berikutnya.
- Jalur build normal Tauri tetap dipakai; SATU kandidat QA; bukti perbandingan screenshot referensi vs EXE.

## Non-goals
- Tidak mengubah visibility repo, tidak commit/push, tidak membuka/merge PR (keputusan terpisah; PR ke `main` sudah diminta agen transfer).
- Tidak menghapus data SQLite, progres peserta, paket pilot 21 Nov, EXE lama, atau pintasan lama sebelum kandidat lulus.
- Tidak mengerjakan integrasi penuh 67 materi/SRS/statistik/catatan ke UI referensi sekarang.
- Tidak memakai Xfigura / agen gambar / publikasi lain / reset / clean / profil peserta.

## Anti-goals
- Menghasilkan tampilan "mirip" yang tetap mempertahankan shell `lernen`, 4 tab, atau tombol `Koleksi media` sebagai UI utama — itu恰恰 yang ingin dihilangkan.
- Pendinginan data dengan cara menghapus modul lama; ini merusak pekerjaan berikutnya.

## Constraints
- Repo kerja: `<clone APPlerner-verify>`, cabang baru `clone-persis-20261121` dari `18edbf85fe2249fb12b06c48a1b2ee21057296ad` (commit hasil SESAI).
- Referensi: `<referensi-visual-novel-20261121>`, manifest `ref-visual-novel-manifest.json` (96 berkas, agregat `a562f171…`). Folder `src/assets/audio/` referensi sudah dilengkapi dari `APPlerner-codex/public/audio/`.
- Aplikasi memakai React 19 + Tauri 2 + Vite. Referensi memakai Tailwind CSS v4 + `@tailwindcss/vite` + `vite-plugin-singlefile`.
- Satu pemilik per area file; tidak ada sesi/monitor duplikat. Transfer/git tetap agen transfer.

## Approaches
1. **Ganti lapisan presentasi (DIPILIH).** Port komponen referensi apa adanya menjadi entry `App.tsx`, tambahkan Tailwind v4 ke build agar kelas render identik, dan petakan data SQLite ke tipe `Progress`/`Game` referensi via adaptor yang sudah ada (`novelProgress`, `storyFlowAdapter`). Modul lama tetap sebagai modul tidur. Tradeoff: fitur lama tak terlihat, dependency Tailwind baru, risiko regressi data jika adaptor salah — diminimalisir dengan adapter read-only dan tes paritas.
2. **Sisipkan referensi sebagai WebView/iframe.** Pixel-identik paling cepat, tetapi data bridge rapuh dan bukan integrasi nyata; ditolak.
3. **Perbaiki tampilan saat ini agar mirip.** Sudah dilakukan dan ditolak pengguna karena tidak persis.

## Keputusan desain (sudah disetujui pengguna)
- Entry default aplikasi = layar referensi; shell `lernen`/4 tab/TodayPage/ExplorePage/Catatan/Profil/**Koleksi media** tidak dirender di jalur utama.
- Tailwind v4 + `@tailwindcss/vite` ditambahkan ke dependency/build aplikasi (satu-satunya dependency baru).
- Komponen referensi dipindahkan apa adanya ke `src/klab/novel/**` (TitleScreen, CharacterCreator, Stage, DialogPanel, Panels, ResultScreen, Portrait, types, engine, story, data, assets, index.css) dengan penyesuaian path import saja.
- Data tersimpan dipetakan lewat adaptor ke `Progress`/`Game`; modul lama (67 materi, SRS, statistik, catatan, backup) dipertahankan sebagai modul tidur + peta integrasi di `docs/.../DATA-BERIKUTNYA.md`.
- Audio memakai aset referensi yang sudah lengkap; default mati; perilaku `AudioController` referensi dipertahankan.
- Build kandidat di folder unik `outputs/penyelesaian-windows/clone-persis-20261121/kandidat-qa/`, target terisolasi, profil QA unik; jangan timpa EXE lama/pintasan/paket pilot.

## Keputusan tambahan setelah pemeriksaan desain (call AD, bukan keputusan pengguna)
1. **Entry boleh menjadi wrapper async.** `App.tsx` referensi memakai `localStore` sinkron; repo verify memakai SQLite async dan bootstrap DB/integrity/auto-backup/study-clock. Rencana: jangan copy `App.tsx` mentah. Buat entry `src/klab/novel/App.tsx` dengan state awal deterministik + `useEffect` async yang memanggil bootstrap DB yang sudah ada, lalu render layar referensi setelah siap. Pertahankan `console.error=0` dan integritas data. Frontend loading hanya sampai DB siap, tidak mengubah tampilan akhir.
2. **Font ditanam offline.** Referensi memuat Google Fonts (Atkinson italic 400 + Caveat 600) lewat CDN. Saya sudah mengunduh keduanya dan menyimpannya di `src/assets/fonts/AtkinsonHyperlegible-Italic.ttf` (53.176 B) dan `Caveat-SemiBold.ttf` (251.816 B). Rencana: `@font-face` lokal di `index.css`, hapus `<link>` Google Fonts dari `index.html`, jaga `offline` lulus.
3. **Adaptor ditulis ulang, mesin lama dinonaktifkan dari jalur utama.** `storyFlowAdapter`/`storyStore` yang ada membuang `stage` & `prologCompleted` dan terikat mesin cerita lama. Rencana: buat `localStore`-adapter baru di atas `novelStore`/SQLite yang memetakan penuh tipe `Progress`/`Game` referensi (termasuk `stage`, `flags`, `prologCompleted`); mesin cerita lama dipertahankan sebagai modul tidur untuk fase berikutnya, bukan dipakai entry baru.

## Yang diserahkan ke builder
- Susun urutan port file, konfigurasi Tailwind/Vite, dan strategi adapter data.
- Tentukan cara menyimpan modul tidur agar mudah diaktifkan lagi (mis. registry + dokumentasi, bukan penghapusan).
- Siapkan checklist QA perbandingan screenshot referensi vs EXE pada hash yang sama.

## Acceptance
- Build normal exit 0; satu EXE kandidat; 0 proses QA; DB QA dipulihkan.
- Screenshot EXE layar per layar cocok dengan referensi (Title, Create, Stage/Story, Result, tiap panel), `console.error=0`, keyboard/reduced motion/900×600/1280×800/offline/restart lolos.
- Tidak ada data/profil/paket pilot yang berubah. Status produk tetap `LAYAK BERSYARAT`.
