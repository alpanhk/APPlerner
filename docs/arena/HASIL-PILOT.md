> **Status terbaru:** lihat [hasil kelanjutan dari ef47c5c](HASIL-PILOT-v2.md); laporan ini mempertahankan bukti pembanding.

# Pilot · hasil browser dan langkah uji

Perubahan ini dilanjutkan dari HEAD `11eb96204ba17b7769100aa338a7686ce2df7853`, pada PR #4 berbasis `pilot-lernen-v16`. SHA yang diuji adalah commit yang memuat dokumen dan gambar ini (lihat head PR). Jalur pengguna: `src/main.tsx → DesktopEntry → arena/App.tsx`; misi stasiun kini dipasang di menu judul aplikasi itu, bukan entry demo. Browser: Chromium 153 headless Linux, profil lokal fiktif terisolasi, Vite. Gambar dan log di bawah dibuat dari perubahan kode yang sama; tidak ada rekaman suara pengguna di repositori.

## Mencoba

`corepack pnpm install --frozen-lockfile` lalu `corepack pnpm dev --host 0.0.0.0`. Gunakan preview Arena atau URL Vite. Browser menyimpan profil dan tugas pada localStorage asal situs.

- **Mia:** Mulai cerita → nama, avatar, Dengar suara → Mulai prolog → Periksa catatan → lanjut → Duduk sebentar → tutor → ketik perkenalan → Buka pintu. Jawab `Hallo!`, `Rina` atau `Ich bin Rina`; nama saja membuka umpan balik dan pilihan latihan ulang. Saat giliran Mia, **Dengar sapaan tokohmu** memutar klip `Hallo!` dari avatar yang dipilih, bukan klip dengan nama demo. Jurnal dan riwayat ada pada bilah atas; reload dan pilih Lanjutkan.
- **Stasiun:** menu judul → Latih keterampilan · Peron berubah → baca tiket → Ke pengumuman → Dengarkan → masukkan angka → uji pengumuman lain → rekam pertanyaan atau ketik pertanyaan → tulis pesan kepada Mia. Contoh uji yang sengaja keliru: `Hallo Mia, der Zug fährt um 09:10 von Gleis 4.` Revisi: `Liebe Mia, um 09:10 fährt unser Zug von Gleis fünf.` Buka jurnal untuk melihat respons pertama dan revisi. Reload, kembali melalui tombol Latih keterampilan untuk melanjutkan tugas. Mulai latihan baru mempertahankan riwayat tetapi dua pengumuman yang sama tetap bukan stimulus baru.

## U01–U12

| Uji | Status browser | Bukti dan batas |
|---|---|---|
| U01 | Lulus | Judul, profil baru, prolog, refresh dan Lanjutkan diuji; profil lama sintetis tanpa portrait tetap terbuka. |
| U02 | Parsial | Empat PNG `naturalWidth=768`; masing-masing dipilih sampai panggung dengan ID yang cocok. Keempat WAV mengirim `playing` dan klip lama `pause` saat pilihan berubah. Avatar 03 diuji saat bicara di prolog; suara sebenarnya belum didengar manusia. |
| U03 | Parsial | Di UI diuji `Hallo!`, `Rina`, `Ich bin Rina`, serta bantuan + `Ich heiße Rina` (tercatat `support=example`); tes fungsi juga memeriksa `Ich heiße Rina` dan tutor/Rina. Perlu audit lebih luas semua kombinasi dan akibat hingga akhir prolog. |
| U04 | Parsial | Di UI replay Mia menggerakkan hanya Mia; saat sapaan avatar diputar, Mia diam dan avatar bergerak; riwayat menghentikan suara dan menutup mulut. Mode senyap/minim gerak menutup keduanya. Hasil selesai audio dan efek perlu pengujian manusia lebih lanjut. Crash saat membuka riwayat di Chromium baru diperbaiki. |
| U05 | Parsial | Papan, judul, dialog dan label dicek sebelum respons; jawaban 2→4 tersimpan, varian 5 disembunyikan sampai respons. Kedua stimulus audio berbeda. Rekaman teknis tidak membuktikan pemahaman aktual. |
| U06 | Parsial | Event `playing` terlihat untuk kedua MP3 pada run terpisah; abort klip 4 memberi jalur transkrip dan respons tanpa nilai menyimak; transkrip ditandai membaca. Playback bukan bukti bahwa penguji mendengar audio. |
| U07 | Parsial | Penolakan mikrofon memberi fallback teks; fake device merekam, audio replay mengembalikan playing dan hapus menghilangkan kontrol. Rekaman hanya di memori halaman, dihapus saat keluar; bukti lisan menunggu telaah. Belum diuji pada mikrofon manusia/Windows. |
| U08 | Parsial | Pesan peron 4 mendapat koreksi spesifik, revisi susunan berbeda dengan peron 5 dan 09:10 diterima; keduanya tersimpan. Pemeriksa berbasis kata/angka konservatif **bukan** penilai semantik/rubrik andal dan bisa menolak alternatif benar; masih perlu telaah. |
| U09 | Parsial | Draf prolog dan draf pesan pulih setelah refresh; profil/avatar dan hasil misi dipulihkan; double click jawaban salah dan kirim pesan tidak menggandakan entri pada tes. Belum seluruh giliran, klik, kegagalan penyimpanan dan Tauri diuji. |
| U10 | Parsial | Tes fungsi deterministik menguji 4/5 pertama, deduplikasi stimulus, konteks, hari berbeda, bantuan, dan rubrik yang ditelaah. Kedua stimulus stasiun tidak cukup dan jurnal menyatakan belum layak; belum ada bank transfer yang memadai atau penilaian autentik untuk kelulusan. |
| U11 | Parsial | Judul 900×600 terlihat; panel 900×600 muat; dua ukuran tanpa overflow horizontal pada layar hasil. Escape menutup riwayat dan fokus kembali ke jawaban; mode senyap dan minim gerak diuji. Belum semua aksi dan kombinasi ukuran/keyboard diaudit. |
| U12 | Parsial | Profil lama sintetis dibuka dan perpustakaan menampilkan daftar A1–B2. **Ruang belajar desktop di browser gagal membuka SQLite** dan menampilkan halaman pemulihan, sehingga tidak dapat dinyatakan berfungsi. Windows offline belum diuji. |

Bukti gambar: [pilihan avatar](bukti/avatar.png), [Mia bicara](bukti/mia-bicara.png), [avatar bicara](bukti/avatar-bicara.png), [jurnal stasiun anonim](bukti/peron-jurnal.png). Dalam tes pergantian, browser mencatat `pause` untuk `c_mia1.wav` sebelum `playing` untuk `player-03/respons-hallo.wav`; frame player terbuka dan Mia tertutup. Ini bukti event browser, bukan rekaman atau kesaksian pendengaran. Aset peron 4/5 masing-masing cocok indeks `a1-ch11.s02.a1-u11-o4.transisi-01.petugas-stasiun` dan `...pengumuman-variasi-01.petugas-stasiun`, transkripnya `Achtung, der Zug fährt heute von Gleis vier/fünf ab.` Penutur keduanya pengumuman stasiun sintetis. Klip respons petugas yang tersedia menyatakan peron **empat**, sehingga tidak diputar sebagai respons peron lima. Belum tersedia/diintegrasikan klip petugas untuk kalimat `Der Zug fährt heute von Gleis fünf ab.`; respons akhir saat ini berupa teks Indonesia, bukan audio yang salah.

## Verifikasi dan batas

- `python3 scripts/arena/audit-assets.py`: 125 cocok, 0 hilang/berbeda; `node --experimental-strip-types scripts/arena/test-evidence.mjs` dan `.../test-readiness.mjs`: lulus. `corepack pnpm build`: lulus, 157/157 aset required disalin. Node 22+.
- Penguji manusia: pada SHA head PR, ulangi kedua alur dari judul, dengarkan seluruh empat contoh suara dan dua pengumuman, periksa kecocokan suara/teks, frame, hasil pemulihan, lalu gunakan mikrofon nyata. Event `playing`/file tersedia tidak membuktikan suara benar-benar terdengar.
- **Windows offline belum diuji.** Di Windows 10/11 dengan Rust, MSVC dan WebView2: `corepack pnpm install --frozen-lockfile`, `corepack pnpm tauri build`, jalankan pada profil terisolasi, ulangi U01–U12 termasuk pemutusan jaringan, decode PNG, audio, izin mikrofon, simpan/reload dan profil lama. Jangan menghapus profil pengguna untuk QA.
- Audio stasiun yang gagal dicatat sebagai masalah teknis dan bukan kesalahan belajar. Catatan latihan disimpan di localStorage, belum memakai kontrak SQLite desktop terpadu. Rekaman tidak bertahan reload dan tidak otomatis dinilai. Tidak ada klaim berbicara mandiri, penilaian bahasa lengkap, atau ketuntasan level dari misi ini.
- Cakupan A1–B2: peta 42 unit adalah peta, bukan bukti 42 unit lengkap. Hasil peserta dan target kelulusan Goethe >80% **belum terukur**, karena belum ada kohor sesuai protokol.
