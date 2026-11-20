# PRD — Aplikasi Belajar Bahasa Jerman (Pribadi)

| Keterangan | Nilai |
|---|---|
| Kode dokumen | PRD-DEU-001 |
| Versi | v1.4 — arah produk Windows, katalog 67, dan dialog RPG bertahap |
| Tanggal | 2026-11-19 |
| Nama aplikasi | **Lernen** (final — §13.1 dijawab) |
| Penerima | Masyarakat umum berbagai usia; **pelajar mandiri berbahasa Indonesia** sebagai pengguna utama; **pengajar bahasa Jerman sebagai penelaah** materi, penilaian, dan pedagogi — bukan sebagai syarat operasional aplikasi. |
| Status keputusan | Menyelesaikan **Lernen Windows** terlebih dahulu dengan prioritas A1, offline-first, dan perlindungan progres. **Android adalah fase berikutnya**, bukan prioritas aktif. Arah visual **KLAB Windows sudah digunakan** pada produk Windows, bukan lagi sekadar rancangan. Mutu A2–B2 memerlukan bukti tersendiri. Dialog RPG direncanakan bertahap untuk seluruh 67 bacaan; bukti mesin pilot bukan kesiapan produk, dan uji pengajar/pelajar masih harus dilaksanakan. §0.8 mengesampingkan keputusan 17 November yang bertentangan; §1–§14 dipertahankan sebagai sejarah. |

---

## 0. Pembaruan prioritas — 17 November 2026

**Cara membaca dokumen:** §0 adalah ketentuan terbaru dan mengesampingkan bagian lama jika bertentangan. Bagian §1–§14 dipertahankan sebagai sejarah dan rancangan awal, bukan bukti bahwa semua fitur, materi, penilaian atau klaim risetnya sudah terverifikasi. Salinan dalam repo `lernen-app/PRD-Aplikasi-Belajar-Bahasa-Jerman.md` adalah rujukan kerja utama; dokumen di folder induk adalah salinan pada tanggal pembaruan ini. Status implementasi dan langkah agent ada di `lernen-app/HANDOFF-LERNEN.md`.

### 0.1 Tujuan dan keputusan produk

Lernen membantu pembelajar berbahasa Indonesia belajar bahasa Jerman secara mandiri melalui pelajaran, penjelasan, latihan, pengulangan, membaca dan audio. Sasaran pengembangan berikutnya adalah **membuat A1 dapat dipelajari secara mandiri dengan bantuan yang memadai**, kemudian membawa standar kualitas yang sama ke A2, B1 dan B2. Aplikasi Windows tetap offline-first dan mempertahankan progres pengguna. Konten A2–B2 yang sudah ada tidak dihapus dan tidak dianggap lengkap hanya karena unit tersedia.

Pengguna menyetujui keenam arah perbaikan berikut sebagai prioritas produk: (1) memperkuat A1; (2) umpan balik kesalahan dan remedial; (3) checkpoint yang menguji tujuan pada contoh baru; (4) latihan mendengar dan menulis dalam konteks; (5) latihan bicara dan percakapan; (6) kurasi bahasa dan uji pengguna. Urutan pelaksanaan ada di §0.4. Instruksi saat ini adalah memperbarui PRD dan menyimpan progres; implementasi pengembangan dilakukan dalam pekerjaan berikutnya.

Tujuan personal 15–30 menit/hari atau estimasi tiga bulan adalah **rencana yang dapat disesuaikan**, bukan janji keberhasilan. Penyelesaian unit, angka statistik, atau estimasi 8/10 tidak membuktikan penguasaan CEFR atau kesiapan Goethe/telc. Angka 8/10 merupakan aspirasi penilaian subjektif, bukan hasil pengukuran atau kriteria kelulusan produk. Tampilkan apa yang diukur, jumlah sampel yang relevan, dan "belum dinilai" bila bukti tidak tersedia. Tidak menjanjikan bahwa aplikasi sendiri menjamin kelulusan ujian atau menggantikan interaksi manusia.

### 0.2 Masalah yang perlu diselesaikan

1. Contoh, latihan dan checkpoint sebagian masih menguji pilihan terjemahan contoh yang sudah dilihat, terutama B1/B2; itu tidak membuktikan pengguna dapat memakai aturan di situasi baru. Contoh nyata: nominalisasi B2 belum diuji secara memadai.
2. Beberapa materi pemula padat; penjelasan belum selalu menyediakan prasyarat, contoh dan pembanding yang cukup untuk orang tanpa guru.
3. Sebagian feedback menyatakan jawaban/terjemahan benar tanpa menjelaskan penyebab kesalahan atau memberi tindak lanjut yang terarah.
4. Mendengar TTS berbeda dari memahami dialog; mengetik bentuk pendek berbeda dari menulis pesan bebas. Cakupan dan asesmennya masih terbatas.
5. Belum ada asesmen bicara atau percakapan yang memadai; audio tersedia melalui Piper yang perlu disiapkan atau klip bawaan terbatas.
6. Mutu bahasa dan keterpahaman seluruh materi belum terbukti melalui peninjauan pengajar dan uji pembelajar mandiri. Penilaian sebelumnya bersifat tinjauan produk, bukan studi hasil belajar.

### 0.3 Kebutuhan dan kriteria penerimaan

| Kode | Kebutuhan | Kriteria penerimaan yang dapat diperiksa |
|---|---|---|
| P1-A1 | Materi dasar bertahap | Untuk setiap pelajaran A1 yang dinyatakan siap: tujuan dan prasyarat jelas; penjelasan bahasa Indonesia, contoh yang relevan, pembanding/kesalahan umum, ringkasan dan latihan bertahap tersedia; rute keluar, kembali dan lanjut dapat dipakai. Ketepatan bahasa ditinjau dan status peninjauan dicatat. |
| P2-FB | Feedback dan remedial | Jawaban benar/salah memiliki feedback relevan terhadap tujuan; kesalahan umum yang sudah dipetakan memperoleh alasan dan langkah memperbaiki; pengguna dapat membuka penjelasan dan mencoba soal baru. Kesalahan yang belum dikenali tidak memperoleh diagnosis yang dibuat-buat. |
| P3-CP | Latihan dan checkpoint valid | Setiap soal memiliki tujuan belajar dan level/unit yang eksplisit; checkpoint mengambil kisi-kisi tujuan unit, mencakup penerapan pada soal baru, dan melaporkan hasil per tujuan dan jumlah soal. Bedakan memahami contoh dari menerapkan aturan. Bank yang belum cukup ditandai belum siap dan tidak dipakai sebagai bukti penguasaan. |
| P4-LW | Mendengar dan menulis | A1 menyediakan dialog pendek, pertanyaan isi, pengulangan dan transkrip yang dapat dibuka; tugas menulis berkembang dari respons terpandu ke pesan singkat. Jelaskan apa yang dinilai; jawaban bebas tanpa pemeriksa yang andal diberi contoh dan daftar periksa, bukan nilai palsu. |
| P5-SP | Bicara dan percakapan | Rancang latihan dengar–ucapkan–rekam–bandingkan dan skenario bercabang yang relevan. Jika perekaman atau penilaian otomatis belum tersedia/andal, beri status jujur dan alternatif; jangan mengklaim percakapan atau penilaian pelafalan manusiawi. Simulasi bercabang tidak mensyaratkan AI. |
| P6-QA | Kualitas isi dan pengguna | Inventaris unit, revisi konten dan status peninjau tercatat; periksa bahasa Jerman, terjemahan, artikel/plural/konjugasi, contoh, prasyarat dan kesesuaian tujuan–materi–latihan–checkpoint. Uji alur dengan pembelajar mandiri tanpa pendampingan, catat hambatan dan perbaiki; jangan menyatakan ahli/pengguna telah memvalidasi sebelum ada bukti. |
| P7-TRUST | Progres dan klaim | Pisahkan materi selesai, performa per jenis latihan dan kemampuan yang belum dinilai; laporkan level/konteks/jumlah sampel. Tidak mengubah skor aktivitas menjadi klaim sertifikasi atau kemampuan bicara. |
| P8-DATA | Ketahanan progres | Data pengguna, perubahan pribadi, penghapusan dan jadwal SRS terjaga saat update. Latihan dapat dilanjutkan setelah navigasi/restart; penulisan jawaban dan progres perlu dijamin bersama saat gagal/mati mendadak, dicegah duplikasi, dan diuji dengan DB terisolasi. Backup dan pemulihan memerlukan bukti ulang setelah perubahan. |
| P9-ACCESS | Kegunaan dasar | Navigasi keyboard termasuk Enter yang ditawarkan layar, fokus, label, feedback kegagalan dan mode tanpa bantuan diuji pada alur utama. Audio yang tidak tersedia dijelaskan bersama langkah lanjut. |

### 0.4 Urutan pengembangan dan batas selesai

1. **Fondasi A1:** inventaris 12 unit dan tujuan; pilih irisan awal A1 yang kecil namun lengkap, perkuat materi dan uji alur. Lanjutkan ke seluruh A1 dengan standar sama. Perubahan isi harus menjaga edit dan penghapusan pengguna lama.
2. **Umpan balik dan remedial:** berikan penjelasan yang spesifik dan rujuk pengguna kembali ke konsep; uji benar, salah, jawaban alternatif dan kesalahan tak dikenal.
3. **Checkpoint berbasis tujuan:** kisi-kisi, soal baru, jumlah soal memadai per tujuan, hasil per tujuan; uji bahwa skor hafalan contoh saja tidak dilaporkan sebagai penguasaan tata bahasa.
4. **Mendengar dan menulis:** dialog serta tugas nyata A1, dengan status audio yang jujur dan rubrik tugas bebas. Terapkan offline-first dan uji kegagalan audio.
5. **Bicara dan percakapan:** simulasi bercabang dan dukungan latihan suara; desain perekaman serta evaluasi berdasarkan kemampuan perangkat dan privasi. AI lokal F7 tetap opsi terpisah; penyebutan model lama bukan bukti instalasi atau keputusan bahwa model itu harus digunakan untuk semua tugas.
6. **Kurasi dan uji pengguna:** catat siapa/apa yang diuji, hasil dan perbaikannya. Kerjakan pemeriksaan bahasa sejak tahap 1, lalu uji perjalanan A1 dari awal sampai akhir. Baru setelah A1 memenuhi kriteria, perluas pendekatan ke A2/B1/B2.

Setiap tahap dinyatakan selesai hanya setelah fitur dan isi yang bersangkutan tersedia, skenario normal dan gagal diuji, hasil tercatat, serta batas yang belum divalidasi dinyatakan. Build lulus sendiri tidak membuktikan mutu pedagogis. Untuk pilot usability, pilih tugas dan ambang keberhasilan sebelum menguji dan laporkan jumlah/karakter peserta; pilot kecil memberi indikasi hambatan, bukan bukti efektivitas belajar atau sertifikasi.

### 0.5 Ketentuan transisi dari PRD lama

- §3, §6, §7 dan §11 lama adalah baseline historis: isi 12 unit atau ambang 70% tidak otomatis berarti A1 lengkap atau dikuasai; soal dan ambang harus ditinjau sesuai §0.3.
- Label A1–B2 menandakan pengelompokan materi. Konten lanjutan yang ada masih perlu penguatan; nominalisasi dan tujuan lain tidak boleh ditandai tervalidasi hanya berdasarkan terjemahan contoh.
- Rutinitas belajar dan target waktu lama adalah saran yang dapat disesuaikan, bukan kewajiban bagi pengguna. Hindari klaim kausal atau kecepatan belajar yang belum diuji.
- TTS Piper/klip bukan evaluasi pengucapan; pemasangan bersih dan unduhan perlu bukti pada lingkungan terisolasi. Rilis build tidak berarti installer sudah dipasang atau diuji pada PC lain.
- Sumber buku dan pemetaan tetap mengikuti keputusan sebelumnya bila sumber sah tersedia; verifikasi status berkas sebelum mengandalkan catatan unduhan 2026-11-09. Jaga hak penggunaan materi.
- Risiko crash saat menyimpan jawaban dan draft latihan, pengujian instalasi, kualitas isi dan fitur yang belum ada dicatat dalam handoff; jangan menganggap checklist lama sebagai verifikasi baru.

---

### 0.6 Arahan pengguna terbaru — desain KLAB dan Android

Pembaruan 17 November 2026 setelah §0.1–§0.5: sasaran berkembang dari satu pengguna personal menjadi masyarakat umum berbagai usia. Android menjadi prioritas penggunaan, dengan Windows tetap didukung dan layout menyesuaikan HP, tablet serta jendela desktop. Aset pembelajaran inti dibundel untuk penggunaan offline; ukuran MB aktual harus diukur, bukan diperkirakan dari mockup. Prioritas kualitas A1 dan perlindungan data tetap berlaku.

Pengguna memilih alternatif **02 KLAB** sebagai arah visual: buku komik, karakter kucing ekspresif, identitas warna baru, mode terang/gelap. Nama aplikasi tetap Lernen. Kebutuhan tambahan: pilihan terurut/bebas saat awal dan dapat diganti; materi panjang dengan catatan serta penjelasan yang dibuka sesuai kebutuhan; reaksi meme/soundboard opsional; percakapan bercabang dan rekam–bandingkan; motivasi XP/lencana; ulang materi setelah unit lulus, dengan jumlah kelulusan dan catatan dipertahankan. Tidak diperlukan akun, sinkronisasi atau fitur ekspor/impor pada pengalaman baru; tidak menghapus data dan backup yang sudah ada.

[Spesifikasi detail UI](docs/superpowers/specs/2026-11-17-lernen-klab-ui-design.md) menjabarkan layar, state, responsif dan kriteria penerimaan. Pilihan arah visual sudah disetujui; kebijakan detail diberi status usulan. Gambar adalah rancangan, bukan bukti fitur berjalan, kelayakan porting atau pengujian semua usia. Ketentuan personal/Windows-saja yang bertentangan pada bagian lama kini bersifat historis.

### 0.7 Keputusan terbaru — selesaikan Windows terlebih dahulu

Pembaruan 17 November 2026 setelah §0.6. Pengguna ingin menyelesaikan aplikasi yang sedang dikembangkan sebelum melanjutkan ke versi lain. **Tahap aktif berfokus pada Lernen Windows. Port Android, adaptasi HP/tablet, dan perombakan besar UI KLAB menjadi pekerjaan tahap berikutnya.** Ketentuan ini mengesampingkan prioritas Android pada §0.6 dan jadwal implementasi lintas perangkat dalam spesifikasi KLAB.

Pekerjaan aktif mencakup kriteria P1–P9 untuk prioritas A1 serta fitur inti Windows yang sudah tersedia. Dahulukan validitas soal dan penilaian, pembaruan konten lama ke baru, ketahanan sesi dan progres, backup/pemulihan, audio pembelajaran inti offline, materi bertahap, feedback/remedial, statistik yang sesuai bukti, dan kegunaan alur utama. Latihan mendengar/menulis, percakapan bercabang, dan uji tiruan yang sudah ada tetap diperiksa sebagai bagian aplikasi saat ini. F7 AI lokal tetap opsi terpisah.

Penutupan tahap memerlukan bukti pengujian alur normal dan gagal pada profil terisolasi, hasil upgrade dan restore, kelanjutan sesi setelah restart, serta pemasangan bersih dan penggunaan offline pada Windows. Status telaah bahasa dan uji pembelajar dicatat berdasarkan bukti pelaksanaannya. Kekurangan yang masih terbuka tetap tercantum dalam matriks penerimaan; kelulusan build saja belum memenuhi seluruh kriteria.

Arah visual 02 KLAB dan sasaran publik tetap menjadi rujukan pengembangan lanjutan. Penambahan gamifikasi, reaksi dekoratif, dan fitur baru yang hanya berasal dari rancangan KLAB masuk tahap tersebut. Perbaikan UI yang diperlukan untuk menyelesaikan alur belajar Windows termasuk pekerjaan aktif. Dokumen dan papan desain KLAB disimpan sebagai referensi tahap berikutnya.

### 0.8 Arahan terbaru — 19 November 2026 (mendahului keputusan 17 November)

Pembaruan ini dibuat setelah bukti kandidat Windows 19 November 2026. **Apabila bertentangan
dengan §0.6 atau §0.7, ketentuan §0.8 yang berlaku.** Bagian §0.1–§0.7 dan §1–§14 tidak dihapus;
semua tetap dipertahankan sebagai sejarah keputusan dan rancangan awal.

**Urutan produk.** Pertama, **selesaikan Lernen Windows** sampai benar-benar dapat dipakai pengguna.
Kedua, **Android dan adaptasi HP/tablet adalah fase berikutnya**, bukan prioritas aktif; keputusan
yang berlaku adalah **Windows lebih dahulu, Android menyusul**. Ketiga, arah visual **KLAB Windows sudah
digunakan** pada produk Windows — bukan sekadar mockup atau rancangan menunggu persetujuan. Perombakan
besar UI dan fitur dekoratif baru tetap mengikuti tahap lanjutan, tetapi perbaikan UI yang diperlukan
untuk alur Windows termasuk pekerjaan aktif.

**Prioritas isi dan bukti mutu.** **A1 tetap prioritas utama**: tujuan, latihan transfer, checkpoint
berbasis tujuan, remedial, dan koreksi jawaban harus dapat dipakai mandiri. **A2–B2 tidak dianggap
bermutu hanya karena unit dan terjemahan tersedia**; mutu A2–B2 memerlukan bukti peninjauan pengajar,
uji pembelajar, dan soal yang menguji penerapan aturan pada contoh baru. Dialog RPG direncanakan
**bertahap untuk seluruh 67 bacaan**, bukan diluncurkan sekaligus. Saat ini **11 giliran Im Café hanya
terbukti di pratinjau terpisah**; jangan menyatakan dialog RPG tersedia pada seluruh EXE maupun ke-67
bacaan. Lihat [catatan isi 11 giliran](outputs/preview-dialog-rpg/catatan-isi.md),
[data dialog](outputs/preview-dialog-rpg/dialog.json), dan
[pratinjau RPG](outputs/preview-dialog-rpg/README.md).

**Naskah, penutur, dan audio DE–ID.** Teks sumber berbahasa Jerman (DE) dipasangkan dengan
penjelasan dan terjemahan Indonesia (ID); penanda penutur (`ich`, `freundin`, `kellner`, `narrator`)
mengikuti kontrak dialog, bukan asumsi identitas. Audio memakai klip bawaan yang **cocok persis
dengan teks** yang ditampilkan, bukan klip perkiraan. Tidak ditambahkan syarat penutur asli/native
speaker yang belum diputuskan pengguna. Setiap adegan menyediakan kontrol **maju, kembali, dan ulang
audio** yang berjalan **offline** dengan klip bawaan. Giliran adaptasi tanpa klip dinyatakan jujur;
klip lama dilarang dipakai sebagai pengganti. Status ini tercatat di
[kontrak audio dialog](outputs/preview-dialog-rpg/catatan-isi.md).

**Aset RPG yang terpisah.** **Latar, sprite karakter, dan properti disimpan sebagai berkas
terpisah** dan dapat disusun ulang per adegan. Setiap tokoh memiliki **master karakter** dengan
**pose yang konsisten**; pose khusus yang belum dibuat memakai master netral dan dinyatakan, bukan
diganti gambar baru. Kandidat mengikuti **gambar acuan pengguna**
[PNG acuan kafe 19 November](outputs/aset-bacaan-percakapan-review/referensi/acuan-gaya-kafe-pengguna-2026-11-19.png).
**Review seni dilakukan oleh pengguna**; kandidat v02 berstatus menunggu penilaian, sebagaimana
dicatat di [katalog 67 bacaan](outputs/aset-bacaan-percakapan-review/README.md),
[pemetaan 67 judul](outputs/aset-bacaan-percakapan-review/katalog-layer.json), dan
[status aset](outputs/preview-dialog-rpg/assets.manifest.v02.json).

**Pilot dan kesiapan produk.** Pilot pengajar dan pelajar **21 November 2026 direncanakan, belum
dilaksanakan**. Angka **43/43 E2E pada EXE kandidat**, **7/7 uji buka salinan paket**, dan **35/35
regresi non-GUI** adalah bukti mesin pada kandidat/salinan, **bukan bukti kesiapan produk akhir**
apalagi hasil belajar. [Keputusan paket](outputs/siap-uji-lernen-2026-11-21/MULAI-DI-SINI.md),
[E2E final](outputs/lanjut-pilot-01/tuntas-pilot-e2e-report.json),
[uji buka 3c](outputs/siap-uji-lernen-2026-11-21/bukti/uji-buka-3c.json), dan
[regresi 3b](outputs/lanjut-pilot-01/agent-3b-revisi-1453.md) harus dibaca bersama panduan
[pilot fasilitator](outputs/pilot-klab-2026-11-21/PANDUAN-FASILITATOR-PILOT-KLAB.md). Lembar masukan
pengajar/pelajar sengaja kosong sampai ada pengamatan manusia; tidak ada persentase keseluruhan yang
dihitung dari tes pilot.

**Status dari satu dokumen.** Syarat aktif, deferred dan opsional, pemilik, bukti, serta tindakan
lanjut dapat dibuka langsung dari
[Matriks pelacakan penyelesaian Windows](outputs/penyelesaian-windows/MATRIKS-PENYELESAIAN-WINDOWS.md)
dan [Antrean temuan lintas agen](outputs/penyelesaian-windows/ANTREAN-TEMUUAN.md). Status teknis
memakai `siap dikerjakan`, `sedang dikerjakan`, atau `menunggu hasil eksternal` dengan pemilik dan
prasyarat konkret; bukti pengajar/pelajar tidak digantikan simulasi.

---

## 1. Ringkasan

Aplikasi desktop Windows untuk belajar bahasa Jerman secara **mandiri dan offline-first**, dibangun khusus untuk satu pengguna. Temuan riset kompetitor (§2): seorang pembelajar biasanya masih memerlukan **3–4 aplikasi berbeda** — satu untuk struktur kursus, satu untuk kosakata jangka panjang, satu untuk drill tata bahasa, satu untuk membaca/mendengar. Aplikasi pribadi ini menggabungkan keempat peran itu dalam satu basis data dan satu alur:

1. **Kursus terstruktur** (peran Babbel / Nicos Weg) — alur pelajaran per unit tema, dengan mini-lesson tata bahasa singkat.
2. **Mesin kosakata** (peran Anki) — SRS (spaced repetition) dengan algoritma modern (FSRS); kata benda selalu bersama artikel + plural-nya.
3. **Drill tata bahasa** (peran Learn German with Games) — latihan pendek mengisolasi satu mekanika Jerman per sesi (artikel, konjugasi, kasus, plural, Perfekt…), jawaban **produksi (mengetik)**, umpan balik instan.
4. **Membaca berjenjang + mendengar** — teks berlabel A1/A2, kata dapat di-tap untuk artinya dan disimpan langsung ke deck SRS, TTS lafal Jerman.

Dashboard + streak menjadi perekat kebiasaan. AI percakapan **dirancang sebagai fase lanjutan** (arsitektur disiapkan, tidak dibangun di MVP — lihat §5.1).

**Sasaran utamanya bukan fitur, melainkan kebiasaan yang tidak terputus**: 15–30 menit/hari, antrian yang disetel otomatis oleh SRS, dan progres nyata menuju level Goethe/telc **A1** (kemudian A2).

---

## 2. Riset — Temuan yang Membentuk Konsep

Hasil riset November 2026 terhadap aplikasi jadi dan artikel review independen (sumber lengkap di §14). Delapan temuan yang langsung mengubah desain:

**T1 — Satu aplikasi tidak pernah meng-cover semuanya.** Pembelajar yang konsisten menggabungkan 2–3 aplikasi (struktur + kosakata + mendengar/bicara). *(learngermanwithgames, Jul-2026)* → Aplikasi pribadi bisa menyatukan peran-peran itu di satu data.

**T2 — Kebiasaan harian adalah faktor terbesar.** 15 menit/hari mengalahkan 2 jam sekali-seminggu; risiko terbesar pembelajar mandiri adalah berhenti di minggu kedua. → Dashboard/streak dan antrian "Hari Ini" diposisikan sebagai fitur inti, bukan hiasan.

**T3 — Sistem gender/kasus Jerman adalah titik sakit #1 di semua aplikasi massa.** Contoh klasik: pengguna Duolingo jangka panjang masih menebak der/die/das karena artikel tidak pernah didrill terisolasi. *(Duolingo review, Jul-2026)* → Drill mekanika menjadi fitur inti.

**T4 — Produksi mengalahkan pengenalan.** Mengetik bentuk yang benar (bukan memilih dari pilihan ganda) membangun refleks; pemaparan saja tidak cukup. → Semua drill default mengetik; pilihan ganda hanya untuk latihan pembuka.

**T5 — SRS bekerja bila dua syarat terpenuhi.** (a) kata benda **selalu** dengan artikel & plural; (b) interval ditetapkan tepat sebelum titik lupa. Algoritma **FSRS** (dipakai Anki sejak 2023) menggantikan SM-2 klasik; implementasi open-source `ts-fsrs` tersedia untuk TypeScript.

**T6 — Teks berjenjang "satu tema, tiga tingkat" membuat membaca mengalir**, terutama bila kata penting bisa di-tap dan langsung jadi kartu. *(learngermanwithgames /german-reading-practice)* → Fitur F4.

**T7 — AI percakapan meledak di 2026** (Langua, Speak, Praktika, Univerbal, TalkPal). Fitur yang terbukti berguna: koreksi inline berlapis penjelasan, simpan kata saat berbicara lalu AI menyisipkannya kembali di percakapan berikutnya, laporan umpan balik akhir sesi. Kelemahan umum: SRS jelek/absen, biaya langganan, skor pelafalan tidak andal. *(Lingtuitive Nov-2026; LanguaTalk Okt-2026)* → AI diposisikan sebagai **modul plug-in nanti**, bukan inti; inti tetap bekerja offline penuh.

**T8 — Volume konten beracuan Goethe realistis untuk dijangkau:** A1 ± 650 kata, A2 ± 1.300 kata kumulatif; estimasi 0→B1 ± 200 jam belajar. *(daftar Goethe di learngermanwithgames; deutschmitdanielle)* → Seed konten dibangun per unit, bukan sekali jadi; target level pertama A1.

---

## 3. Sasaran & Metrik Sukses

### 3.1 Sasaran
- Dari 0 (atau dasar yang lemah) menuju **A1 penuh dalam ±3 bulan**, lalu **A2 dalam ±3 bulan berikutnya** — target personal, langkah kecil tapi nyata per hari.
- Jika akan mengikuti uji Goethe/telc, aplikasi harus cukup untuk menyiapkan format uji di tingkat A1.
- Bahasa antarmuka aplikasi: **Indonesia**; konten belajar: Jerman (+ penjelasan Indonesia/Inggris bila perlu).

### 3.2 Metrik yang terlacak aplikasi

| Metrik | Target MVP+3 bulan | Sumber data |
|---|---|---|
| Hari aktif per minggu | ≥ 5 | progress_daily |
| Durasi belajar | 15–30 menit/hari | progress_daily |
| Kartu "matang" (interval ≥ 21 hari) | ≥ 300 kartu A1 (dari ±650) | srs_state |
| Akurasi drill inti (D1–D5) saat review | ≥ 85% | attempts |
| Unit A1 selesai | 12/12 | lesson_progress |
| Teks dibaca & kata disimpan | ≥ 20 teks | reading_log |

### 3.3 Rutinitas pengiring (di luar aplikasi — syarat jalur "tercepat")

Aplikasi menata komponen belajar dengan ROI tertinggi ke dalam satu tempat; namun lima rutinitas **di luar aplikasi** inilah yang membuat jalurnya benar-benar cepat. Semua murah, tanpa fitur baru:

1. **Listening harian 10 menit** — video/audio Jerman tingkat pemula (Nicos Weg/Deutsche Welle, Easy German) sejak minggu pertama. Volume input adalah akselerator terbesar yang tidak bisa digantikan SRS.
2. **Shadowing 5 menit/hari** — meniru kalimat dari TTS/audio dengan suara keras. Latihan produksi lisan tanpa lawan bicara; menutup gap "bicara" sampai F7 (AI) siap.
3. **Deadline nyata** — mendaftar uji Goethe/telc A1, atau tanggal target pribadi yang dianggap serius. Deadline mempercepat lebih banyak daripada fitur mana pun; selaras dengan §13.3 dan prioritas F8.
4. **Konten cukup-untuk-mulai** — jangan menunggu konten sempurna: 40 teks A1 + 12 unit sudah cukup untuk berjalan; konten disempurnakan sambil jalan.
5. **Aturan anti-prokrastinasi membangun** — belajar hari itu **wajib, membangun aplikasi opsional**. Kuota kebiasaan (≥ 5 hari aktif/minggu, §3.2) dicek dulu; coding dikerjakan *setelah* kuota terpenuhi. Dua hal ini karena risiko paling realistis proyek ini bukan bug, melainkan waktu membangun yang memakan waktu belajar.

---

## 4. Pengguna & Konteks Pemakaian

- **Satu pengguna** di satu PC Windows; skenario belajar sore/malam 15–30 menit, kadang dua slot singkat.
- Contoh sesi 20 menit: buka app → tab **Hari Ini** → 15 kartu jatuh tempo (±5 menit) → 1 drill artikel (±5 menit) → lanjut 1 pelajaran unit (±7 menit) → 3 menit membaca teks baru / menyimpan kata.
- Internet hanya dibutuhkan untuk opsi update konten; semua belajar berjalan **offline penuh** (TTS melalui Piper lokal atau klip audio yang dibundel; voice bawaan Windows tidak digunakan).

---

## 5. Lingkup

### 5.1 Keputusan yang telah dikunci (sesi review 2026-11-08)

| # | Keputusan | Nilai dipilih |
|---|---|---|
| K1 | Platform | **Aplikasi desktop Windows (Tauri)** |
| K2 | Level konten | **A1 penuh dulu, lalu A2**; sistem mendukung, tapi B1 sebagai konten menyusul |
| K3 | AI percakapan | **Tidak di MVP**; F7 = **AI offline (LLM lokal via llama.cpp di Rust core)** — model default **Qwen3.5 4B (Q4_K_M)**, fallback **Phi-4 Mini 3.8B**; diunduh sekali — tanpa API selamanya |
| K4 | Fitur MVP | Alur pelajaran + SRS + drill tata bahasa + membaca berjenjang/TTS + dashboard/streak |

> ✅ **Konfirmasi final (2026-11-08):** AI = **F7 di Fase M4**, berbentuk **AI offline**. Kontradiksi lama selesai; detail model & pengadaan terjawab di §13.2. Status proyek per 2026-11-09: alur inti M0–M3 sudah diimplementasikan; fallback statis F4 sudah dibundel dalam 30 WAV dan build frontend telah lulus.

### 5.2 Peta fitur per fase

| Kode | Fitur | Fase | Prioritas |
|---|---|---|---|
| F1 | SRS kosakata (inti ala Anki, algoritma FSRS) | **M1 (MVP)** | Wajib |
| F2 | Drill mekanika tata bahasa | **M1 (MVP)** | Wajib |
| F3 | Alur pelajaran A1→A2 (struktur dirancang sampai B1) | **M2** | Wajib |
| F4 | Membaca berjenjang + TTS | **M2** | Wajib |
| F5 | Dashboard progres & streak | **M3** | Wajib |
| F6 | Pengelola konten & import/backup | **M3** | Wajib |
| F7 | AI percakapan Jerman **offline** (LLM lokal: Qwen3.5 4B, tanpa API) | Fase 4 | Opsional |
| F8 | Mode uji tiruan Goethe/telc A1 | Fase 5 | Opsional |

### 5.3 Di luar lingkup

- Multi-pengguna, sistem akun/logout.
- Cloud sync antar perangkat (data tetap satu PC + backup file).
- Konten level B1 **penuh** (struktur data siap, konten menyusul bila mau).

---

## 6. Sistem Kurikulum

### 6.1 Struktur (beracuan CEFR + tema Goethe/telc)

```
Level (A1, A2, B1) ── Unit (12 tema per level) ── Pelajaran (1 sesi 10–15 menit)
Pelajaran = [recap] + [mini-lesson tata bahasa] + [drill ringan dari bank item F2] + [kosakata baru masuk SRS] + [mini-review]
```

**Aturan desain yang mengikat (dari temuan riset):**
- Kata benda **selalu** disimpan dengan artikel + plural.
- Tiap unit memasukkan 15–25 kata baru ke deck SRS — tidak lebih, agar jadwal review tetap terkendali.
- Mini-lesson ≤ 6 slide ringkasan: **1 inti aturan** (definisi 1 kalimat) + **2 contoh** + **1 jebakan umum**.

**Checkpoint unit.** Akhir unit = kuis 15 item campuran (grammar + kosakata + listening) — lulus ≥ 70% untuk meng-unlock unit berikutnya.

### 6.2 Peta Unit A1 (12 unit)

> **Status: 12 unit A1 sudah diisi.** Unit 1–4 memakai kurasi sebelumnya; unit 5–12 kini berisi materi orisinal beracuan Goethe (3 pelajaran per unit). Pemetaan/penyelarasan ke buku dalam `Modul belajar` belum dilakukan karena arsip 001 masih berupa `.crdownload` yang tidak dapat diekstrak pada pemeriksaan terakhir. Kerangka Goethe ini menjaga aplikasi tetap dapat dipakai sambil menunggu sumber lengkap.

| U | Tema | Kosakata inti | Tata bahasa terkait |
|---|---|---|---|
| 01 | Salam & perkenalan diri | nama, asal negara/kota, umur, bahasa | konjugasi praesens; kata tanya wer/woher/wo/wie; sapaan du/Sie |
| 02 | Angka, waktu, harga | 0–1.000, jam, harga € | pola angka (einundzwanzig); um (jam), am (tanggal), im (bulan/tahun); konfirmasi & negasi (ja/doch/kein, das stimmt) |
| 03 | Keluarga & hubungan | anggota keluarga, profesi, foto keluarga | plural benda; artikel tertentu/tak tertentu (der–ein); possessiv mein/dein |
| 04 | Makanan & minuman | bahan, menu, pesanan | Akkusativ dasar; ich möchte / ich nehme / wir brauchen |
| 05 | Belanja & harga | barang, ukuran, warna, uang | verb-trennbare (anprobieren, einkaufen); kalimat tanya belanja |
| 06 | Rumah & tempat tinggal | ruangan, perabot, alamat | Dativ-tempat intro (in/auf/an); es gibt + Akkusativ |
| 07 | Kota & petunjuk arah | jalan, arah, transportasi | modal verbs (können, müssen, dürfen); wohin/wo; mit dem Bus/Bahn |
| 08 | Pekerjaan & harian | jam kerja, kegiatan harian | Perfekt (haben/sein + Partizip II); kebiasaan harian (Tagesablauf) |
| 09 | Kesehatan & tubuh | organ, rasa sakit, janji dokter | Dativ verbs (helfen, danken, gefallen); pola "Ich habe ... Schmerzen" |
| 10 | Waktu luas & hobi | hobi, musik, rencana akhir pekan | wenn-Satz dasar; kata urutan (erst, dann, danach) |
| 11 | Transportasi & perjalanan | tiket, kereta, pesawat, reservasi | tujuan: nach/zu/in; asal: aus/von; kendaraan: mit dem/der |
| 12 | Komunikasi & janji | pesan, telepon, undangan | imperative; Satzklammer (verb berkurung); verb-trennbare di akhir kalimat |

*Peta unit A2 (ditulis lengkap saat memulai fase A2): pekerjaan & karier, kontrak sewa & Anmeldung, perbankan & surat resmi, kesehatan & pengobatan, liburan & cuaca, peristiwa & perayaan, pendidikan; tata bahasa: Präteritum untuk verb umum, reflexive verbs, comparative/superlative penuh, Wechselpräpositionen, weil/denn/deshalb, Konjunktiv II dasar (würde), relative clauses ringan.*

### 6.3 Sumber konten

| Sumber | Dipakai untuk | Cara |
|---|---|---|
| **studio d B1** Kurs- und Übungsbuch (Cornelsen, pindai 264 hlm, sudah terekstrak di `Sumber reffrensi\Studio D B1\`) | acuan struktur unit B1: Start + 8 Einheiten + 3 Stationen; Wortschatz per unit; latihan untuk bank drill | PDF pindai **tanpa lapisan teks** → per unit: render halaman → OCR Tesseract deu (plus kurasi manual) → entry JSON (pipeline §6.4) |
| **Materi folder `Modul belajar\` — sumber acuan yang diminta pengguna**: arsip 001 masih `.crdownload` dan gagal diekstrak; zip 002 adalah studio d B1. Unit A1 5–12 sementara ditulis orisinal beracuan Goethe atas keputusan pengguna; pemetaan ke buku tetap tertunda | konten unit **A1/A2** (keputusan K2): tema, Wortschatz, mini-lesson, latihan | begitu zip 001 selesai: ekstrak → petakan isi → **peta unit §6.2 direstrukturisasi dari buku**; urutan K2 tetap A1 dulu |
| Daftar kata Goethe A1/A2 (nouns/verbs/adjectives, public) | bank kosakata dasar & pelengkap antar-bab | skrip generator di build-time (bukan runtime) menghasilkan JSON seed |
| Teks baca berjenjang (A1/A2) | F4 | ditulis/dikurasi manual ± 40 teks; tema boleh mengikuti bab Studio d |
| Tema & jebakan umum dari riset review app | topik drill + pedagogi | catatan riset §14 |
| Piper lokal + klip audio bundle | suara kata & kalimat | mesin/voice Piper lokal; klip statis untuk frasa inti bila sintesis tidak tersedia |

**Batas hak cipta (penting):** materi Studio d adalah karya terlindung Cornelsen. Dipakai **hanya untuk belajar pribadi** oleh pemilinya — ini aplikasi personal, bukan produk publik. File asli PDF dan hasil ekstraksinya **tidak dibundel/didistribusikan** bersama aplikasi; aplikasi hanya membaca data hasil kurasi (JSON) yang tersimpan di PC sendiri.

### 6.4 Pipeline konversi sumber lokal → seed JSON

```
PDF pindai ──render hal. per bab──> PNG ──OCR (Tesseract deu) atau kurasi AI/diri──> draf tekstual
draf ──pembersih & strukturisasi (skrip)──> data/unit_NN.json ──validator──> seed SQLite (idempotent)
```

- Urutan kerja mengikuti keputusan K2 (**A1 dulu, lalu A2**): sumber B1 sudah ada lebih dulu, tetapi konversinya masuk fase M5 — kurikulum A1 tidak menunggu B1.
- Satu JSON per unit bab buku (bukan per halaman) agar mudah direvisi.
- Validator mengecek: noun selalu punya artikel + plural; kalimat contoh tidak kosong; per unit 15–25 kata baru; tolak entry duplikat by field `de`.

---

---

## 7. Spesifikasi Fitur

### F1 — SRS Kosakata (inti ala Anki, algoritma FSRS)

**Deskripsi.** Manajer deck per level/topik/kustom; kartu jatuh tempo hari ini tampil di layar **Hari Ini** (F5) untuk review harian.

**Bentuk satu kartu yang keluar dari satu entri kata:**
1. **DE→ID** (pengenalan) — tampil kata Jerman, jawab artinya (kartu dibalik untuk cek).
2. **DE→ID produksi** — tampil Bahasa Indonesia, **ketik** kata Jerman termasuk artikel (kata benda: "die Lampe", bukan "Lampe").
3. **Dengar → tulis** — audio TTS diputar, teks tersembunyi; ketik apa yang terdengar.
4. **Cloze kalimat contoh** — kalimat contoh dengan kata hilang, ketik untuk isi.

**Algoritma.** FSRS via `ts-fsrs` (parameter default; panel lanjutan opsional di Pengaturan). Jawaban salah = grade "Ulang (Again)" — kartu muncul kembali kosong di sesi yang sama, lalu jadwal FSRS memperpendek intervalnya.

**Mekanik harian:** antrian ≤ 30 kartu/hari; jika lebih, kartu interval < 3 hari diprioritaskan. Nilai harian bisa diedit oleh pengguna.

**Acceptance criteria:**
- Menambah 10 kartu manual memakan < 2 menit (alur editor padat).
- Review 20 kartu: teks + audio (bila klik) muncul; 4 tipe kartu bekerja; grade manual (Lupa/Sulit/Baik/Mudah) bekerja.
- Kartu salah otomatis masuk antrian ulang hari yang sama.
- `attempts` merekam setiap review (timestamp + grade) → data untuk F5/analytics.
- Interval hasil FSRS konsisten dengan param default (cek sampel 10 kartu 7 hari).

### F2 — Drill Mekanika Tata Bahasa

**Deskripsi.** Latihan pendek 2–5 menit yang **mengisolasi satu mekanika per sesi** (satu jenis item per drill), dengan feedback kurang dari 1 detik.

**Katalog drill MVP:**

| Kode | Drill | Level | Mekanik |
|---|---|---|---|
| D1 | Artikel: der/die/das | A1 | pilih tiga tombol; benar → next; salah 2× berurut → kartu kata dijadwalkan ulang (masuk SRS) |
| D2 | Plural benda | A1 | ketik plural dari singular |
| D3 | Konjugasi praesens | A1 | ketik akhiran/persona (termasuk irregular e→i, e→ie) |
| D4 | Kasus: Akkusativ/Dativ | A1 | pilih artikel yang benar (den/dem/…) dari potongan kalimat |
| D5 | Perfekt: haben/sein + Partizip | A1 | pilih auxiliary (haben/sein), ketik Partizip |
| D6 | Susun kalimat (word order) | A1/A2 | susun kalimat dengan tap kata; verb selalu posisi 2 (V2); pada anak kalimat → verb di akhir |
| D7 | Präteritum umum | A2 | ketik bentuk Präteritum dari verb umum (war, hatte, ging…) |
| D8 | Angka & waktu dari suara | A1 | TTS membaca angka/jam, ketik angka & jam |
| D9 | Präpositionen um/am/im/nach/zu | A1/A2 | pilih preposisi yang benar dalam kalimat waktu/tujuan |
| D10 | Modal verbs | A1 | conjugate modal (können/müssen/dürfen/wollen) + posisi infinitive |

**Mekanik umum:** timer ringan opsional (default 10 detik per item, bisa dimatikan). Jawaban salah → tampilkan penjelasan + link mini-lesson terkait. 3× salah → item masuk daftar **weak items**: tampil kembali di drill berikutnya dan dijadwalkan lewat SRS.

**Acceptance criteria:**
- Semua drill D1–D5 berjalan di M1; D6–D10 di M2, memakai bank item JSON yang sama dengan konten unit.
- Sesi drill menampilkan ringkasan (benar/salah/waktu) + rekomendasi "drill berikutnya".
- Setiap halaman drill punya tombol "Kartu Teori" yang membuka mini-lesson terkait (harus konsisten dengan referensi item F3).
- Jawaban salah tercatat di `attempts` dengan drill_code untuk F5.

### F3 — Alur Pelajaran A1→A2 (arsitektur siap B1)

**Deskripsi.** Peta level → unit → pelajaran; unit terbuka berurutan; tiap unit ditutup dengan checkpoint kuis. Bagian dalam pelajaran: **5 langkah tetap:**

1. **Recap** 60 detik (apa yang sudah dilihat).
2. **Mini-lesson** tata bahasa (≤ 6 slide).
3. **Thumb drill** ringan 3–5 item dari bank item F2.
4. **Kosakata baru** 8–10 kata (flash 4 arah sesuai F1) — dicatat sebagai kartu baru di SRS.
5. **Mini-review** — gambar progres unit + saran tindakan berikutnya.

Semua latihan datang dari **bank item yang sama** dengan F2 (tidak ada sistem latihan dobel).

**Acceptance criteria:**
- Pelajaran bisa diselesaikan ≤ 15 menit; setiap langkah bisa di-skip bila sudah paham (dengan tanda).
- Unit-checkpoint kuis 15 item, lulus ≥ 70% → unlock unit berikutnya (progress tercatat).
- Kata baru pelajaran otomatis enqueued ke SRS untuk review hari berikutnya.
- 12 unit A1 + checkpoint lengkap di M2; kerangka A2 hanya struktur dulu.

### F4 — Membaca Berjenjang + TTS

**Deskripsi.** Perpustakaan teks pendek berlabel A1/A2 (± 40 teks di MVP, dibangun bertahap bersama unit). Setiap kata di teks dapat di-tap → muncul **popover artinya** + tombol "Simpan ke deck (SRS)" — langsung masuk F1. Kata yang belum ada di kartu diberi penanda warna berbeda, tandannya dibuat saat kurasi konten per teks.

**Fitur pembaca:**
- **Terjemah per kalimat** (toggle): klik baris untuk menampilkan terjemahan Indonesia.
- **TTS per kalimat**: Piper lokal; klip bundle untuk kata/frasa inti yang tersedia; kecepatan bisa diatur 0,75×–1× di Pengaturan; tombol "Ulangi kalimat ini".
- **Kamus kecil lokal** (daftar Goethe + frasa tersimpan pengguna) — semua offline.
- **Mode tanpa bantuan**: sembunyikan semua terjemahan untuk tes diri.

**Tentang TTS:** suara kalimat bebas dibuat dengan **Piper lokal** melalui mesin dan voice yang diunduh sekali. Voice bawaan Windows dan Web Speech API tidak digunakan. Bila Piper tidak aktif atau gagal, aplikasi hanya memutar klip audio bundle yang cocok (frasa, kosakata inti, angka, dan jam); teks tanpa klip menampilkan status bahwa audio tidak tersedia. Sintesis dibatasi waktu tunggunya dan UI melaporkan kegagalan, tanpa diam-diam mencoba voice Windows.

**Import teks sendiri:** paste teks → pilih tingkat → disimpan ke SQLite; anotasi kata berjalan otomatis dari **kamus lokal**; kata yang tak ada kamusnya bisa ditentukan manual dan disimpan.

**Status implementasi (2026-11-09):** Piper offline terverifikasi dan fallback statis 30 WAV sudah dibundel: angka 1–100, sapaan, 12 kosakata inti unit 1, serta klip waktu D8. Fallback bundle diputar ketika Piper tidak siap atau gagal; voice Windows tidak digunakan. Tombol/listen SRS hanya menampilkan kata yang memiliki klip statis.

**Acceptance criteria:**
- Baca teks dengan TTS per kalimat, kecepatan bisa diatur, tanpa internet.
- Kata di-tap → popover artinya + tombol simpan ke SRS.
- Import teks sendiri berjalan < 5 detik; kata yang tak ada di kamus bisa didefinisikan manual.
- Progress teks tercatat (halaman-halaman yang tersentuh/sudah dibaca).

### F5 — Dashboard Progres & Streak

**Deskripsi.** Satu layar memantau kemajuan & kebiasaan:
- **Streak kalender**: hari aktif; jumlah hari berturut-turut; target harian (default 15 menit) bisa diganti.
- **Ringkasan harian**: kartu selesai, drill benar/salah, menit belajar.
- **Mastery progres**: bar kemajuan per unit/topik, per jenis drill, dan per aktivitas.
- **Forecast**: jumlah kartu jatuh tempo 7 hari ke depan (atau chart 30 hari) — informasi apakah beban review kian naik.
- **Diagram kelemahan**: top-5 jenis item yang sering salah — dengan tombol "drill kelemahan ini" langsung.
- **Ready check A1**: indikator kesiapan Goethe-A1 per skill (Hören/Lesen/Schreiben/Sprechen) dihitung dari mastery unit + accuracy.

**Notification Windows (opsional, via Tauri plugin):** hari belum ada aktivitas ≥ 24 jam → notifikasi "Review 12 kartu (±3 menit)". Bisa dimatikan.

**Acceptance criteria:**
- Streak kalender muncul dan tidak hilang setelah restart.
- Semua angka dashboard berasal dari attempts/srs_state/progress_daily — tidak ada nilai dummy.
- Zero state (hari 1) tampil tutorial singkat, bukan panel kosong.

### F6 — Pengelola Konten & Backup

**Deskripsi.** Bila aplikasi ini ada

- **Editor kartu**: tambah/ubah/delete kartu per deck (form inline, preview 4 tipe kartu F1, tag manual).
- **Import**: CSV/JSON (paste atau file), termasuk daftar Jerman–Indonesia hasil AI/copy dengan format sederhana (kolom `de | meaning_id | article | plural`).
- **Backup**: auto-export JSON mingguan ke folder pilihan + manual export; restore dari file backup (verifikasi sebelum menimpa).
- **Deteksi korup**: bila buka app dan DB invalid → tampilkan dialog "restore dari backup terakhir?".

**Acceptance criteria:**
- Export/restore roundtrip: data identik sebelum & sesudah.
- Primary daily backup tidak menumbuhkan file (rotasi 4 file terakhir).
- Editor kartu menampilkan hasil preview tipe kartu sebelum disimpan.

### F7 — AI Percakapan **offline** (Fase 4) — LLM lokal di dalam aplikasi, tanpa API

Diperbarui setelah verifikasi perangkat pemilik (Ryzen 5 3400G 4c/8t, RAM 14 GB, iGPU Vega 11) dan riset model kecil 2026 (sumber §14.8–14.9): model instruksi kelas 4B kuantisasi Q4_K_M berjalan di CPU ini ±5–10 token/detik — pas untuk percakapan **diketik** 10–15 menit per sesi. Nol biaya, nol internet setelah model ada. **Model terkunci (§13.2):** default **Qwen3.5 4B**, fallback **Phi-4 Mini 3.8B**.

**Cara kerja:**
- **Mesin inferensi:** llama.cpp yang di-compile langsung ke Rust core (`crate llama-cpp-2`): bukan server luar, bukan cloud. Jalur CPU standar; Vulkan (iGPU) hanya opsional jika memberi manfaat.
- **Manajer model (keputusan terkunci §13.2):** default **Qwen3.5 4B** kuantisasi **Q4_K_M** — lisensi Apache 2.0, MMLU-Pro 79.1 (tertinggi di kelas 4B), konteks 256K, unduh GGUF ±3,3–4,0 GB **sekali saja** (sumber resmi: Hugging Face `Qwen/Qwen3.5-4B` GGUF atau Ollama `qwen3.5:4b`), checksum diverifikasi, bisa dihapus dari Pengaturan; installer aplikasi tetap kecil (tidak membundel model). Mode **thinking** bawaan Qwen3.5 **dimatikan** di CPU agar token tidak menumpuk. **Fallback saat RAM ketat: Phi-4 Mini 3.8B** (lisensi MIT, unduh ±2,5 GB). Opsi ketiga untuk situasi kritis: Qwen3.5 2B. Ditimbang lalu ditolak: Gemma 4 E4B (mutu baik tapi unduh 6,6–9,5 GB — terlalu berat untuk RAM/iGPU ini) dan Llama 3.2 (dianggap usang oleh riset 2026).
- **Fitur (sama seperti rancangan awal):** skenario roleplay dari kurikulum (mis. "Bestellung im Restaurant" — unit 04); koreksi inline + penjelasan, mode explicit/implicit; simpan kata/frasa langsung ke deck SRS F1 (tabel `saved_from_chat`); laporan akhir sesi (JSON) untuk F5.
- **Gerbang perangkat (bertingkat):** RAM bebas ≥ 6 GB → jalankan Qwen3.5 4B; 4–6 GB → otomatis turun ke Phi-4 Mini 3.8B; < 4 GB → F7 disembunyikan, inti aplikasi tak berubah. Streaming token ditampilkan saat dibangkitkan supaya terasa responsif.
- **Interaksi diketik dulu**; input suara (whisper.cpp model kecil, ±500 MB) menyusul sebagai opsi lanjutan — TTS tetap memakai Piper lokal atau klip audio bundle (F4).

**Batas mutu yang jujur:** koreksi kesalahan umum A1–A2 (artikel/kasus/konjugasi) memadai; penjelasan panjang dan nuansa C1 lebih lemah daripada model cloud besar — sesuai target level aplikasi (A1→A2), ini bisa diterima.

**Batasan fase ini:** tidak dibangun di MVP; nol biaya API; nol ketergantungan jaringan — termasuk saat AI aktif.

### F8 — Mode Uji Tiruan Goethe/telc A1 (Fase 5)

- Format komponen ujian Goethe A1 (Hören/Lesen/Schreiben/Sprechen) sebagai set teks + item dengan timer per bagian + rubrik penilaian mandiri.
- Hasil tersimpan; kelemahan per komponen tercatat di F5.

---

## 8. Arsitektur & Teknologi

```
┌────────────────────── Tauri 2 (Windows) ──────────────────────┐
│ Frontend (WebView2)                │ Rust core (src-tauri)    │
│ • React + TypeScript + Vite        │ • SQLite (plugin-sql)    │
│ • State: Zustand                   │ • File system & dialogs  │
│ • SRS: ts-fsrs                     │ • Notification plugin    │
│ • TTS: Piper lokal + klip bundle      │ • (nanti) auto-update    │
│ • UI: Tailwind CSS                 │                          │
└────────────────────────────────────┴──────────────────────────┘
              ▲ seed konten JSON (dibangun sekali, ikut aplikasi)
```

**Alasan pemilihan:**
- **Tauri 2**: bundel kecil (MB-an, bukan Electron), jalan di Windows 10/11 via WebView2 yang sudah ada, backend Rust; SQLite native aman untuk data belajar lokal.
- **React + TypeScript**: ekosistem matang; komposisi komponen drill/flashcard berulang dengan tipe yang jelas.
- **ts-fsrs (npm)**: implementasi FSRS open-source yang setara Anki (Anki memakai FSRS sejak 2023).
- **Tailwind CSS**: tema Akademik Premium (ivory + emas + serif, lihat §10); komponen keyboard-friendly untuk drill.
- **Piper lokal + audio bundle**: sintesis offline untuk teks bebas; klip inti sebagai fallback (lihat F4).
- **LLM lokal (Fase 4, F7)**: mesin llama.cpp di-compile dalam Rust core (`llama-cpp-2`); model **Qwen3.5 4B Q4_K_M (±3,5 GB)** default, **Phi-4 Mini 3.8B (±2,5 GB)** fallback — diunduh sekali, AI tetap 100% offline.
- **SQLite single-file**: semua progres, siap backup/restore murah.

**Struktur repo (disarankan):**

```
src/
  ui/           Komponen layar & shared (buttons, card, chart)
  srs/          wrapper ts-fsrs + policy antrian harian
  drills/       Engine drill + definisi D1–D10 + loader bank item
  lessons/      loader unit/pelajaran (JSON)
  data/         Seed JSON: words_unit1.json … texts/, grammar/
  stores/       Zustand: progressStore, sessionStore, settingsStore
src-tauri/      Rust: sqlite, fs, notification, dialog
scripts/        Node/Python: generator konten (daftar Goethe → seed JSON)
```

---

## 9. Model Data (SQLite, tabel inti)

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| decks | id, name, level, topic, kind(vocab/grammar) | dibuat dari seed; bisa custom |
| entries | id, kind(noun/verb/adj/phrase), de, article, plural, forms_json, meaning_id, example_de, example_id, tags, audio_ok | satu kata = satu baris |
| cards | id, entry_id, type(reco/produce/listen/cloze), deck_id | 4 tipe kartu diturunkan dari satu entry |
| srs_state | card_id, due, stability, difficulty, reps, lapses, last_grade | state FSRS |
| attempts | id, ts, kind(review/drill/quiz), item_id, correct, ms, drill_code | log setiap jawaban |
| drills | code, name, level, item_source, lesson_ref | definisi D1–D10 |
| lesson_progress | unit_no, lesson_no, state, score, finished_at | state pelajaran |
| texts | id, title, level, body_json, tags | teks baca |
| reading_log | id, text_id, ts, words_saved | log baca |
| progress_daily | date, minutes, cards_done, drills_done, streak_count | dashboard & streak |
| saved_from_chat | id, ts, phrase, meaning, source | siap untuk F7 |
| config | key, value | target harian, preferensi TTS Piper, tema, (nanti) AI keys |

**Migrasi:** versioned migration; seed idempotent (bila file seed memakai `version_hash` yang sudah sama, tidak di-reimpor). Semua data belajar **tidak** ikut seed — seed hanya konten.

---

## 10. Rancangan UX (teks)

**Tema visual — terjawab (§13.4, mockup pengguna 08-Nov-2026):** gaya **"Lernen Akademik Premium"** — dasar ivory/parchment, aksen emas, heading serif (Georgia), panel krem bergaris sepia; modus gelap opsional menyusul di M3 sebagai tema kedua. Tema gelap default lama dibatalkan.

**Navigasi rail kiri desktop:** `Hari Ini · Kurikulum · Drill · Kosakata · Membaca · Statistik · Pengaturan`

1. **Hari Ini** — ringkasan "yang dikerjakan hari ini": kartu jatuh tempo, drill yang direkomendasikan, pelajaran berikutnya; tombol mulai besar.
2. **Kurikulum** — grid unit (terbuka/terkunci/progres); klik unit → daftar pelajaran 5 langkah + tombol checkpoint.
3. **Drill** — pilih jenis (D1–D10) → sesi 2–5 menit → hasil + rekomendasi.
4. **Kosakata** — daftar deck; editor kartu; tombol "Review cepat"; statistik deck.
5. **Membaca** — daftar teks per level; reader: TTS Piper/klip bundle per kalimat (kecepatan), kata → popover artinya + "Simpan ke deck".
6. **Statistik** — (F5) streak, heatmap, mastery per topic, forecast due, kelemahan, ready check A1.
7. **Pengaturan** — target harian (default 15 menit), TTS Piper dan kecepatan, tema (Akademik Premium default; modus gelap opsional di M3), backup/import, path data.

**Prinsip UI:** tema **Akademik Premium** (ivory + emas + serif, lihat atas §10); font besar (kenyamanan membaca lama); setiap jawaban salah **mengajarkan**, bukan hanya menyatakan salah; shortcut keyboard drill (1/2/3/4 untuk grade).

---

## 11. Roadmap

| Fase | Isi | Estimasi (jam kerja efektif) |
|---|---|---|
| M0 | Skeleton Tauri+React, DB & migrasi, navigasi, pipeline seed | 6–10 |
| M1 | **F1** SRS penuh + **F2** D1–D5 + layar **Hari Ini** | 16–24 |
| M2 | **F3** alur pelajaran 12 unit A1 + **F4** reader + TTS + D6–D10 | 20–30 |
| M3 | **F5** dashboard + streak + **F6** editor/import/backup + polish UI | 10–16 |
| M4 | (opsional) **F7** AI percakapan offline (llama.cpp + manajer model) | 16–26 |
| M5 | (opsional) **F8** mode uji tiruan + konten A2 (12 unit) + B1 skeleton | 20–30 |

Konten seed dibuat **mengikuti progres unit** (bukan sekali jadi): skrip generator membaca daftar kata Goethe + hasil kurasi Studio d (pipeline §6.4) → menghasilkan `words_unitN.json` → di-import saat build.

Satu fase dinyatakan selesai bila: (1) build berjalan di Windows, (2) checklist penerimaan per fitur lulus manual test, (3) DB valid dan seed masih idempotent (tidak menduplikasi data).

---

## 12. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Kebiasaan putus (konsistensi menurun) | Tinggi | Streak + antrian "Hari Ini" selalu memiliki sesi ≤ 5 menit; target harian bisa diturunkan bila luar biasa sibuk |
| Piper tidak merespons atau voice Piper tidak terpasang | Sedang | Batas waktu tunggu, pesan kegagalan yang terlihat, serta klip audio bundle untuk konten inti |
| Volume konten A1 besar untuk satu orang | Tinggi | Bangun per unit; generator skrip; jangan mengejar B1 sebelum A1 stabil |
| PDF referensi berupa pindai tanpa lapisan teks | Sedang | Pipeline OCR/kurasi per unit (§6.4); verifikasi manual hasil OCR setiap unit |
| Kerusakan/kehilangan data | Tinggi | SQLite single file + auto-backup mingguan + export/import manual + dialog restore |
| Scope creep (semua fase ingin sekaligus) | Tinggi | Lock fase per §5.2; fitur baru harus lewat pertanyaan terbuka §13 |
| Membangun aplikasi menelan waktu belajar (prokrastinasi produktif) | Tinggi | Aturan pengaman §3.3 poin 5: kuota belajar harian dulu, coding sesudahnya |
| Model LLM ±3–4 GB memakan disk & RAM saat sesi AI | Sedang | Manajer model (unduh sekali, bisa dihapus); gerbang RAM bertingkat — otomatis turun ke Phi-4 Mini 3.8B (±2,5 GB) bila RAM ketat; mesin hanya aktif saat sesi F7 |
| Kecepatan inferensi CPU 4 core (±5–10 token/detik) | Sedang | Interaksi diketik (bukan call mode); tampilkan token mengalir; jawaban model dibatasi pendek; mode thinking Qwen3.5 dimatikan |
| Mutu Jerman model kecil < model cloud besar | Sedang | Koreksi dibatasi pola umum A1–A2; pola penjelasan datang dari kurikulum, bukan imajinasi model |
| TTS pelafalan tidak sempurna | Rendah | TTS dipakai untuk latihan awal; kata inti memakai audio bundel; pelafalan native tidak dijanjikan |

---

## 13. Pertanyaan Terbuka (untuk saat review)

1. **Nama aplikasi** — ✅ **TERJAWAB (2026-11-08): Lernen**. Aplikasi memakai nama final ini; nama kerja lama "Dein Deutsch" dan alternatif lain dibatalkan.
2. **Posisi AI & pemilihan model** — ✅ **TERJAWAB (2026-11-08)**: berbentuk **AI offline** ya; fase tetap **M4** (default dipertahankan karena tidak ada keberatan); pengadaan = **unduh sekali** saat pertama pakai, installer tetap kecil (default dipertahankan). Model ditetapkan agent atas mandat pengguna, berdasar riset §14.8–14.9: **default Qwen3.5 4B (Q4_K_M, thinking dimatikan)**; **fallback Phi-4 Mini 3.8B** bila RAM bebas ketat. Detail di F7.
3. **Target uji nyata** — harus menuju Goethe/telc A1 di ±3 bulan? Ini memengaruhi prioritas F8 (dibangun Fase 5 sebagai alat latihan menjelang ujian).
4. **Tema visual** — ✅ **TERJAWAB (2026-11-08)**: **Akademik Premium** (ivory/parchment + aksen emas + heading serif Georgia) mengikuti mockup pengguna; detail & prinsip UI di §10. Modus gelap opsional di M3.
5. **Sinkronisasi data** — cukup satu PC + backup file (keputusan K1); kalaupun nanti mau ke HP, road mapnya tambah M6.
6. **Konten baca** — cukup teks yang dikurasi offline, atau mau fitur import cerita online nanti (internet opsional)?
7. **Kurikulum ikut buku atau ikut daftar Goethe?** — ✅ **TERJAWAB (2026-11-08): keduanya — buku sebagai isi, Goethe sebagai kerangka.** Konten tiap unit (tema, Wortschatz, mini-lesson, latihan) **mengikuti buku di `Modul belajar`**; kerangka level/checkpoint tetap standar Goethe/telc. Pembaruan 2026-11-09: unit A1 yang belum dapat dipetakan ke buku ditulis sebagai materi orisinal beracuan Goethe agar aplikasi bisa digunakan; penyesuaian mengikuti buku dilakukan setelah arsip valid tersedia.
8. **Status unduhan** — pada pemeriksaan terakhir (2026-11-09), zip 001 masih `.crdownload` dan gagal diekstrak. Materi orisinal Goethe sudah dipakai untuk mengisi A1 unit 5–12; penyelarasan dengan buku akan dilakukan setelah arsip valid tersedia.

---

## 14. Lampiran — Sumber Riset (dibaca Nov 2026)

1. **"The Best Apps to Learn German in 2026, Tested by a German Learner"**, learngermanwithgames.com (Jul-2026) — tabel "app untuk learner mana", tip "kombinasikan 2–3 app", review Duolingo/Babbel/Pimsleur/Anki/Seedlang/Nicos Weg + tiga kombinasi paket belajar.
2. **"Duolingo German Review"**, learngermanwithgames.com (Jul-2026) — analisis mengapa pengguna jangka panjang masih menebak der/die/das; produksi vs pilihan ganda; koreksi tanpa penjelasan.
3. **"German Levels Explained: A1 to C2 (CEFR)"**, deutschmitdanielle.de — can-do tiap level; estimasi jam (60–100 jam per level; 0→B1 ±200 jam); level required by visa/kerja (A1 pasangan, B1 residence).
4. **"I Tested the Top 5 AI Speaking Apps for Months"**, lingtuitive.com (upd. 02-Nov-2026) — perbandingan Langua/Speak/Praktika/Univerbal/Talkpal: koreksi inline + mode implisit, My Path yang dibangun dari percakapan & kesalahan pengguna sendiri, kelemahan SRS pada banyak app.
5. **"What's the best AI language learning app in 2026?"**, languatalk.com (30-Oct-2026) — fitur koreksi penuh + keterbatasan ChatGPT sebagai tutor (lupa koreksi, memotong kalimat, dsb.).
6. **Daftar Goethe A1/A2/B1 (nouns/verbs/adjectives)**, learngermanwithgames.com /resources — acuan bank kartu F1 (tipe kata & isu per level).
7. **studio d B1 — Kurs- und Übungsbuch mit Zertifkatastraining**, H. Funk dkk., Cornelsen 2007 (pindai 264 hlm, milik pemilik; di `Sumber reffrensi\Studio D B1\`) — struktur Start + 8 Einheiten + Stationen; Wortschatz per unit; latihan sertifikasi; acuan pipeline §6.4.
8. **"Best Small Local LLMs 2026: Top 4B Models and the Smallest to Run Locally"**, promptquorum.com (upd. 18-Okt-2026) — ranking kelas 4B: **Qwen3.5 4B** (MMLU-Pro 79.1, konteks 256K, unduh ±3,3–4,0 GB di Ollama, Apache 2.0) di atas Gemma 4 E4B (69,4; unduh 6,6–9,5 GB — terlalu berat) dan **Phi-4 Mini 3.8B** (MIT, ±2,5 GB); opsi ringan Qwen3.5 2B/0.8B untuk mesin 4 GB; kuantisasi default Q4_K_M → dasar keputusan model F7 (§13.2).
9. **"Best Small LLM for Local Deployment in 2026"**, ertas.ai (upd. 30-Apr-2026) — pemetaan kelas 2B/4B/7B/14B terhadap memori perangkat (telepon 4 GB / laptop 8–16 GB); model < 7B kini layak instruksi/chat lokal → mengonfirmasi pilihan kelas 4B untuk Ryzen 4-core + RAM 14 GB.

*Catatan bias: beberapa sumber adalah vendor ber-afiliasi (Lingtuitive/LanguaTalk/learngermanwithgames mempromosikan app miliknya). Klaim yang dipakai adalah pola yang muncul **konsisten di beberapa sumber mandiri** — bukan angka harga.*

---

*Akhir PRD v1.1-draft, status 2026-11-09. Keputusan inti terkunci dan M0–M3 telah dibangun. A1 unit 5–12 dan teks tambahan sudah ditulis orisinal beracuan Goethe. Penyelarasan buku menunggu arsip 001 valid; F4 kini memiliki Piper dan fallback audio statis 30 berkas. F7/F8 tetap berada di fase opsional sesuai peta fitur.*
