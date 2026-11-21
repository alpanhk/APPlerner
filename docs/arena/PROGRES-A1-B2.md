# Daftar kemajuan A1–B2

Checkpoint awal sesi: `034b71d97ce823ceec51dff5cd27de72d9268c8d` pada PR #4 (draft). Laporan terdahulu `HASIL-BAB01.md`, `HASIL-DUA-PROFIL.md`, `HASIL-BAB02.md` adalah bukti historis, bukan status terbaru. Daftar ini adalah antrean hidup.

## Terakhir diuji

- Chromium otomatis `test-browser-full-menu.cjs`: mulai profil dari menu → prolog → Bab 01 → kios dan seluruh jalur utama Bab 02 → penutup/jurnal → Bab 03 keluarga/artikel → mein/meine → jumlah saudara/anak dan jurnal. Dialog kios kini memakai panggung, pembicara, Arti bila ada terjemahan, alasan bertindak, reaksi atas jawaban dan akibat; penutup memperlihatkan Mia mengenali foto. Ulasan dan jurnal tetap berbentuk panel, bukan percakapan. `bukti/bab02-penutup-dialog.png` merekam penutup yang diuji.
- `test-browser-chapter-two.cjs`: salah → bantuan → revisi → kartu baru tanpa bantuan untuk jam, hari dan pesan; draf, ganti profil, reopen, checkpoint lama `end`, judul dan jurnal. Bab 03 mein/meine dan jumlah keluarga diuji salah → bantuan → revisi → kartu baru, catatan per profil, buka ulang dan ulasan hari 3 dengan waktu disimulasikan. Pemain B tidak memiliki simpanan tujuan Bab 03 milik A. Layar kecil 320 × 568 dicek pada kios. Bukti: `bukti/bab02-mia-bingung.png`, `bukti/bab03-jumlah-jurnal.png`.
- `test-browser-title-checkpoint.cjs`, `test-browser-two-profile.cjs`, `test-browser-chapter-three-pending.cjs` lulus. Respons Bab 03 yang tidak dikenali dapat diteruskan sebagai menunggu telaah tanpa dianggap benar atau membuat jadwal palsu. Judul Bab 03 mengikuti adegan yang dibuka oleh Lanjutkan. Tes evaluator: Bab 02 18 kasus, Bab 03 17 kasus; jadwal 3/7/21 diuji terpisah pada jam simulasi. Build produksi lulus dan audit 125/125 aset cocok.

Tujuan terakhir dimainkan: `a1-u3-o3` jumlah saudara/anak. Latihan utama meminta jumlah dan dua relasi serta pertanyaan tentang anak; kartu mandiri baru hanya memeriksa jumlah tiga anak, sehingga belum membuktikan seluruh kemampuan tujuan itu secara mandiri. `a1-u3-o2` mein/meine: contoh, latihan, tiga label pada kartu pinjaman, dan tiga label kartu baru. Hasil berbentuk pola terbatas yang memerlukan telaah tulisan; lulus pola atau selesai bermain **bukan penguasaan**. Tanggal 3/7/21 disimpan per tujuan dan profil; ulasan hari 3 baru diuji dengan simulasi, bukan menunggu hari nyata.

Klip persis dialog baru Bab 02/03 tidak ada: kegiatan membaca/menulis, bukan menyimak; frame bicara tetap diam tanpa audio. Browser headless tidak membuktikan suara didengar manusia. Windows offline/SQLite desktop dan mikrofon nyata belum diuji. Tidak ada unggahan rekaman pribadi.

## Kekurangan terbuka dan pekerjaan berikut

1. Lanjutkan Bab 03 `a1-u3-o4` sesuai naskah: status menikah/lajang/bercerai dan tinggal bersama, tanpa menyimpulkan status dari alamat; buat penjelasan, latihan, respons/akibat, kartu baru mandiri, jurnal, jadwal per profil dan regresi menu/reopen. Lanjut `a1-u3-o5` possessiv/Akkusativ setelah besuchen, pertemuan mandiri dan penutup sebelum menyatakan Bab 03 lengkap.
2. Perkuat transfer `a1-u3-o3`: kartu baru harus juga menguji pertanyaan jumlah dan penyebutan relasi tanpa bantuan, bukan hanya menghitung anak. Artikel/keluarga awal Bab 03 masih panel lama dan belum memiliki ulasan 3/7/21 sendiri. Hindari menganggap satu latihan atau satu kartu sebagai penguasaan.
3. Evaluator tulisan Bab 02/03 masih heuristik, bukan penilaian tata bahasa atau semua bentuk sah; minta pengajar memeriksa jawaban dan ambiguitas. Ada jalur menunggu telaah untuk pesan/kios transfer dan tugas Bab 03, tetapi pertanyaan kios tertentu masih terlalu ketat. Respons dan bantuan tetap tercatat; telaah manusia belum dilakukan.
4. Uji manusia dan perangkat terpisah: pengajar Jerman menelaah naskah, akibat NPC, proporsi koreksi, tugas baru dan jurnal; pemain menilai penyutradaraan/aksesibilitas. Uji Windows offline/SQLite, mikrofon nyata, dan dengar kecocokan suara/tokoh/kalimat secara langsung. 3/7/21 setelah hari nyata dan retensi lintas konteks belum diuji. Jangan unggah rekaman pribadi.
5. Bab 04 dan seluruh jalur berikutnya menuju A1–B2 masih harus dikembangkan sesuai peta; jangan menganggap tujuan yang sudah dimainkan sebagai kurikulum lengkap.

## Cara mencoba

Mulai cerita dari menu, pilih avatar dan mainkan prolog, lanjut Bab 01 lalu kios Bab 02. Pilih peti dan tanyakan harga; pada jadwal coba 09.30 → bantuan → 08.30 → kartu baru. Ikuti hari, pesan dan kios lain, lalu lihat jurnal dan buka Bab 03. Setelah label keluarga/artikel pilih **Lanjut · mein/meine**, lalu **Lanjut · jumlah keluarga**. Gunakan Judul/Lanjutkan dan ganti profil untuk memeriksa checkpoint; jadwal belum dapat dibuka sebelum jatuh tempo.
