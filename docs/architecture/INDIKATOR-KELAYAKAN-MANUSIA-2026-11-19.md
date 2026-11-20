# Indikator Kelayakan Penggunaan Manusia — Aplikasi Lernen

**Disusun oleh:** Agent Utama / orkestrator, sesi `ses_e0c636994ffejfdkGOfzzgKZxt`
**Tanggal:** 19 November 2026
**Fungsi:** kerangka penilaian saat menerima laporan dari agent test dan 2 agent murid. Orkestrator **tidak** melakukan pengujian; agen yang menguji sesuai bagiannya, orkestrator yang menskor dan menyimpulkan.

---

## 1. Dimensi indikator

| Kode | Indikator | Bobot | Pertanyaan utama | Agen penguji |
|---|---|---|---|---|
| **I1** | Fungsi inti belajar | 25% | Review SRS tersimpan? Kartu maju? Progres bertahan setelah restart? | Agent test |
| **I2** | Keterbacaan & aksesibilitas | 15% | Teks/tombol terbaca di tema gelap dan terang? Fokus/Tab jelas? Zoom 125–200%? | Agent test + Murid 2 |
| **I3** | Keterpahaman & mutu materi | 20% | Istilah didefinisikan? Istilah konsisten? Penjelasan sesuai soal? Soal menguji penerapan, bukan hafalan? | Murid 1 |
| **I4** | Integritas & kepercayaan data | 15% | Backup first-run bekerja? Pesan error ramah? Tidak ada data hilang/duplikat? Progres tidak membengkak? | Agent test + Murid 2 |
| **I5** | Navigasi & alur antarmuka | 10% | Tombol nav bekerja dari dalam pelajaran? Tidak ada dead-end? Catatan pertama bisa dibuat? | Agent test + Murid 2 |
| **I6** | Stabilitas & penanganan error | 10% | Tidak crash? `console.error = 0`? Retry aman? Audio dibatalkan saat keluar halaman? | Agent test |
| **I7** | Kesiapan prosedur manusia | 5% | Dokumen pilot sesuai UI? Host bersih, pengamat pembaca layar, persetujuan seni tersedia? | Murid 2 (catatan), orkestrator (eskalasi) |

---

## 2. Skala skor (0–4)

| Skor | Makna | Penjelasan |
|---|---|---|
| **0** | Gagal / blocker | Fungsi tidak bisa dipakai sama sekali atau merusak data |
| **1** | Mengganggu terus-menerus | Setiap sesi terkena; pengguna sulit menyelesaikan tugas |
| **2** | Mengganggu kadang-kadang | Ada workaround, tapi melelahkan atau membingungkan |
| **3** | Gangguan minor | Tidak menghalangi tugas utama; bisa diterima dengan catatan |
| **4** | Baik | Siap pakai; tidak ada temuan yang mengganggu pada dimensi ini |

**Aturan skor:**
- Skor hanya boleh diberikan jika ada bukti **[P] eksekusi nyata**. Temuan **[T] inspeksi** boleh menjelaskan akar, tetapi tidak boleh menaikkan skor.
- Jika bukti tidak cukup untuk suatu dimensi, beri **N/A** dan jelaskan — jangan mengarang angka.
- Simpan bukti FAIL asli walaupun sudah diperbaiki, agar regresi dapat dibuktikan.

---

## 3. Ambang keputusan

| Nilai terbobot | Keputusan | Arti bagi manusia |
|---|---|---|
| **≥ 3,50** | **LAYAK** | Dapat dipakai untuk belajar mandiri tanpa pengawasan |
| **2,80 – 3,49** | **LAYAK BERSYARAT** | Dapat dipakai dengan bimbingan/perbaikan minor |
| **2,00 – 2,79** | **BELUM LAYAK** | Perbaikan diperlukan sebelum dipakai luas |
| **< 2,00** | **TIDAK LAYAK** | Fungsi inti rusak; jangan didistribusikan |

**Aturan pengecualian (blocker override):** jika **I1 = 0**, keputusan maksimal **BELUM LAYAK** berapapun nilai terbobotnya. Alasan: aplikasi belajar yang tidak bisa menyimpan hasil belajar tidak layak dipakai.

---

## 4. Pembagian pengujian (sesuai bagian agen)

| Agen | Bagian pengujian | Yang wajib dilaporkan |
|---|---|---|
| **Agent test** `ses_e0c6c5de…` | Fungsi inti & teknis: SRS review, backup, catatan, navigasi, tema, stabilitas | Skor I1, I2, I4, I5, I6 + bukti reproduksi per temuan |
| **Murid 1** `ses_e0c65d0e1…` | Keterpahaman materi lintas unit: definisi istilah, konsistensi istilah, terjemahan, soal sejenis, transfer bank | Skor I3 + contoh kalimat/slide yang membingungkan + saran perbaikan |
| **Murid 2** `ses_e0c655f10…` | Pengalaman pengguna: first-run, banner, progres, soal sejenis, Statistik, dokumen pilot | Skor I2, I4, I5, I7 observasi + daftar hal positif yang harus dipertahankan |

Format laporan tetap: **dampak pengguna | langkah reproduksi | bukti/path | batas bukti**, dengan pemisahan **[P]** dan **[T]**.

---

## 5. Alur penilaian

```
agen menguji sesuai bagian
  -> agen kirim laporan ke outputs/koordinasi-opencode/laporan-masuk/<agen>.md
  -> agen kirim notifikasi ringkas ke sesi orkestrator
  -> orkestrator mencocokkan temuan lintas agen (dedupe/konvergensi)
  -> orkestrator memberi skor 0-4 per indikator (hanya dari bukti [P])
  -> orkestrator menghitung nilai terbobot + menerapkan blocker override
  -> orkestrator menulis keputusan: LAYAK / LAYAK BERSYARAT / BELUM LAYAK / TIDAK LAYAK
  -> hasil diteruskan ke Asisten Director untuk ditindaklanjuti
```

---

## 6. Batas penilaian

- Skor adalah **pendapat terstruktur berbasis bukti agen**, bukan hasil uji laboratorium, bukan telaah pengajar, bukan sertifikasi CEFR.
- Agen adalah simulator; temuan menunjukkan indikasi prioritas, bukan pengalaman pembelajar manusia sungguhan.
- Pilot formal N=3–5, host Windows bersih, pengamat Narrator/NVDA, dan persetujuan seni tetap **PENDING** dan tidak boleh dinilai LULUS oleh agen.
- Penilaian ini tidak menggantikan keputusan manusia.
