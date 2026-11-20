# Rencana Kerja Tiga Agent untuk Penyelesaian Lernen Windows

> Untuk agent pelaksana, gunakan skill implementasi, debugging, dan verifikasi yang relevan sesuai AGENTS.md. Kerjakan tugas berurutan dalam bidang masing-masing dengan bukti hasil. Rencana ini merupakan penugasan pengguna melalui koordinator Codex pada 17 November 2026 dan menggantikan usulan pembagian tugas lama di hub.

Tujuan pekerjaan adalah menyelesaikan kekurangan Windows dalam PRD v1.3 bagian 0.3 dan 0.7. Prioritas konten adalah A1. Port Android, adaptasi HP/tablet, perombakan besar KLAB, perluasan bank A2/B1/B2, dan F7 AI lokal berada pada tahap lanjutan.

Repositori kerja adalah `.`. Stack yang dipertahankan adalah Tauri 2, React, TypeScript, Rust, dan SQLite. Baca PRD, HANDOFF-LERNEN.md, dan bukti audit terbaru sebelum menyunting.

## Koordinasi dan keselamatan pekerjaan

- Gunakan hub yang sudah ada di `<agent-sync>`. Agent 1 menjadi satu-satunya penulis STATE.md. Setiap agent menulis status sendiri dan mengirim pesan ke inbox tujuan secara append-only, ASCII, dengan waktu WIB.
- Klaim daftar file sebelum menyunting. Satu file memiliki satu pemilik. Permintaan perubahan file milik agent lain dikirim melalui inbox berisi tujuan, lokasi, contoh masalah, dan tes penerimaan. Pemilik file mengerjakan perubahan tersebut.
- Kerjakan di working tree yang sekarang. Perubahan tracked dan untracked yang sudah ada merupakan baseline pengguna. Pertahankan perubahan tersebut. Hindari reset, clean, penggantian branch, serta commit/push yang belum disepakati pengguna.
- Setiap tugas menggunakan status MENUNGGU, BERJALAN, SIAP_DITINJAU, LULUS, atau TERHAMBAT. Catat ID tugas, file, ringkasan perubahan, perintah tes, exit code, batas bukti, dan kebutuhan agent lain. Status LULUS memerlukan hasil tes yang telah diperiksa.
- Agent 1 dan Agent 2 menjalankan tes modul dengan SQLite terisolasi atau di memori. Agent 3 memegang aplikasi QA, port pengembangan, target build, pengujian UI, dan build rilis. Kirim kebutuhan tes UI ke Agent 3. Pembuatan dan pengujian paket akhir menunggu pelepasan file dari seluruh pemilik.
- Data produksi `app.lernen.desktop`, instalasi pengguna, dan backup produksi dipertahankan. Tes memakai profil terisolasi. Instalasi bersih dijalankan dalam lingkungan terisolasi yang benar-benar tersedia dan tidak menggantikan instalasi produksi.
- Jika sebuah tes gagal, diagnosis dan perbaiki akar penyebab pada bidang sendiri. Sampaikan masalah lintas bidang melalui inbox. Keputusan implementasi rutin diselesaikan mandiri dalam lingkup PRD.
- Setelah tugas selesai, kirim bukti dan pelepasan daftar file ke Agent 1 dan agent penerima terkait. Agent 1 merekonsiliasi STATE.md. Komunikasi ini juga diperlukan ketika pekerjaan melintasi batas konteks atau sesi.

## Pembagian kepemilikan file

| Pemilik | File dan area yang boleh disunting |
|---|---|
| Agent 1 | `src-tauri/src/lib.rs`, Cargo.toml/Cargo.lock bila dibutuhkan; `src/data/seedLoader.ts`, `src/data/importWords.ts`; `src/stores/db.ts`, `src/stores/backup.ts`; `src/ui/FatalDatabase.tsx`; `src/drills/attempts.ts`, `src/drills/session.ts`; modul SRS selain `tts.ts` dan `answers.ts`; `src/lessons/drillDraft.ts` dan modul persistensi baru yang benar-benar diperlukan; `src/ui/lessons/LessonRunner.tsx`, `MiniDrill.tsx`, `CheckpointRunner.tsx`; tes seed, resume, transaksi, dan checkpoint gagal simpan; STATE.md; dokumen penerimaan, README.md, dan handoff akhir |
| Agent 2 | `src/lessons/objectives.ts`, `practice.ts`, `feedback.ts`, `units.ts`; `src/data/lessons/`, JSON konten A1 pada seed/reading/practice, data drill dan `src/drills/items.ts`; `src/srs/answers.ts`; `src/ui/pages/Latihan.tsx`, `UjiTiruan.tsx`, `Kurikulum.tsx`, `Statistik.tsx`; `src/stats/queries.ts`; tes objektif, feedback, praktik, percakapan, dan mock exam serta tes regresi penilaiannya |
| Agent 3 | `src/srs/tts.ts`, `src/assets/tts_core/`, generator dan tes audio; `src/ui/pages/Membaca.tsx`, `Drill.tsx`, `Pengaturan.tsx`, `HariIni.tsx`, `Kosakata.tsx`; `src/App.tsx`, `App.css`, `src/ui/Layout.tsx`, `PageShell.tsx`, `src/stats/studyClock.ts` dan tesnya; `src-tauri/tauri.conf.json` dan konfigurasi QA/capability terkait; bukti QA/audio/aksesibilitas/rilis; artefak build akhir |

File di luar daftar dibahas melalui inbox sebelum disunting. Tetapkan satu pemilik lalu catat keputusan di STATE.md. Penambahan tes baru memakai nama sesuai kasus dan pemilik, sehingga agent lain tidak menimpa tes yang sama.

## Agent 1 - ketahanan data dan integrasi penyimpanan

### DB-01 Upgrade seed dari instalasi lama

- [ ] Reproduksi upgrade memakai seed asli dari HEAD `c45e0dd`, marker v11, dan kondisi tanpa snapshot. Tambahkan kasus edit pribadi, penghapusan lama, serta konten yang benar-benar baru.
- [ ] Perbaiki pembedaan konten lama yang dihapus dan konten baru pada seedLoader.ts. Uji kegagalan sebagian serta retry. Tangani juga profil yang sudah menerima snapshot v12 bermasalah, dengan tetap menjaga perubahan pengguna.
- [ ] Buktikan penambahan 120 kosakata dan 17 bacaan yang hilang dari skenario audit. Jika konten Agent 2 berubah, laporkan delta berdasarkan manifest baseline dan konten terkini.
- [ ] Uji peluncuran ulang, idempotensi, edit, penghapusan, dan koreksi aman. Nilai marker versi saja belum membuktikan seluruh konten terpasang.

### DB-02 Checkpoint gagal simpan dan penghitungan jawaban

- [ ] Reproduksi 11/15 atau 73 persen dengan hitungan tujuan `[3,3,2,2,1]`. Tujuan terakhir harus gagal.
- [ ] Suntikkan kegagalan penyimpanan lesson_progress, lalu retry. Hasil harus tetap gagal dengan hitungan maksimal 3/3 per tujuan. Data jawaban lama tidak boleh ikut dihitung pada percobaan baru.
- [ ] Pertahankan hasil sesi saat menyimpan dan tampilkan kegagalan beserta tindakan retry yang jelas. Pastikan retry menyimpan hasil yang sama sekali secara efektif.
- [ ] Gunakan aturan penilaian dan kesiapan bank yang dikirim Agent 2. Untuk pilihan yang memang tersedia sebagai tombol, cocokkan opsi dengan kunci/alternatif sah secara tepat sehingga pengecoh kapitalisasi tetap salah. Pertahankan kebijakan input ketik yang sesuai tujuan.
- [ ] Pertahankan kelulusan historis sesuai perilaku yang disepakati, sambil memisahkan hasil percobaan terkini dan skor terbaik.

### DB-03 Transaksi sesi dan progres

- [ ] Rancang penyimpanan jawaban, posisi sesi/draft, serta perubahan progres terkait dalam transaksi SQLite dengan identitas sesi dan item yang stabil.
- [ ] Simpan lesson_progress dan objective_result sebagai satu unit transaksi. Pertahankan kompatibilitas format snapshot yang dibaca Statistik, atau kirim kontrak migrasinya kepada Agent 2 sebelum perubahan.
- [ ] Migrasikan draft lama dari localStorage secara aman. Backup/restore dan daftar tabel yang diizinkan harus mencakup data baru. Periksa seluruh pemanggil yang terdampak.
- [ ] Uji keluar/navigasi, restart, gagal sebelum commit, gagal setelah commit sebelum respons UI, dan retry. Jumlah attempt, posisi, serta hasil tujuan harus konsisten tanpa penggandaan.
- [ ] Cegah jawaban sesi drill lama mengubah sesi baru setelah operasi async selesai. Kirim kontrak status submitting dan pergantian sesi kepada Agent 3 untuk Drill.tsx.

### DB-04 Backup dan penutupan bukti

- [ ] Pastikan penulisan backup memublikasikan file lengkap dan pemulihan tetap dapat memakai backup valid ketika kandidat terbaru rusak. Uji di profil terisolasi.
- [ ] Jalankan tes modul terkait dan cargo test. Kirim hasil serta instruksi reproduksi ke Agent 3.
- [ ] Setelah seluruh bukti diterima, perbarui matriks P1-P9, STATUS-AUDIT-01-25, DAFTAR-KEKURANGAN, BUKTI-PENGUJIAN, HANDOFF-LERNEN.md, dan README.md. Status seed yang sebelumnya ditutup perlu disesuaikan dengan bukti DB-01.

## Agent 2 - validitas penilaian dan kualitas alur belajar A1

### NILAI-01 Opsi dan bank checkpoint

- [ ] Reproduksi pola 184/184 pilihan ganda A1 berkunci opsi pertama serta seluruh soal objektif Uji A1. Perbaiki pengacakan opsi saat percobaan dibuat dan pertahankan urutan saat resume.
- [ ] Periksa checkpoint, remedial, latihan mendengar, dan mock exam. Identitas soal serta kunci harus tetap stabil ketika opsi diacak.
- [ ] Koreksi soal ambigu atau bertentangan, termasuk koran di sofa, an + dem/an der, ledig/geschieden, dan pengecoh Musik/musik serta schwimmen/Schwimmen.
- [ ] Pastikan tuntutan soal sesuai tujuan. Bedakan pengenalan contoh dan penerapan. Bank yang kurang harus berstatus belum siap dan tidak menghasilkan bukti penguasaan.
- [ ] Kirim kepada Agent 1 permintaan patch MiniDrill dan CheckpointRunner dengan aturan kelulusan, pemetaan jawaban, penanganan bank kurang, serta kasus 73 persen dan satu tujuan gagal. Agent 1 yang menyunting kedua file runner tersebut.
- [ ] Tambahkan tes regresi posisi opsi dengan sumber acak terkontrol, resume urutan opsi, jawaban alternatif, pengecoh kapitalisasi, dan bank tidak cukup. Uji konten yang benar-benar terpilih sebagai checkpoint.

### NILAI-02 Materi, remedial, dan pelaporan

- [ ] Periksa keselarasan 12 unit dan 36 pelajaran A1 terhadap tujuan, prasyarat, penjelasan Indonesia, contoh, pembanding, ringkasan, dan latihan bertahap. Dahulukan 17 pelajaran yang masih bertumpu pada terjemahan contoh yang sama.
- [ ] Lengkapi feedback relevan dan rute remedial ke penjelasan lalu kembali ke sesi. Kirim perubahan runner kepada Agent 1 melalui inbox.
- [ ] Perbaiki pelaporan tugas dilewati, audio tidak tersedia, rubrik mandiri, dan kemampuan yang belum dinilai. Terapkan pada Latihan, Uji A1, dan Statistik sesuai bukti yang tersedia.
- [ ] Bekukan teks A1 yang dipakai audio dan kirim daftar file beserta hash ke Agent 3. Perubahan teks sesudah serah-terima memerlukan pemberitahuan regenerasi audio.
- [ ] Siapkan catatan revisi bahasa dan skenario telaah pengajar/pilot pembelajar. Pertahankan status belum ditinjau sampai ada pelaksanaan manusia yang dapat dibuktikan.
- [ ] Kirim kasus uji benar/salah/remedial/retry Unit 4-12 ke Agent 3, termasuk hasil yang diharapkan per tujuan.

## Agent 3 - audio, kegunaan Windows, dan QA rilis

### AUDIO-01 Pemakaian audio melalui alur normal

- [ ] Reproduksi bacaan A1 yang WAV-nya ada tetapi tombolnya terblokir saat Piper tidak terpasang. Gunakan kemampuan audio per konten agar klip bawaan dapat dipakai.
- [ ] Perbaiki normalisasi audio angka 33 pada D8, termasuk huruf eszett yang diubah menjadi ss. Uji semua 14 item, termasuk kegagalan audio serta tindakan lanjut.
- [ ] Lengkapi audio inti percakapan yang sebelumnya baru tercakup 3/30 baris. Regenerasi akhir menunggu pembekuan teks dari Agent 2. Pertahankan manifest dan ukuran paket yang terukur.
- [ ] Verifikasi pemutaran nyata pada profil tanpa Piper untuk kosakata, slide, bacaan, dialog, percakapan, serta Uji A1. File WAV yang ada harus benar-benar dapat dipakai melalui layar normal.
- [ ] Kirim kebutuhan perubahan Latihan/UjiTiruan kepada Agent 2. Gunakan kontrak speak/hasBundledAudio yang konsisten dan catat batas audio yang masih belum tercakup.

### UI-01 Kegunaan dan aktivitas belajar

- [ ] Tangani submitting pada Drill.tsx sesuai kontrak Agent 1 agar katalog/sesi baru tidak menerima efek jawaban lama.
- [ ] Uji Tab, Enter, Space, fokus, label, feedback gagal, pembesaran 125-200 persen, dan pembaca layar pada alur utama Windows. Perbaiki file yang dimiliki dan kirim temuan file lain ke pemiliknya.
- [ ] Perbaiki pelacakan waktu/streak agar aplikasi terbuka tanpa aktivitas belajar tidak otomatis menambah waktu belajar. Koordinasikan data Statistik dengan Agent 2.
- [ ] Tinjau CSP berdasarkan kebutuhan aktual Windows, audio, dan unduhan. Verifikasi fungsi terkait setelah setiap perubahan konfigurasi.

### QA-01 Integrasi dan paket Windows

- [ ] Tunggu pemberitahuan SIAP_DITINJAU dan pelepasan file dari Agent 1 serta Agent 2. Catat hash file sumber dan konten yang diuji. Selama QA akhir, perubahan sumber dikoordinasikan terlebih dahulu.
- [ ] Jalankan ulang seluruh tes Node yang relevan, cargo test --locked --offline, dan pnpm build. Kegagalan baru dikirim ke pemilik dan diuji ulang setelah diperbaiki.
- [ ] Jalankan UI Unit 4-12 dengan jalur gagal -> remedial -> retry. Uji pula kelulusan benar, 73 persen dengan satu tujuan gagal, kegagalan simpan/retry, resume, dan audio tanpa Piper. Simpan bukti per unit/kasus dan hasil per tujuan.
- [ ] Periksa kemampuan VM/Windows Sandbox/lingkungan bersih yang tersedia. Jalankan pemasangan MSI dan NSIS secara terisolasi jika tersedia, termasuk startup offline, restart, upgrade, pemulihan data QA, dan uninstall. Ekstraksi administratif dicatat sebagai bukti ekstraksi.
- [ ] Jika lingkungan instalasi bersih belum tersedia, catat hambatan konkret dan siapkan langkah reproduksi. Lanjutkan QA lain yang dapat dikerjakan dan laporkan kebutuhan lingkungan kepada koordinator.
- [ ] Jalankan pnpm tauri build setelah kode/konten stabil. Catat path MSI/NSIS, ukuran byte/MiB, waktu WIB, SHA-256, serta sumber yang digunakan. Build rilis akhir hanya dikerjakan Agent 3.
- [ ] Kirim bukti ke Agent 1 untuk rekonsiliasi dokumen penerimaan. Nyatakan batas uji audio manusia, bahasa, dan pilot berdasarkan pelaksanaannya.

## Serah-terima dan kriteria akhir

Urutan kerja dimulai paralel. Agent 1 mengerjakan DB-01 dan DB-02, Agent 2 NILAI-01, serta Agent 3 AUDIO-01 dan UI-01. Agent 1 dan Agent 2 menyepakati aturan penilaian/persistensi melalui inbox. Agent 2 mengirim pembekuan teks kepada Agent 3 sebelum regenerasi audio akhir. QA-01 dimulai sesudah seluruh perubahan terkait siap ditinjau.

Setiap serah-terima memuat ID tugas, daftar file/hash, kontrak yang berubah, langkah reproduksi, perintah dan hasil tes, batas yang belum diuji, serta penerima berikutnya. Temuan yang berdampak pada data atau kelulusan dikirim segera ke semua pihak terkait.

Penutupan teknis Windows memerlukan bukti bahwa celah penilaian, upgrade, transaksi, pemulihan, audio, dan kegunaan sudah ditangani pada sumber yang sama dengan paket rilis. Matriks PRD harus tetap mencantumkan kriteria yang belum terpenuhi. Telaah pengajar dan pilot pembelajar memerlukan bukti dari peserta nyata. Sasaran A2/B1/B2 dan versi lain baru dijadwalkan setelah status tahap Windows direkonsiliasi.
