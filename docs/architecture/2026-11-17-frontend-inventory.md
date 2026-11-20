# Snapshot frontend dan aset Lernen
Pemeriksaan langsung workspace, 17 November 2026. Ini inventaris untuk prompt arsitektur, bukan audit penuh atau bukti runtime. Tidak menjalankan ulang build/tes pada pemeriksaan ini.

## Fakta terkini
- package.json: React 19.1, TypeScript ~6.0.3, Vite ^8.0.16, Tailwind ^4.3.5, Zustand ^5.1, ts-fsrs ^5.4.2, Tauri 2 / plugin-sql. Ini spesifikasi dependensi; versi resolved harus dicek lockfile.
- src/ui/pages/index.ts mendaftarkan 9 layar: HariIni, Kurikulum, Drill, Kosakata, Membaca, Latihan, UjiTiruan, Statistik, Pengaturan.
- Layout.tsx masih rail tetap w-60 dengan konten px-10. App.css masih warna parchment/emas dan heading serif; color-scheme light.
- Navigasi src/stores/nav.ts berupa state page:string dan pendingDrill. Bukan router/history lengkap.
- A1 inventory: 60 tujuan, unit 1–12, total 300 soal dari 12 bank JSON.
- src/data/practice: 5 dialog listening, 5 tugas writing, 4 skenario percakapan, 4 bagian uji tiruan. Latihan.tsx menghubungkan listening/writing/percakapan; UjiTiruan.tsx tersedia. Keberadaan kode tidak membuktikan mutu bahasa atau runtime.
- persistence.ts sudah menyimpan draft ke SQLite lesson_drafts dan memigrasikan localStorage. checkpointStore.ts memanggil save_checkpoint_result untuk snapshot per tujuan/best_score/ever_passed.
- Rust memuat transaksi save_attempt_with_draft, save_checkpoint_result, serta unique index session_id/item_key. attempts.ts menggunakan perintah atomik bila draft diberikan. Karena itu catatan desain lama mengenai draft hanya localStorage sudah tertinggal untuk jalur pelajaran; draft writing di Latihan.tsx masih localStorage.
- Snapshot per tujuan disimpan pada config.objective_result:<unit>; jangan menyebutnya ledger lengkap semua percobaan tanpa menelusuri implementasi.
- Pencarian src tidak menemukan MediaRecorder/getUserMedia, fitur XP/lencana atau panel Catatan saya pada kode UI yang diperiksa. Catatan/sorotan/rekaman/gamifikasi memerlukan penelusuran lagi sebelum dianggap pasti belum ada.
- Desain KLAB dan detail layar ada di outputs sebagai JPG, bukan aset UI produksi terpisah.
- Repo memiliki banyak perubahan tracked/untracked; tidak boleh dianggap baseline Git bersih.

## Ukuran dan manifest aset
- Seluruh src/assets: 455 WAV sekitar 35.05 MiB, 1 manifest JSON sekitar 0.04 MiB, 1 react.svg.
- Root src/assets/tts_core: 454 WAV sekitar 35.02 MiB. Satu WAV lain ada di subfolder generated; jangan menyamakan seluruh folder sumber dengan bundle.
- manifest.json memiliki 453 entri phrases yang menunjuk 453 nama file unik; semua referensi file tersebut ditemukan.
- numbers_1_100.wav sekitar 5.37 MiB, memakai manifest segmen angka. Jangan mengonversi lossy tanpa memvalidasi offset/ketepatan segmentasi.
- tts.ts memakai import.meta.glob eager '?url' pada WAV root, bukan recursive. URL import tidak sama dengan decode seluruh audio.
- tts.ts memiliki bundledBuffers Map, cache Piper dan mekanisme audio; telaah retensi RAM ketika merancang Android.
- Piper dipanggil melalui Rust; perintah platform Windows seperti explorer ditemukan. Kompatibilitas Android belum diuji.
- public berisi vite.svg dan tauri.svg pada pemeriksaan. Belum ditemukan maskot KLAB, font custom lokal, ikon produksi KLAB atau soundboard meme dalam inventaris src/assets/public.
- Ukuran di atas bukan APK/AAB, ukuran unduh, atau ruang terpasang. Tidak melakukan transcode/menghapus aset.

## Tes tersedia
scripts/test_a1_objectives.cjs, test_a1_option_order.cjs, test_a1_practice.cjs, test_a1_conversation.cjs, test_a1_mock_exam.cjs, test_a1_audio.cjs, test_audio_lookup.cjs, test_checkpoint_result.cjs, test_draft_migration.cjs, test_drill_session.cjs, test_lesson_practice.cjs, test_lesson_resume.cjs, test_seed_sync.cjs, test_seed_upgrade.cjs, test_study_clock.cjs; tes Rust di src-tauri/src/lib.rs.
Tidak menjalankan skrip tersebut pada tugas menyiapkan prompt ini. Bukti lama di handoff perlu dipisahkan dari pemeriksaan terbaru.

## Implikasi untuk arsitektur
Pakai ulang domain yang ada dan verifikasi regresi. Pemetaan empat tujuan navigasi harus mencakup Latihan dan Uji A1 yang telah ditambahkan sejak konsep desain awal. Jangan membangun percakapan dari nol atau mengembalikan sesi ke penyimpanan dua langkah yang lebih lemah. Pisahkan asset-preparation, rendering UI, pengelolaan data dan perbedaan platform secara proporsional. Perbarui asumsi terhadap kode aktual bila aktivitas pengembangan lain mengubah workspace.

