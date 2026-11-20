# Penugasan lanjutan backend Agent 1–2–3

ID: **BACKEND-20261117-02**. Tanggal:17November2026, Asia/Jakarta. Ditugaskan langsung oleh pengguna melalui Codex. Pengguna meminta perintah diberikan kepada tiga sesi OpenCode yang sudah ada dan menegaskan seluruh konten aplikasi lama wajib ada di aplikasi baru sebagai standar capaian yang mengacu PRD.

Tujuan sekarang: selesaikan ketahanan dan kelengkapan aplikasi awal Windows, siapkan batas layanan untuk frontend baru, lalu buktikan kesiapan integrasi. Infrastruktur `src/klab/` sudah tersedia secara terpisah; ini bukan izin mengganti App dengan fixture atau mulai Android/APK. Fitur KLAB baru seperti gamifikasi/rekaman/catatan produksi tetap mengikuti gate tahapnya, bukan alasan menunda penutupan aplikasi awal.

Dokumen ini melengkapi [pembagian file sebelumnya](2026-11-17-lernen-windows-three-agent.md); gunakan pembagian pemilik yang sama. Status/bukti lama harus diperiksa sebelum mengulang atau mengklaim pekerjaan selesai. Baca PRD §0, handoff terbaru dan status hub kanonik `<agent-sync>/`. Agent1 tetap satu-satunya penulis STATE.md.

## Ketentuan kelengkapan konten — berlaku bagi ketiga agent

Baseline beku: [legacy-content-baseline.json](../../architecture/evidence-2026-11-17/legacy-content-baseline.json), ID **CONTENT-PARITY-20261117-01**. Ini inventaris source aktual, bukan akses data produksi; tidak bergantung pada Git HEAD saja. Seluruh81JSON konten di-hash, unit/lesson/objective/bank/practice IDs dan manifest/audio root dicatat. Standar capaian tetap PRD: kesamaan hitungan saja belum membuktikan isi, tujuan atau kualitasnya terjaga.

Baseline minimum sekarang:

| Area | Jumlah/identitas yang harus terlacak |
|---|---|
| A1 |12unit,36pelajaran,60tujuan,300soal bank |
| A2/B1/B2 |masing-masing10unit dan20pelajaran; total seluruh level42unit/96pelajaran |
| Kosakata seed |2.134kata unik beserta artikel/plural/arti/contoh/tag dan hubungan SRS |
| Bacaan |67teks dengan level, isi kalimat, terjemahan dan metadata |
| Drill |D1–D10, termasuk bank/aturan generator/opsi/alternatif/feedback |
| Praktik A1 |5dialog mendengar/10pertanyaan;5tugas menulis;4percakapan/30node/39opsi |
| Uji A1 |4bagian dan seluruh soal/rubrik/model/transkrip/referensinya |
| Audio |454WAV root,453phrase refs,200alias→100segmen angka; semua pemetaan/transkrip tetap berfungsi |

**Syarat penerimaan aplikasi baru:** setiap konten lama memiliki identitas/pemetaan sumber→layanan→rute UI nyata, lengkap isi/tujuan/latihan/penilaian/feedback/audio yang sebelumnya tersedia. Tidak mengganti konten lengkap dengan4unit fixture, meringkasnya sampai tujuan hilang, menghapus level lanjutan, atau menghitung duplikasi sebagai kelengkapan. A1 tetap prioritas peningkatan kualitas, bukan alasan membuang A2–B2.

Koreksi bahasa/penilaian yang sah tetap diperbolehkan: catat IDpendahulu, delta alasan, dampak progres/soal dan bukti penerimaan; optimasi codec memakai pemetaan ekuivalen tervalidasi. Jangan meregenerasi baseline untuk menyembunyikan konten yang hilang. Tambahan konten sesudah snapshot menjadi delta tambahan yang juga wajib dibawa saat freeze integrasi. Konten yang belum ada menurut PRD dicatat sebagai kekurangan; tidak menganggap baseline otomatis memenuhi semua standar PRD.

Konten tambahan, edit/penghapusan, jadwalSRS, notes/draft/hasil pengguna lama dipertahankan melalui migrasi/backup/restore terisolasi. Jangan menghidupkan lagi seed yang sengaja dihapus pengguna untuk mengejar hitungan seed. Tes instalasi bersih mengharapkan katalog seed lengkap; tes upgrade mengharapkan edit/hapusan tetap benar. Jangan mengakses profil produksi untuk pembuktian ini.

## Agent 1 — database, sesi dan pemulihan

**Pemilik:** bidang/file Agent1 sebelumnya: Rust/SQLite, seedLoader/importWords, stores/db/backup, persistence/drafts, attempts/drill session, SRS selain audio/answers, runner Lesson/MiniDrill/Checkpoint. Tidak menyunting `src/klab/` atau file Agent2/3 tanpa serah-terima pemilik.

Urutan kerja:

1. Rekonsiliasi DB-01..04 dengan bukti terkini; pertahankan yang sudah lulus. Tuntaskan celah sesi yang masih nyata: checkpoint/remedial belum membawa draftKey, hasil/seenKeys lokal hilang saat membuka materi lalu kembali; serialisasi penulisan draft/mirror tidak boleh menimpa state terbaru. Reproduksi dulu, lalu perbaiki pada pemilik persistence/runner menggunakan transaksi existing, session ID dan revision/idempotency secukupnya. Simpan ulang tidak menggandakan attempt atau lulus.
2. Pastikan kelanjutan lesson/checkpoint/remedial dan state yang diakui tersimpan bertahan navigasi/restart/gagal simpan. Untuk listening/writing/conversation/exam milik Agent2, kirim kontrak repository sesi kecil sebelum mereka mengubah caller. Jangan menduplikasi aturan grading di Rust/UI.
3. Pastikan backup ekspor konsisten saat penulisan belajar berlangsung. Atomic rename file bukan snapshot DB; uji baca dalam transaksi atau mekanisme konsistensi nyata. Pertahankan restore backup lama, tabeldrafts, recovery kandidat rusak→valid dan file pemulihan terpisah. Setiap perubahan skema wajib ikut daftar backup/restore/recovery.
4. Siapkan pemetaan backend existing ke `src/klab/contracts.ts` dan [handoff backend](../../architecture/lernen-klab-backend-handoff.md). Tandai implemented/adapter-needed/deferred secara jujur; tidak membuat service notes/XP/recording palsu atau migrasi besar yang belum dibutuhkan tahap Windows.
5. Uji CONTENT-PARITY pada seed install/upgrade/edit/delete/partial+retry/restore, termasuk IDunit global dan link kartu/progres. Laporkan kehilangan/pemetaan konten ke Agent2; jangan ubah konten demi memudahkan migrasi.

Selesai bila kasus fail-before-commit, commit-before-response/retry, stale writer, resume dan backup lama lulus pada DB terisolasi; bukti UI yang masih diperlukan dikirim kepada Agent3. Kirim file/hash/kontrak/test+exitcode serta keterbatasan. Perbarui STATE dan dokumen penerimaan hanya berdasarkan bukti aktual yang diterima dari semua pemilik.

## Agent 2 — domain belajar, konten dan standar capaian PRD

**Pemilik:** file konten/domain/penilaian dan halaman Agent2 sebelumnya, termasuk Latihan/UjiTiruan/Kurikulum/Statistik; tidak menyunting runner Agent1 atau shell `src/klab/`.

Urutan kerja:

1. Buat matriks kesetaraan konten terhadap baseline beku dan PRD: setiap level/unit/pelajaran/tujuan/bank/vocab/bacaan/practice/exam→pemilik API/query→rute existing→rute KLAB target. Sertakan seluruh isi dan hubungan, bukan jumlah saja. Pertahankan seluruh42unit/96pelajaran dan konten lainnya;4unit fixture preview tidak dihitung sebagai migrasi konten.
2. Tambahkan tes terarah `scripts/test_content_parity.cjs` terhadap IDunik/field penting/referensi/ketersediaan sumber; delta yang sah ditinjau eksplisit. Test harus menangkap pelajaran hilang walau jumlah total disamakan duplikasi, tujuan/bank terputus, bacaan/terjemahan hilang, rubrik/cabang/opsi hilang dan kodeD1–D10 yang tidak terpetakan. Koordinasikan manifest audio dengan Agent3.
3. Tuntaskan celah A1 yang tercatat: keselarasan36pelajaran dengan tujuan/prasyarat/contoh/pembanding/ringkasan/latihan, feedback spesifik, bank kurang, soal alternatif/capitalization/option-order. Reuse grader tunggal;73%[3,3,2,2,1] tetap gagal. Konten A2–B2 tetap tersedia dengan label asesmen yang jujur, tidak diklaim tervalidasi otomatis.
4. Untuk state latihan/UjiA1 yang kini memori/localStorage, gunakan kontrak persistensi Agent1 bila disediakan: simpan chosen/order/writing/checklist/path/deadline dan last-result. Pertahankan tulisan bebas/rubrik mandiri tanpa nilai pelafalan palsu. Laporkan kontrak yang belum tersedia melalui inbox; jangan menambal dengan dua penulisan nonatomik.
5. Bekukan teks/referensi terbaru dengan hash dan delta ke Agent3 sebelum audio/QA akhir. Siapkan bahan telaah/pilot; status manusia tetap belum ditinjau bila belum ada pelaksanaan. Definisikan konten lama minimum dan gap PRD sebagai dua kolom terpisah.

Selesai bila matriks dan tes kesetaraan memberikan daftar kehilangan0 atau delta koreksi yang disetujui secara eksplisit, seluruh tes domain terkait lulus, dan kasus UI+hash diserahkan ke Agent3. Tambahan konten sesudah baseline wajib masuk delta freeze integrasi, tanpa mengubah baseline asal.

## Agent 3 — audio, integrasi backend dan QA Windows

**Pemilik:** audio/tts/assets/generator, halaman/config/App lama milik Agent3, aplikasi QA/port1420/build native/rilis. Infrastruktur frontend baru `src/klab/`, `frontend-preview/`, `vite.frontend.config.ts`, port1425 dan outputpreview adalah wilayah Codex; pertahankan sampai ada serah-terima integrasi.

Urutan kerja:

1. Cocokkan paket/binary terhadap hash sumber terbaru. Ada build setelah audit lama; jangan mengulang hasil installer lama sebagai bukti source sekarang. Tunggu release file terbaru Agent1/2 sebelum freeze QA akhir. Satu agent memegang aplikasi QA/targetbuild agar skenario tidak bertabrakan.
2. Validasi semua audio lama tetap reachable melalui alur normal tanpa Piper bila klip tersedia: kosakata/contoh/bacaan/dialog/percakapan/UjiA1 dan14itemD8. Manifest lookup/transkrip/segmen angka tetap ekuivalen. Pastikan loopdialog berhenti ketika sesi ditinggal, sumber tidak overlap atau diputar terlambat, gagal audio punya lanjutteks. Optimasi cache/codec hanya dengan ukuran dan uji keterpahaman/segmen; tidak menghapus audio demi targetukuran.
3. Jalankan QA tersisa yang benar-benar belum ada: draftlesson+CP/remedial kembali dari materi/restart, simpan gagal/retry, restore UI backup lama secara nyata pada profil terisolasi (bukan hanya preview tombol), kandidatbackup rusak→valid, upgrade/edit/delete, jalur gagal→remedial→retryUnit4–12 sesuai kasus Agent2. Keyboard/fokus/scale200% dan audio nyata Windows dicatat terpisah.
4. Uji akses konten seluruh katalog, minimal setiap item dapat di-resolve/ditampilkan oleh layanan/rute, bukan semua96lesson dijawab manual; verifikasi sampel lintasA1–B2 dan semua jenis latihan. Buat gate CONTENT-PARITY yang menolak kehilangan konten sebelum integrasi frontend dinyatakan siap. Nanti UIbaru harus memakai layanan/dataaktual yang sama; fixture bukan pengganti.
5. Periksa lingkungan clean-install yang tersedia. Jika belum ada VM/Sandbox yang layak, catat hambatan dan skenario reproduksi tanpa menyentuh instalasi produksi; jangan mengarang status installlulus. BuildWindows akhir setelah sumber stabil; catat SHA256/ukuran/WIB/sourcefreeze dan hasil tes yang benar-benar dijalankan.
6. Kirim laporan siapintegrasi backend dengan tabel supported/deferred/error, daftar blockerP1–P9 dan kesetaraan konten. Android/APK serta penggantian UIbesar tetap menunggu gate0 dan tahapport, bukan otomatis dijalankan dari tugas ini.

Selesai bila bukti normal/gagal/integrasi/audio/konten terlampir, seluruh check yang dapat dijalankan dilaporkan dengan exitcode, hambatan eksternal dinyatakan, dan Agent1 menerima paket untuk rekonsiliasi status. Buildberhasil sendiri tidak berarti produk selesai.

## Koordinasi dan perlindungan

- Klaim file sebelum edit di status agent sendiri; satu file satu pemilik. Perubahan caller milik agent lain diminta melalui inbox dengan kontrak/kasus/test.
- Hub kanonik tetap `<agent-sync>/`; append-only ASCII/WIB pada status/inbox. Jangan membuat hub baru atau menimpa statusagentlain.
- Source tracked/untracked pengguna dipertahankan; tidak reset/clean/commit/push. Data produksi `app.lernen.desktop` dan backup lama tidak dipakai tes. Profil QA/statebackend diisolasi; jangan silent fallback nativegagal→fixture.
- Dahulukan pekerjaan tersisa berdasarkan kode/bukti sekarang. Pekerjaan yang sudah lulus cukup dipakaiulang dengan hash/cakupannya; perubahanbaru memerlukan regresi terkait. Tidak menunggu pasif jika ada tugasmandiri yang aman.
- Output masing-masing: `outputs/backend-followup-2026-11-17/agent-N.md` berisi tugas/status/file+hash/kontrak/tes+exitcode/CONTENT-PARITY/delta/gapPRD/keterbatasan/serah-terima. Agent1 menambahkan indeks konsolidasi sesudah laporan diterima.
- Status `LULUS` tidak boleh menyembunyikan kehilangan konten atau gapPRD. Label `siapintegrasi` hanya bila kontrak dan perlindungan data/konten teruji; bukan pernyataan aplikasi baru sudah dipasang.
