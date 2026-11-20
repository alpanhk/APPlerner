# Lernen / KLAB — spesifikasi pengalaman dan antarmuka v1
Tanggal: 17 November 2026. Status: arah visual KLAB dipilih pengguna; detail perilaku di bawah merupakan rancangan untuk ditinjau, belum implementasi atau hasil uji pengguna.

Pembaruan urutan pengembangan pada tanggal yang sama mengikuti §0.7 [PRD v1.3](../../../PRD-Aplikasi-Belajar-Bahasa-Jerman.md). Tahap aktif menyelesaikan Lernen Windows. Port Android, adaptasi HP/tablet, dan perombakan besar KLAB pada dokumen ini dijadwalkan setelah tahap tersebut; arah visual yang dipilih tetap menjadi referensi lanjutan.

## 1. Keputusan dan tujuan
Lernen ditujukan untuk masyarakat umum berbagai usia, berbahasa Indonesia, belajar Jerman dengan prioritas kualitas A1. Android lebih diutamakan, Windows tetap didukung; HP, tablet, jendela kecil dan layar besar mendapat susunan yang sesuai. Semua aset pembelajaran inti dibundel dan bisa dipakai offline. Tidak ada akun, sinkronisasi, atau kebutuhan ekspor/impor dalam pengalaman baru.

Pengguna memilih opsi 2 KLAB dari tiga JPG. Nama aplikasi tetap Lernen. Gaya: buku komik ekspresif, maskot kucing, biru–merah–kuning, teks terbaca, ornamen terbatas. Pengguna meminta materi panjang dan catatan; animasi reaksi/meme, audio dan rekaman, percakapan bercabang; XP dan lencana/tingkat kelas; tema terang/gelap; pilihan terurut/bebas saat pertama mulai, bisa diubah; ulang materi sesudah lulus dan hitung jumlah lulus.

Tidak ada klaim siap ujian atau nilai pelafalan otomatis. A1–B2 pada navigasi adalah kelompok materi, bukan tingkat kemampuan yang telah disertifikasi. Tidak ada sistem nyawa, streak atau peringkat kompetitif sebagai motivasi utama.

## 2. Alternatif yang telah dipilih
- KIEZ: lingkungan kota dan belajar berbasis situasi; ilustrasi lebih dominan.
- KLAB (dipilih): buku komik, bacaan, sorotan dan catatan; cocok kebutuhan membaca panjang. Batasi dekorasi di luar teks utama.
- FUNK: studio percakapan; ide alur dengar–rekam–bandingkan dapat diterapkan dalam gaya KLAB, tanpa mengambil identitas visualnya.

Rancangan UI ini tidak menentukan perubahan framework atau membuktikan port Android. Implementasi Android memerlukan audit terpisah atas perintah Rust, lokasi data, audio, izin mikrofon dan pustaka native. Runtime saat ini Tauri/React/SQLite, dengan minWidth Windows 900; mengecilkan CSS saja belum cukup mendukung jendela sempit.

## 3. Batas pekerjaan ini
Deliverable: dokumen perilaku ini dan 3 papan JPG detail (onboarding/beranda/jelajah, pembelajaran/feedback, tablet/desktop/pengaturan).
Bukan deliverable tahap ini: mengubah UI produksi, migrasi database, membangun APK, merekam suara, memasang aset pihak ketiga atau menilai efektivitas belajar.
Angka pada JPG adalah data demonstrasi. Dokumen ini menjadi rujukan perilaku apabila teks kecil atau angka pada gambar hasil generasi tidak tepat. Nama unit memakai kurikulum kerja: U1 Salam & perkenalan diri; U2 Angka, waktu, harga; U3 Keluarga & hubungan; U4 Makanan & minuman.
Sumber aplikasi yang diperiksa: src/ui/pages/index.ts; src/stores/nav.ts; src/data/lessons/units_a1.json; src-tauri/tauri.conf.json; HANDOFF-LERNEN.md dan paket konsep sebelumnya.

## 4. Navigasi
| Tujuan utama | Isi dan rute |
|---|---|
| Hari Ini | Lanjut sesi; kesalahan yang perlu dilatih; SRS jatuh tempo; progres unit dan tujuan |
| Jelajah | Tab Materi, Kosakata, Bacaan, Latihan; pemilihan level; pencarian lokal |
| Catatan | Semua catatan, sorotan, pencarian, filter unit, buka materi asal |
| Profil | XP/lencana, statistik aktivitas dan hasil tujuan, pengaturan, pengelolaan rekaman |

Pemetaan fitur lama: Kurikulum -> Jelajah/Materi; Kosakata/SRS -> Jelajah/Kosakata dan pintasan Hari Ini; Membaca -> Jelajah/Bacaan; Drill D1–D10 -> Jelajah/Latihan; Statistik -> Profil/Progres; Pengaturan -> Profil/Pengaturan. Tidak menghapus bank konten atau riwayat lama.
Dalam sesi fokus, header Kembali + posisi sesi menggantikan navigasi global. Navigasi global tetap di luar sesi. Tombol kembali Android maupun desktop memulihkan konteks halaman dan posisi baca. Tidak mengirim ulang jawaban saat kembali.

Alur utama:
Buka -> onboarding bila belum selesai -> Hari Ini -> lanjut pelajaran -> materi -> latihan -> hasil -> remedial bila perlu -> kembali/lanjut.
Jalur bebas: Jelajah -> pilih unit -> materi atau latihan -> hasil; rekomendasi prasyarat tetap terlihat.
Catatan dan pengaturan dapat dibuka dari sesi; kembali memulihkan sesi yang sama.

## 5. Onboarding: tiga langkah pendek
1. Cara belajar. Terurut dipilih awal; pengguna bisa memilih Bebas. Penjelasan konkret di kedua kartu. Tidak ada klaim salah satu membuat belajar lebih cepat. Tidak mengumpulkan nama, usia, tanggal lahir atau identitas yang tidak diperlukan.
2. Kenyamanan. Tema Sistem/Terang/Gelap; ukuran teks Normal/Besar/Sangat besar dengan contoh; Meme reaksi aktif; Suara reaksi nonaktif; Kurangi gerakan mengikuti preferensi OS bila tersedia, dapat diaktifkan manual. Ini default usulan desainer. Audio pelajaran tetap terpisah dari suara efek. Tombol 'Lanjut', bukan mengakhiri onboarding.
3. Kenali sesi. Pratinjau Materi -> Latihan -> Catatan; tombol 'Mulai dari A1' dan 'Jelajah materi'. Penjelasan offline ringkas. Mikrofon belum diminta izinnya.
Kembali mempertahankan isian; menutup aplikasi melanjutkan langkah terakhir. Mengganti pilihan tidak mereset progres. Pengguna lama mendapat pengenalan ringkas desain baru, tanpa memaksa mengulang seluruh onboarding atau kehilangan pengaturan lama.

Terurut: unit pertama setiap level dapat diakses untuk menjaga perilaku level mandiri yang sudah ada; unit berikutnya dibuka setelah checkpoint unit sebelumnya lulus. Pengecualian usulan desainer: jika bank checkpoint memang belum siap, setelah semua pelajaran unit selesai tawarkan 'Lanjut materi sambil menunggu checkpoint'. Ini membuka materi unit berikut tanpa menandai unit sebelumnya lulus, tanpa XP kelulusan, dan dengan status 'Asesmen belum tersedia'. Akses materi yang telah diberikan tidak dicabut ketika bank kemudian tersedia; beranda menawarkan checkpoint yang tertunda. Pengecualian tidak berlaku untuk pengguna yang gagal pada checkpoint yang tersedia, dan tidak berlaku ketika hanya terjadi kegagalan simpan/audio. Tidak mengganti bank diam-diam dengan asesmen berbeda. Belum ada tes penempatan, sehingga A1 tetap rekomendasi awal dan level lanjutan diberi saran prasyarat. Ini aturan rancangan, bukan bukti kesiapan materi lanjutan.
Bebas: seluruh materi yang tersedia dapat dibuka; prasyarat ditampilkan sebagai saran. Checkpoint tetap tunduk pada kesiapan bank. Mengganti mode tidak mengubah skor, kelulusan atau jumlah putaran. Bila beralih ke Terurut saat unit belum terbuka sedang dikerjakan, izinkan menyelesaikan sesi aktif; rute berikutnya mengikuti aturan terurut. Jangan mengunci ulang unit yang sudah pernah lulus.

## 6. Detail layar
| ID | Layar | Isi wajib | Tindakan utama |
|---|---|---|---|
| O1–O3 | Onboarding | Mode, kenyamanan, pengantar sesi | Lanjut / Mulai |
| H1 | Hari Ini | Sesi terakhir, rekomendasi satu langkah, perbaikan, SRS, progres | Lanjutkan belajar |
| E1 | Jelajah | Pencarian, filter level/jenis, unit dan status | Buka materi |
| U1 | Detail unit | Tujuan, prasyarat, pelajaran, checkpoint, riwayat lulus | Mulai / Lanjut |
| L1 | Pembaca materi | Tujuan, materi, contoh, audio, penjelasan, catatan | Coba latihan |
| L2 | Latihan | Satu soal, input, feedback, penjelasan | Periksa / Soal berikut |
| L3 | Percakapan | Skenario, giliran, pilihan respons, contoh suara | Pilih respons |
| R1 | Rekam/bandingkan | Contoh, rekam, putar, simpan/hapus | Rekam / Hentikan |
| C1 | Hasil checkpoint | Total dan per tujuan, jumlah soal, kriteria | Remedial / Lanjut |
| N1 | Catatan | Daftar dan editor, referensi materi | Catatan baru |
| P1 | Profil | XP, lencana, progres, statistik dengan konteks | Lihat progres |
| S1 | Pengaturan | Mode, tema, teks, humor/suara/gerak | Perubahan tersimpan |
| S2 | Rekaman | Daftar, durasi/ukuran, putar/hapus | Pilih rekaman |
| U2 | Ulang unit | Status pernah lulus, dampak yang jelas | Mulai putaran baru |

### H1 — keputusan belajar berikutnya
Untuk pengguna baru, tawarkan A1 U1. Untuk pengguna kembali, lanjutkan sesi belum selesai. Setelah checkpoint gagal, tampilkan perbaikan tujuan yang gagal, bukan mengarang diagnosis. SRS jatuh tempo tampil dengan jumlah; tidak memaksa menyelesaikan semuanya sebelum materi.
Beranda tidak menyebut 'Perbaiki 3 kesalahan' jika tidak ada data terkait; ganti 'Belum ada kesalahan untuk ditinjau' atau sembunyikan panel.
Progres unit selesai dihitung dari status kelulusan yang tersimpan, bukan persentase membaca. Target kompetensi dipisahkan dari aktivitas. Contoh konsisten: 3/12 selesai, U4 sedang belajar. XP dan lencana ditempatkan sesudah tindakan utama.

### L1 — materi, catatan dan penjelasan
Lebar baca maksimal sekitar 65 karakter per baris; teks isi 16–18 px, line-height 1.55–1.7. Materi panjang dibagi subjudul, tidak dipaksa satu kartu kecil. Ilustrasi komik singkat pada pembuka/konsep penting; pembaca dapat menyembunyikan ilustrasi melalui mode tenang.
Tampilkan tujuan dan prasyarat ringkas, contoh Jerman dan terjemahan Indonesia, pembanding/kesalahan umum, ringkasan. Penjelasan lanjutan dibuka sesuai kebutuhan; catatan dapat dibuat lewat seleksi teks atau tombol 'Tambah catatan' agar tidak bergantung long-press.
Sorotan dan catatan menyimpan referensi stabil ke bagian materi beserta kutipan cadangan. Jika materi diperbarui dan kutipan tidak ditemukan, catatan tetap terlihat dengan label 'Bagian sumber berubah'; tidak dibuang.
Di HP editor catatan berupa panel layar penuh yang menjaga posisi baca. Di tablet/desktop menjadi panel samping. Editor menyimpan otomatis dengan status Menyimpan/Tersimpan/Gagal; bila gagal teks tidak hilang dan ada Coba lagi. Tidak memberi label tersimpan sebelum komit berhasil.

### L2 — latihan dan feedback
Sebelum menjawab: belum ada skor. Setelah Periksa: cegah klik berulang sampai penyimpanan selesai. Benar menampilkan alasan; salah menampilkan jawaban rujukan, alasan yang benar-benar dipetakan, dan cara berlatih lagi. Kesalahan tak dikenali mendapat petunjuk umum tanpa diagnosis palsu.
Enter hanya menjalankan aksi yang tampak dan sesuai fokus; tidak melewati dua soal ketika tombol ditahan. Tidak memaksa drag: susun kata juga dapat dipilih/dibatalkan dengan tap/keyboard.
Soal pilihan ganda mengacak posisi pilihan, bukan hanya urutan soal. Kunci alternatif tidak boleh membatalkan tujuan soal (artikel wajib bila yang dinilai artikel).
Feedback salah tidak memberi hadiah untuk menjawab salah; animasi tidak menghalangi penjelasan. Tombol Coba soal baru tidak mengubah attempt sebelumnya. Audio gagal memiliki pesan inline dan rute belajar teks.

### L3/R1 — percakapan dan suara
Skenario bercabang ditulis dan dibundel lokal; tidak membutuhkan LLM. Contoh di kafe: 'Was möchten Sie trinken?' dengan beberapa respons sah dan cabang yang sesuai. Pilihan yang sah tidak ditandai salah karena berbeda dari satu contoh. Latihan struktur tertentu memakai soal terpisah dengan tujuan eksplisit.
Alur rekam: siap -> minta izin pertama kali -> merekam (timer, Hentikan/Batal) -> pratinjau -> simpan/hapus -> putar/bandingkan. Batas usulan 60 detik per klip; tampilkan sisa waktu, hentikan secara aman. Hanya satu audio berbunyi; memulai rekaman menghentikan contoh dan efek. Saat app masuk latar, hentikan rekaman dan tawarkan pratinjau saat kembali; jangan merekam diam-diam.
Jika izin ditolak, beri 'Lanjut tanpa rekam' dan petunjuk pengaturan perangkat. Tidak memblokir pembelajaran atau kelulusan. Bila perangkat tidak mendukung, mode teks/audio contoh tetap tersedia.
Tidak ada pengiriman suara, identifikasi suara, transkripsi atau nilai pelafalan otomatis. Label hasil: 'Rekaman tersimpan. Dengarkan dan bandingkan dengan contoh.' Rekaman dapat dihapus satuan/banyak melalui daftar dan konfirmasi jumlah, tanpa menghapus catatan atau progres.

### C1 — hasil yang dapat dipercaya
Bank berbasis tujuan: total >=70% DAN minimal 2/3 per tujuan (mengikuti policy unit, jangan hardcode secara global). Tampilkan tujuan, benar/total dan alasan belum lulus. Contoh 11/15 (73%) dengan satu tujuan 1/3 tetap 'Masih perlu latihan'. Tujuan 3/3,3/3,2/3,2/3,1/3 menghasilkan total 11.
Remedial memakai item baru yang tersedia untuk tujuan gagal. Hasil remedial tidak mengubah skor checkpoint. Ulang checkpoint membuat percobaan baru; utamakan item yang belum dilihat termasuk remedial dalam sesi/putaran terkait, tanpa mengklaim semuanya baru bila bank terbatas.
Bank tidak cukup: tampilkan 'Checkpoint belum siap' dan tawarkan materi/latihan; jangan mengganti otomatis dengan tes terjemahan lalu menyebutnya tes tujuan.
Checkpoint lama tetap jujur diberi label 'Pemahaman contoh' atau sesuai kemampuan yang diuji, tidak klaim 'soal baru per tujuan'. Hasil sesi dan hasil per tujuan disimpan, bukan hanya skor terbaik.
Simpan gagal: hasil tetap di layar, tombol 'Coba simpan lagi'; jangan mengulang kuis, kehilangan jawaban atau menghitung dua kali.

### U2 — ulang materi dan hitung lulus
Tombol hanya tersedia untuk unit yang pernah lulus. Dialog menjelaskan lingkup: mulai putaran baru untuk unit ini, sementara riwayat lulus, catatan, kosakata dan jadwal SRS tetap ada. Batal tidak menulis data.
Pisahkan status putaran aktif dari riwayat kelulusan seumur penggunaan. Putaran baru memulai pelajaran/latihan unit dari awal tanpa mengunci unit lain yang telah terbuka. Kelulusan bertambah paling banyak sekali per putaran yang menyelesaikan checkpoint dengan sah. Pengulangan checkpoint dalam putaran sama tidak menambah penghitung.
Menyelesaikan putaran pertama -> 1; mulai ulang -> tetap 1; gagal -> tetap 1; lulus ulang -> 2. Klik simpan berulang, restart dan pemulihan tidak boleh menggandakan angka.
Riwayat lama yang hanya menyimpan satu skor total TIDAK dapat direkonstruksi sebagai jumlah pasti. Tampilkan 'Pernah lulus · riwayat lama' dan hitung putaran baru sebagai '1 kali sejak pembaruan', tanpa mengarang angka historis. Unit lama yang sudah lulus tetap dapat diulang.

## 7. XP dan lencana (kebijakan usulan, bukan keputusan pengguna)
XP hanya umpan balik aktivitas, terpisah dari kelulusan dan tidak dapat membeli akses.
Pengguna menyebut 'lencana (atau tingkat kelas)'. Rancangan memilih lencana sebagai alternatif tersebut; tidak menambah jenjang kelas berbasis XP. A1–B2 tetap kelompok materi, bukan kelas yang naik karena XP.
Usulan sederhana: pelajaran selesai +20 XP sekali per putaran; checkpoint lulus +30 XP sekali per putaran; sesi SRS 10 kartu +10 XP sekali per hari lokal. Tidak ada XP per klik atau per membuka layar. Batas hadiah harian bukan batas belajar.
Lencana: 'Mulai belajar', 'Unit pertama lulus', 'Catatan pertama', 'Kembali berlatih' (putaran kedua lulus). Hindari label 'Mahir A1' karena tak terukur. Tidak ada hadiah untuk memberikan izin mikrofon atau data pribadi.
Semua event hadiah memiliki identitas unik agar tidak berulang saat retry. Data lama tidak dikonversi menjadi XP tanpa aturan migrasi eksplisit. Untuk desain ini gunakan XP contoh; nilai dapat disesuaikan sesudah pilot.

## 8. Sistem visual dan aksesibilitas
Token usulan:
- Light: kertas #FFFCF5; permukaan #FFFFFF; teks #172033; teks sekunder #475569; primer #1746D1 dengan teks putih; aksi aksen #B83226 dengan teks putih; sorotan #FFE16A dengan teks #172033; garis #667085.
- Dark: latar #151922; permukaan #222938; teks #F5F7FB; sekunder #BAC5D6; primer #99B6FF dengan teks #101827; aksen #FFADA2 dengan teks #241411; sorotan #E8CA58 dengan teks #171A21; garis #8B99AF.
Warna gambar hanyalah contoh arah; pasangan produksi perlu pemeriksaan kontras. Judul tebal, isi sans-serif netral. Pilih satu font lokal berlisensi jelas, fallback sistem; tidak memuat font internet.
Kontrol minimal 48x48 logical px/dp sebagai target desain; jarak antartarget 8 px. Focus ring terlihat; status memakai ikon+teks selain warna. Label pembaca layar, urutan fokus dan status penyimpanan dapat diumumkan. Tipografi bisa diperbesar sampai 200% tanpa menghilangkan fungsi.
Animasi reaksi 180–300 ms, tidak berkedip atau loop terus; reduced-motion menggantinya dengan perubahan statis. Meme maksimum satu per akhir kelompok soal, tidak setiap ketukan, dapat nonaktif. Suara reaksi default nonaktif dan volume terpisah; tidak menimpa ucapan. Konten humor dipilih untuk lintas usia, tidak mengejek kesalahan atau memakai bahasa kasar.
Maskot adalah karakter orisinal contoh, bukan aset produksi yang sudah diekstrak dari JPG. Gambar/soundboard internet hanya dibundel setelah pemilihan file, pemeriksaan isi, lisensi dan metadata sumber per aset. Jangan menganggap seluruh situs satu lisensi.

## 9. Responsif
| Lebar logis awal | Susunan |
|---|---|
| 320–599 | Satu kolom; bottom nav 4 tab di luar sesi; editor catatan fullscreen |
| 600–1023 | Rail ringkas bila muat; materi dan panel catatan opsional; jika teks besar, kembali satu kolom |
| >=1024 | Rail berlabel, area baca terbatas lebarnya, panel catatan/progres kontekstual |

Breakpoint adalah keputusan awal desainer, ditentukan ruang isi bukan model HP. Tidak ada kewajiban landscape; rotasi mempertahankan state. HP horizontal tetap dapat satu kolom bila tinggi sempit. Tablet portrait memprioritaskan bacaan. Keyboard virtual tidak menutup kolom teks/tombol simpan; bottom bar naik atau disembunyikan tanpa kehilangan aksi. Insets sistem dihormati. Resize Windows menjaga posisi dan draft. JPG menggambarkan tablet landscape dan desktop; pengujian responsive baru dilakukan pada prototipe/implementasi.

## 10. State wajib
| Kondisi | Respons |
|---|---|
| Baru tanpa progres | Mulai A1 U1, belum ada statistik kemampuan |
| Semua latihan selesai | Pilih materi baru/ulang unit lulus/SRS, tanpa kewajiban streak |
| Pencarian kosong | Pesan jelas, reset filter |
| Catatan kosong | Contoh manfaat, tombol buat; bukan contoh tersimpan palsu |
| Penyimpanan gagal/penuh | Pertahankan input, jelaskan kegagalan, coba lagi, kelola rekaman |
| Audio tidak tersedia | Pesan, ulang pemutaran, transkrip; tidak menggantung sesi |
| Mikrofon ditolak | Lanjut tanpa rekam; tidak memberi nilai gagal |
| Bank belum siap | Materi tersedia, checkpoint tidak dilaporkan valid |
| Keluar/ditutup mendadak | Pulihkan sesi terakhir; jangan duplikasikan attempt/hadiah |
| Tema/ukuran/mode berubah | Pertahankan data dan posisi, simpan preferensi |
| Materi seed diperbarui | Edit/penghapusan pengguna tetap terjaga; catatan tetap dapat dibuka |

## 11. Data dan batas migrasi
Aplikasi sekarang menyimpan draft pelajaran di localStorage dan attempt di SQLite; desain membutuhkan satu transaksi untuk jawaban, posisi sesi, hasil tujuan dan hadiah yang terkait. Gunakan identitas sesi/item/putaran stabil dan idempotensi; detail skema diserahkan ke rencana implementasi.
Data baru yang diperlukan: preferensi onboarding; catatan dan anchor; sesi/draft atomik; putaran unit; hasil per tujuan/attempt; event XP unik; metadata rekaman. Berkas rekaman dan metadata perlu recovery bila penulisan salah satunya gagal.
Pengguna tidak menginginkan fitur ekspor/impor pada pengalaman baru. Ini bukan izin menghapus data, file backup atau perlindungan pemulihan yang sudah ada. Simpan mekanisme pemulihan internal dan gunakan DB QA untuk migrasi/restore/crash. Jangan menghapus fitur lama secara destruktif tanpa rute migrasi.
Mode bebas, rotasi dan perubahan tema tidak mengubah isi materi/progres. Catatan pribadi tidak dicampur ke seed. Tidak ada server untuk data pengguna.
Port Android harus memastikan perintah Windows/Piper tidak dipanggil pada perangkat yang tidak mendukungnya. Audio pelajaran dibundel; model TTS besar bukan persyaratan paket awal. Pilihan native adapter ditentukan dari audit kemampuan, bukan dari gambar.

## 12. Anggaran performa dan ukuran
Target desain awal, belum hasil ukur:
- Ilustrasi, ikon dan reaksi terpilih: 5–10 MB.
- Audio A1 awal: 15–30 MB, durasi dan mutu diverifikasi.
- Satu font lokal subset seperlunya; gunakan ikon/ilustrasi vektor atau WebP, animasi transform pendek; tidak membundel semua sound pack.
- Runtime/native/data menambah ukuran paket; belum ada janji total APK/AAB.
- Rekaman pengguna terpisah dari ukuran instalasi; tampilkan penggunaan penyimpanan dan hapus terpilih.
Tidak memuat sumber jaringan saat belajar. Tiap file aset harus ada di manifest dengan ukuran, tujuan, sumber, lisensi, dan apakah dipakai; deduplikasi contoh audio. JPG papan desain tidak menjadi gambar antarmuka produksi.

## 13. Kriteria penerimaan tahap implementasi
1. Semua fitur lama yang dipertahankan dapat dicapai dari empat tujuan navigasi; back mengembalikan konteks.
2. Terurut/bebas dan tema tersimpan melewati restart, tanpa mengubah skor/kelulusan.
3. Membaca, catatan, latihan dan pengaturan dapat dipakai pada 360x800, 800x1280, 1280x800 dan jendela sempit; 320 px serta teks 200% diuji sebagai batas.
4. Keyboard/fokus, pembaca layar, sentuhan dan reduced-motion diuji pada alur utama.
5. Jawaban salah/alternatif/tidak dikenal, opsi acak dan nilai 73% dengan tujuan gagal diuji.
6. Kegagalan simpan/kill/retry tidak menghilangkan atau menggandakan jawaban, putaran lulus dan XP; database terisolasi.
7. Izin mikrofon ditolak, klip kosong, batas durasi, audio gagal dan storage penuh punya rute lanjut.
8. Ulang unit hanya aktif setelah pernah lulus; riwayat dan catatan tetap; jumlah bertambah sekali per putaran.
9. Instalasi bersih Android/Windows, paket offline dan ukuran aktual dicatat terpisah dari build frontend.
10. Materi dan bahasa ditinjau; pilot pembelajar menentukan hambatan. Usulan pilot 5 peserta dengan variasi pengalaman/perangkat untuk tugas navigasi, baca/catat, remedial dan pengaturan; ambang awal 4/5 tugas inti selesai tanpa bantuan, bukan bukti efektivitas atau generalisasi semua usia. Pilot awal dewasa; evaluasi anak/lansia adalah tahap terpisah sebelum klaim cocok semua usia.

## 14. Urutan sesudah desain ditinjau
A. Rencana implementasi dan audit porting/ukuran; perbaiki validitas penilaian serta ketahanan sesi yang sudah ditemukan.
B. Shell responsif, token, tema, navigasi empat tujuan dan preferensi mode; jaga akses fitur lama.
C. Irisan A1 U4 lengkap: baca/catat -> latihan -> hasil/remedial -> riwayat ulang; uji gagal dan data lama.
D. Percakapan/audio/rekaman offline, kurasi aset humor, XP/lencana.
E. Uji perangkat, kurasi materi dan pilot; perluas kualitas ke unit A1 lain.
Tidak menganggap seluruh A1 atau port Android selesai dari satu irisan.

## 15. Pemeriksaan rancangan
Reviewer terpisah membaca dokumen sebagai calon pembuat rencana implementasi. Dua celah diperjelas: rute lanjut materi ketika bank checkpoint belum siap (§5) dan pemilihan lencana tanpa jenjang kelas XP (§7). Keduanya keputusan rancangan yang dapat ditinjau, bukan klaim persetujuan pengguna atas detail baru. Reviewer tidak menjalankan aplikasi atau memvalidasi bahasa/mutu pedagogis. Dokumen dan JPG belum merupakan prototipe interaktif.

