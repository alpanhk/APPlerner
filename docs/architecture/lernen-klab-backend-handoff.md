# Kontrak penghubung frontend KLAB → backend Lernen

17 November 2026. Pengguna meminta infrastruktur frontend disiapkan sekarang dan backend tetap dikerjakan agent1–2–3 OpenCode. Dokumen ini adalah kontrak penyerahan, bukan implementasi native/SQLite baru. Pada tahap infrastruktur belum dikirim perintah ke sesi mereka. Setelah pengguna secara eksplisit meminta pembagian/perintah, penugasan **BACKEND-20261117-02** dikirim ke ketiga sesi existing; [rincian tugas](../superpowers/plans/2026-11-17-lernen-backend-agent123-followup.md), [bukti penerimaan API](../../outputs/backend-followup-2026-11-17/dispatch-receipts.json). Status pelaksanaan tetap dilaporkan pemilik agent, bukan dianggap selesai dari penerimaan pesan.

## Yang sudah disiapkan frontend

- `src/klab/routes.ts`: union Route/Tab dan mapping9halaman legacy; identitas sesi sebagai parameter, bukan seluruh soal di route.
- `src/klab/navigation.ts`: `createNavigation()` Zustand vanilla, empat stack maks20, nested back dan tab session retention. Belum persisten/dipasang ke App awal.
- `src/klab/contracts.ts`: tipe kecil untuk failure/result/save state, preferences, note anchors, quiz sessions, putaran/receipt, audio, recorder dan `BackendPorts`. Semua import domain memakai `import type`, terhapus dari JavaScript preview.
- Shell/token light-dark dan preview fixture terpisah; tidak memiliki adapter produksi, SQL atau invoke. Fixture save/retry hanya state memori dengan label jelas. Refresh bukan persistence.

Jalankan dari root:

```powershell
node scripts/test_klab_frontend.cjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite --config vite.frontend.config.ts
```

Preview: `http://127.0.0.1:1425/frontend-preview/`. Build hanya preview: `pnpm exec vite build --config vite.frontend.config.ts`, output terpisah pada `outputs/frontend-infrastructure-2026-11-17/dist`. Konfigurasi utama/port1420 dan target native tidak dipakai.

## Yang tetap menjadi sumber kebenaran backend/domain existing

| Area | Pemilik sumber sekarang | Catatan penghubung |
|---|---|---|
| DB/migrations | Agent1, `stores/db.ts`, Rust `lib.rs` | v1–v3 dipertahankan; nomor migrasi berikutnya dicek ulang saat mulai |
| Attempt+draft | Agent1, `drills/attempts.ts`, `lessons/persistence.ts`, Rust `save_attempt_with_draft` | sudah atomik bila draftKey diberikan; bukan semua caller otomatis |
| CP result | Agent1, checkpointStore/Rust save_checkpoint_result; policy Agent2 objectives/checkpointResult | latest/best/ever_passed sudah ada, ledger complete belum |
| Grading/bank/feedback/option order | Agent2, lessons/* + data/* | controller frontend wajib memanggil modul ini, bukan menulis grader baru |
| FSRS | Agent1, srs/* selain pembagian existing | save_review_atomic dipakai, antrean sesi belum persist |
| Audio | Agent3, srs/tts.ts + aset | speak/capability existing tidak diubah; future adapter perlu cancel/release |
| Backup/recovery | Agent1 DB/backup/FatalDatabase; Agent3 QA | perlu ikut setiap skema baru, tidak hilangkan backup lama |
| QA/rilis/App awal | Agent3 | frontend ini tidak mengambil App/layout/port/build native |

## Permintaan kontrak untuk tahap integrasi nanti

`contracts.ts` adalah rujukan nama/tanda tangan yang sudah dikompilasi. Backend boleh mengusulkan penyesuaian dengan dampak caller/test yang jelas; tidak perlu membuat semua layanan sekarang untuk sekadar menutup Windows.

1. **Result/error.** Kegagalan dikembalikan sebagai `{ok:false,error:{code,message,retryable}}`; jangan success sebelum commit. Petakan native string lokal ke code yang disepakati tanpa membuang detail log. Preview tidak otomatis mengganti backend error dengan mock.
2. **Preferences.** `load/patch` untuk `ui_preferences_v1`, patch tervalidasi dan serialized. Key existing daily/tts/piper tetap pemiliknya, tidak dipindah duplikat ke object baru. Mode free/ordered tidak reset data atau memperluas kuota SRS sendiri.
3. **Notes/anchors.** `list/save/remove`, expectedRevision; missing source tidak cascade-delete. Body/quote disimpan walau anchor tidak cocok. Butuh stable `blockId`; `Sentence.id` existing adalah terjemahan Indonesia, jangan dipakai sebagai ID. Sidecar/migrasi stabil dibahas bersama konten Agent2.
4. **QuizSessions.** `create/load/answer/advance/pause`, expectedRevision dan soal/order/seenKeys yang dikunci. answer menerima chosen, domain existing menilai. Hasil commit stale ditolak atau receipt yang sama; draft lama tidak boleh menimpa posisi baru. SRS membutuhkan visitId berbeda untuk again, bukan dedupe seluruh kartu.
5. **UnitRounds.** `begin(unitNo,operationId)` hanya untuk unit pernah lulus; retry operationId sama→round sama. `complete(sessionId,grade,operationId)` commit hasil immutable+snapshot+pass unik/round+event XP; receipt diperiksa setelah restart sebelum retry. Payload berubah dengan ID sama→conflict. Tidak menghapus lesson_progress/SRS untuk memulai putaran. Angka XP masih usulan dalam spec, bukan keputusan wajib backend sekarang.
6. **Audio.** `AudioRequest` discriminated text vs recordingId. Satu sumber aktif, cancel stale Piper/loop dialog, promise selesai di end/cancel termasuk segmented numbers. Reaksi tidak memotong pelajaran. Android bundled-only untuk awal; Windows Piper tetap opsional.
7. **Recorder.** start/stop/save/discard/dispose; denied/unsupported tetap bisa belajar. Protokol stage file→finalize→metadata + recovery journal, maksimum60detik/8MiB preview sebagai budget awal. Tidak ASR/score palsu; berkas private, no upload.
8. **Backup.** Export source tables perlu read transaction konsisten, tidak hanya atomic file rename. Skema baru ikut TABLES/optional restore allowlist/recover migrations/tests. Jelaskan backup rekaman metadata-only atau ikut file manifest. Restore lama tidak boleh rusak.

## Bukti integrasi yang harus dikirim pemilik backend

- Hash file kontrak/source dan versi schema/content yang diuji; payload contoh sukses/gagal/conflict.
- Tes isolated DB: fail-before-commit, commit-before-response/retry, duplicate/stale, legacy upgrade/backup/restore.
- CP73%[3,3,2,2,1] gagal, per-objective cap3, result tetap saat gagal; count pass1→begin1→fail1→pass2 tanpa double count.
- Resume soal/order/answers dari snapshot; semua jenis sesi termasuk listening/writing/conversation/exam/SRS punya batas dukungan yang jelas.
- File yang dilepas dan bukti UI/native dari Agent3. Modul/transaksi lulus tidak otomatis menutup perangkat/installer/pedagogi.

STATE.md tetap hanya ditulis Agent1; status agent lain tidak ditimpa. Penugasan terbaru dicatat append-only pada inbox masing-masing dan status Codex sendiri; perintah yang sama dikirim melalui API sesi setelah diminta pengguna, bukan pekerjaan duplikat. Ketentuan tambahan pengguna: seluruh konten lama wajib ada di aplikasi baru sesuai standar capaian PRD, dibuktikan terhadap baseline CONTENT-PARITY beserta delta/konten pengguna. Full migration tetap menunggu [gate0](lernen-klab-frontend-migration-plan.md#gate-0--aplikasi-awal-siap).
