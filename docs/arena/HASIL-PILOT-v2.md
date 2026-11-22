# Hasil kandidat PR #4 · kelanjutan dari ef47c5c

HEAD awal `ef47c5c7653a4c897be4c903bc6828338e5c87fc`. Hasil diuji: commit yang memuat laporan ini, lihat SHA head PR. Jalur normal `src/main.tsx → DesktopEntry → arena/App.tsx`. Tidak ada basis data profil uji atau rekaman suara pribadi dalam Git.

## Akar masalah ruang belajar dan perbaikannya

Pada pembanding `ef47c5c`, judul → **Ruang belajar A1–B2** memanggil `DesktopEntry → LegacyApp → initializeDatabase → seedLoader/getDb → Database.load("sqlite:lernen.db")`; plugin SQLite Tauri tidak tersedia di browser dan FatalDatabase muncul. [Sebelum](bukti/ruang-sebelum.png) · [sesudah](bukti/ruang-sesudah.png).

Sekarang `DesktopEntry` memilih ruang belajar web hanya saat `isTauri()` salah; Tauri tetap memakai `LegacyApp`/SQLite, tanpa mengganti migrasi atau database. Jalur web memakai 67 bacaan yang ada (`src/arena/data/readings.json`: A1 18, A2 23, B1 13, B2 13), menampilkan bacaan dan latihan arti satu kalimat per bacaan. Riwayat jawaban pada `lernen.web-reading.v1` di localStorage asal browser, terpisah dari profil prolog dan SQLite. Ini **bukan** implementasi penuh pelajaran A1–B2 atau ukuran kelulusan; bacaan dan latihan teks dapat dibaca dengan bantuan. Penyimpanan tidak disinkronkan antar perangkat.

Browser Chromium 153: profil baru → ruang belajar → `Hallo, ich bin Anna` → jawaban benar → menu → reload → ruang belajar menunjukkan **1/1**. Profil lama sintetis tanpa avatar tetap muncul dan progres bacaan tetap terbaca. Browser `pageerror` nihil pada tes tersebut. Windows/SQLite tidak dijalankan.

## Cara mencoba dari judul

Node 22+: `corepack pnpm install --frozen-lockfile`, `corepack pnpm dev --host 0.0.0.0`, buka preview. Di menu:

1. **Ruang belajar A1–B2** → pilih level dan bacaan → pilih arti → Periksa jawaban → Kembali ke menu. Setelah refresh masuk lagi untuk melihat riwayat.
2. **Mulai cerita** → nama/avatar → Dengar suara → Mulai prolog → Periksa catatan → Duduk sebentar → jawab tutor → Buka pintu → jawab Mia. Jurnal dan riwayat ada di bilah atas; reload lalu Lanjutkan.
3. **Latih keterampilan · Peron berubah** → baca tiket → dengar pengumuman/opsional transkrip → jawab peron → situasi kedua → klarifikasi petugas dengan rekaman atau teks → pesan Mia → jurnal → **Coba tugas membaca baru**. Contoh respons ambigu `Mia, Gleis 2 und Gleis 5.` meminta klarifikasi; `Mia, bitte geh zu Gleis 2.` diberi koreksi; `Mia, nicht von Gleis 2, sondern von Gleis fünf fährt der Zug ab.` menyampaikan tujuan. Umpan balik dan revisi disimpan; tata bahasa tetap menunggu telaah.

Kedua pengumuman hanya menyatakan peron terbaru, bukan jam. Tiket latihan secara terpisah menyatakan 09:10; pemeriksa tidak lagi mensyaratkan jam yang tidak didengar. Penilai adalah aturan terbatas, bukan pemahaman bahasa umum: frasa yang tidak dikenali diminta klarifikasi, dan kemungkinan salah klasifikasi tetap perlu diuji/ditelaah pengajar. Tes `node --experimental-strip-types scripts/arena/test-message.mjs` mencakup angka/kata, urutan lain, negasi peron lama, dua peron ambigu dan arah salah.

## Transfer dan cek tertunda

Tugas teks baru tentang sambungan Köln memakai peron 7 versus peron lama 1; ini bukti **membaca**, bukan audio atau berbicara. Identitas paparan dan jawaban pertama disimpan. Ulangan identik dilabeli latihan, sedangkan respons pertama benar pada stimulus baru dilabeli stimulus baru. Transkrip pada pengumuman 4/5 tetap dicatat sebagai bantuan membaca, bukan bukti mendengar mandiri. [Contoh jurnal anonim](bukti/transfer-jurnal.png). Satu cek tertunda baru tentang bus/Steig 6 tersedia setelah hari lokal berbeda dari keberhasilan tugas awal; tes menggunakan jam terkendali maju dua hari. Aturan 4/5, konteks, hari, dan rubrik di `readiness.ts` tetap konservatif: dua soal transfer tidak cukup untuk menyatakan layak naik. Jadwal 3/7/21 hari dan bank stimulus baru yang memadai **belum tersedia**.

## Media dan penguji

Pencarian katalog transkrip (`speech-catalog`, `story-media.generated`, indeks) menemukan pengumuman sintetis peron lima `Achtung, der Zug fährt heute von Gleis fünf ab.`, bukan respons dialog petugas yang persis sama. Pesan menampilkan teks petugas yang benar tanpa memutar audio peron empat. **Permintaan aset:** karakter `petugas-stasiun`; naskah `Der Zug fährt heute von Gleis fünf ab.`; arti `Kereta hari ini berangkat dari peron lima.`; titik pemutaran: setelah pemain meminta klarifikasi, sebelum menulis kepada Mia. Perlu suara berlisensi dan kecocokan transkrip ditinjau, lalu pemutaran diuji.

Browser mengirim event `playing` pada dua klip pengumuman dan avatar (bukan bukti didengar manusia). Fake microphone diuji rekam–play–hapus; setelah reload hanya riwayat peristiwa tersisa dan file sementara tidak tersedia. Penguji nyata: buka alur dari judul, dengar empat contoh dan dua pengumuman, tolak izin lalu uji jalur teks, izinkan mikrofon dan rekam/dengar/hapus. Windows offline: di profil terisolasi dengan WebView2, MSVC dan Rust jalankan `corepack pnpm tauri build`, cabut jaringan dan ulangi alur, pulihkan profil dan periksa database. **Belum diuji di Windows atau oleh pendengar manusia.**

## U01–U12 terbaru

| Kasus | Status | Bukti dan sisa |
|---|---|---|
| U01 | Lulus | Judul, mulai/reload/lanjut; profil lama sintetis diuji. |
| U02 | Parsial | Empat potret dan ID terdekode, `playing` dan penghentian sampel; manusia belum mendengar. |
| U03 | Parsial | Salam/nama/kalimat/bantuan diuji; belum semua kombinasi dan akhir prolog ditinjau. |
| U04 | Parsial | Replay, pergantian penutur, akhir klip kembali diam, riwayat, mode senyap/minim gerak diuji pada browser; efek dan Windows masih perlu pengujian. |
| U05 | Parsial | Respons pertama dan revisi, peron 4/5 dan no-spoiler sebelum respons diuji; belum ada kohor. |
| U06 | Parsial | Klip `playing`, transkrip dan abort terpisah; suara belum didengar manusia. |
| U07 | Parsial | Mikrofon simulasi rekam–dengar–hapus dan penolakan diuji; mikrofon nyata/Windows belum diuji. |
| U08 | Parsial | Sepuluh tes aturan pesan dan alur ambigu→salah→revisi berhasil; penilaian semantik/gramatika belum dikalibrasi oleh pengajar. |
| U09 | Parsial | Reload draf, hasil, dan double click diuji; belum semua giliran dan backend desktop. |
| U10 | Parsial | Transfer membaca baru, ulangan, transkrip dan cek berikut hari diuji dengan jam simulasi; jadwal penuh dan bank transfer empat keterampilan belum ada. |
| U11 | Parsial | Alur stasiun selesai dengan Tab/Enter di 900×600; Escape/fokus, senyap/minim gerak diuji; audit aksesibilitas penuh belum. |
| U12 | Parsial | Ruang baca browser, latihan dan reload pada profil baru/lama berhasil; seluruh materi A1–B2, migrasi lintas backend dan Windows offline belum diuji. |

Build `corepack pnpm build`, audit 125 indeks dan tes `test-message.mjs`, `test-evidence.mjs`, `test-readiness.mjs` lulus. Materi lanjutan, aplikasi siap rilis, dan dampak hasil belajar adalah tiga hal berbeda: seluruh A1–B2 belum tuntas, aplikasi masih kandidat pilot, dan target kelulusan Goethe >80% belum terukur tanpa data kohor.
