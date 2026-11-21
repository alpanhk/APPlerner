# Daftar kemajuan A1–B2

Checkpoint awal sesi: `ce7cca34c971b12e86c727c39f505fe304a399e2` pada PR #4 (draft). Laporan `HASIL-BAB01.md`, `HASIL-DUA-PROFIL.md`, `HASIL-BAB02.md` adalah bukti historis, bukan status terbaru. Ini satu daftar kemajuan dan antrean hidup.

## Terakhir benar-benar dimainkan dan diuji

- Chromium otomatis `test-browser-full-menu.cjs` memainkan profil baru dari menu → prolog → Bab 01 → Bab 02 → seluruh jalur Bab 03 hingga penutup/jurnal → awal Bab 04 `a1-u4-o1` makanan/artikel hingga jurnal. Bab 04: salah artikel → bantuan → revisi → daftar bahan pertama → daftar baru tanpa bantuan → jurnal; jadwal hari 3 dikerjakan dengan waktu simulasi. Bab 04 belum lengkap.
- Bab 03 `a1-u3-o3`: kartu fiktif Lina baru memotivasi pertanyaan jumlah saudara. Herr Bauer menjawab dua saudara, satu Bruder dan satu Schwester; Mia meminta dan menanggapi label. Jurnal mencatat bertanya, jumlah dan dua relasi secara terpisah, termasuk respons pertama/revisi dan bantuan. Jalur uji: pertanyaan salah → revisi → jawaban jumlah benar tetapi relasi kurang → revisi lengkap. Draf disimpan saat kembali ke judul, berganti ke profil Bela, reload, dan kembali ke Ari.
- `a1-u3-o4`: fakta yang diucapkan Herr Bauer membedakan Eva/Tom menikah dan tinggal bersama, saudara Lena/Mara lajang yang tinggal bersama, serta Nora bercerai yang tinggal sendiri; status tidak ditebak dari alamat. `a1-u3-o5`: kunjungan paman, pertanyaan kepada Mia, pemilik ihr/sein, dan kartu baru `Mia besucht ihren Bruder`. Pada pertemuan keluarga fiktif lain pemain bertanya dan menyebut jumlah/relasi, memperkenalkan orang, menyampaikan status dan siapa mengunjungi siapa. Penutup dan undangan kafe terlihat pada `bukti/bab03-penutup-dialog.png`; menu Bab 04 `bukti/menu-bab04.png`, jurnal Bab 04 `bukti/bab04-jurnal-makanan.png`.
- Pembukaan keluarga/artikel kini berupa panggung dan giliran Mia/tutor dengan reaksi; jurnal lama dan draf dimigrasikan tanpa dihapus. Jadwal 3/7/21 `a1-u3-o1` berasal dari waktu tugas benar lama bila tersedia. Tes `test-browser-chapter-three-reviews.cjs` memeriksa migrasi itu, ulangan salah/revisi dan respons yang menunggu telaah tanpa jadwal palsu. Bab 03 o2, o3, o4 dan o5 serta Bab 04 o1 memiliki jadwal 3/7/21 per profil; uji tertentu memajukan jam/tempo secara sintetis, bukan menunggu hari nyata. Ulasan o4/o5 mencatat percobaan pertama dan revisi.
- `test-browser-chapter-two.cjs`, `test-browser-title-checkpoint.cjs`, `test-browser-two-profile.cjs`, `test-browser-chapter-three-pending.cjs` dan tes review lulus; judul/adegan dan Lanjutkan mengikuti checkpoint aktual, termasuk peralihan Bab 03/04. Build produksi lulus; audit aset 125/125 cocok. Tes pola Bab 03 meliputi 17 kasus lama dan 31 kasus kelanjutan; Bab 02 18 kasus.

Hasil tulisan/label diperiksa dengan pola terbatas, bukan parser atau penilaian tata bahasa penuh. Bentuk sah yang belum dikenali dapat dilanjutkan sebagai **menunggu telaah** pada tugas bebas baru, tidak dihitung benar; bantuan dan percobaan tetap tercatat. Selesai bermain atau satu respons benar bukan penguasaan. Penutup yang masih memiliki respons menunggu telaah tidak mengklaim bingkai telah diserahkan.

Klip persis dialog Bab 02/03/04 baru tidak tersedia: ini membaca/menulis, bukan menyimak; frame bicara diam tanpa audio. Browser headless tidak membuktikan suara didengar manusia. Windows offline/SQLite desktop dan mikrofon nyata belum diuji. Tidak ada unggahan rekaman pribadi.

## Kekurangan terbuka dan tugas berikut

1. Lanjutkan Bab 04 `a1-u4-o2` sesuai naskah: rasa makanan dan keadaan lapar/haus, dengan alasan berbicara, respons/akibat NPC, penjelasan, latihan, tugas baru mandiri, jurnal dan ulasan per profil. Lalu o3 memesan, o4 interaksi/tagihan, o5 kebiasaan makan, pertemuan mandiri dan penutup sebelum menganggap bab lengkap.
2. Telaah pengajar masih diperlukan: bentuk Jerman sah yang belum dikenali, penyangkalan/ambigu yang mungkin terlewat, kecocokan NPC dan kekuatan bukti per tujuan. Bab 03 o1 masih meminta daftar label dalam satu respons; perlu variasi kartu mandiri lintas konteks dan pengujian retensi manusia. Sebagian pertanyaan kios Bab 02 masih ketat.
3. Pengujian manusia dan perangkat terpisah: dengar kecocokan suara/tokoh/kalimat, uji mikrofon nyata serta Windows offline/SQLite. Lakukan ulasan pada hari 3/7/21 nyata dan lintas konteks; simulasi tidak membuktikan retensi. Jangan unggah rekaman pribadi.
4. Bab 04 sisa dan seluruh jalur berikutnya menuju A1–B2 masih harus dikembangkan sesuai peta. Bukti lintas keterampilan dan penguasaan belum lengkap.

## Cara mencoba

Dari menu pilih avatar dan mainkan prolog → Bab 01 → Bab 02 → Bab 03. Pada jurnal jumlah keluarga pilih **Kartu keluarga baru**, tanyakan jumlah saudara Lina, lalu beri label berdasarkan jawaban Herr Bauer. Lanjutkan status, kunjungan dan pertemuan baru sampai penutup; buka jurnal lalu **Lanjut · Bab 04**. Gunakan Judul/Lanjutkan dan ganti profil untuk memeriksa draf; jadwal ulasan belum dapat dibuka sebelum jatuh tempo.
