# Stok audio draf Lernen A1 · Bab 01–12

Berkas untuk tinjauan pengguna dan pengajar. Urutan penerbitan stok 01–04, 05–08, 09–12. Jalur media dalam indeks bab relatif ke folder audio; jalur efek relatif ke folder sound-design.

**759 klip tuturan baru** dan **1 rujukan tuturan terverifikasi**, mencakup 760 pemetaan putar. Terdapat 12 demo bab. Delapan profil prolog dipertahankan menurut ID. Karakter pendukung mendapatkan profil tetap, dan barista memakai suara paket Im Café.

[Katalog tuturan](speech-catalog.json) · [Pemeriksaan audio dan stimulus](audio-checks.json) · [Checkpoint](checkpoint.json) · [Efek dan suasana](sound-design/manifest.json) · [Putar demo efek](sound-design/pratinjau-efek-dan-suasana.mp3)

| Bab | Judul | Pemetaan audio | Efek | Demo | Indeks |
| --- | --- | ---: | ---: | --- | --- |
| 01 | Tanda cangkir di balik surat | 63 | 1 | [MP3](a1-ch01/demo.mp3) · [WAV](a1-ch01/demo.wav) | [Manifest](a1-ch01/manifest.json) |
| 02 | Jam yang terlipat | 109 | 1 | [MP3](a1-ch02/demo.mp3) · [WAV](a1-ch02/demo.wav) | [Manifest](a1-ch02/manifest.json) |
| 03 | Siapa di foto ini? | 48 | 1 | [MP3](a1-ch03/demo.mp3) · [WAV](a1-ch03/demo.wav) | [Manifest](a1-ch03/manifest.json) |
| 04 | Dua cangkir, satu meja | 77 | 2 | [MP3](a1-ch04/demo.mp3) · [WAV](a1-ch04/demo.wav) | [Manifest](a1-ch04/manifest.json) |
| 05 | Jaket yang tertukar | 73 | 0 | [MP3](a1-ch05/demo.mp3) · [WAV](a1-ch05/demo.wav) | [Manifest](a1-ch05/manifest.json) |
| 06 | Kunci ruang bersama | 66 | 0 | [MP3](a1-ch06/demo.mp3) · [WAV](a1-ch06/demo.wav) | [Manifest](a1-ch06/manifest.json) |
| 07 | Peta untuk tamu yang tersesat | 55 | 1 | [MP3](a1-ch07/demo.mp3) · [WAV](a1-ch07/demo.wav) | [Manifest](a1-ch07/manifest.json) |
| 08 | Giliran pertama | 48 | 1 | [MP3](a1-ch08/demo.mp3) · [WAV](a1-ch08/demo.wav) | [Manifest](a1-ch08/manifest.json) |
| 09 | Suara Mia serak | 53 | 1 | [MP3](a1-ch09/demo.mp3) · [WAV](a1-ch09/demo.wav) | [Manifest](a1-ch09/manifest.json) |
| 10 | Satu kursi kosong di klub | 55 | 0 | [MP3](a1-ch10/demo.mp3) · [WAV](a1-ch10/demo.wav) | [Manifest](a1-ch10/manifest.json) |
| 11 | Peron berubah | 55 | 1 | [MP3](a1-ch11/demo.mp3) · [WAV](a1-ch11/demo.wav) | [Manifest](a1-ch11/manifest.json) |
| 12 | Sekarang kamu yang menyambut | 58 | 2 | [MP3](a1-ch12/demo.mp3) · [WAV](a1-ch12/demo.wav) | [Manifest](a1-ch12/manifest.json) |

## Kontrak pemutaran

- Pilih aset berdasarkan ID node, karakter, bahasa, serta kartu yang benar. Respons empat avatar adalah contoh tetap atas permintaan. Teks ketik bebas, nama dan jadwal atau tujuan dari sesi memerlukan data aktual.
- Bantuan, koreksi, transisi, contoh tutor DE dari 36 pelajaran dan panduan tutor ID dapat dicari dari indeks. Teks tertulis dan arahan tidak dibacakan sebagai NPC. Transfer yang belum punya kalimat pasti memakai status dinamis.
- Pengumuman lewat kanal PA. Tunggu bunyi awal selesai lalu beri jeda 120 ms sebelum ujaran. Putar ulang ujarannya tanpa mengulang bunyi awal. Bab 11 punya stimulus peron 4 dan variasi 2→5 yang masing-masing terikat pada data.
- Saat latihan angka 17/70 atau 18/80, jeda ambience pasar sebelum stimulus. Cangkir Im Café berbunyi sekali bila pesanan kopi dikonfirmasi. Rincian mulai, fade dan berhenti ada di [manifest efek](sound-design/manifest.json).

## Verifikasi dan izin

[Demo silang angka dan peron](pratinjau-stimulus.mp3) · [Master WAV](pratinjau-stimulus.wav)

- 1544 berkas tuturan dan demo berhasil dibuka serta cocok dengan checksum dan jumlah sampel. Master baru PCM s16le mono 44,1 kHz; runtime MP3 64 kbps. WAV barista lama tetap dirujuk sebagai sumber; format putarnya diberi penyesuaian level. Klip baru dan MP3 adaptasi ini lolos ambang clipping digital.
- Enam stimulus utama diberi pemeriksaan silang nilai, transkrip dan fingerprint WAV. Hasil pengenalan otomatis, bila tersedia, dicatat per format. Uji dengar manusia dan telaah register/pelafalan masih diperlukan.
- Suara sintetis dari Supertonic 3 serta Piper. [Ketentuan model Supertonic](SUPERTONIC-LICENSE.txt). Barista mengacu pada M-AILABS melalui Eva K; izin distribusi publik diperiksa sebelum rilis. Ketentuan per aset ada pada indeks.
- Dialog Tamu pada ajakan Sabtu Bab 12 memakai Eva sebagai asumsi draf. Penutur kartu «Ich bin hungrig.» Bab 04 belum ditetapkan; berkas yang disediakan merupakan contoh tutor.
