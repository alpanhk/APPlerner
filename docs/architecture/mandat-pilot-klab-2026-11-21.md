# Mandat Pilot Pengajar dan Pelajar Lernen KLAB — 21 November 2026

**ID:** PILOT-KLAB-20261121 · **Koordinator:** Asisten Director OpenCode · **Pemilik:** Agent 1a, 2a, 3a, 4a.
**Folder keluaran baru (wajib, pertahankan bukti build lama):** `outputs/pilot-klab-2026-11-21/`

Aturan mutlak:
- Jangan libatkan agen UI/UX Codex dan jangan gunakan Xfigura.
- Tidak ada instruksi shutdown dan tidak ada publikasi/instalasi ke profil produksi `app.lernen.desktop`.
- Jangan menghapus perubahan agen lain atau menimpa folder `outputs/migrasi-klab-windows-2026-11-19/` maupun `outputs/windows-2026-11-18-09/`.

---

## 1. Tugas Agent 2a — Pemilik `src/klab/learning/LessonFlow.tsx` & `scripts/test_klab_learning.cjs`

Ambil alih dan review edit lokal awal Director di `src/klab/learning/LessonFlow.tsx`:
1. **Penilaian Soal Hanya Setelah Dikirim (Bukan Sebelum Diketik/Dikirim):**
   - Kandidat sebelumnya memakai status `checked` soal pertama untuk menilai soal kedua (`paymentItem`), sehingga tombol `Cek jawaban` pada soal kedua (`Zusammen oder ___?` -> `getrennt`) terkunci bahkan sebelum kata `getrennt` selesai diketik.
   - Pastikan baik soal pertama (`stage === 'order'`, `orderItem`) maupun soal ke-2 dan ke-3 (`stage === 'payment'`, `exerciseIndex = 1..items.length-1`) **hanya dinilai setelah dikirim** (`answers.find((entry) => entry.id === item.id)`).
   - Pastikan ketika menjawab salah pada soal ke-2/ke-3 (atau soal pertama), umpan balik kesalahan (`Belum tepat` + penjelasan/petunjuk) tampil jelas, dan murid dapat memperbaiki/mencoba lagi atau kembali ke soal sebelumnya.
2. **Navigasi Kembali ke Soal & Dukungan Semua Item (Termasuk 3 Soal seperti Unit 11 Pelajaran 1):**
   - Saat di `stage === 'payment'`, tombol kembali (`Kembali ke soal sebelumnya` / `Kembali ke koreksi`) harus mundur ke `exerciseIndex - 1` bila `exerciseIndex > 1` (mis. dari soal ke-3 kembali ke soal ke-2), dan kembali ke `stage = 'order'` (soal ke-1) bila `exerciseIndex === 1`, sambil mempertahankan jawaban yang sudah dikirim di `answers` serta menampilkan `submitted?.picked` pada input.
   - Bila item ke-2 atau ke-3 bertipe `mode === 'order'` (memiliki `tokens` seperti `lp-u11-l1-03`), sediakan juga tombol keping kata (`tokens`) atau izinkan pengetikan kalimat agar ke-3 item dapat dijawab tuntas.
3. **Tombol `Selesai` yang Bermakna:**
   - Tombol `Selesai` hanya aktif/muncul setelah soal terakhir pada pelajaran tersebut selesai dijawab (atau di slide terakhir bila pelajaran tidak memiliki soal), menampilkan status `Menyimpan…` saat `onFinish` berjalan, dan bila penyimpanan gagal (`saveError`), menampilkan pesan `role="alert"` (`"Progres belum tersimpan. Tekan Selesai untuk mencoba lagi."`) tanpa keluar dari layar sehingga pengguna bisa menekan `Selesai` lagi.
   - Dukung pemulihan `initialAnswers?: LessonProgress['answers']` (opsional dari 1a) agar saat pelajaran dibuka kembali setelah restart, jawaban yang sudah tersimpan tetap dikenali.
4. **Contoh Bantuan (`Lihat contoh dari materi`) Sesuai Pelajarannya:**
   - Di `LessonFlow.tsx`, saat ini `#klab-example-panel` memakai `slide = lesson.slides[Math.min(page, lesson.slides.length - 1)]`. Jika pengguna membaca sampai slide terakhir (`page = 3`, *"Membayar — Die Rechnung, bitte."*) lalu masuk ke soal pertama (`"Ich möchte ___ Apfelsaft, bitte."`), panel contoh bantuan malah menampilkan slide terakhir (`"Die Rechnung, bitte."`), bukan contoh memesan (`"Ich möchte einen Kaffee, bitte."`)!
   - Perbaiki pemilihan slide contoh bantuan (`exampleSlide`) untuk soal aktif agar mencocokkan slide pelajaran yang relevan dengan soal tersebut (untuk `lp-u4-l2-01` / soal pertama memesan: slide `"Ich möchte einen Kaffee, bitte."`, dan untuk pelajaran lain: slide yang relevan dengan soal atau slide contoh utama pelajaran tersebut, lengkap dengan audio `clipFor(exampleSlide.exampleDe)`).
5. **Verifikasi 2a:**
   - Perbarui `scripts/test_klab_learning.cjs` untuk menguji: (a) soal kedua tidak terkunci oleh `checked` soal pertama, (b) jawaban baru dinilai setelah dikirim (benar & salah), (c) kembali ke soal sebelumnya, (d) pelajaran dengan 3 item (`Unit 11 Pelajaran 1`), (e) `Selesai` gagal simpan -> retry berhasil, dan (f) contoh bantuan sesuai pelajarannya bahkan setelah berada di slide terakhir.
   - Jalankan `node scripts/test_klab_learning.cjs` dan `pnpm exec tsc --noEmit` (exit 0), tulis laporan `outputs/pilot-klab-2026-11-21/agent-2a.md`, dan kirim sinyal `PILOT-KODE-2A-SIAP` ke `inbox/agent-1a.md` & `inbox/agent-3a.md`.

---

## 2. Tugas Agent 1a — Pemilik `src/app/routeView.tsx`, `src/app/flowPersistence.ts`, & `scripts/test_klab_cutover.cjs`

Ambil alih edit lokal awal Director pada callback selesai di `src/app/routeView.tsx` & `src/app/flowPersistence.ts`:
1. **Simpan & Pulihkan Jawaban, Progres, dan Skor Nyata Setelah Restart:**
   - Di `src/app/flowPersistence.ts`, pastikan `saveLessonFlowProgress(progress, finished)` menyimpan `answers` yang sudah dideduplikasi per `item.id` (jawaban terakhir per soal) ke `lesson_drafts` (`lernen_lesson_${unitNo}_${lessonNo}`), dan saat `finished === true` menghitung skor akurat (`Math.round((correct / answers.length) * 100)`, mis. 1 salah `ein` + 1 benar `getrennt` = `50`) lalu menyimpan ke `lesson_progress` (`state = 'done', score, finished_at`).
   - Tambahkan fungsi `loadLessonFlowState(unitNo, lessonNo)` di `src/app/flowPersistence.ts` yang membaca `answers` & `step` dari `lesson_drafts` serta `score` & `state` dari `lesson_progress`.
   - Di `LessonKlabFlow` (`src/app/routeView.tsx`), muat `loadLessonFlowState(route.unitNo, route.lessonNo)` dan teruskan `initialAnswers` ke `LessonFlow` (atau tampilkan ringkasan skor & jawaban tersimpan dari penyimpanan) sehingga setelah aplikasi ditutup dan dibuka kembali, kedua jawaban (`ein` dan `getrennt`) serta skor (`50%`) terbukti terbaca kembali dari SQLite dan tampak di UI.
2. **Kegagalan Simpan Tampak dan Dapat Dicoba Kembali (Retry):**
   - Di `LessonKlabFlow`, pastikan `onFinish` melakukan `await saveLessonFlowProgress(progress, true)` tanpa menelan error (`try/catch` tidak boleh memakan error sebelum dilempar ke `LessonFlow`), sehingga bila penyimpanan SQLite gagal, `LessonFlow` menampilkan alert `"Progres belum tersimpan. Tekan Selesai untuk mencoba lagi."` dan saat dicoba kembali (`retry`) berhasil menyimpan serta memanggil `reloadTargets(refreshTargets)`.
3. **Verifikasi 1a:**
   - Perbarui `scripts/test_klab_cutover.cjs` untuk menguji: (a) simpan & baca kembali kedua jawaban + skor `50` setelah simulasi restart, dan (b) kegagalan simpan pada `onFinish` melempar error ke pemanggil lalu berhasil pada percobaan ulang (`retry`).
   - Jalankan `node scripts/test_klab_cutover.cjs`, seluruh `scripts/test_*.cjs`, dan `pnpm exec tsc --noEmit` (exit 0), tulis laporan `outputs/pilot-klab-2026-11-21/agent-1a.md`, lalu kirim sinyal `PILOT-KODE-1A-SIAP` ke `inbox/agent-3a.md`.

---

## 3. Tugas Agent 3a — Pemilik QA Regresi, Build EXE Pilot Terisolasi & Uji Aplikasi Nyata

**Tunggu sinyal `PILOT-KODE-1A-SIAP` dan `PILOT-KODE-2A-SIAP` (serta `tsc --noEmit` exit 0) sebelum membangun EXE pilot.**
Setelah 1a dan 2a siap:
1. **Uji Regresi & Build EXE Pilot Terisolasi di Folder Baru `outputs/pilot-klab-2026-11-21/`:**
   - Jalankan seluruh `scripts/test_*.cjs`, `pnpm exec tsc --noEmit`, dan `cargo test --locked --offline`.
   - Bangun EXE pilot Windows berprofil uji terisolasi (`app.lernen.qa.audio`, `src-tauri/tauri.qa.conf.json`) dan salin ke **`outputs/pilot-klab-2026-11-21/qa-build/lernen-app-qa.exe`** (pertahankan bukti lama di `outputs/migrasi-klab-windows-2026-11-19/` dan `outputs/windows-2026-11-18-09/`). Catat ukuran byte dan SHA-256 EXE pilot tersebut.
2. **Uji Lewat Aplikasi Nyata (E2E pada `outputs/pilot-klab-2026-11-21/qa-build/lernen-app-qa.exe`):**
   - Buat dan jalankan skrip uji aplikasi nyata `scripts/qa/pilot-klab-e2e-2026-11-21.mjs` yang menyimpan bukti ke `outputs/pilot-klab-2026-11-21/pilot-e2e-report.json` + screenshot:
     1. Buka pelajaran **Unit 4 Pelajaran 2** (`Ich möchte ___ Apfelsaft, bitte.`).
     2. Pilih **satu jawaban salah (`ein`)** -> kirim (`Cek jawaban`) -> verifikasi status salah.
     3. Buka & baca alasan (**`Mengapa einen?`** -> `.explanation`) dan buka contoh (**`Lihat contoh dari materi`** -> `.example-panel` berisi `"Ich möchte einen Kaffee, bitte."` + tombol **`Dengarkan`**) -> kembali ke soal.
     4. Tekan **`Lanjut`** ke soal kedua (`Lengkapi: Zusammen oder ___?`). Verifikasi tombol `Cek jawaban` belum terkunci oleh status `checked` soal pertama.
     5. **Masukkan jawaban berikutnya per huruf** (`g`, `e`, `t`, `r`, `e`, `n`, `n`, `t` satu per satu lewat dispatch key/input event) -> kirim (`Cek jawaban`) -> verifikasi dinilai benar setelah dikirim -> tekan **`Selesai`**.
     6. **Tutup aplikasi secara normal dan buka kembali (restart)** -> periksa dari penyimpanan SQLite (`lesson_drafts` dan `lesson_progress`) serta UI bahwa **kedua jawaban (`lp-u4-l2-01`: `ein`/false, `lp-u4-l2-02`: `getrennt`/true) dan skor (`50`) tersimpan dengan benar**.
     7. **Periksa jalur bacaan *Im Café***: buka `Jelajah → Bacaan` -> klik sampul *Im Café* -> cuplikan (`.book-preview`) -> klik `Baca` / `Dengarkan` -> verifikasi 6 kalimat *Im Café* tampil di `.reader` dan audio dapat diputar -> kembali ke rak.
     8. Pastikan instance `lernen-app-qa.exe` ditutup bersih setelah uji selesai (`0` proses tersisa).
3. **Laporan 3a:**
   - Bila ditemukan masalah tampilan, laporkan ke `inbox/agent-4a.md` untuk segera ditangani 4a.
   - Uji instalasi Windows bersih hanya jika lingkungan (Windows Sandbox/VM) tersedia; jika belum aktif, catat jujur beserta hal yang masih membutuhkan pengajar dan pelajar manusia.
   - Tulis laporan lengkap `outputs/pilot-klab-2026-11-21/agent-3a.md` berisi hasil uji regresi, hasil E2E aplikasi nyata, identitas build (path + ukuran + SHA-256 EXE pilot), dan batas bukti.

---

## 4. Tugas Agent 4a — Siaga Tampilan Pilot KLAB

- Periksa apakah ada masalah tampilan pada alur `LessonFlow` (soal 1 → soal 2 → soal 3 → tombol `Selesai` / alert gagal simpan / ringkasan jawaban tersimpan) atau `ExplorePage` (*Im Café*) di `1280×800` dan `900×600`, dan tangani segera jika ada temuan dari 1a, 2a, atau 3a.
