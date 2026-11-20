# Lernen

> **Mulai di sini untuk melanjutkan pengembangan:** baca [HANDOFF-LERNEN.md](HANDOFF-LERNEN.md) dan §0 [PRD v1.2](PRD-Aplikasi-Belajar-Bahasa-Jerman.md). Fokus berikutnya adalah mutu belajar mandiri A1; checklist di bawah terutama merupakan riwayat implementasi, bukan bukti kelengkapan atau validasi pedagogis terkini.

Aplikasi pribadi belajar bahasa Jerman (**A1 → A2**), desktop Windows, **offline-first**.
Spesifikasi utama: [PRD-DEU-001 v1.2](PRD-Aplikasi-Belajar-Bahasa-Jerman.md); salinan di folder induk mencerminkan pembaruan 17 November 2026.

## Status fase: M0–M3 + konten A1–B2

**M0 — scaffold**
- [x] Skeleton **Tauri 2 + React + TypeScript** (tema **Akademik Premium**: ivory + emas + serif, Tailwind v4)
- [x] Navigasi rail 7 layar (PRD §10): Hari Ini · Kurikulum · Drill · Kosakata · Membaca · Statistik · Pengaturan
- [x] **SQLite** via `tauri-plugin-sql` + migrasi v1: 12 tabel inti (PRD §9) + 5 indeks
- [x] Pipeline seed idempotent: `src/data/seed/words_unit1.json` (13 kata, kurikulum unit 1) → tabel `entries`; marker versi di `config`; manifest baseline v11 (`seed_v11_manifest.json`) menjaga hapusan/edit pengguna saat upgrade tanpa snapshot dan tetap memasang 120 kata/17 teks baru
- [x] Skrip generator konten: `scripts/generate_vocabulary.py` (CSV → JSON seed + validasi aturan PRD §6.4)
- [x] Verifikasi jalan penuh di Windows — `pnpm tauri dev`: jendela "Lernen — Belajar Bahasa Jerman" tampil (08-Nov-2026)
- [x] Build rilis Windows - executable, installer MSI, dan NSIS berhasil dibangun ulang (17-Nov-2026 15:11 WIB)

**M1 — SRS + drill D1–D5 + Hari Ini nyata**
- [x] Migrasi v2: `srs_state.state/last_review`, `attempts.item_key`, indeks drill
- [x] Backfill 4 kartu per entri (recog/produce/listen/cloze) → 52 kartu untuk 13 kata unit 1
- [x] **F1 SRS** (`ts-fsrs` 5.4.2): antrian harian ≤30 (baru ≤20, bisa diedit), prioritas due, review 4 tipe kartu, grade FSRS Lupa/Sulit/Baik/Mudah + pratinjau interval, kartu "Lupa" muncul lagi di sesi yang sama, `attempts` + `progress_daily` tersimpan
- [x] Editor tambah entri manual (≤2 menit untuk 10 kartu) + pengaturan beban harian
- [x] **F2 drill D1–D5**: item dari entri DB (D1 artikel, D2 plural, D3 konjugasi) + bank statis (D4 kasus, D5 Perfekt), timer 10 dtk (bisa dimatikan), feedback + penjelasan, Kartu Teori, ringkasan sesi + rekomendasi, item salah tercatat; 3× salah → daftar lemah diperkuat SRS; D1 salah 2× berurut → kartu masuk SRS
- [x] Verifikasi alur review & drill di jendela app — SRS (kartu 1 → `srs_state` due +10 mnt) dan drill D1 (`attempts` kind `drill`) terekam di DB, `progress_daily` tersinkron (`cards_done`/`drills_done`)
- [x] Penanganan voice: kartu listen memakai Piper atau klip audio bundle; voice Windows tidak digunakan, dan kartu tanpa klip dibatasi dari antrian

**M2a — F3 alur pelajaran + checkpoint**
- [x] Peta kurikulum A1 12 unit (`units_a1.json`): 12 unit A1 tersedia (36 pelajaran); unit 1–4 dari kurasi sebelumnya dan unit 5–12 materi orisinal beracuan tema Goethe, masing-masing 3 pelajaran + checkpoint
- [x] Alur pelajaran 5 langkah: recap → mini-lesson (slide + contoh + TTS) → thumb drill (mesin F2, attempt tercatat `kind='drill'`) → kosakata (kartu arti dari DB) → mini-review; progres disimpan ke `lesson_progress`
- [x] Checkpoint unit 15 item campuran D1–D5, ambang lulus 70%, state `done`/`failed` tersimpan; unlock unit berikutnya dihitung dari checkpoint unit sebelumnya
- [x] Verifikasi nyata: lesson 1–3 unit 1 selesai, checkpoint 15/15 (100%) tersimpan di DB, 22 attempt drill, `progress_daily.drills_done=22`

**M2a+ - irisan A1 berbasis tujuan (seluruh Unit 1–12)**
- [x] Inventaris 5 tujuan Unit 1 (`a1_objectives.json`) dengan prasyarat, bukti slide, cakupan, status review, dan saran remedial
- [x] Bank 25 soal transfer (5/tujuan) dengan umpan balik spesifik per pengecoh dan petunjuk untuk soal produksi
- [x] Checkpoint 15 soal (3/tujuan), lulus ≥70% dan ≥2/3 per tujuan; laporan hasil per tujuan
- [x] Remedial dari soal bank yang belum dipakai; percobaan ulang mengutamakan soal baru
- [x] Verifikasi QA: gagal 0/15 (5 tujuan 0/3, remedial 10 soal), remedial 10/10, ulangi 15/15 (100%, 5 tujuan 3/3); DB QA `lesson_progress(1,99)=done`
- [x] Unit 2 "Angka, waktu, harga": 5 tujuan (angka, harga, jam, hari/jadwal, `um/am/im`) + bank 25 soal; verifikasi QA gagal 0/15 → remedial 10/10 → ulangi 15/15 (100%, 5 tujuan 3/3); DB QA `lesson_progress(2,99)=done`, 40 attempt checkpoint `drill_code=NULL`
- [x] Unit 3 "Keluarga & hubungan": 5 tujuan (artikel keluarga, mein/meine, jumlah saudara, status pernikahan, possessiv + Akkusativ) + bank 25 soal; verifikasi QA gagal 0/15 → remedial 10/10 → ulangi 15/15 (100%, 5 tujuan 3/3); DB QA `lesson_progress(3,99)=done`, 40 attempt checkpoint `drill_code=NULL`
- [x] Unit 4 "Makanan & minuman": 5 tujuan (artikel makanan, rasa/lapar/haus, möchte + Akkusativ, interaksi restoran, waktu makan + essen/trinken) + bank 25 soal; tes struktur dan build lulus, smoke test runtime 1 sampel (`u4-o3-03`) benar; jalur gagal/remedial/retry belum dijalankan
- [x] Unit 5 "Belanja & harga": 5 tujuan (warna + kata sifat, ukuran/passen, Akkusativ setelah suchen/haben, anprobieren + Umkleidekabine, harga/bayar/umtauschen) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 6 "Rumah & tempat tinggal": 5 tujuan (artikel perabot, es gibt + Akkusativ, Wo? + Dativ, Wo? vs Wohin?, aufräumen/müssen) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 7 "Kota & petunjuk arah": 5 tujuan (tempat umum + artikel, letak relatif + Dativ, imperatif formal, zum/zur, transportasi mit + Dativ) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 8 "Pekerjaan & kegiatan harian": 5 tujuan (urutan kegiatan, anfangen pisah, tempat kerja/departemen, tugas + mit + Dativ, müssen/können + von … bis) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 9 "Kesehatan & tubuh": 5 tujuan (keluhan dengan haben, menanyakan kondisi + seit, janji dokter, gejala/pemeriksaan, saran obat dengan sollen) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 10 "Waktu luang & hobi": 5 tujuan (gern/lieber/am liebsten, hobi, ajakan, jadwal am/um, Verein + latihan) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 11 "Transportasi & perjalanan": 5 tujuan (nach/in + negara, Abfahrt/Ankunft, mitnehmen, Gleis/Verspätung, reservasi + informasi) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Unit 12 "Komunikasi & janji": 5 tujuan (mengundang + menyepakati waktu, menerima/menolak ajakan, percakapan telepon, anrufen + pesan, menulis/membalas pesan) + bank 25 soal; tes struktur dan build lulus; lulus checkpoint runtime 15/15
- [x] Seluruh 12 unit A1 kini memakai checkpoint berbasis tujuan; hasil per tujuan disimpan ke `config.objective_result:<unit>` dan tampil di Statistik
- [x] Uji runtime checkpoint Unit 4–12: masing-masing lulus penuh 15/15 (100%); jalur gagal/remedial penuh baru Unit 1–3
- [ ] Belum: uji runtime penuh Unit 4–12, peninjauan pengajar, uji pembelajar, dan penyimpanan hasil per tujuan

**M2b — F4 reader + TTS + kamus lokal + impor teks**
- [x] 67 teks seed A1/A2 (`texts_a1.json` dan berkas tambahan), termasuk 16 teks orisinal baru dengan terjemahan per kalimat; seed idempotent + dedupe (judul + level + tag) dan guard `initPromise` anti seed ganda
- [x] Reader per kalimat: toggle terjemahan, mode tanpa bantuan, TTS per kalimat (Piper lokal atau klip bundle), kecepatan 0,75–1× tersimpan di `config.tts_rate` (dipakai reader & Pengaturan)
- [x] Kamus kecil lokal: tokenizer + lookup lemma/umlaut (wohne → wohnen, Männer → Mann), popover kata, simpan ke SRS 4 kartu, kata tak dikenal bisa diberi arti manual
- [x] Impor teks sendiri (judul + level + paste), pemecahan kalimat otomatis, tersimpan ke SQLite; terverifikasi 540 ms (<5 dtk)
- [x] Progres baca dari `reading_log` (jumlah baca, waktu terakhir, kata disimpan) — bukan angka dummy
- [x] Verifikasi nyata: "wohne" tersimpan sebagai lemma "wohnen" (`reading_log.words_saved=1`), kata "Budi" + arti manual membuat entri/kartu baru, toggle terjemahan & mode tanpa bantuan bekerja, `tts_rate` persist
- [x] Piper lokal terpasang dan sintesis WAV offline terverifikasi langsung; voice Windows dihapus dari jalur pemutaran; Piper dan klip bundle menjadi sumber audio

**M2c — F2 lanjutan: drill D6–D10**
- [x] Bank item D6–D10: susun kalimat (12), Präteritum (18), angka & jam dari suara (14), preposisi (14), modal verbs (16)
- [x] Mode `order` (tap kata, verb posisi 2 / anak kalimat verb akhir), timer dinonaktifkan untuk mode ini; `say` untuk D8 (TTS otomatis + tombol ulang)
- [x] Katalog 10 drill aktif; D8 tetap tersedia lewat audio bundle angka/jam bila Piper tidak aktif
- [x] `MiniDrill` (pelajaran/checkpoint) ikut mendukung mode `order` dan tombol dengar
- [x] Verifikasi nyata: D6/D7/D9/D10 dijawab benar lewat UI; D8 kini tersedia dengan audio bundle dan jawaban tetap tercatat per `drill_code`

**P4a — latihan mendengar & menulis A1**
- [x] Halaman "Latihan" (nav 06) dengan tab Mendengar dan Menulis
- [x] 5 dialog pendek A1 + 10 pertanyaan pemahaman, transkrip yang bisa dibuka, TTS per baris dan putar seluruh dialog
- [x] 5 tugas menulis terpandu: unsur wajib, contoh jawaban, daftar periksa mandiri; draft disimpan di `localStorage`
- [x] Tulisan bebas tidak diberi skor otomatis; UI menyatakan batas dan meminta penilaian mandiri
- [x] Verifikasi: `node scripts/test_a1_practice.cjs` lulus, `pnpm build` lulus, smoke test 1 sampel pertanyaan "Kopi dan air" + tab Menulis tampil
- [ ] Belum: peninjauan pengajar, uji pembelajar, variasi dialog/tugas lebih luas, dan asesmen bicara (P5)

**P5a — percakapan bercabang A1**
- [x] Tab Percakapan di halaman Latihan: 4 skenario (kafe, jalan ke stasiun, dokter, toko pakaian), 30 node, 39 opsi bercabang
- [x] Umpan balik per pilihan, transkrip percakapan, TTS per baris, ringkasan saat skenario selesai, dan tombol ulangi
- [x] Tidak ada perekaman/pengenalan suara/penilaian ucapan otomatis; UI menyarankan mengucapkan jawaban dengan suara keras
- [x] Verifikasi: `node scripts/test_a1_conversation.cjs` lulus (tanpa siklus, semua node terjangkau), `pnpm build` lulus, smoke test 1 sampel pilihan "Ich möchte einen Kaffee, bitte."
- [ ] Belum: peninjauan pengajar, uji pembelajar, asesmen pelafalan, dan skenario lebih luas

**F8a — uji tiruan A1**
- [x] Halaman "Uji A1" (nav 07): Hören, Lesen, Schreiben, Sprechen dengan timer per bagian
- [x] 5 pertanyaan Hören, 5 teks Lesen, 1 tugas Schreiben, 3 prompt Sprechen; Hören/Lesen dinilai objektif, Schreiben/Sprechen rubrik mandiri
- [x] Pembahasan Hören/Lesen + contoh Schreiben/Sprechen setelah selesai; hasil terakhir disimpan di `config` dan tampil di Statistik
- [x] Verifikasi: `node scripts/test_a1_mock_exam.cjs` lulus, `pnpm build` lulus, smoke test runtime 1 jawaban Hören → hasil 1/5 Hören, 0/5 Lesen, 0/5 Schreiben, 0/12 Sprechen; `config.mock_a1_last_result` tersimpan
- [ ] Belum: bukan ujian resmi/sertifikasi, timer bukan pengawasan ujian, belum ditinjau pengajar/diuji pembelajar

**M3a — F5 Statistik nyata (dashboard & streak)**
- [x] Modul `src/stats/` (`queries.ts`, `dates.ts`): agregasi dari `attempts`, `srs_state`, `lesson_progress`, `reading_log` — nol angka dummy
- [x] Streak berjalan + rekor, heatmap 12 minggu (Senin–Minggu), ringkasan harian (kartu, drill, menit, akurasi 7 hari), target harian dari `config.daily_goal_min`
- [x] Forecast SRS 7 hari (bucket per hari lokal) + kartu lewat jatuh tempo + komposisi kartu baru/belajar/review/matang (stability ≥ 21 hari)
- [x] Mastery kurikulum per unit (pelajaran selesai + skor checkpoint) dan **kesiapan Goethe A1** per skill (Hören/Lesen/Schreiben/Sprechen) dengan formula yang dinyatakan terbuka + jumlah sampel
- [x] Top-5 kelemahan drill dengan tombol **“Latih →”** yang langsung membuka drill terkait (navigasi lewat `stores/nav.ts`)
- [x] Zero state hari pertama: panduan 3 langkah, bukan panel kosong
- [x] Verifikasi nyata lewat UI: streak 1 hari, 29 jawaban (akurasi 83%), heatmap, forecast 1 kartu, kelemahan D1 — semuanya cocok dengan isi DB

**M3b — F6 backup/restore JSON + rotasi**
- [x] Perintah Rust `backup_write/list/read/dir_path/open_folder`: tulis ke `Dokumen\Lernen Backups`, fallback otomatis ke folder data aplikasi bila Dokumen tidak bisa ditulis (mesin ini → `%APPDATA%\app.lernen.desktop\Backups`)
- [x] Export JSON seluruh 13 tabel (format `lernen-backup` v1; `lesson_drafts` opsional untuk backup lama) dengan verifikasi nama file (anti path traversal) dan penulisan atomic: file sementara → `fsync` → rename
- [x] Auto backup mingguan saat aplikasi dibuka (`config.backup_last_auto`), rotasi 4 backup `auto` terakhir
- [x] Restore dua langkah: panel **verifikasi** (tanggal, total baris, hitungan per tabel) → konfirmasi → backup `pre-restore` otomatis → hapus & isi ulang semua tabel
- [x] Verifikasi roundtrip end-to-end: export 108 baris → restore 108 baris, hitungan 12 tabel identik sebelum/sesudah; restore lewat UI juga diuji (pesan sukses + backup pra-restore terbentuk)
- [x] Tombol **“Buka folder”** (Explorer) dan daftar file backup (jenis, waktu, ukuran) di Pengaturan
- [x] Pilihan folder backup sendiri tersedia di Pengaturan; notifikasi Windows tetap opsional dan belum dibuat

**M3c — polish: impor kosakata, pengaman database, Hari Ini nyata**
- [x] **Impor CSV/JSON** di Kosakata (`src/data/importWords.ts`): pemisah `|` / tab / `;` / koma, header dikenali otomatis, `die Lampe` di kolom kata dipecah jadi artikel+kata, validasi artikel/arti, duplikat terhadap file & DB dilewati dengan alasan
- [x] Pratinjau impor (6 baris pertama + jumlah siap/dilewati) dan hasil “N kata diimpor · M kartu SRS dibuat”; teruji 4 kata → 16 kartu, kata duplikat ditolak (data uji kemudian dibersihkan)
- [x] **Layar darurat** `FatalDatabase`: `PRAGMA integrity_check` dijalankan sebelum UI menyentuh data; bila DB gagal dibuka/rusak → penjelasan, tombol pulihkan backup terbaru (mencoba mundur ke backup valid berikutnya bila kandidat terbaru rusak), buka folder, muat ulang (tidak pernah menimpa data diam-diam)
- [x] **Hari Ini dihitung penuh**: rekomendasi drill dari rasio salah nyata (`3/10 salah — latih lagi`), status unit/pelajaran/checkpoint, jumlah teks belum dibaca, tombol aksi langsung (mulai review, mulai D1, kurikulum, perpustakaan)
- [x] **Editor kartu (F6)**: ubah & hapus entri dari tabel, konfirmasi dua langkah, dan pratinjau 4 tipe kartu (Kenali · Produksi · Dengar→tulis · Cloze) sebelum menyimpan

**Kosakata — pencarian, filter, bantuan baca**
- [x] **Pencarian langsung** di halaman Kosakata: mengetik di mana saja langsung mengisi kolom cari (tanpa klik), tombol `/` untuk fokus, tombol ✕ untuk menghapus
- [x] **Filter level** (A1/A2/B1/B2/Wortschatz/Manual) dengan hitungan per level + **filter jenis** (benda/kerja/sifat/lainnya)
- [x] **Urutan**: A–Z Jerman, A–Z arti, terbaru, atau per level; hasil menampilkan “X dari Y kata” dan tombol “Tampilkan 100 lagi” (render bertahap untuk 2.000+ entri)
- [x] **Bantuan cara baca & pemenggalan (Bahasa Indonesia)**: setiap kata menampilkan suku kata (`Woh-nung`, `Mög-lich-keit`) dan pelafalan ejaan Indonesia (`wonung`, `möglikhkait`); panel bantuan menjelaskan `w`, `v`, `z`, `sch`, `ch`, `ei/ie/eu`, `ä/ö/ü`, `ß`, `h` diam, dan akhiran `-er`
- [x] Heuristik pemenggalan/pelafalan ada di `src/data/pronunciation.ts` (bukan kamus; audio Piper/bundle menjadi acuan pelafalan)

**TTS — Piper dan klip offline**
- [x] Voice Windows dan pemilihnya dihapus dari pengaturan dan pemutaran; tidak ada fallback `speechSynthesis`
- [x] Tombol uji menampilkan hasil sintesis atau pesan kegagalan; sintesis dibatasi waktu tunggu 8 detik
- [x] Piper dipakai untuk teks bebas, klip bundle untuk konten yang tersedia; tidak ada voice Windows
**TTS neural offline (Piper, opsional)**
- [x] Pengaturan → **Suara neural offline (Piper)**: unduh mesin (±21 MB) + voice Jerman sekali (Eva K ±18 MB / Kerstin ±20 MB / Thorsten ±63 MB), lalu 100% offline
- [x] Perintah Rust `piper_status`, `piper_install_engine`, `piper_download_voice`, `piper_speak`; Piper dijalankan sebagai proses persisten lokal, WAV hasil sintesis dikirim ke frontend (base64) dan diputar lewat Web Audio; pemanggilan Rust berjalan di worker agar UI tidak membeku
- [x] Bila Piper aktif dan siap, tombol 🔊 memakai Piper; jika sintesis gagal, aplikasi mencoba klip bundle yang cocok; tidak ada fallback voice Windows
- [x] Preferensi `piper_enabled` dan `piper_voice` disimpan di tabel `config`; mesin/voice disimpan di folder data aplikasi (`.../piper`)
- [x] **Fallback audio offline**: angka 1-100 (satu trek bersegmen), 178 kata A1, 122 contoh kalimat A1, 100 kalimat bacaan A1, 21 baris dialog P4, 12 kosakata unit 1, delapan frasa jam D8, sapaan, dan dua contoh suara; disintesis lokal dengan Eva K

**Konten A1–B2 — 4 level, seed v11**
- [x] **2.134 kata · 7.323 kartu SRS · 67 teks** — A1 221 · A2 731 · B1 643 · B2 539 (seed v12; kata baru masuk setelah aplikasi dibuka ulang)
- [x] **30 unit A2–B2 × 2 pelajaran** (60 pelajaran) dengan slide tata bahasa, contoh, thumb drill, dan kata kunci per pelajaran
- [x] Level A2: Wohnen · Arbeit · Einkaufen · Gesundheit · Reisen · Verkehr · Freizeit · Medien · Feste · Umwelt
- [x] Level B1: Nachbarschaft · Lebensstil · Karriere · Meinung · Klima · Kultur · Gesellschaft · Bildung · Finanzen · Technik
- [x] Level B2: Arbeitswandel · Politik · Wissenschaft · Wirtschaft · Klimapolitik · Desinformation · Identität · Medizin · Recht · Ethik
- [x] **Dek Wortschatz** tambahan per level (tanpa contoh kalimat → 3 kartu: kenali/produksi/dengar) untuk memperluas cakupan kata
- [x] **Generator konten** `scripts/generate_levels.py` + definisi ringkas `scripts/konten/{a2,b1,b2}.json` → unit, seeded kata, teks, dan dek Wortschatz (deterministik, duplikat otomatis dilewati)
- [x] Kurikulum multi-level (tab A1/A2/B1/B2), progres per level, pembukaan unit per-level lewat checkpoint
- [x] Statistik menampilkan mastery per level; rekomendasi pelajaran di Hari Ini melintasi level
- [x] Drill diperkuat: **D6** 18 item susun kalimat, **D9** 20 item preposisi (termasuk pola `in die Schweiz`, `aus`, `zum`)
- [ ] Belum (opsional): notifikasi Windows, mode gelap, perluasan kata per unit A2–B2 melebihi 12 kata/unit


## Perintah

```powershell
pnpm install
pnpm tauri dev        # mode pengembangan: window asli + hot reload
pnpm tauri build      # installer Windows (MSI + NSIS) di src-tauri/target/release/bundle
pnpm build            # hanya frontend (tsc + vite)
node scripts/test_a1_objectives.cjs   # validasi inventaris/checkpoint/remedial seluruh A1 Unit 1–12
node scripts/test_a1_practice.cjs     # validasi data dialog mendengar + tugas menulis A1
node scripts/test_a1_audio.cjs        # validasi audio offline kata/contoh A1
node scripts/test_a1_conversation.cjs # validasi skenario percakapan bercabang A1
node scripts/test_a1_mock_exam.cjs    # validasi data uji tiruan A1
```

## Rilis Windows

Build terbaru: **17 November 2026, 15:10–15:11 WIB**. Paket bukti Windows ada di [`outputs/audit-windows-2026-11-17`](outputs/audit-windows-2026-11-17/README.md).

- **Installer MSI:** `src-tauri/target/release/bundle/msi/Lernen_0.1.0_x64_en-US.msi` (29,18 MiB)
- **Installer NSIS (per-user):** `src-tauri/target/release/bundle/nsis/Lernen_0.1.0_x64-setup.exe` (28,40 MiB)
- **Portable:** `src-tauri/target/release/lernen-app.exe` (butuh WebView2, sudah ada di Windows 10/11)

Build ini mencakup seluruh A1 berbasis tujuan, halaman Latihan (P4/P5), Uji A1 (F8), dan audio offline A1. Installer **belum** dipasang/diuji sebagai instalasi bersih di mesin lain; MSI baru diuji ekstraksi administratif.

Build release pertama memakan ±9 menit (kompilasi Tauri/sqlx); build berikutnya ±4 menit.

## Struktur (PRD §8)

```
src/ui/        komponen & halaman (rail navigasi, sesi review, drill)
src/srs/       wrapper ts-fsrs, antrian harian, sesi review, TTS
src/drills/    engine D1–D10 + bank item
src/lessons/   loader unit/pelajaran + checkpoint
src/reading/   reader F4: teks, kamus lokal, impor, log baca
src/stats/     agregasi dashboard F5 (queries, utilitas tanggal lokal)
src/data/      seed JSON konten + bank drill statis + teks seed
src/stores/    koneksi DB singleton, backup F6, navigasi antar-layar
src-tauri/     Rust core: sqlite, fs, notification, perintah backup
scripts/       generator konten (Goethe/Studio d → JSON seed; materi orisinal A1 unit 5–12)
```

## Catatan

- **Rust sudah terpasang** (rustup 1.29, stable-msvc, rustc 1.99.1) — jika `cargo` tak terbaca di terminal baru, pastikan `%USERPROFILE%\.cargo\bin` ada di PATH.
- Unduh crates pertama `cargo check` pertama memakan waktu (Tauri + sqlx); build berikutnya memakai cache `src-tauri/target`.
- Data belajar tersimpan di database SQLite aplikasi (bukan file seed) — seed hanya konten; backup/restore JSON ada di **Pengaturan → Backup & Restore** (M3b).
- Backup otomatis dibuat seminggu sekali saat aplikasi dibuka; di mesin ini folder tulis jatuh ke `%APPDATA%\app.lernen.desktop\Backups` karena folder Dokumen tidak dapat ditulis — path aktual selalu tampil di Pengaturan.
- [x] BACKEND-20261117-02: backup export 13 tabel lewat satu read-transaction Rust; checkpoint/remedial memakai sessionRepository (revision/sessionId) + draftKey; seed parity 81 hash/2134 field-exact/67 teks/42-96.
