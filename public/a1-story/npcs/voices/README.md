# Suara prolog · Surat untuk Siapa?

Paket suara sintetis untuk tinjauan pemeran visual novel A1. [Indeks lengkap](audio-index.json) · [Checkpoint](checkpoint.json) · [Ketentuan model](SUPERTONIC-LICENSE.txt)

Terdapat **71 klip individual** dan satu reel delapan pemeran. Setiap hasil tersedia sebagai WAV PCM 16-bit mono 44,1 kHz dan MP3 mono 64 kbps. Total 72 WAV dan 72 MP3. Semua suara dibuat lokal memakai Supertonic 3, tanpa musik atau ambience.

- **NPC.** 51 kalimat statis dari 32 node tuturan. 11 kalimat dengan `{name}` dicatat tanpa rekaman nama contoh. Frau Lehmann memakai F4 untuk DE dan ID. Nama Jerman dan kutipan `Und du?` disintesis pada segmen DE dengan preset F4 yang sama.
- **Pemain.** Masing-masing punya Hallo!, Guten Morgen!, Ja, dan Nein. Prolog memproses jawaban bebas; respons baku tersedia untuk pemetaan apabila suara pemain ditambahkan. Satu demo per pemain memakai nama contoh Alex dan berada di folder `demo-perkenalan`.
- **Naskah.** 54 node terjangkau, termasuk cabang salah jawab, pengulangan di `b_ready` dan `d_hub`, serta percabangan surat `d_post_ok`. Pilihan, terjemahan UI, petunjuk input dan narasi ditandai per ID dalam indeks. `a_note` dan `e_letter` adalah teks properti DE dari narator.

## Putar delapan suara

[Reel WAV](demo-delapan-suara.wav) · [Reel MP3](demo-delapan-suara.mp3)

| Waktu | Pemeran | Preset | Kalimat |
| --- | --- | --- | --- |
| 00:00.160–00:01.725 | [player-01](demo-perkenalan/player-01/demo-perkenalan.wav) | supertonic3-F1 | Hallo, ich heiße Alex. |
| 00:02.295–00:03.950 | [player-02](demo-perkenalan/player-02/demo-perkenalan.wav) | supertonic3-M1 | Hallo, ich heiße Alex. |
| 00:04.520–00:06.245 | [player-03](demo-perkenalan/player-03/demo-perkenalan.wav) | supertonic3-F3 | Hallo, ich heiße Alex. |
| 00:06.815–00:08.190 | [player-04](demo-perkenalan/player-04/demo-perkenalan.wav) | supertonic3-M3 | Hallo, ich heiße Alex. |
| 00:08.760–00:09.725 | [Frau Lehmann](masters/tutor/b_hallo-s01.wav) | supertonic3-F4 | Hallo! |
| 00:10.295–00:11.300 | [Mia](masters/mia/c_mia1-s02.wav) | supertonic3-F2 | Ich bin Mia. |
| 00:11.870–00:13.005 | [Petugas pos](masters/pos/d_post_q-s02.wav) | supertonic3-M2 | Bist du Mia? |
| 00:13.575–00:14.680 | [Herr Bauer](masters/tetangga/d_nb1-s01.wav) | supertonic3-M4 | Guten Morgen! |

## Pemeriksaan dan izin

- 144 berkas dibuka ulang dan cocok dengan ukuran sampel serta checksum. RMS aktif tuturan berkisar -23.0 hingga -20.0 dBFS. Keluaran WAV dan MP3 lolos uji sinyal serta clipping digital.
- Awal dan akhir setiap kutipan di reel dicocokkan dengan sampel WAV individual. Kecocokan transkrip diuji terhadap data prolog dan teks masukan sintesis. Pelafalan, pemisahan timbre antarpemeran, serta intonasi belum dinilai lewat dengar manusia.
- Supertonic 3 oleh Supertone. Ketentuan OpenRAIL-M mengatur penggunaan model dan keluaran. Pemberi lisensi pada umumnya tidak mengklaim hak atas keluaran, dengan ketentuan dan pembatasan lisensi tetap berlaku. Pertahankan label suara sintetis ketika mendistribusikan aset. [Sumber model](https://huggingface.co/supertone-oss-archive/supertonic-3) · [Salinan lisensi](SUPERTONIC-LICENSE.txt)
