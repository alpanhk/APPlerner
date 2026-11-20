# Rencana infrastruktur dan migrasi frontend Lernen / KLAB

> Untuk pelaksana: gunakan skill Superpowers implementasi/verifikasi sesuai AGENTS.md. Baca arsitektur dan kontrak bersama task; jangan menjalankan seluruh backlog otomatis. **Instruksi terbaru mengizinkan infrastruktur frontend sekarang, sedangkan backend tetap dikerjakan agent 1–2–3 OpenCode.**

**Goal:** siapkan frontend KLAB yang dapat dikembangkan dan ditinjau secara terpisah, lalu sambungkan setelah aplikasi awal siap tanpa kehilangan fitur/data.

**Architecture:** pertahankan domain dan transaksi aplikasi sekarang. Infrastruktur berada dalam namespace baru `src/klab/`, dengan entry preview tersendiri dan fixture terisolasi. App produksi tidak dialihkan pada tahap ini. Struktur target lengkap dalam arsitektur adalah tahap akhir, bukan perintah memindah folder hari ini.

**Tech stack:** React/TypeScript/Vite/Tailwind/Zustand existing, Tauri/SQLite saat integrasi; tanpa dependency frontend baru.

**Spec:** [arsitektur](lernen-klab-frontend-architecture.md), [peta fitur/aset](lernen-klab-feature-asset-map.md), [UI KLAB](../superpowers/specs/2026-11-17-lernen-klab-ui-design.md), PRD §0.7. Arahan langsung pengguna pada chat ini mengizinkan persiapan infrastruktur sebelum gate0; tidak mengizinkan backend/port APK sekarang.

## Batas bersama

- Tidak reset/clean/delete perubahan tracked/untracked, commit/push, mengubah profil produksi, atau mengganti worktree tanpa konteks lengkap.
- Jangan sunting file backend/runner/data/audio/App/layout milik agent1–2–3; kerja awal hanya file baru namespace KLAB, preview, tes frontend dan dokumen ini. Kontrak backend berupa handoff, bukan perintah native baru yang pura-pura tersedia.
- Port preview frontend1425 dan build output `outputs/frontend-infrastructure-2026-11-17/dist`, terpisah dev Tauri1420/dist/release milik Agent3. Tidak menjalankan aplikasi produksi atau meminjam profil QA yang sedang dipakai Agent3.
- Belajar tanpa akun/cloud/biaya/jaringan. Fixture preview bukan data pengguna dan tidak bisa menyimpan ke SQLite produksi.
- UI nantinya **harus mengikuti mockup KLAB**, bukan dashboard generik. Perubahan aksesibilitas harus dicatat pada comparison.
- Pengaturan mode/tema/ulang tidak menghapus progres, catatan atau jadwal SRS. Snapshot best/ever-passed bukan jumlah lulus historis.
- Seluruh konten aplikasi lama wajib tersedia pada aplikasi baru sebagai standar capaian PRD; gate CONTENT-PARITY-20261117-01 memeriksa baseline identitas/isi/relasi/akses/audio serta delta konten berikutnya. Tidak mengubah baseline demi menyamarkan kehilangan, tidak mengganti katalog dengan fixture. Detail tugas backend dan tes parity pada [penugasan lanjutan Agent1–2–3](../superpowers/plans/2026-11-17-lernen-backend-agent123-followup.md).

## Review focus

| Risiko paling penting | Task yang harus membuktikan |
|---|---|
| Navigasi/resize me-remount runner dan menghilangkan state | F1 unit store, M2/M3 device navigation/resume |
| Entry preview mengimpor getDb/invoke/seed atau aset besar secara tidak sengaja | F1 dependency graph guard, F3 emitted bundle audit |
| State commit terlambat/retry menggandakan hasil/XP atau menimpa draft baru | M2 transaksi revision/receipt + fail injection |
| Visual hanya mengganti warna tanpa maskot/komposisi komik | F3 catatan gap aset, M1/M2 screenshot fidelity gate |
| Back/IME/background Android tidak sama dengan browser desktop | M5 native adapter/device audit, tidak ditutup oleh preview |

## Pekerjaan sekarang: infrastruktur frontend saja

### F1 — Kontrak dan navigasi frontend terisolasi

Files baru: `src/klab/routes.ts`, `navigation.ts`, `contracts.ts`, `scripts/test_klab_frontend.cjs`.

Interfaces: export `Route`, `Tab`, `homeRoute(tab)`, `tabForRoute(route)`, `createNavigation()`; interface layanan pada `contracts.ts` memakai Result/Failure, Preferences, SourceRef/Note, AudioService/Recorder dan BackendPorts. Tidak ada implementasi DB/native pada tahap ini. Tipe domain existing hanya diimpor dengan `import type`.

- [x] Tulis assertion terlebih dahulu: empat tab dan sembilan halaman lama punya pemetaan, back memulihkan unit sebelum daftar, tab mempertahankan stack, duplicate route tidak menambah stack, stack dibatasi20.
- [x] Jalankan `node scripts/test_klab_frontend.cjs`; catat RED karena modul belum ada/kontrak belum dipenuhi.
- [x] Implementasi union route dan factory Zustand vanilla terisolasi; `back` mengembalikan false pada root agar adapter native kelak menentukan perilaku OS. Tidak persist navigation ke localStorage sekarang.
- [x] GREEN test navigasi nyata; dependency guard menelusuri import preview untuk menolak getDb/seedLoader/invoke/SQL/native/assets tts. Typecheck seluruh src.

Acceptance: dapat dipakai preview tanpa Tauri, tombol Uji A1/percakapan tetap ada rutenya, tidak mengubah `stores/nav.ts` existing. Rollback: hentikan preview; app produksi tidak memakai namespace baru.

### F2 — Token, komponen dasar dan shell KLAB

Files baru: `src/klab/tokens.css`, `Shell.tsx`, `Icon.tsx`, `Mascot.tsx`.

Interfaces: `Shell({route,onNavigate,theme,children})`; empat nav item diturunkan dari Tab, semantic tokens terang/gelap; ikon SVG lokal. Maskot SVG prototipe berlabel status aset pada dokumentasi, bukan final asset approval.

- [x] Terapkan canvas/surface/text/primary/action/highlight/focus sesuai arsitektur; CSS scoped `.klab-app`, tidak import App.css atau mengubah style aplikasi awal.
- [x] Buat shell bottom-nav HP/rail tablet-desktop, safe-area padding, min-width0, touch48, skip-link/focus, reduced-motion.
- [x] Satu children tree untuk semua viewport; theme hanya attribute, bukan mengganti key/remount.
- [x] Verifikasi visual di browser dan kontras pasangan token. Aset final, font lokal dan panel komik belum dibuat diberi gap eksplisit, bukan diganti screenshot mockup.

Acceptance: pengembang bisa memasang controller nyata kelak lewat props tanpa shell mengetahui SQL. Rollback: namespace baru tetap tidak dirujuk produksi.

### F3 — Preview kerja, bukti dan handoff backend

Files baru: `src/klab/preview.tsx`, `frontend-preview/index.html`, `vite.frontend.config.ts`, `src/klab/README.md`, `docs/architecture/lernen-klab-backend-handoff.md`. Contoh hanya menunjukkan shell, rute belajar, state simpan/failed dan tampilan kosong; tidak membangun domain belajar baru.

- [x] Jalankan `pnpm exec vite --config vite.frontend.config.ts` di port1425; tidak memakai port agent3.
- [x] Build terpisah: `pnpm exec vite build --config vite.frontend.config.ts`; keluaran tidak mengosongkan dist aktif.
- [x] Screenshot360×800,800×1280,1280×800 terang/gelap, batas320px; cek nav, focus, resize tanpa state hilang, error retry fixture. Catat screenshot dan gap terhadap mockup. Tidak menandai final fidelity lulus dari shell awal.
- [x] Periksa output emitted tidak memuat WAV/SQLite/native bridge, fixture tidak diimpor main produksi, shared source hash tidak berubah oleh pekerjaan ini.
- [x] Handoff ke backend menetapkan yang sudah ada vs kontrak tambahan, dependensi task/receipt/revision/recording/recovery; agent1–2–3 tetap pemilik implementasinya. Tidak mengubah STATE/status agent lain atau memulai agent pengganti.

Acceptance: infrastruktur bisa dijalankan/di-build, ada perintah ulang dan bukti; aplikasi awal belum dipindahkan. Semua pekerjaan M1–M5 berikut tetap backlog sesudah gate0.

## Gate 0 — aplikasi awal siap

Pemilik penutupan Windows: agent1–2–3 OpenCode sesuai [rencana tiga agent](../superpowers/plans/2026-11-17-lernen-windows-three-agent.md). Baca kembali status/handoff terkini saat mulai integrasi; snapshot arsitektur bisa tertinggal.

- [ ] Rekonsiliasi P1–P9 pada sumber/build yang sama: validitas penilaian, upgrade seed, sesi/transaksi/recovery, audio inti, kegunaan Windows.
- [ ] Bukti UI terisolasi: keluar/navigasi/restart, fail-before-commit, commit-before-response/retry, 73% tujuan gagal, remedial/retry, audio tanpa Piper. Jangan menganggap tes modul sudah menutup UI.
- [ ] Bukti clean install/offline/restart/upgrade/uninstall pada lingkungan Windows bersih; ekstraksi MSI bukan pemasangan.
- [ ] Status telaah pengajar dan pilot pembelajar dicatat berdasarkan pelaksanaan; kekurangan pedagogis tidak disembunyikan sebagai lulus teknis. Kesepakatan lingkup kesiapan diputuskan bersama status produk, bukan auto-approve dari typecheck.
- [ ] File/sumber backend dilepas pemilik, backup terisolasi+format lama teruji, tidak ada writer source bertabrakan. Catat hash baseline baru sebelum mengaktifkan shell.

**Gate ini belum lulus dalam pekerjaan infrastruktur.** Tidak menunggu secara aktif sampai agent lain selesai dan tidak mulai port karena waktu berlalu. Tidak perlu implementasi A2–B2 baru untuk menyiapkan shell, tetapi semua fitur/konten existing harus tetap terakses.

## Migrasi sesudah gate0

### M1 — Hubungkan shell, preferensi dan empat tujuan

Files: adaptasi `App.tsx`, `ui/Layout.tsx`, `PageShell.tsx`, `App.css`, `stores/nav.ts`, `ui/pages/index.ts` oleh pemilik yang disepakati; hub baru explore/profile; adapter PreferencesRepository backend.

- [ ] Test `test_klab_routes.cjs` baru:9legacy routes→4tabs, nested back, invalid ID, last-route restore. Test `test_klab_preferences.cjs` baru: system theme change, patch serialized/retry, mode switch preserves data.
- [ ] RED→implement props shell ke route host; pastikan bootstrap/migrasi/seed/error/auto-backup lama tetap utuh.
- [ ] Hub Jelajah4kategori dengan Drill/SRS/Hören/Schreiben/Percakapan/Uji A1 eksplisit; Profil stats/settings/recordings/recovery/legacy-tools. Tidak membuat semua kartu identik dashboard.
- [ ] Preferences committed ke config; jangan duplikasi tts_rate/daily_*. Onboarding3langkah dan Skip/back mempertahankan pilihan, mode dapat diubah kapan saja.
- [ ] Screenshot gate home/Jelajah/settings per viewport; tes keyboard/touch200%. Turunkan minWidth Windows hanya setelah narrow-window nyata lulus.

Acceptance: semua fitur lama reachable, root/native back tidak menghilangkan draft, light/dark tersimpan, main tree tidak remount saat resize. Risiko: alias CSS mempengaruhi layar lama. Rollback: feature switch lokal ke host lama, preferensi tetap tersimpan; tidak downgrade/menghapus tabel.

### M2 — Satu perjalanan U4 lengkap: baca/catat→latihan→hasil/remedial→ulang

Files: `LessonRunner`, `MiniDrill`, `CheckpointRunner`, `lessons/{sessions,rounds,access,persistence,checkpointStore}`, `features/notes/*`, data stable block ID; backend Rust/schema/backup dikerjakan pemilik backend, bukan task frontend mandiri.

- [ ] Test baru `test_klab_session.cjs`, `test_klab_notes.cjs`, `test_klab_rounds.cjs`; Rust integration tests oleh backend: answer+draft revision, finalization receipt, duplicate operation/conflicting payload, rollback.
- [ ] Gunakan existing grader/optionOrder/feedback. Persist selected items+order+seenKeys+answers sebelum menampilkan soal; Checkpoint/remedial diberi identitas dan draft, bukan hanya lesson.
- [ ] Test73% [3,3,2,2,1] gagal, all-correct pass, stale/duplicate answer ignored, bank insufficient blocks CP but lesson accessible, remedial score unchanged. Retry/exclude mencakup seen dalam putaran; jelaskan bila bank terbatas.
- [ ] Catatan stable IDs + quote backup; insert/edit sumber tidak menghilangkan note. Save failing buffer retained; retry same revision. Editor HP/fullscreen, tablet side panel, desktop3panel.
- [ ] Round: first pass1→begin tetap1→fail tetap1→pass2; double retry/restart tetap2. Failed new round tidak mengunci unit lama, SRS/notes/history preserved. Legacy shows pernah-lulus tanpa count fiktif.
- [ ] Satu transaksi hasil+snapshot+unit pass+XP receipt; UI success hanya setelah commit. Lesson progress old summary tidak dihapus untuk restart.
- [ ] Screenshot U4 lesson, feedback salah,73%hasil dan repeat dialog dengan fixture **sama seperti mockup**. Uji kill/save-full/retry via QA backend.

Acceptance: perjalanan lengkap teruji normal/gagal/restart, semua anchor dan data legacy aman, visual gate lulus. Rollback: kembali view lama dengan DB additive; hide UI baru tanpa menghapus notes/rounds, parser lama diperiksa kompatibel. Jangan memasang binary lama yang tidak memahami schema baru tanpa strategi rollback kompatibilitas.

### M3 — Domain lainnya tanpa kehilangan fitur

Files: Latihan split panels/session; UjiTiruan session/results; SRS/drill persistence; Membaca/Kosakata/Statistik/Pengaturan responsive. Pemilik existing melepaskan file dahulu.

- [ ] Per-domain task/test kecil: listening option order/transcript/audioFail; writing legacy migration no clear before commit; conversation path/node restore; exam deadlines, answers, skipped/audiofail/rubrik; SRS again visitId; drill generation/stale async.
- [ ] Test baru `test_klab_practice_resume.cjs`, `test_klab_exam_resume.cjs`, `test_klab_srs_resume.cjs` oleh pemilik; preserve FSRS due, limits/new-level filter, manual edits/deletions/imported content.
- [ ] Pindah waktu/theme/nav/scroll tidak restart sesi; exam timer berdasarkan deadline tetap; SRS laten response tidak mengubah sesi lain. Failure inline punya retry, bukan reset otomatis.
- [ ] Statistik membedakan latest/best/ever-passed/history dan rubrik mandiri. XP bukan skor CEFR. Refresh query setelah commit tidak replay aksi.
- [ ] QA regresi seluruh9layar dan perbandingan screenshot fitur tambahan terhadap sistem visual KLAB, tanpa menghilangkan advanced content/legacy tools.

Acceptance: matriks fitur tidak ada baris tanpa rute/owner/error action; per-domain reuse nyata dan payload compatible. Risiko: fixtures lulus tetapi native gagal. Rollback per-domain, tidak all-or-nothing rewrite.

### M4 — Audio arbiter, aset produksi, recording dan ukuran

Files: fasad `srs/tts.ts`→audio coordinator/bundle/platform; produksi aset/font/manifest; backend recordings storage. Tidak regenerate konten/audio aktif tanpa pembekuan teks pemilik.

- [ ] Test `test_klab_audio_lifecycle.cjs` baru: one-active source, cancel late Piper, dialog stops route exit, number play awaits end, release buffer/objectURL/tracks. Existing audio lookup14D8+allcoverage tetap lulus.
- [ ] LRU24MiB decoded termasuk numbers; Piper base648MiB/20entries Windows; profile peak memory pada perangkat sasaran. Count cap bukan byte proof.
- [ ] Produksi wordmark/kucing/komik U4/ikon/font lokal sesuai inventaris; per-file license/provenance/size dan content review. No mockup JPG shipped.
- [ ] Codec eksperimen salinan: bandingkan A1 ucapan, numbers1–100/time segments, delay/seek/decoder support; fallback WAV sampai pembuktian. Catat src/dist/package/installed secara terpisah.
- [ ] Recorder state idle/requesting/recording/preview/saving/saved/error; denied/no-device/empty60s/8MiB cap/background/full/retry/orphan/delete-many diuji. Tidak memberi nilai pelafalan atau wajib izin.
- [ ] Backend staged file+metadata recovery, backup semantics rekaman jelas, penghapusan tidak menghapus note/progres. Reaksi off default, volume terpisah, no masking lesson.

Acceptance: offline semua konten yang diberi label tersedia, no audio leak, asset manifest lengkap, ukuran aktual tercatat. Tidak menjanjikan15–30MB terpenuhi. Rollback audio manifest version ke WAV lama tanpa menghapus source/rekaman pengguna.

### M5 — Android port dan perangkat, Windows tetap berfungsi

Audit porting harus menyelesaikan: Windows piper.exe/amd64 ZIP/explorer di-cfg secara utuh; dependencies native yang hanya Windows; SQL migration/capabilities; app-private paths/recovery; native microphone runtime permissions+WebView grant bila digunakan; lifecycle/back root/predictive back; edge-to-edge/insets/IME; codec/bundle URL/CSP; ABI/toolchain/signing. Spesifikasi SDK resmi yang telah diperiksa ditautkan pada arsitektur; verifikasi ulang saat port.

- [ ] Pemilik backend/platform menyiapkan target Android/SDK/NDK/rust dan konfigurasi QA terpisah; tidak menimpa Windows identifier/data. Tidak menambah engine/model Piper ke paket awal.
- [ ] Spike SQL create/migrate/write/read/restart/restore, audio offline, mic allowed/denied/revoked/background, backgesture/root/suspend/kill. Dukungan Tauri SQL Android tidak otomatis membuktikan app ready.
- [ ] Build APK/AAB per ABI setelah adapter lulus, **oleh pemilik port nanti**. Catat byte/hash/compressed/installed dan ruang rekaman, cold start/peak memory/device/WebView version.
- [ ] Windows existing suite + clean install/offline ulang setelah shared changes. Native narrow window dan200%font real, bukan CSS viewport saja.
- [ ] Uji pembelajar/peninjau bahasa sesuai PRD, catat peserta/temuan; jangan klaim cocok semua usia atau manfaat belajar dari tes kode.

Acceptance: Android dan Windows punya bukti instalasi/normal/gagal/offline pada versi sama. Rollback non-destruktif: hentikan distribusi build baru, pertahankan backup/data, gunakan pembaca skema kompatibel; tidak auto-downgrade DB atau menghapus berkas pengguna.

## Gate visual wajib sebelum implementasi penuh dinyatakan selesai

Screenshot **bukan** empat JPG penuh yang diletakkan di app. Crop layar referensi di luar bezel/chrome/banner papan, petakan ke viewport; simpan original+crop metadata. Gunakan data fixture U4, state73%[3,3,2,2,1], progress/XP contoh yang sama, tema dan text scale default. Font/asset version direkam. Untuk viewport tanpa mockup langsung (portrait tablet/320), uji komposisi adaptif, bukan klaim pixel match terhadap contoh yang tidak ada.

| Viewport CSS px | Light + dark, minimal state | Pembanding |
|---|---|---|
|360×800|home,Jelajah,lesson,wrong,result,settings|detail01/02/03HP|
|800×1280|reader+notes bila muat, single-column di text200%|adaptasi tablet; belum exact reference|
|1280×800|home,reader+notes,Catatan3panel|02-KLABdesktop +detail03|
|1280×800 tablet landscape|materi+catatan|detail03tablet; diuji pula native tablet|
|320×800 dan Windows sempit|nav48px,input,dialog,scroll tanpa horizontal|batas reflow, bukan screenshot asli|
|800×360/IME terbuka|aksi tetap reachable, draft tidak hilang|QA interaction tambahan|

Untuk tiap capture: (1) screenshot implementasi, (2) referensi crop side-by-side, (3) overlay opacity50%/diff sebagai alat bantu, (4) checklist manusia bertanggal. Pixel diff hanya diagnostik karena mockup generatif bukan layout pixel-perfect yang terspesifikasi. Jangan menetapkan threshold magic yang otomatis menyetujui salah komposisi.

Checklist pass per layar: identitas Lernen; kucing ekspresif konsisten; panel/balon/outline/halftone komik; biru-merah-kuning dan kontras; hierarki/urutan/proporsi; top/bottom/rail/panel sesuai ruang; typography legible; seluruh CTA/feedback ada; tidak generik dashboard. **Semua** ciri identitas/komposisi wajib lulus, tanpa penyimpangan utama terbuka. Catat koreksi aksesibilitas seperti label teks/touch48/reflow sebagai intentional differences, bukan hapus ciri KLAB. Assets/fonts belum siap berarti visual gate pending.

Tambahan keyboard Tab/Enter/Space tanpa double advance, focus visible/return/dialog, screen reader label/live status, OS reduced-motion, touch,200%text; native permission/rotation/back/background. Sebelum label implementasi selesai, review comparison manusia dan bukti device terlampir. Shell infrastruktur F1–F3 tidak memenuhi gate ini sendirian.

## Regression commands dan status bukti

Existing15Node dan8Rust sudah lulus baru pada tahap audit; log di evidence. Nama test_klab_* selain infrastruktur di atas adalah **rencana test baru**, belum tersedia sampai task terkait. Jalankan failing test dahulu lalu implement/test sesuai scope task. Tidak membuat satu tes per CSS declaration.

```powershell
node scripts/test_klab_frontend.cjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config vite.frontend.config.ts
```

Sesudah integrasi ke app produksi nantinya, pemilik QA menjalankan seluruh15Node+test baru, `cargo test --locked --offline`, `pnpm build`, UI QA/installer/device gates terkait. Build tidak menggantikan audio/pedagogi/a11y. Tidak melakukan commit/push dalam pekerjaan ini meski workflow skill umum menyarankan checkpoint commit.

## Status dan ledger

- Audit dan desain: selesai ditulis berdasarkan sumber/tes baru; bukan tanda Windows siap.
- F1–F3: selesai untuk lingkup infrastruktur terisolasi sesuai arahan baru; bukti akhir di [laporan frontend](../../outputs/frontend-infrastructure-2026-11-17/README.md). Tidak berarti final fidelity atau integrasi backend selesai.
- M1–M5/gate0: belum dieksekusi oleh pekerjaan ini. Backend tetap agent1–2–3; tidak menandai tugas mereka lulus.
- Ruling: namespace `src/klab/` untuk infrastruktur awal menggantikan pemindahan langsung ke `app/ui/features` — menghindari benturan file aktif; modul dipindah hanya sesudah integrasi dan release pemilik.
- Ruling: preview port/output terpisah — App/domain/Rust/source dist aktif tidak tersentuh. Tidak ada worktree baru karena konteks untracked aktif harus tetap utuh dan pengguna menugaskan pekerjaan bersama pada repo ini.
