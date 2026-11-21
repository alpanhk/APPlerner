# Bab 02 · Jam yang terlipat — hasil browser

Pembanding: `1f89bfa34f5fb59ac6df5ed04088140af02a4d13`. Lanjutan memakai checkpoint `lernen.chapter02.kiosk.v1` yang sudah ada, dalam namespace profil aktif. Simpanan lama pada `step: end` (keranjang sudah dibeli) langsung membuka giliran jam, dengan riwayat transaksi lama tetap ada; tidak perlu ulang prolog atau pembelian. Label bantuan untuk respons lama yang tidak mempunyai provenance ditulis **tidak tercatat**, bukan dianggap mandiri.

## Mencoba dari menu

Pilih profil yang sudah menyelesaikan Bab 01, **Lanjutkan**, dan dari jurnal **Pergi ke kios · Bab 02**. Beli peti 17 euro dan keranjang 8 euro. Jika sebelumnya sudah sampai akhir kios, cukup **Lanjutkan**: penjual langsung meminta kembali `um halb neun`. Pilih 09.30 untuk melihat penjelasan tutor, revisi 08.30, dan coba kartu baru `halb zehn`. Lanjutkan kartu jam, urutan dan hari, tanya jam buka pasar, ungkapan `am`, `um`, `im`, dan pesan bebas untuk Mia. Setelah tugas mandiri kios lain, jurnal menunjukkan respons pertama, bantuan, revisi dan ulasan. **Temui Mia · Bab 03** membuka tujuan awal keluarga dan artikel; sisa Bab 03 belum dibuat pada jalur baru.

Setiap langkah dan draf Bab 02 disimpan pada profil, termasuk pesan saat hari benar tetapi jam salah. Judul menu memakai adegan yang sama dengan layar lanjutan; jurnal sementara bisa dibuka selama adegan. Dari jurnal akhir tersedia ulasan 3/7/21 untuk lima tujuan, dengan tanggal per tujuan dan kartu baru; ulasan yang terlambat tetap terbuka. Respons pertama, bantuan dan ulangan dipisahkan. Latihan belum otomatis membuktikan ketuntasan.

## Bukti dan batas

- [Checkpoint anonim, adegan pesan](bukti/bab02-checkpoint-jadwal.png) dan [jurnal Bab 02 anonim](bukti/bab02-jurnal.png).
- Chromium: kios → 09.30 salah → petunjuk **halb neun adalah setengah jalan ke sembilan, 08.30** → 08.30 revisi berbantuan → `halb zehn` 09.30 pada kartu baru tanpa bantuan. Pesan pertama “Liebe Mia, am Samstag um 09:30.” mempertahankan Sabtu dan mendapat petunjuk khusus jam. Revisi “Um 08:30 am Samstag, Mia.” diterima. Urutan lain “Um halb neun am Samstag” juga diuji pada evaluator. Deteksi maksud hanya pola konservatif, bukan penilaian tata bahasa; teks yang tidak terdeteksi dapat dilanjutkan dengan permintaan telaah tanpa dianggap benar.
- Keluar pada draf “Liebe Mia, am Samstag um ”, pindah ke profil B di prolog, tutup dan buka browser, pilih A dan **Lanjutkan**: adegan dan draf pulih; B tetap prolog. Simpanan sintetis versi lama `end` membuka jam langsung. Jurnal akhir dan awal Bab 03 juga bertahan setelah reload. Profil uji sintetis.
- Jadwal lima tujuan muncul dengan tanggal tersimpan. Fungsi kalender diuji sebelum/tepat/sesudah 3/7/21 dengan jam simulasi. Browser mengubah satu tanggal jatuh tempo untuk mensimulasikan keterlambatan, lalu memeriksa salah → revisi berbantuan dan penyimpanan ulasan; hari nyata tidak ditunggu.
- Dialog dan petunjuk ini **membaca**, bukan menyimak. Katalog menyebut klip Bab 02 sebagai `created`, tetapi file MP3 yang dicantumkan tidak ada di checkout maupun indeks 125 aset. Kebutuhan rekaman: penjual “Komm bitte um halb neun wieder.”, “halb zehn”, “Der Markt öffnet um acht Uhr.” dan dialog kios baru; tutor penjelasan halb; Mia “Heute ist Donnerstag. Wann holen wir den Korb ab?”, “Schreib bitte auf, wann wir uns treffen.” dan transisi foto. Jangan gunakan klip yang tidak sesuai atau menganggap teks bukti mendengar. Latihan enam kartu suara 8/12/16/30/99/100 di naskah masih membutuhkan klip dan uji menyimak; ini bukan bukti seluruh keterampilan lisan Bab 02.
- `scripts/arena/test-browser-chapter-two.cjs` menguji jalur dan migrasi; gunakan server di port 1420 dan `PLAYWRIGHT_CORE=<path playwright-core> CHROMIUM=<path chromium> node scripts/arena/test-browser-chapter-two.cjs`. Tes judul dinamis, dua profil, peron dan ruang baca juga dijalankan. Latar Bab 01–03 diperbaiki agar menunjuk WebP yang benar; browser memeriksa gambar kios dan rumah termuat. Build, audit 125/125, tes evaluator, jadwal, pesan dan readiness lulus. Windows belum diuji.

## Antrean manusia / perangkat

1. **Pendengaran manusia:** setelah klip yang tepat tersedia, putar setiap klip, verifikasi tokoh, kalimat dan volume. Event pemutaran bukan bukti terdengar.
2. **Mikrofon nyata:** pada giliran rekam yang tersedia, izinkan, rekam, putar dan hapus; uji penolakan dan pastikan teks tetap dapat digunakan. Fake mic tidak menggantikan perangkat nyata.
3. **Windows offline:** bangun Tauri, putus jaringan, lanjutkan simpanan kios lama, ganti profil dan buka SQLite; periksa aset serta progres setelah restart. Belum diuji pada Windows.
4. **Telaah pengajar:** tinjau contoh, parser pesan, umpan balik hari/jam, stimulus ulasan dan batas bukti; harapkan variasi valid tidak ditolak tanpa jalan telaah dan tidak ada promosi ketuntasan otomatis.
