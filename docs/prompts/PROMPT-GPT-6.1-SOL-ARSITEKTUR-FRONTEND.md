# Perintah untuk GPT-6.1 Sol — arsitektur frontend Lernen/KLAB

Bertindaklah sebagai lead frontend architect untuk proyek yang sudah berjalan. Saya meminta arsitektur frontend yang konkret dan siap diturunkan menjadi pekerjaan implementasi, berdasarkan kode serta aset AKTUAL. Jangan membuat aplikasi baru dari nol atau hanya memberi folder generik.

## Tujuan dan lingkup
Proyek: ..
Susun arsitektur untuk menerapkan arah UI KLAB pada Lernen: Android sebagai prioritas, HP/tablet/Windows responsif, offline dengan aset bawaan, hemat ukuran paket, untuk masyarakat umum berbagai usia. Tetap prioritaskan kualitas materi A1.
Kerjakan pemeriksaan kode/aset, keputusan arsitektur, pemetaan migrasi dan rencana implementasi. Pada tugas ini hasil utamanya dokumen arsitektur dan kontrak yang dapat ditinjau; jangan langsung merombak seluruh kode produksi atau membangun APK. Jangan berhenti pada rencana akan memeriksa—selesaikan pemeriksaan dan dokumen.
Ambil keputusan teknis rutin mandiri. Tandai asumsi produk baru; tanyakan hanya bila ada hambatan material yang tidak terjawab dari proyek.

## 1. Baca rujukan, lalu verifikasi kode
Wajib:
- HANDOFF-LERNEN.md seluruhnya, terutama pembaruan paling akhir.
- PRD-Aplikasi-Belajar-Bahasa-Jerman.md §0, termasuk pembaruan KLAB/Android.
- docs/superpowers/specs/2026-11-17-lernen-klab-ui-design.md.
- outputs/klab-detail-2026-11-17/README.md dan tiga JPG di folder tersebut; inspeksi gambarnya.
- outputs/ui-alternatif-2026-11-17/02-KLAB.jpg sebagai arah visual terpilih.
- docs/architecture/2026-11-17-frontend-inventory.md sebagai snapshot awal, BUKAN kebenaran permanen.
- AGENTS.md yang berlaku dan skill relevan dari inventaris pengguna.

Kode yang harus ditelusuri:
- package.json, lockfile, vite.config.ts, tsconfig*, src/main.tsx, src/App.tsx, src/App.css.
- src/ui/Layout.tsx, PageShell.tsx, FatalDatabase.tsx, src/ui/pages/index.ts dan seluruh layar yang didaftarkan.
- src/stores/nav.ts, db.ts, backup.ts.
- src/ui/lessons/*, src/lessons/*, src/drills/*, src/srs/*, src/reading/*, src/stats/*.
- src/data/lessons, practice, reading, seed; seedLoader.ts dan importWords.ts.
- src/assets/tts_core/manifest.json, semua aset yang direferensikan dan aturan import pada src/srs/tts.ts; public/.
- src-tauri/src/lib.rs, Cargo.toml, tauri.conf.json dan capabilities.
- scripts/test_*.cjs dan bukti QA yang relevan.

Utamakan instruksi pengguna terbaru untuk arah produk dan kode terkini untuk status implementasi. Dokumen dapat tertinggal. Contoh: ada modul SQLite draft, transaksi attempt+draft, pengacakan opsi dan snapshot hasil checkpoint; jangan menganggap semuanya masih belum dibuat berdasarkan audit lama. Keberadaan kode bukan bukti semua skenario runtime telah lulus.

## 2. Batas perlindungan
Repo berisi banyak perubahan tracked/untracked milik pengguna. Catat git status sebelum bekerja. Jangan reset, clean, menghapus, menimpa pekerjaan lain, commit/push atau pindah worktree tanpa membawa data konteks yang diperlukan. Tidak ada keperluan mengubah data produksi.
Profil produksi app.lernen.desktop tidak digunakan untuk percobaan. Gunakan DB terisolasi/profil app.lernen.qa bila pemeriksaan runtime diperlukan. Jaga edit/penghapusan konten, SRS, catatan/draft/hasil pengguna dan backup lama.
Pengguna tidak membutuhkan ekspor/impor dalam UX baru; ini BUKAN perintah menghapus perlindungan recovery dan data yang ada.
Tidak ada akun, cloud sync, layanan berbayar atau ketergantungan jaringan saat belajar.

## 3. Inventaris wajib sebelum menentukan arsitektur
Buat matriks fitur: fitur -> file pemilik -> penyimpanan/efek samping -> status aktual -> reuse/refactor/new -> rute KLAB.
Cakup minimal:
1. Hari Ini, rekomendasi, lanjut sesi, waktu belajar dan statistik.
2. Kurikulum A1–B2, materi, latihan pelajaran, checkpoint per tujuan dan remedial.
3. Drill D1–D10, kosakata, SRS/FSRS, kamus, bacaan dan audio.
4. Latihan Hören/Schreiben, percakapan bercabang, dan Uji Tiruan A1. Ketiganya sudah memiliki kode; jangan hilangkan dari navigasi baru.
5. Pengaturan, startup/migrasi/seed, backup/recovery, error state.
6. Usulan baru: catatan/sorotan, onboarding mode terurut/bebas, tema, rekaman mikrofon, XP/lencana, putaran ulang dan jumlah lulus.
Bedakan 'belum ditemukan pada pencarian' dari 'terbukti tidak ada'. Cari implementasi aktual sebelum menyebut fitur baru.

Inventaris aset: path, jenis, jumlah, ukuran byte/MiB, dipakai oleh siapa, dicakup manifest/import atau tidak, lisensi/provenance bila ada, keputusan pakai ulang/optimalkan/perlu dibuat. Bedakan folder sumber, file yang teremit ke dist, ukuran paket Android terkompresi dan ruang terpasang. Jangan mengklaim eager import URL berarti seluruh audio sudah didekode ke RAM.
JPG desain adalah referensi; jangan dijadikan screenshot UI produksi atau dianggap maskot/icon terpisah. Inventaris font/ikon/meme/soundboard harus nyata; lisensi belum diketahui diberi status belum diperiksa. Jangan membundel semua aset internet hanya karena tersedia.

## 4. Keputusan produk yang harus ditampung
- Identitas tetap Lernen, arah visual KLAB: buku komik, kucing ekspresif, biru–merah–kuning, ornamen di tepi, materi tetap terbaca.
- Empat tujuan utama: Hari Ini, Jelajah, Catatan, Profil. Semua fitur lama tetap punya rute yang dapat ditemukan. Jelajah memuat materi/kosakata/bacaan/latihan, termasuk percakapan dan uji A1; Profil memuat statistik/pengaturan.
- Mode terurut/bebas pada awal dan bisa diganti tanpa menghapus progres. Pertahankan state sesi saat navigasi, rotasi, resize dan kembali.
- Materi panjang, penjelasan dibuka sesuai kebutuhan, catatan/sorotan dengan referensi stabil.
- Tema sistem/terang/gelap, ukuran teks, keyboard/fokus, sentuhan dan reduced-motion.
- Meme dan suara reaksi opsional; suara reaksi terpisah dari audio pelajaran, tidak mengejek kesalahan, tidak menutupi materi.
- Percakapan bercabang offline; dengar–rekam–bandingkan sendiri. Jangan membuat nilai pelafalan atau kemampuan CEFR palsu.
- XP/lencana terpisah dari bukti penguasaan. Angka hadiah dalam spesifikasi adalah usulan, bukan alasan mendesain mesin gamifikasi besar.
- Ulang unit hanya setelah pernah lulus; putaran baru mempertahankan catatan, riwayat, jadwal SRS dan akses unit yang telah dibuka. Jumlah lulus bertambah sekali per putaran sah, bukan setiap klik. Riwayat lama tidak diada-adakan.
- Skenario kosong, loading, gagal simpan, bank belum siap, audio tidak ada, mikrofon ditolak, storage penuh dan app masuk latar harus memiliki tindakan lanjut.

## 5. Rancang arsitektur yang sesuai proyek
Mulai dari React + TypeScript + Vite + Tailwind + Zustand + Tauri/SQLite yang ada. Tidak mengganti framework, state library, routing library atau UI kit tanpa masalah konkret, perbandingan manfaat/biaya dan dampak ukuran. Ini aplikasi lokal; jangan memaksakan Next.js, SSR atau backend web.

Berikan:
A. Diagram arsitektur dan aliran data/efek samping (Mermaid), serta aturan dependensi.
B. Struktur folder target realistis dengan pemetaan file lama -> lokasi/tanggung jawab target. Bedakan modul baru, file yang tetap, dan pemindahan bertahap. Jangan memindah semua file sekaligus hanya untuk estetika.
C. Pemilik state: state tampilan lokal, navigasi global, preferensi, data domain persisten, sesi latihan, cache audio. Tentukan satu sumber kebenaran dan kapan data ditulis.
D. Strategi navigasi: rute bertipe/parameter, nested session, kembali Android/desktop, deep link internal, posisi baca, pemulihan sesi. Putuskan apakah Zustand nav diperluas atau router diperlukan berdasarkan bukti.
E. Kontrak TypeScript kecil beserta perilaku/error untuk kebutuhan nyata: preferensi, catatan, sesi/hasil, audio, rekaman, putaran/XP. Pakai modul domain yang ada; jangan menduplikasi grading, FSRS, seed sync, pemilihan soal atau transaksi Rust di UI.
F. Pemisahan platform hanya pada fungsi yang benar-benar bervariasi: bundled audio vs Piper desktop, microphone permissions/recording, file/path, lifecycle dan safe areas. Perintah Windows seperti explorer/Piper executable harus diinventaris. Jangan menyatakan Tauri Android siap tanpa verifikasi; bila merujuk kemampuan SDK, periksa dokumentasi resmi terkini.
G. Komponen UI bersama yang diperlukan: shell/rail/bottom nav, tombol/input, dialog/sheet, pembaca/penjelasan/catatan, feedback, hasil per tujuan, audio/record controls. Jangan membuat generic component dengan puluhan flag.
H. Token light/dark semantik, font lokal, typography, ikon, maskot/reaksi, kontras, target sentuh dan responsif. Perhatikan minWidth Windows saat ini, bukan CSS saja.
I. Strategi aset/bundle: pemuatan kode dan data per fitur bila layak, deduplikasi klip, cache yang dibatasi, pelepasan resource audio/object URL, codec yang diverifikasi pada target, manifest dan lisensi. Kompresi audio harus mempertahankan keterpahaman ucapan serta mekanisme potongan angka; jangan ubah format membabi buta.
J. Batas kebutuhan perubahan backend/SQLite. Catat bila frontend tidak bisa menjamin atomicity sendirian; gunakan transaksi yang sudah ada. Snapshot checkpoint terkini tidak otomatis menjadi riwayat percobaan lengkap atau jumlah lulus.
K. Strategi browser preview/QA dengan adapter data contoh terisolasi bila diperlukan; jangan menganggap Vite browser memiliki API Tauri atau mencampur mock dengan produksi.
L. Tahapan migrasi vertikal: shell -> satu perjalanan pelajaran lengkap -> domain lain -> Android/perangkat. Tiap tahap berisi acceptance criteria, risiko dan rollback non-destruktif.

## 6. Verifikasi dan hasil
Tidak perlu membangun ulang installer untuk tugas arsitektur ini. Jalankan pemeriksaan read-only dan tes terisolasi yang relevan bila ingin menyatakan baseline lulus. Catat perintah, exit code dan batas cakupannya. Jangan menyalin hasil lama sebagai hasil baru.
Periksa skrip yang tersedia; tidak ada npm test terpadu pada snapshot awal. Tes domain/seed/draft/audio/checkpoint yang ada menjadi regression gate rencana; build frontend tidak membuktikan audio, aksesibilitas, Android atau kualitas pedagogis.
Pisahkan: fakta inspeksi sekarang, hasil tes baru, hasil historis, rekomendasi, asumsi, belum diverifikasi.

Simpan deliverable:
- docs/architecture/lernen-klab-frontend-architecture.md — keputusan, diagram, tree, contracts, lifecycle/error/data ownership, opsi yang ditolak beserta alasan.
- docs/architecture/lernen-klab-feature-asset-map.md — inventaris terukur dan pemetaan semua fitur/aset.
- docs/architecture/lernen-klab-frontend-migration-plan.md — urutan implementasi, acceptance/regression gates, kebutuhan backend dan audit porting.
Jika nama sudah ada, baca dahulu lalu perbarui secara terarah atau versi baru tanpa menimpa kerja lain.

Selesai bila setiap fitur aktual punya tempat di target, setiap kebutuhan KLAB punya pemilik data/aksi/state gagal, aset punya keputusan, reuse dijelaskan spesifik, dan pembuat implementasi bisa memulai tanpa menebak hal penting. Jawaban akhir dalam bahasa Indonesia: rekomendasi inti, tautan dokumen, apa yang dapat dipakai ulang, apa yang perlu dibuat, risiko Android/ukuran/data, serta batas verifikasi. Jangan berhenti pada daftar pertanyaan atau saran generik.

