# Bukti hak klip sapaan kafe — belum clearance rilis

Diperiksa 21 November 2026. Klip aplikasi `src/assets/tts_core/conv_76f18fde42ee.wav` memiliki SHA-256 `95284daf675800230abd0592194dfb19b33639a2f1183232fe48a49c3c4191bd`, cocok dengan entri `im-cafe:barista-sapaan` di `public/a1-story/audio/speech-catalog.json`. Katalog mencatat kalimat “Guten Tag! Was möchten Sie?”, pemeran barista, suara `de_DE-eva_k-x_low`, dan sumber manifest produksi. Kecocokan hash dan transkrip adalah bukti identitas stok, bukan bukti asal pembuatan atau izin file spesifik.

## Sumber dan ketentuan

- [README dataset M-AILABS, versi 53c4c9f](https://github.com/i-celeste-aurora/m-ailabs-dataset/blob/53c4c9fe0f63cb0ae85ee7eb46a32b7316223e8e/README.md) menyebut data untuk speech synthesis dan menyertakan perjanjian lisensi; ketentuan data tertentu dapat berbeda.
- [Jawaban pemilik dataset, 19 Oktober 2026](https://github.com/i-celeste-aurora/m-ailabs-dataset/issues/10#issuecomment-6262698198), menjawab pertanyaan yang menyebut Piper `eva_k` dan penggunaan komersial: pemakaian dan redistribusi penuh/sebagian, komersial maupun nonkomersial diizinkan menurut lisensi; pemilik meminta dua copyright notice dan lisensi disertakan.
- [Salinan historis lisensi M-AILABS](https://github.com/rhasspy/larynx/blob/e18d0a43647a80066ff1c215231894121c577907/licenses/m-ailabs.txt) memuat izin redistribusi/penggunaan bersyarat, retensi pemberitahuan untuk data sumber, larangan endorsement tanpa izin, dan disclaimer. Jangan mengabaikan ketentuan teks lisensi aktual yang berlaku untuk model dan distribusi.
- Katalog menunjuk [model card upstream Piper eva_k](https://huggingface.co/rhasspy/piper-voices/blob/main/de/de_DE/eva_k/x_low/MODEL_CARD). Isi dan versi model yang benar-benar menghasilkan WAV belum diverifikasi secara independen dalam pemeriksaan ini.

## Sebelum rilis publik

Telusuri manifest sumber dan bukti pipeline/model/version untuk WAV spesifik; verifikasi lisensi model dan ketentuan lain yang berlaku terhadap distribusi audio hasil sintesis; sertakan notice dan teks lisensi yang diwajibkan di produk/paket rilis; minta peninjauan pihak yang bertanggung jawab atas perizinan. Pernyataan dataset di atas mendukung izin bersyarat, tetapi tidak menggantikan pemeriksaan asal dan clearance rilis. Playback Chromium yang telah diuji tidak membuktikan pendengaran manusia atau hak distribusi.
