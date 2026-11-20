# Usulan Perbaikan dari Hasil Pengujian Agent Test & 2 Agent Murid

**Tanggal:** 19 November 2026 (WIB)
**Ditujukan kepada:** Agent Asisten Director — selanjutnya yang menerbitkan perintah ke agent di bawahnya
**Disusun oleh:** Agent Utama (orkestrator), sesi `ses_e0c636994ffejfdkGOfzzgKZxt`
**Status:** USULAN — bukan perintah, bukan klaim kelulusan produk

## Sumber bukti

| Sumber | Laporan | Jenis |
|---|---|---|
| Agent test (`ses_e0c6c5de…`) | Penilaian akhir di sesi + log `human-test-*.mjs`, screenshot di `%TEMP%\opencode\shot-*.png` | Uji fungsional manusiawi pada EXE `outputs/penyelesaian-windows/final-candidate/lernen-app-qa.exe` |
| Murid 1 (`ses_e0c65d0e1…`) | `outputs/murid-p01-2026-11-19/LAPORAN-MURID-P01.md` + `murid-p01-comprehension.json` + 7 screenshot | Keterpahaman materi A1 U4 L2, EXE pilot `67d958e5…` |
| Murid 2 (`ses_e0c655f10…`) | `outputs/pilot-pembelajar/penilaian-murid-agent2.md` + `pilot_*.png`, `pilot_drive*.mjs` | Uji kegunaan eksploratori, EXE `31ca7aaf…` |

> **Batas penting:** ketiga pelaku adalah agen simulasi, bukan pembelajar manusia. Temuan Ini adalah indikasi untuk diprioritaskan, **bukan** bukti efektivitas belajar, bukan telaah pengajar, dan bukan hasil pilot formal N=3–5. Tanda **[P]** = eksekusi nyata, **[T]** = inspeksi kode/dokumen.

---

## 1. Ringkasan eksekutif

| Tingkat | Jumlah | Inti masalah |
|---|---|---|
| **P0 — blocker** | 1 | Review SRS tidak bisa disimpan: migrasi v4 tidak terdaftar di jalur aplikasi normal. Fungsi inti belajar rusak. |
| **P0 — major** | 1 | tema gelap membuat teks kartu tak terbaca (default saat sistem dark mode). |
| **P1** | 4 | Backup first-run gagal + pesan error mentah; tombol "Buat catatan" dead-end; Today page tidak konsisten. |
| **P2** | 8 | Awalan `similar-` tumbuh tanpa batas; prompt soal "sejenis" tidak cocok dengan opsi; navigasi dari dalam pelajaran; Statistik miskin; 5 temuan keterpahaman materi P01. |
| **P3** | 3 | Sorotan slide tidak jalan; transfer bank belum mencakup U4 L2; dokumen pilot usang. |
| **Eksternal** | 4 | Pilot manusia, host Windows bersih, pengamat Narrator/NVDA, persetujuan seni — tidak boleh dikarang. |

**Kesimpulan jujur agent test:** aplikasi **belum layak dipakai untuk belajar** sampai U-01 selesai. Ini bukan kegagalan total: navigasi utama merender benar dan `console.error = 0`.

**Yang sudah baik dan harus dipertahankan:** umpan balik dengan penjelasan tata bahasa, tombol `Mengapa einen?` / `Lihat contoh dari materi` / `Dengarkan` / `Perbaiki jawaban`, progres tersimpan setelah restart, disclaimer angka bukan penilaian kemampuan, pengaturan tema/ukuran teks/gerakan, dan path backup yang transparan.

---

## 2. Daftar usulan perbaikan

Prioritas: **P0** = segera, **P1** = sebelum rilis berikutnya, **P2** = penting untuk kegunaan, **P3** = peningkatan.

### 2.1 Fungsi inti & kepercayaan pengguna

| ID | Prio | Dampak bagi pengguna | Akar / lokasi | Bukti | Pemilik usulan | Kriteria terima |
|---|---|---|---|---|---|---|
| **U-01** | P0 | Menilai kartu (Lupa/Sulit/Baik/Mudah) gagal disimpan; kartu tetap 1/24, progres hilang | `src-tauri/src/lib.rs:1347-1370` — `run()` hanya mendaftarkan migrasi 1-3; `MIGRATION_V4` (`ALTER TABLE attempts ADD COLUMN grade`, baris 151-157) hanya dipakai di `recover_backup_to_path`/test, tidak di jalur normal. `save_review_atomic` menulis `grade` di baris 453 | **[P]** banner `table attempts has no column named grade`; fresh DB pun error; test T2 | **1a** (Rust/migrasi), lalu **3a** rebuild | `run()` mendaftarkan v4; pada DB kosong, klik "Lupa" tersimpan, kartu maju, attempt ber-`grade`; `cargo test` hijau; 3a verifikasi UI |
| **U-02** | P0 | Tema gelap (default dark mode) membuat kata kartu, terjemahan, label nilai, sapaan, dan tombol putih di atas kartu krem nyaris tak terbaca | `src/App.tsx:27-29` `prefers-color-scheme`; tidak ada pemisahan warna teks/kartu mengikuti tema (test T3). Juga murid 2 P1: banner "Siapkan audio" teks terang di latar krem | **[P]** `shot-01..03` vs `shot-04-theme.png`; terukur `Guten Abend!` = `rgb(245,247,251)` di atas krem | **4a** (presentasi), **3a** QA visual | teks dan latar memakai token tema yang sama; kontras terbaca di dark & light; 3a verifikasi dua tema |
| **U-03** | P1 | Banner merah "Backup otomatis gagal … (os error 2)" muncul saat first-run; pengguna mengira data rusak dan tidak mendapat backup pertama | `src-tauri/src/lib.rs:318-319` `write_backup_atomic` | **[P]** test P3 (fresh profile, seed selesai) + murid 2 P2 | **1a**, lalu **3a** verifikasi | first-run pada profil kosong membuat backup tanpa banner error; pesan ramah bila memang gagal |
| **U-04** | P1 | Pesan error teknis mentah menakutkan pemula | Penerjemahan pesan backup gagal | **[P]** murid 2 P2 | **4a** (teks UI) + **1a** (kode error) | pesan berbahasa Indonesia, menjelaskan tindakan yang bisa dilakukan, menyembunyikan detail `os error 2` dari tampilan utama |
| **U-05** | P1 | Tombol "Buat catatan" tidak berfungsi saat catatan masih kosong → tidak bisa membuat catatan pertama | `src/app/routeView.tsx:280` `onNew` hanya mengosongkan `selectedId`/`draft`; `src/klab/pages/NotesPage.tsx:43` render editor hanya jika `notes.length > 0`; `EmptyState` memanggil `onNew` yang tidak mengubah `notes` (test T1) | **[P]** test P4, klik=true tetapi `INPUTS []` | **1a** + **4a**, **3a** QA | dari keadaan tanpa catatan, klik "Buat catatan" langsung menampilkan editor dan catatan bisa disimpan |
| **U-06** | P2 | Panel "Progres tersimpan" membengkak jadi dinding teks; awalan `similar-` bertambah tiap klik "Coba soal sejenis" | Kunci progres pada lapisan pembelajaran/penyimpanan | **[P]** murid 2 P3: `similar-similar-…-lp-u4-l2-01` | **2a** (logika) + **1a** (kunci penyimpanan) | kunci soal sejenis stabil/idempoten; panel menampilkan ringkasan ringkas, bukan daftar tak terbatas |
| **U-07** | P2 | Prompt "Pilih contoh kalimat lain untuk tujuan yang sama" tidak cocok dengan sub-teks "Pilih artikel Akkusativ untuk Saft" dan opsinya; feedback mengandung `jus..` | Pembangkit soal sejenis | **[P]** murid 2 P4 | **2a** | prompt, sub-teks, opsi, dan feedback konsisten; tidak ada tanda baca ganda |
| **U-08** | P2 | Dari tengah latihan, tombol nav "Jelajah" tidak berpindah halaman; setelah "Selesai" pun tampilan latihan bertahan | Rute/state lesson (perlu dipastikan apakah modal disengaja) | **[P]** murid 2 P5 | **1a** + **2a** | navigasi keluar dari pelajaran bekerja atau ada tombol keluar yang jelas; state tidak mengunci |
| **U-09** | P2 | Statistik hanya menampilkan `7329 Kartu diulang` dan `0 Pelajaran selesai` plus disclaimer; tidak ada progres per unit/langkah lanjut | `src/stats/queries.ts` + tampilan Statistik | **[P]** murid 2 P6 | **1a** (query) + **4a** (tampilan) | ada ringkasan yang bisa ditindaklanjuti (progres per unit/aktivitas terbaru) tanpa mengklaim penilaian kemampuan |
| **U-17** | P2 | Tampilan "Hari Ini" berubah-ubah antar sesi (varian agenda SRS vs varian BELAJAR MANDIRI); tombol "Mulai D1" hanya di salah satu | `src/App.tsx:60-62`, `routeView.tsx:392-402`, `TodayPage.tsx:39/64` (test T4) | **[P]** test P5 | **1a** + **4a** | perilaku disengaja dan terdokumentasi, atau disatukan; tidak ada tombol inti yang hilang antar sesi |

### 2.2 Mutu materi & keterpahaman (paket P01, pemilik **2a** kecuali ditentukan)

| ID | Prio | Dampak bagi pengguna | Akar / lokasi | Bukti | Kriteria terima |
|---|---|---|---|---|---|
| **U-10** | P2 | Satu kata dua nama dalam satu panel: soal memakai `Apfelsaft`, penjelasan `der Apfelsaft → einen Apfelsaft` **dan** `der Saft menjadi einen Apfelsaft` | `LessonFlow.tsx:404-405`; `a1_lesson_practice.json:85` | **[P]** P01 P-1 | satu nama konsisten di soal dan penjelasan |
| **U-11** | P2 | Istilah `Akkusativ`, `objek`, `Nominativ`, `Dativ` dipakai tanpa definisi | `units_a1.json:624`; `a1_lesson_practice.json:77,83,85`; `a1_unit4_bank.json:19` (T-2) | **[P]** P01 P-2 | satu baris definisi sederhana di slide 2, mis. "Akkusatif = bentuk kata benda setelah kata kerja tertentu seperti möchte" |
| **U-12** | P2 | Terjemahan tidak konsisten: sebagian kalimat diterjemahkan, sebagian tidak, tanpa keterangan | `units_a1.json:632-633,664` | **[P]** P01 P-3 | semua contoh diterjemahkan ATAU diberi label "coba tanpa bantuan" |
| **U-13** | P2 | Ringkasan memakai `den/die`, soal memakai `einen/eine`, tanpa jembatan penjelas | `units_a1.json:625`, `a1_lesson_practice.json:78` | **[P]** P01 P-4 | satu kalimat penjelas bentuk tak tentu `einen` vs bentuk tertentu `den` |
| **U-14** | P3 | Sorotan slide tidak tampil kecuali pada pola `Ich möchte`/`einen Kaffee` | `src/klab/learning/logic.ts:191-196` vs `LessonFlow.tsx:300-302` (T-3, belum GUI) | **[T]** | sorotan mengikuti hasil `logic.ts`; diverifikasi GUI pada slide lain |
| **U-15** | P3 | "Coba soal sejenis" tidak tersedia untuk U4 L2; `transferBank.json` hanya memuat U4 L1 | T-5 (inspeksi) | **[T]** | cakupan transfer diperluas ke U4 L2 atau diberi label jujur bahwa belum tersedia |
| **U-16** | P3 | Kartu beranda "Coba alur koreksi" langsung membuka latihan dengan skor 0%, sebelum materi dibaca | `steps.open` di laporan P01 | **[P]** P01 P-5 | kartu membuka slide materi dulu, atau diberi label "latihan tanpa membaca materi" |

### 2.3 Dokumentasi, QA, dan prasyarat eksternal

| ID | Prio | Masalah | Pemilik usulan | Kriteria |
|---|---|---|---|---|
| **U-18** | P2 | Protokol pilot lama meminta "Kurikulum > A1 > Unit 1", "Latihan", "Uji A1", "Statistik", padahal UI KLAB hanya punya "Hari Ini · Jelajah · Catatan · Profil" (murid 2 T1) | **3c** | dokumen pilot diperbarui sesuai navigasi KLAB; pelaksana tidak tersesat |
| **U-19** | P3 | EXE QA panic `WebView2 error 0x8007139F` bila user-data folder bentrok; perlu `WEBVIEW2_USER_DATA_FOLDER` unik (murid 2 P7) | **3a** | prosedur/env QA didokumentasikan; bukan bug produk; jangan membunuh proses WebView2 milik agen lain |
| **U-20** | Eksternal | Pilot manusia G01+P01–P03, host Windows bersih, pengamat Narrator/NVDA, persetujuan seni | **Asisten Director → User** | tetap **PENDING**; tidak boleh diubah menjadi LULUS oleh agen |

---

## 3. Paket perintah siap pakai untuk Asisten Director

Berikut blok yang bisa disalin langsung ke `outputs/koordinasi-opencode/tugas/<kode>.md`.

### Untuk agent 1a — integrasi/data/Rust
> **MANDAT: FIX-CORE-20261119 (P0).** Kerjakan U-01 lebih dulu: daftarkan `MIGRATION_V4` ke `run()` di `src-tauri/src/lib.rs` (baris ~1347-1370), pastikan jalur normal menjalankan `ALTER TABLE attempts ADD COLUMN grade`. Uji pada DB kosong: review "Lupa" tersimpan, kartu maju, `cargo test --locked --offline` hijau. Setelah U-01, kerjakan U-03 (backup first-run), U-05 bersama 4a (routeView `onNew`), U-06 kunci `similar-` bersama 2a, U-08 navigasi bersama 2a, U-09 query Statistik, U-17 konsistensi Today page. Klaim file di status sendiri; jangan reset/clean/commit/push; jangan pakai profil produksi. Laporkan hash, exit code, dan bukti UI menunggu 3a.

### Untuk agent 2a — pembelajaran/konten
> **MANDAT: FIX-LEARNING-20261119 (P1/P2).** Kerjakan paket mutu materi U-10 sampai U-15 dan U-06/U-07/U-08 bersama 1a. Fokus: konsistensi `Apfelsaft`/`Saft`, definisi istilah tata bahasa, terjemahan konsisten, jembatan `einen` vs `den`, sorotan slide, transfer bank U4 L2, dan soal "sejenis" yang prompt/opsi/feedback-nya cocok. Jangan klaim telaah pengajar; status mutu tetap `not-reviewed`. tsc 0, tes hijau, bukti [P] per irisan. Jangan menyunting file 1a/4a/3a.

### Untuk agent 4a — presentasi/kegunaan
> **MANDAT: FIX-VISUAL-20261119 (P0/P1).** Kerjakan U-02 (kontras teks/kartu di tema gelap dan light, termasuk banner "Siapkan audio"), U-04 (pesan backup yang ramah), U-05 editor catatan pertama bersama 1a, U-09 tampilan Statistik, dan U-16/U-17 bila relevan. Pertahankan hal yang sudah baik (umpan balik grammatikal, tombol bantuan, disclaimer angka, pengaturan aksesibilitas). Sertakan bukti visual dua tema untuk 3a.

### Untuk agent 3a — build & QA GUI
> **MANDAT: VERIFY-FIX-20261119.** Setelah 1a/2a/4a melaporkan hash final, build ulang EXE kandidat baru (jangan timpa `final-candidate/` yang sedang dipakai). Verifikasi: U-01 review tersimpan, U-02 dua tema terbaca, U-03 first-run tanpa banner error, U-05 catatan pertama, U-06 panel progres ringkas, U-07 soal sejenis, U-08 navigasi. Uji dengan profil QA terisolasi dan user-data folder unik (U-19). Tutup semua proses QA setelah uji. Laporkan SHA EXE + bukti screenshot.

### Untuk agent 3b — regresi tanpa GUI
> **MANDAT: REGRESI-FIX-20261119.** Verifikasi mandiri seluruh `scripts/test_*.cjs`, tsc, cargo, content-parity, dan postcheck 0 diff setelah perbaikan 1a/2a/4a. Dilarang build/EXE/GUI. Pisahkan [P] dan [T]. Jangan klaim stabilitas dari satu kali PASS.

### Untuk agent 3c — dokumen
> **MANDAT: DOCS-PILOT-20261119.** Perbarui protokol pilot agar sesuai navigasi KLAB (U-18): Hari Ini · Jelajah · Catatan · Profil, dengan "Pemulihan & peralatan lama" di Profil. Jangan mengubah status PENDING prasyarat manusia menjadi lulus.

---

## 4. Urutan & dependensi yang disarankan

```
U-01 (blocker SRS)  ──> 3a rebuild + verifikasi UI
        │
        ├─ U-02, U-03, U-04, U-05  ──> 3a verifikasi (kepercayaan & keterbacaan)
        ├─ U-06..U-15              ──> 2a + 1a + 4a, lalu 3a QA
        ├─ U-17, U-18, U-19        ──> dokumentasi & env QA
        └─ U-20                    ──> PENDING, diserahkan ke manusia
                    ↓
              3b regresi akhir ──> laporan konsolidasi
```

**Alasan urutan:** tanpa U-01, perbaikan visual dan materi tidak ada gunanya karena pengguna tidak bisa menyimpan hasil belajar. U-02 menempati prioritas P0 karena membuat materi tak terbaca pada konfigurasi default dark mode.

---

## 5. Aturan turunan untuk Asisten Director

1. Terjemahkan usulan ini menjadi perintah dengan ID, klaim file, kriteria terima, dan batas bukti — bukan sekadar "perbaiki".
2. Satu file satu pemilik; klaim di status sendiri sebelum menyunting.
3. Pertahankan semua perubahan tracked/untracked; tanpa reset/clean/commit/push.
4. Pakai profil QA terisolasi; jangan menjalankan dua GUI QA bersamaan (identifier `app.lernen.qa.audio` sama).
5. Pisahkan **[P] eksekusi nyata** dan **[T] inspeksi**; simpan bukti FAIL asli.
6. Jangan ubah temuan simulasi agen menjadi klaim pilot manusia atau kelulusan produk.
7. Setelah perbaikan, minta 3b melakukan regresi mandiri sebelum item ditutup.

---

## 6. Lampiran

- `outputs/murid-p01-2026-11-19/LAPORAN-MURID-P01.md` — 7 temuan [P], 5 inspeksi [T], saran murid, batas bukti.
- `outputs/pilot-pembelajar/penilaian-murid-agent2.md` — 7 temuan [P], 3 inspeksi [T], daftar hal positif.
- Penilaian agent test — laporan akhir di sesi `ses_e0c6c5de0ffeuLvY8v9qySkOTI`, 5 temuan [P], 4 inspeksi [T].
- Rencana koordinasi: `docs/architecture/RENCANA-ORKESTRASI-PENGUJIAN-2026-11-19.md`.
