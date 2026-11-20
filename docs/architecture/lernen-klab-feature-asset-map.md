# Peta fitur dan aset Lernen / KLAB

17 November 2026, Asia/Jakarta. **Inventaris pemeriksaan sekarang untuk persiapan perpindahan**, bukan status aplikasi selesai. Perpindahan menunggu aplikasi awal siap sesuai arahan pengguna. [Arsitektur](lernen-klab-frontend-architecture.md) dan [rencana migrasi](lernen-klab-frontend-migration-plan.md) memakai peta ini. Sesudah inventaris awal, pengguna mengizinkan infrastruktur frontend: namespace `src/klab/` dan preview terpisah ditambahkan tanpa mengubah entry aplikasi awal/backend/data pengguna. Bukti tambahannya ada di [laporan frontend](../../outputs/frontend-infrastructure-2026-11-17/README.md).

## 1. Cara membaca bukti

Pembaruan ketentuan pengguna: seluruh konten lama adalah minimum aplikasi baru sesuai PRD. [Baseline kesetaraan konten](evidence-2026-11-17/legacy-content-baseline.json) membekukan81JSON,42unit/96pelajaran,2.134kata seed,67bacaan,60tujuan/300soal A1, seluruh practice/exam IDs dan454audio root. Gate migrasi memeriksa isi/identitas/relasi/perilaku dan akses UI nyata, tidak sekadar jumlah. Konten tambahan setelah snapshot masuk delta wajib, sementara edit/hapusan pengguna dipertahankan. Preview empat unit bukan pemenuhan gate konten.

- **Fakta inspeksi:** ditemukan pada source/lockfile/ukuran file saat tugas ini. Keberadaan file tidak membuktikan semua jalur runtime.
- **Tes baru:** perintah benar-benar dijalankan; log [Node](evidence-2026-11-17/node-tests.json), [verifikasi](evidence-2026-11-17/verification.json).
- **Historis:** handoff dan outputs QA lama; tetap berguna sebagai petunjuk, tidak disalin menjadi tes baru.
- **Refactor:** perilaku/domain dipakai ulang, UI/persistence dibenahi per irisan. **New:** kebutuhan yang belum ditemukan sebagai fitur runtime dalam pencarian terarah.
- ID rute di tabel adalah kontrak target dalam arsitektur, belum rute yang aktif. Semua path sumber relatif terhadap root repo.

Snapshot awal [2026-11-17-frontend-inventory](2026-11-17-frontend-inventory.md) dibaca lalu dicocokkan ulang. Source fingerprint dan status Git ada dalam [source-snapshot.json](evidence-2026-11-17/source-snapshot.json), 166 file. Git status awal memuat perubahan tracked App/layout/domain/Rust dan banyak untracked konten/tes/docs/outputs; semuanya dipertahankan. Commit HEAD tidak memuat seluruh source yang diperiksa.

Handoff/PRD terbaru mendahulukan Windows (§0.7). Beberapa paragraf historis handoff/audit masih menyebut hasil tujuan memori, draft belum atomik atau CSP null. Sumber kini mempunyai snapshot/transaction dan CSP string. Gunakan sumber pemilik untuk status teknis; gunakan instruksi pengguna untuk jadwal. Sisa bukti UI/instalasi/pedagogi tidak dianggap selesai dari kode tersebut.

## 2. Matriks fitur aktual dan target

| Fitur | File pemilik aktual | Penyimpanan / efek samping | Status aktual dan batas | Keputusan / tujuan KLAB |
|---|---|---|---|---|
| Startup, seed, integrity | `src/App.tsx`, `main.tsx`, `data/seedLoader.ts`, Rust `run` migrations | SQLite config/entries/texts/cards; PRAGMA; auto-backup | Migration v1–v3 dan seed v12/content marker; guard init/seed idempotent; belum clean install baru | **Reuse**; `app/bootstrap.ts`, startup shell |
| Hari Ini / rekomendasi | `ui/pages/HariIni.tsx` planLesson/planDrill/loadAgenda; `srs/queue.ts` | baca lesson_progress/attempts/readings/config; ensureCards dapat menulis | Rekomendasi weakest drill min 4 sampel, D8 difilter audio; lesson mengikuti unlock | **Refactor** query ke `features/today/agenda.ts`; `today` |
| Lanjut pelajaran | `HariIni`, `Kurikulum`, `LessonRunner` | draft SQLite; rute kini hanya halaman umum | CTA bukan deep-link session lengkap; nested view lokal | **Refactor** typed lesson route + session registry; today→lesson |
| Waktu belajar/target/streak | `stats/studyClock.ts`, `stats/dates.ts`, `stats/queries.ts`, `srs/queue.ts`, `Pengaturan` | `study_ms:<date>`, goal config, attempts/reading/progress aggregates | Clock input+focus/visible/idle30s, interval15s; tes mock clock baru lulus; lifecycle Android belum | **Reuse** + lifecycle adapter; today dan profile/stats |
| Kurikulum A1–B2, unit/unlock | `lessons/units.ts`, `ui/pages/Kurikulum.tsx`; 4 units JSON | lesson_progress(unit_no,lesson_no); lesson 99 untuk CP | 42 unit/96 pelajaran, bukan bukti validitas seluruh level | **Refactor** UI dan akses lifetime/per-round; explore/materials→unit |
| Materi, recap, slide, contoh, teori | `LessonRunner.tsx`, `units_*.json` | step/slide/drillScore pada draft; vocab DB; speak | Lima langkah existing Recap/Mini-lesson/Drill/Kosakata/Review; body arrays, belum block ID | **Reuse konten**, reader panjang KLAB+stable IDs baru; lesson |
| Latihan pelajaran | `lessons/practice.ts`, `a1_lesson_practice.json`, `MiniDrill.tsx`, `drills/items.ts` | attempts+draft bila draftKey diberikan; current correctCount | 96 pelajaran punya practice terkait contoh; 17 pelajaran A1 punya 35 application items; sisanya tidak otomatis transfer | **Reuse** selektor/matcher/feedback, ekstrak controller; lesson→practice |
| Tujuan/checkpoint A1 | `lessons/objectives.ts`, `checkpointResult.ts`, `checkpointStore.ts`, `CheckpointRunner.tsx`, 12 bank | attempts(session_id,objective_id), lesson_progress + config.objective_result | 60 tujuan/300 soal, tiap unit15 CP; snapshot latest/best/ever_passed atomik; CP aktif belum draftKey, result ref memori | **Reuse policy/grading**; tambah persist sesi+ledger; checkpoint(unit,session) |
| Checkpoint legacy A2/B1/B2 | `CheckpointRunner` buildLegacyItems, `practice.ts`, `units.ts` | attempts/snapshot ringkasan | B1/B2 dari contoh, A2 gabungan contoh/vocab; tidak klaim asesmen tujuan | **Reuse jujur** label Pemahaman contoh; explore/unit→checkpoint |
| Remedial/retry | `objectives.ts` buildRemedialItems, `CheckpointRunner` | remedial/exclude keys memori; attempts remedial tanpa sessionId/draftKey pada panggilan sekarang | Soal pool tak dipakai pada CP; retry excludes CP terakhir, bukan seluruh riwayat putaran | **Refactor** session/seenKeys persist, tanpa ubah skor CP; checkpoint→remedial |
| Drill D1–D10 | `ui/pages/Drill.tsx`, `drills/items.ts`, `session.ts`, `attempts.ts`; 7 JSON D4–D10 | attempts; scheduleAgain D1; store Zustand | D1–D3 DB-generated; D4–D10 static; choice/type/order, timer10s, theory, keyboard/audio. generation/session guard ada; restart store belum | **Reuse** bank/store/aturan; persist per-session dan UI KLAB; explore/practice→drills(code) |
| FSRS/SRS | `srs/fsrs.ts`, `queue.ts`, `cards.ts`, `session.ts`, `review.ts`, `answers.ts`, `ui/review/ReviewCard.tsx`, HariIni | entries/cards/srs_state/attempts; save_review_atomic; progress_daily cache | 4 card types recog/produce/listen/cloze, due/quota/newLevel/audio filtering; antrean memori, review DB atomik | **Reuse** FSRS dan queue; session checkpoint dengan visitId, UI baru; today→srs dan explore/vocabulary→srs |
| Kosakata manual/edit/hapus | `ui/pages/Kosakata.tsx`, `srs/cards.ts`, `data/pronunciation.ts` | entries/cards/srs_state; config kuota/filter; cascade existing saat hapus kartu | Search/filter/sort/pagination 100, IPA/petunjuk, edit/delete konfirmasi; perubahan seed pengguna dipertahankan | **Reuse** CRUD, UI responsif; explore/vocabulary; legacy import di profile/tools |
| Kamus tap/bentuk kata→SRS | `reading/dictionary.ts`, `Membaca.tsx` | loadDictionary Map; ensureCards/saveWordToSrs; reading_log words_saved | Lemma candidates dan umlaut, popover current fixed width320; bukan kamus jaringan | **Reuse** pencocokan/save; sheet HP/popover desktop+keyboard; reader |
| Bacaan/per-kalimat/terjemahan/audio | `reading/texts.ts`, `Membaca.tsx`, `data/reading/*.json` | texts, reading_log saat selesai/kata saved; tts_rate config | 67 seed teks menurut tes seed; parse old string/object/tuple; translation id bukan stable ID; posisi memori | **Reuse** data/log; stable anchors/posisi, reader responsif; explore/reading→reader(textId) |
| Audio/bundle/Piper | `srs/tts.ts`, `manifest.json`, Rust PiperProc/commands | URL map, decoded buffer Map, number buffer, base64 Map max80; Piper files/model terpisah | Phrase/number lookup, timeout20s, voice/rate; root glob; belum koordinator cancel/byte-LRU publik | **Refactor** fasad compatible→audio/platform; dipakai semua layar |
| Hören/dialog pendek | `ui/pages/Latihan.tsx`, `data/practice/a1_listening.json` | pilihan/order/audio failure memori, speak loop; belum attempt domain persisten | 5 dialog/10 soal, 21 baris audio; transcript/retry/feedback | **Reuse** data+aturan; extract ListeningPanel/session; explore/practice→practice(listening,id) |
| Schreiben terpandu | `Latihan.tsx`, `a1_writing.json` | `localStorage lernen_writing_<id>`; checklist/model memori | 5 tugas; tanpa nilai otomatis, localStorage write belum flow gagal SQLite | **Reuse** tugas/rubrik; migrasi draft sesudah commit ke SQLite, fail status; practice(writing,id) |
| Percakapan bercabang | `Latihan.tsx`, `a1_conversation.json` | talkNode/log memori; TTS; graph statis | 4 skenario/30 node/39 opsi, tanpa siklus; teks+feedback, bukan AI/rekaman | **Reuse** cabang/text/audio; state persist, recorder opsional baru; practice(conversation,id) |
| Uji Tiruan A1 | `ui/pages/UjiTiruan.tsx`, `a1_mock_exam.json`, listening source | jawaban/checklist/timer memori; config.mock_a1_last_result setelah finish | 4 bagian, 10 item objektif/1 writing/3 speaking; score answered/skipped/audioFailed terpisah, rubrik mandiri | **Reuse** konten/batas grading; extract exam/session/results, retry simpan/sesi; explore/practice→exam |
| Statistik | `ui/pages/Statistik.tsx`, `stats/queries.ts`, `dates.ts` | baca attempts, srs_state, progress, readings, study config, snapshot objectives/mock | Heatmap/streak/weak items/forecast/level progress; label berdasarkan sampel, latest CP dan mock | **Reuse** query, rapikan view; profile/stats; ringkas today |
| Preferensi existing | `Pengaturan.tsx`, Kosakata/Membaca, `tts.ts` | daily_new/max/srs_new_level/daily_goal_min/tts_rate/piper_* config | TTS/setup tersedia; onboarding existing hanya audio flag localStorage | **Reuse** key lama; profile/settings; tidak menamainya mode onboarding KLAB |
| Backup/restore/recovery | `stores/backup.ts`, `FatalDatabase.tsx`, Rust backup_* / restore_tables | 13 tabel JSON; path mirror lokal; temp+rename, transaksi restore | Backup lama tanpa drafts diterima; recovery-to-file terpisah, kandidat valid berikutnya; SELECT export belum snapshot tunggal | **Reuse** perlindungan; snapshot export konsisten+skema baru; profile/recovery dan startup fail |
| Impor kosakata/teks, ekspor manual lama | `data/importWords.ts`, Kosakata, `reading/texts.ts` importText, Membaca, backup/Pengaturan | entries/texts/cards; JSON backup | Fitur tersedia saat ini; bukan UX utama baru yang diminta | **Pertahankan** backend/data/akses kompatibilitas Windows profile/legacy-tools; tidak memaksakan onboarding ekspor/impor |

### Kebutuhan KLAB tambahan — pemilik dan state gagal

Pencarian terarah `src`/`src-tauri/src` atas MediaRecorder/getUserMedia, XP, lencana, Catatan saya, highlight, unit_rounds dan putaran baru tidak menemukan implementasi fitur terkait. `pronunciation.ts notes[]` adalah petunjuk lafal, `.badge` adalah kelas UI, `lernen_audio_onboarding_done` adalah banner audio; ketiganya bukan fitur catatan/lencana/onboarding belajar baru. Tidak mengklaim pencarian tersebut membuktikan tidak ada file di seluruh drive.

| Kebutuhan | Reuse / yang ditambah | Pemilik persisten/aksi | Gagal / rute |
|---|---|---|---|
| Empat tab, nested navigation, restore | Reuse Zustand; typed routes/stacks/registry baru | nav + config last-route; sesi SQLite | ID invalid→daftar; save fail tetap editor; semua root |
| Terurut/bebas dan onboarding | Reuse unlock/progress; access policy+UI preferences baru | preferences.patch; lessons/access; tidak mengubah skor | load rusak default+pesan, patch retry; onboarding/profile/settings |
| Theme system/light/dark, text scale, quiet/motion | CSS lama sebagai alias transisi; token/store baru | config.ui_preferences_v1; effective OS theme | input tetap saat gagal; settings dan shortcut header |
| Catatan/sorotan | Reuse isi materi dan lookup sumber; notes/anchors baru | notes.save/remove dengan revision; durable blockId | quote orphan tetap tampil, save failed buffer retained; notes + lesson/reader |
| Rekam–bandingkan sendiri | Reuse audio+conversation; recorder/storage baru | platform recorder + recordings metadata, file stage/finalize | permission denied/full/empty/interrupt→lanjut tanpa rekam atau retry; practice/profile recordings |
| Meme/reaksi/soundboard | Aset belum siap; satu komponen reaksi+manifest baru | UI preferences; audio role reaction terpisah | missing asset fallback dekorasi statis, tidak blokir materi |
| Ulang unit / jumlah lulus | Reuse best/ever_passed sebagai bukti pernah, bukan count | UnitRounds.begin/complete + unique unit_passes + lifetime access | batal tidak write; retry same operationId; unit→dialog; count old unknown |
| XP/lencana | Query/domain event kecil baru | reward_events unique, commit bersama completion | save fail tidak award; no per-click; today/profile |
| Semua state: loading/kosong/bank kurang/gagal | Reuse FatalDatabase dan error patterns | tiap controller own Result/SaveState | tindakan lanjut eksplisit, sesuai tabel error arsitektur |

## 3. Pemetaan refactor per file

| Asal | Target tanggung jawab / tetap | Urutan aman |
|---|---|---|
| `App.tsx` | composition root, bootstrap readiness; `app/bootstrap.ts` baru | seed/integrity/backup tidak dilewati demi preview |
| `ui/Layout.tsx`, `PageShell.tsx`, `App.css` | shell KLAB + `ui/shell/*`, `ui/tokens.css` | alias token lama dan compatibility page mapping |
| `stores/nav.ts`, `ui/pages/index.ts` | typed route dispatch/lazy; registry halaman tetap saat transisi | pertahankan 9 rute legacy sampai pemanggil beralih |
| `HariIni.tsx` fungsi query | `features/today/agenda.ts`; view tetap sebelum diganti | parity rekomendasi/SRS sebelum komposisi visual |
| `Kurikulum.tsx View` | `app/routes.ts` unit/lesson/checkpoint; `lessons/access.ts` | global unit ID tetap, level display terpisah |
| `LessonRunner`, `MiniDrill`, `CheckpointRunner` | presentasi+controller dipisah saat irisan U4; domain existing tetap | jangan rewrite matcher/policy/option order |
| `lessons/persistence.ts`, `checkpointStore.ts`, `drills/attempts.ts` | tetap; envelope+revision/ledger txn ditambahkan kompatibel | perintah Rust existing dipakai, bukan 2 SQL di UI |
| `srs/session.ts`, `drills/session.ts` | tetap pemilik state; serialisasi ke sesi | review visitId dan generation guard dipertahankan |
| `Latihan.tsx` | Listening/Writing/ConversationPanel + session module | ekstraksi satu tab dahulu, data JSON sama |
| `UjiTiruan.tsx` | `features/exam/session.ts`, `results.ts`, halaman existing view | jangan mengubah nilai rubrik menjadi auto score |
| `Membaca`, `reading/*` | reader reusable + controls/dictionary sheet | `Sentence.id` tidak dipakai sebagai ID; translation preserved |
| `Kosakata`, `srs/cards`, `importWords` | CRUD existing + view responsif; legacy tools route | edit/hapus/import tetap bisa dibuka pada transisi |
| `srs/tts.ts` | fasad API lama → `audio/coordinator`, `bundle`, `platform/windows` | capability per teks, stop/cancel dan cache sebelum codec |
| `Statistik`, `stats/*`, `Pengaturan` | query/key config tetap; Profile hub baru | invalidasi sesudah commit; tidak menduplikasi source config |
| `backup.ts`, Rust `lib.rs`, `FatalDatabase` | tetap; snapshot export/allowlists + mobile recovery | ubah bersama schema migration, uji backup lama |
| `vite.config.ts`, tsconfig, lockfiles | tetap | preview entry/lazy chunks saat task-nya; tidak upgrade dependency kosmetik |

## 4. Inventaris terukur aset yang ada

Sumber lengkap **per file**: [asset-inventory.json](evidence-2026-11-17/asset-inventory.json). 1.024 entri mencakup path, ukuran byte/MiB, hash SHA-256, waktu modifikasi, consumer/keputusan/provenance; WAV mencakup kanal, sample rate, frames, durasi dan estimasi byte float32 decoded. Kelompok data/dist disertakan untuk membedakan sumber dengan output, bukan seluruhnya gambar siap pakai.

Metode: enumerasi file lokal, stat+SHA-256, JSON manifest, WAV header lewat Python `wave`; cocokkan glob root dengan file dan baca aturan import. Tidak mengukur APK/AAB/download/install/RAM runtime, tidak transcode, tidak menjalankan skrip generate (sebagian membaca Piper di profil produksi). MiB = byte / 1.048.576; label MB historis tidak disamakan tanpa hitung ulang.

| Scope/path | Jenis / jumlah | Byte | MiB | Pemakai / cakupan | Keputusan |
|---|---|---:|---:|---|---|
| `src/assets/` seluruh | 457 file:455 WAV+manifest+SVG | 36.795.279 | 35,0907 | folder sumber, bukan paket | audit subset actual import |
| semua WAV sumber | 455 WAV | 36.752.436 | 35,0499 | seluruh root+generated | simpan sumber, codec staging nanti |
| `src/assets/tts_core/*.wav` root | 454 WAV | 36.723.464 | 35,0222 | **seluruhnya** glob `eager:true,?url`, nonrecursive | reuse; semua root tetap emitted walau belum pernah diputar |
| `manifest.json` | 1 JSON | 38.717 | 0,0369 | static import `tts.ts`;453 phrases→453 file unik;200 number aliases→100 segmen | enrich metadata produksi, normalisasi tetap |
| `numbers_1_100.wav` | 1 WAV | 5.627.436 | 5,3667 | 100 segmen dari number index, bukan phrase ref | jangan lossy tanpa offset validation |
| `generated/test.wav` | 1 WAV | 28.972 | 0,0276 | di luar glob root, bukan phrase manifest | tidak ikut desain produksi; jangan hapus source sekarang |
| `src/assets/react.svg` | 1 SVG | 4.126 | 0,0039 | tidak ditemukan import pada src yang diperiksa | bukan aset KLAB; keluarkan dari release bila audit konsumen kosong |
| `public/vite.svg`, `tauri.svg` | 2 SVG | 4.102 | 0,0039 | public copy; vite favicon pada HTML perlu diganti saat identitas | bukan ikon KLAB; ganti referensi kemudian |
| `src-tauri/icons/` |16 file:14PNG+ICO+ICNS |162.539|0,1550|5 file explicitly configured bundle.icon; varian lain platform|pertahankan sampai icon production siap; provenance belum diaudit |
| `src/data/` |84 file:81JSON+3TS |1.196.732|1,1413|data/content/import/seed sources|bukan binary media; preserve |
| JSON saja `src/data/` |81 JSON |1.164.327|1,1104|static imports + glob eager|split per fitur jika ukur bermanfaat |
| `src/data/lessons/` |18 JSON |442.116|0,4216|4 level,12 bank,objectives,practice|reuse; review bahasa tetap terbuka |
| `src/data/practice/` |4 JSON |28.556|0,0272|Latihan/UjiTiruan|reuse; extract imports per fitur |
| `src/data/reading/` |6 JSON |65.276|0,0623|seedLoader `texts_*.json`|reuse; tetap user edits/deletions |
| `src/data/seed/` |46 JSON |603.291|0,5753|45 `words_*.json` glob +1 baseline static|bukan seluruhnya seed kata baru |
| `src/data/drills/` |7 JSON |25.088|0,0239|items.ts D4–D10 static imports|reuse |
| `dist/` **yang sudah ada** |459 file |38.060.032|36,2969|artefak lama, sebagian timestamp sampai16:55 WIB|hanya pengukuran historis; bukan build baru |
| WAV emitted existing dist |454 WAV |36.723.464|35,0222|cocok jumlah/byte root WAV, generated test tidak masuk|bukan APK terkompresi |
| JS/CSS emitted existing dist |1 JS +1 CSS |1.301.981+29.991|1,2417+0,0286|satu chunk utama; belum lazy-route|baseline untuk pengukuran berikutnya |

Semua WAV yang diperiksa mono PCM 16-bit 16 kHz. Number clip berdurasi175,856 detik, estimasi decode float32 11.254.784 byte (10,7334 MiB); ini hitungan header, bukan peak heap profiler. Tidak ditemukan file yang hilang dari 453 phrase refs. Root WAV di luar phrase refs tepat numbers_1_100.wav, yang diakses eksplisit oleh kode. Semua 455 WAV sumber tidak mempunyai hash byte duplikat; peluang dedup semantik perlu audit teks/lafal, tidak mengasumsikan audio identik.

453 file phrase melayani banyak consumer yang berbagi frasa. Jangan menjumlahkan jumlah teks domain sebagai file unik: tes audio lookup membuktikan coverage 178 kosakata+122 contoh+100 kalimat bacaan+21 baris listening+28 baris node percakapan dan14 item D8, dengan reuse indeks. Angka253/428 atau32,7MiB di dokumen lama bukan inventaris sekarang. Tes `test_a1_audio` mencetak25,4MiB untuk subset coverage-nya, bukan total root35,02MiB.

`tts.ts` saat ini Piper-first jika siap, lalu bundle; angka start/duration dipakai Web Audio. URL eager hanya membuat daftar URL/emit file, decode terjadi pada playBundle/fetch→decodeAudioData. `bundledBuffers` belum cap byte; number buffer ditahan, Piper base64 max80 entri; cache tersebut alasan optimasi RAM, bukan klaim seluruh audio sudah eager decoded.

### Empat JPG referensi yang diperiksa secara visual

| Path | Byte / MiB | Isi yang mengikat desain |
|---|---:|---|
| `outputs/ui-alternatif-2026-11-17/02-KLAB.jpg` |562.308 /0,5363|arah komik/kucing/warna, HP home+belajar dan desktop light/dark; nama KLAB contoh diganti Lernen menurut detail |
| `outputs/klab-detail-2026-11-17/01-Mulai-dan-Jelajah.jpg` |500.984 /0,4778|onboarding mode/kenyamanan, home, Jelajah dark |
| `outputs/klab-detail-2026-11-17/02-Belajar-dan-Umpan-Balik.jpg` |532.308 /0,5076|U4 lesson, percakapan/rekam, salah+penjelasan, hasil73% gagal |
| `outputs/klab-detail-2026-11-17/03-Perangkat-dan-Pengaturan.jpg` |478.069 /0,4559|tablet materi+notes, desktop notes3panel, HP settings, dialog putaran |

Tiga detail1536×1024 sesuai README; diinspeksi dengan image viewer pada tugas ini. Provenance README: image_gen, bukan asset pipeline produk. Empat JPG bukan halaman web, bukan sprite, bukan bukti runtime atau font berlisensi. Dua alternatif non-KLAB ikut terukur di JSON sebagai dokumen referensi tetapi tidak menjadi arah terpilih. Tidak membundel folder outputs.

### Provenance/lisensi aset existing

`scripts/generate_tts_bundle.py`, `generate_a1_core_tts.py`, `generate_a1_reading_tts.py`, `generate_dialogue_tts.py`, `generate_conversation_tts.py` menunjukkan jalur generasi melalui Piper; contoh skrip menunjuk `de_eva_k_x_low.onnx` di profil Windows. Rust mem-pin unduhan voice dan engine. Ini **bukti rute generasi**, bukan audit lisensi masing-masing WAV/model. Tambahkan model card/license/hash/versi/penutur/output terms per batch sebelum distribusi publik; jangan mengambil status lisensi dari nama file atau satu situs. Lisensi ikon template/font/model/bahan konten belum diperiksa secara menyeluruh.

Pencarian media pada src/assets/public menemukan WAV/JSON/SVG template tersebut; tidak menemukan font WOFF/TTF lokal, mascot KLAB, ilustrasi kafe terpisah, meme/soundboard produksi. Infrastruktur berikutnya menambah `src/klab/Mascot.tsx` dan `Icon.tsx` berupa studi SVG original dalam kode; bukan set pose/ilustrasi/font produksi yang sudah siap. Inventaris sumber nyata tidak boleh diganti dengan daftar aset internet yang belum dipilih.

## 5. Inventaris aset produksi yang perlu disiapkan — terpisah dari JPG

Semua baris berikut adalah **belum dibuat/kurasi**, bukan file siap bundle. Kuantitas adalah ruang lingkup batch awal, tidak harus membuat variasi per soal. Penamaan target adalah keputusan persiapan.

| ID / path target | Jumlah awal / format | Consumer | Kriteria siap & keputusan ukuran |
|---|---|---|---|
| `assets/klab/brand/lernen-wordmark.svg` |1SVG +varian kontras jika perlu|shell/onboarding|Lernen, sapuan garis, baca light/dark; provenance orisinal |
| `assets/klab/mascot/{welcome,calm,encourage,think,celebrate}.webp` |5pose transparan, ukuran1x/2x seperlunya|home/onboarding/feedback/result|kucing putih,telinga biru,syal merah konsisten; tidak mengejek; quiet fallback; bukan crop JPG |
| `assets/klab/comics/a1-u4-cafe-{01,02}.webp` |2panel tanpa paragraf teks tertanam|reader/conversation U4|karakter/lokasi sesuai mockup, balon+teks DOM; alt meaningful; perlu review bahasa pada dialog |
| `ui` SVG ornaments/halftone/ribbon |3–5 bentuk reuse|headers/ComicPanel/unit list|vektor sederhana lokal; dekorasi aria-hidden; tidak memenuhi background isi dengan noise |
| `assets/klab/icons/*.svg` |~20ikon inti satu gaya|nav,audio,notes,settings,results,backup|local SVG,label aksesibel,touch48; lisensi per sumber atau original |
| `assets/klab/badges/*.svg` |4lencana kebijakan awal|home/profile|aktivitas, bukan sertifikasi; dapat dirender statis; no gamification dependency |
| `assets/fonts/<family>-*.woff2` +LICENSE |1family,2bobot minimum|typography|file dipilih berlisensi, glyph Jerman lengkap, subset diuji, offline; tidak hotlink |
| `assets/klab/reactions/*` |maks3klip reaksi pendek awal|audio role reaction|default mati, label/provenance/license/volume,durasi singkat, lintas usia; tidak mengambil seluruh pack |
| `src-tauri/icons/*` generasi baru |varian platform dari1master|installer/launcher|wordmark/mascot konsisten; safe-area launcher/ukuran Android dibuktikan nanti |
| `assets/klab/manifest.json` atau build manifest |1JSON|build validation|setiap file: id/path/bytes/hash/format/duration/dimensions/source/license/attribution/consumer/review |

Usulan anggaran visual/ikon/reaksi **total5–10 MB**, audio A1 **15–30 MB** berasal dari spec dan belum dicapai/bukan total app. Awal produksi aset U4 saja agar fidelitas diuji sebelum mass production. Catat keputusan keep/optimize/exclude dengan ukuran actual, keterbacaan di320/360px, light/dark dan lisensi. Manifest baru menambahkan attribution lokal tanpa akun/jaringan.

## 6. Bukti baru, bukti historis dan keterbatasan

| Pemeriksaan baru | Hasil | Cakupan nyata |
|---|---|---|
| 15 `node scripts/test_*.cjs` (masing-masing dicatat log) |semua exit0|domain/bank/order/feedback/resume parser/audio lookup/seed/study clock; beberapa TS transpile+mock |
| `test_seed_sync`, `test_seed_upgrade` |exit0|SQLite :memory:, edit/hapus pengguna, retry/upgrade v11/v12; bukan upgrade profil produksi |
| `pnpm exec tsc --noEmit --incremental false` |exit0|typecheck sumber; bukan Vite emit/native/UI |
| `cargo test --locked --offline` dari src-tauri |exit0,8passed|transaksi review,attempt+draft,CP+snapshot/rollback,restore/recovered history,backup atomic file; test DB/files terisolasi |
| Python stat/hash/manifest/WAV header |exit0|path/byte/header/cakupan import; tidak mendengarkan audio |
| Empat JPG via image viewer |terinspeksi|komposisi statis, bukan screenshot per viewport runtime |

Daftar15Node: `test_a1_audio`, `test_a1_conversation`, `test_a1_mock_exam`, `test_a1_objectives`, `test_a1_option_order`, `test_a1_practice`, `test_audio_lookup`, `test_checkpoint_result`, `test_draft_migration`, `test_drill_session`, `test_lesson_practice`, `test_lesson_resume`, `test_seed_sync`, `test_seed_upgrade`, `test_study_clock` (semua `.cjs`). Tidak ada `npm test` terpadu di package.json. Tes audio lookup meniru normalisasi kode; bukan end-to-end pemutaran. Test resume parser bukan crash recovery menyeluruh. Tes drill session memeriksa generation/start dengan mock, bukan restart installer.

Bukti historis yang dibaca: [paket Windows](../../outputs/audit-windows-2026-11-17/README.md), [kekurangan](../../outputs/audit-windows-2026-11-17/DAFTAR-KEKURANGAN.md), handoff lengkap. Unit1–3 gagal/remedial/retry dan4–12 full-pass serta MSI/NSIS build dilaporkan di sana; tidak dijalankan ulang pada tugas ini. Installer29,18/28,40MiB adalah hasil Windows historis, tidak memprediksi APK. QA UI restart/save-fail/restore, pemasangan bersih, telaah pengajar dan pilot masih perlu bukti owning task terbaru sebelum gate0 lulus.

Belum diverifikasi sekarang: build Vite/rilis baru, pemasangan bersih Windows, UI runtime/keyboard/pembaca layar/200%, listening kualitas suara, semua perilaku suspend/crash, Android toolchain lengkap/ABI/permission/CSP/WebView codec/back gesture, APK/AAB/ruang terpasang, lisensi distribusi semua aset, manfaat pedagogis. Aplikasi awal dan migrasi KLAB tidak dinyatakan selesai.
