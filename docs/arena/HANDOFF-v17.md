# Handoff kandidat Arena v1.7 — 21 November 2026

## Baseline dan integrasi

- SHA awal `4fdfc9d0b5dd007787d04e21e5ca6eaa94f9c7db` (head PR #3 `pilot-lernen-v16`); `main` pada pemeriksaan `c2d3509a63b0b79933082e136d5e24d62457ec31`. Cabang lain `clone-persis-20261121` dan `uiux-visual-novel-20261121`; PR terbuka hanya #3. Cabang sesi ini berangkat dari head OpenCode, tanpa menimpa pekerjaannya.
- Entry: `index.html` → `src/main.tsx` → `DesktopEntry` → `src/arena/App.tsx` → judul/creator/prolog; latihan bab menggunakan `src/klab/StoryPage.tsx`, yang **berbeda** dari mesin `src/klab/novel/App.tsx`. Jangan mengira perubahan pada mesin kedua otomatis aktif.
- `Lernen-Arena-Konteks-Pilot.zip` dan `Lernen-Arena-Pelengkap-Pilot.zip` sudah ada di baseline. Paket pelengkap diekstrak ke akar. `python3 scripts/arena/audit-assets.py`: 125/125 cocok path dan SHA-256; 0 hilang/berbeda (45 frame, 67 speech, 3 announcement, 6 prop, 4 background). Indeks dan enam prop dilacak; tidak perlu menduplikasi media 21 MB dari paket konteks.
- `corepack pnpm install --frozen-lockfile`; baseline build gagal karena `src/klab/story.css` tidak ada. CSS ditambahkan dan `corepack pnpm build` berhasil. Build mengembalikan 157/157 aset required.
- Tiga klip indeks pengumuman (empat, lima, dan respons petugas) diimpor langsung oleh `src/klab/indexed-story-clips.ts`, mempertahankan hash aset sumber. Metadata transkrip dan karakter ada di indeks. Banyak audio cerita lain belum tersedia pada path runtime StoryPage: audit `story-data.json` menemukan 557 path audio unik, hanya 88 nama cocok di sumber novel; tiga klip terindeks kini dipetakan. Ini bukan bukti seluruh Bab 11–12 bersuara.

## Cara mencoba

Node 22.12+ dan Corepack/pnpm: `corepack pnpm install --frozen-lockfile`, `corepack pnpm dev --host 0.0.0.0`; buka URL server. Judul → Mulai cerita → isi nama → pilih karakter → Dengar suara → Mulai prolog → lanjutkan sampai bertemu Mia. Refresh → Lanjutkan untuk mencoba profil. Untuk latihan: Mulai cerita → Latih keterampilan → pilih karakter jika diminta → tombol Peron berubah (Bab 11); gunakan pemilih Bab jika perlu. Ikuti tujuan hingga soal peron, putar pengumuman, jawab, lalu coba pengumuman baru. Ini adalah kandidat parsial, **bukan** penerimaan lengkap kedua alur.

## U01–U12 — status yang dapat dipertanggungjawabkan

| Kasus | Status | Bukti / sisa |
|---|---|---|
| U01 | Belum diuji | Build lulus, host preview HTTP 200; rendering dan lanjut profil belum diuji di browser. |
| U02 | Belum diuji | Pemilihan kini menghentikan suara lama; empat PNG dan empat klip sudah direferensikan, tetapi `naturalWidth`, tampilan, dan suara belum diuji. |
| U03 | Parsial | `node --experimental-strip-types scripts/arena/test-evidence.mjs`: nama saja, salam, dua kalimat, dan regresi tutor/Rina lulus pada fungsi; alur UI/bantuan belum diuji. |
| U04 | Belum diuji | Audio controller lama menghentikan tuturan saat panel/keluar; sinkronisasi visual dan efek masih perlu pemeriksaan. |
| U05 | Parsial | Papan dan teks varian disembunyikan sebelum respons, tiga klip terindeks terhubung; belum diuji interaktif, respons pertama belum disimpan. |
| U06 | Parsial | Transkrip opsional menandai bantuan; kegagalan audio menampilkan pesan. Belum diuji dan jurnal belum memisahkan kejadian putar audio dan membaca dengan memadai. |
| U07 | Gagal / belum diimplementasikan | Jalur rekam–dengar–hapus dan bukti lisan belum ada pada StoryPage aktif. Ketikan bukan bukti berbicara. |
| U08 | Gagal / belum diimplementasikan | Validasi pesan alternatif, revisi dan riwayat respons awal belum memadai. |
| U09 | Parsial | Prolog menyimpan profil/posisi; draf StoryPage kini disimpan. Pemulihan draf prolog, klik ganda dan idempotensi belum diverifikasi. |
| U10 | Gagal / belum diimplementasikan | Proteksi konservatif untuk bukti tanpa metadata, tetapi aturan lintas stimulus, dua konteks, hari berbeda dan rubrik belum dibangun. |
| U11 | Belum diuji | CSS baru dan pengaturan lama; viewport, keyboard, gerak dan mode senyap belum diverifikasi. |
| U12 | Belum diuji | Perlu cek profil lama, materi, simulasi dan offline Windows; belum ada pengujian desktop. |

Pemeriksaan otomatis browser dicoba menggunakan Chromium headless, namun proses tidak dapat memuat `libnspr4.so`, `libnss3.so`, dan `libnssutil3.so`. Karena itu belum ada screenshot, rekaman suara, bukti decode, atau bukti visual pergantian mulut dari kandidat ini. Jangan menyatakan uji tersebut lulus berdasarkan HTTP 200. Pengujian Windows masih memerlukan WebView2, build Tauri pada profil terisolasi, tes naturalWidth keempat PNG, dua klip peron, replay/overlap, reload, mikrofon ditolak/rekam/hapus, offline, dan kedua resolusi.

## Antrean berikutnya

1. Jalankan browser nyata; selesaikan U01–U06 dan perbaiki jalur media yang hilang berdasarkan ID/transkrip/path lengkap, bukan nama pendek. Verifikasi empat avatar saat bicara dan nonpenutur tetap diam.
2. Satukan peron–petugas–pesan dalam alur aktif dengan rekam lokal, transkrip, umpan balik/revisi, respons pertama dan persistensi idempoten; jangan menyebut ketikan sebagai lisan.
3. Rancang bukti baru dan evaluasi tertunda lintas konteks; migrasikan profil lama tanpa menaikkan status. Jalankan U07–U12 dan uji Windows.
4. Kembangkan bertahap 42 unit/96 pelajaran sesuai mandat; katalog atau naskah bukan bukti materi tuntas. A1–B2 belum selesai; kesiapan aplikasi masih kandidat parsial. Hasil belajar peserta dan target kelulusan Goethe >80% **belum terukur**, tidak ada data kohor.
