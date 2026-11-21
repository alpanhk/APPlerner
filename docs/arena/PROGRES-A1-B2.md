# Daftar kemajuan A1–B2

Checkpoint kerja: dasar penyutradaraan Bab 02 `e0371c3`; perubahan lanjutan pada PR #4 (tetap draft). Data dan hasil terdahulu: `HASIL-BAB01.md`, `HASIL-DUA-PROFIL.md`, `HASIL-BAB02.md`. Daftar ini adalah antrean hidup; laporan terdahulu adalah bukti historis, bukan klaim status baru.

## Terakhir diuji

Chromium otomatis memainkan prolog dari menu hingga Bab 01 (`test-browser-title-checkpoint.cjs`), lalu regresi judul, profil, buka ulang dan simpanan lama lulus. Pembacaan prolog menunjukkan catatan cangkir dan surat memotivasi pencarian, pertemuan di jalan serta percakapan pos/Mia; panggung dan dialog menjadi acuan. Ini pengamatan melalui jalur otomatis, bukan telaah pengalaman oleh manusia.

Bab 02 dimainkan dari kios hingga jurnal dan awal Bab 03 (`test-browser-chapter-two.cjs`). Tujuan terakhir diuji adalah pesan hari/jam: salah jam → Mia menyatakan Sabtu sudah dipahami → bantuan → revisi → pesan janji Jumat baru tanpa bantuan → jurnal. Jam dan hari juga diuji salah → bantuan → revisi → kartu baru mandiri. Peristiwa dan status bantuan tercatat per profil. Tes memakai profil awal yang disiapkan dan dimulai melalui Lanjutkan, bukan bermain ulang seluruh prolog dalam tes yang sama. Judul/scene, ganti profil, browser reopen, draft dan migrasi checkpoint `end` diuji; dua profil diuji terpisah. Ulasan jadwal pada tes Bab 02 disimulasikan jatuh tempo; 3/7/21 bukan bukti retensi manusia.

Dialog jam/hari/pesan memakai Stage dan DialogPanel: respons dan tindakan Mia mengikuti keputusan. Klip persis Bab 02 tidak ada: membaca/menulis, bukan menyimak; animasi bicara tidak aktif tanpa audio. Pemeriksaan tulisan berbasis pola konservatif, tidak menilai seluruh tata bahasa. Selesai dimainkan atau lulus pola bukan penguasaan. Browser Chromium headless tidak membuktikan suara didengar manusia; Windows offline, SQLite desktop dan mikrofon nyata belum diuji.

## Kekurangan terbuka dan pekerjaan berikut

1. Bab 02 belum seluruhnya disutradarai seperti prolog: peti/harga, latihan jam lain, urutan hari, preposisi, kios transfer dan penutup masih panel tugas; ubah per giliran tanpa membuang bukti atau merusak migrasi. Verifikasi tampilan kecil dan penyelesaian tanpa bantuan untuk semua jalur.
2. Tujuan hari dan pesan memiliki tugas baru, tetapi pola jawaban masih terbatas; perlu penguji bahasa menilai variasi maksud yang sah dan kontradiksi. Tambah cakupan otomatis sebelum memperluas evaluator. Latihan dan ulasan tidak menjamin penguasaan.
3. Bab 03 baru awal keluarga/artikel; lanjutkan tujuan mein/meine menurut naskah, lalu satu bab lengkap dengan penjelasan, latihan, umpan balik, transfer mandiri, jurnal dan ulasan per profil. A1–B2 masih jauh dari selesai.
4. Pengujian manusia terpisah: pengajar Jerman menelaah naskah, proporsi koreksi, jawaban bebas dan jurnal; pemain menilai alur prolog/Bab 02 dan aksesibilitas. Uji perangkat: Windows offline/SQLite, mikrofon nyata dan dengar kecocokan suara/tokoh/kalimat. Jangan unggah rekaman pribadi.

## Cara mencoba

Mulai cerita, pilih avatar dan mainkan prolog; di akhir lanjutkan Bab 01 lalu kios Bab 02. Pada jadwal pilih 09.30, minta bantuan, revisi ke 08.30 dan jawab kartu baru; lanjutkan hari dan pesan. Gunakan Judul/Lanjutkan dan ganti profil untuk memeriksa checkpoint. Bukti versi ini: `bukti/bab02-mia-bingung.png`, `bukti/bab02-checkpoint-jadwal.png`, `bukti/bab02-jurnal.png`. Pemeriksaan aset 125/125 cocok; build produksi lulus.
