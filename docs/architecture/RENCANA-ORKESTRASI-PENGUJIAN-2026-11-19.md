# Rencana Orkestrasi Pengujian: Agent Utama + 2 Agent Murid + 1 Agent Test

**Tanggal:** 19 November 2026 (WIB)
**Objek:** aplikasi Lernen (Windows) — repo `.`
**Tujuan:** membuat pengujian tidak hanya "hijau di mesin", tetapi dapat digunakan dan dipahami manusia.
**Status:** AKTIF — agent-agent sudah berjalan; dokumen ini dipakai sebagai kontrak koordinasi.

---

## 0. Pemetaan sesi aktual (dari API OpenCode lokal)

Saya adalah **agent utama / orkestrator**, sesi `ses_e0c636994ffejfdkGOfzzgKZxt` ("Mengatur agent pengujian aplikasi").

| Peran | Sesi | Mandat asli (prompt pengguna) | Kondisi saat inspeksi |
|---|---|---|---|
| **Agent test** | `ses_e0c6c5de0ffeuLvY8v9qySkOTI` | "kamu aplikasi test agent yang kritis dan jujur dalam memberikan penilaian" | 44 pesan assistant, aktif; terakhir menguji D1 drill, pelajaran, dan alur Catatan |
| **Murid 1** | `ses_e0c65d0e1ffelUNT5QB4m050Xj` | "murid agent 1 yang akan melakukan ujicoba dan memberikan penilaian sebagai murid yang belajar" | 18 pesan assistant; terakhir mengalami retry ke-5 akibat **HTTP 502 Endpoint is unavailable**; menyampaikan kekhawatiran bentrokan profil QA |
| **Murid 2** | `ses_e0c655f10ffeZ4FF5EW3sftCJf` | "murid agent 2 yang akan melakukan ujicoba dan memberikan penilaian sebagai murid yang belajar menggunakan aplikasi tersebut" | 32 pesan assistant, aktif; terakhir menjalankan `pilot_drive3.mjs` |

> Sesi lama `ses_e0ce392a1ffe28oRp8gUp730dI` (Assistant Director) dan pekerja lama 1a/2a/3a/3b/3c/4a **tidak** saya ajukan sebagai pengganti. Rencana sebelumnya yang memakai pemetaan itu sudah diganti dengan pemetaan di atas.

---

## 1. Temuan inspeksi yang mendesak

1. **Bentrokan profil QA (nyata).** `src-tauri/tauri.qa.conf.json` menetapkan identifier `app.lernen.qa.audio` untuk semua build QA. Artinya seluruh EXE QA — `target-qa/release/lernen-app.exe`, `outputs/penyelesaian-windows/final-candidate/lernen-app-qa.exe`, dan `outputs/siap-uji-lernen-2026-11-21/app/lernen-app-qa.exe` — **memakai satu database yang sama**. Murid 1 sudah melihat proses QA lain (PID 14544) dan menahan diri. Saat inspeksi hanya satu proses aktif: PID 2364 (`target-qa/release/lernen-app.exe`).
2. **Murid 1 retry 502.** Upstream provider sempat tidak tersedia (attempt 5). Status "running" belum tentu berarti progres; perlu dicek ulang apakah ia sudah pulih atau masih menunggu retry.
3. **Bukti mesin sudah kuat, tetapi bukan kelulusan produk.** Dokumen `outputs/koordinasi-opencode/RINGKASAN.md` mencatat 38/38 Node, `tsc 0`, `cargo 11/11`, paritas 10/10 — sekaligus menegaskan itu bukan kelulusan produk. Sisa yang bermakna bagi manusia: pilot pembelajar/pengajar, host Windows bersih, pengamat Narrator/NVDA, persetujuan seni.

Ketiga temuan ini menentukan prioritas orkestrasi: **dekonflik dulu, baru kumpulkan hasil, lalu terjemahkan ke bahasa manusia.**

---

## 2. Pembagian peran

### 2.1 Agent Utama (orkestrator — saya)

- Memantau status dan progres ketiga agen tanpa menginterupsi kerja yang sehat.
- Mencegah dua agen memakai GUI/DB QA bersamaan; menetapkan giliran bila perlu.
- Memastikan tiap agen menghasilkan **temuan yang bisa dipakai manusia**: dampak pengguna, langkah reproduksi, bukti/screenshot, dan batas bukti.
- Mengonsolidasikan hasil menjadi satu laporan ringkas, bukan kumpulan hash.
- Mengeskalasi prasyarat manusia tanpa mengarang hasilnya.
- Larangan: reset/clean/commit/push, menyentuh profil produksi/peserta, membuat sesi baru, menimpa identitas sesi lain.

### 2.2 Agent Test (pemeriksa kritis)

- Menilai aplikasi dari sisi kebenaran fungsi: drill D1, pelajaran, Catatan, dan alur inti lainnya.
- Bersikap kritis dan jujur: mencatat yang gagal, bukan hanya yang lolos.
- Membedakan **[P] eksekusi nyata** dan **[T] inspeksi**.
- Menutup proses QA yang dibukanya setelah selesai.

### 2.3 Murid 1 dan Murid 2 (simulasi pembelajar)

- Memakai aplikasi sebagai pembelajar: urutan klik, jawaban salah/perbaikan, audio, bacaan, checkpoint, remedial, keluar di tengah lalu restart.
- Menilai dari sisi manusia: instruksi jelas atau tidak, umpan balik membantu atau tidak, tombol sesuai label atau tidak, progres tersimpan atau tidak.
- Menghasilkan artefak yang bisa dilihat manusia: ringkasan langkah, screenshot, dan daftar friksi.
- Murid 1 dan Murid 2 **tidak boleh** menjalankan GUI QA bersamaan; perlu bergiliran atau memakai profil yang berbeda.

---

## 3. Aturan koordinasi (kontrak bersama)

1. **Satu GUI QA dalam satu waktu.** Karena identifier sama, jika satu agen sedang menjalankan EXE/UI, agen lain menahan eksekusi GUI dan boleh melakukan inspeksi/analisis dulu.
2. **Tutup proses sendiri.** Setelah selesai, agen menutup proses EXE yang dibukanya dan melaporkan PID/status.
3. **Jangan pakai profil produksi/peserta.** Hanya profil QA terisolasi; jangan menimpa data agen lain.
4. **Laporkan ke sesi orkestrator** (`ses_e0c636994ffejfdkGOfzzgKZxt`) saat selesai atau saat menemui blocker.
5. **Format temuan:** ID | ringkasan | dampak pada pengguna | langkah reproduksi | bukti (path/screenshot) | batas bukti.
6. **Jangan mengarang hasil.** Jika gagal menjalankan aplikasi, laporkan kegagalan itu sebagai temuan.

---

## 4. Alur kerja

```
inspeksi status agen (API + proses)
  -> dekonflik profil/GUI (atur giliran)
  -> agen lanjut kerja
  -> agen kirim temuan ke orkestrator
  -> orkestrator verifikasi silang (test vs murid)
  -> konsolidasi laporan manusia
  -> eskalasi prasyarat eksternal
```

---

## 5. Rencana eksekusi

| Fase | Aksi | Penanggung | Kriteria |
|---|---|---|---|
| 0 | Petakan sesi & konflik profil | Orkestrator | Selesai — lihat §1 |
| 1 | Kirim kontrak koordinasi ke 3 agen | Orkestrator | Pesan terkirim, tanpa menghentikan kerja sehat |
| 2 | Dekonflik GUI QA | Semua agen | Maksimal satu proses GUI QA aktif; yang lain menahan |
| 3 | Kumpulkan temuan test + 2 murid | Agent Test, Murid 1, Murid 2 | Tiap agen mengirim temuan berbentuk dampak pengguna + repro |
| 4 | Verifikasi silang & konsolidasi | Orkestrator | Satu laporan ringkas; temuan kontradiktif ditandai |
| 5 | Eskalasi prasyarat manusia | Orkestrator -> User | Pilot G01+P01–P03, host bersih, Narrator/NVDA, seni tetap PENDING |

---

## 6. Kriteria "bermanfaat untuk manusia"

- Pisahkan **bukti mesin** dari **kelulusan produk**.
- Setiap temuan menjawab: *"apa yang berubah bagi pengguna?"*
- Utamakan langkah reproduksi di atas angka.
- Simpan bukti negatif (FAIL asli) agar perbaikan bisa dibuktikan.
- Hindari notifikasi yang tidak menghasilkan keputusan.
- Tidak mengulang pekerjaan yang sudah terverifikasi dengan hash yang sama.

---

## 7. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| DB QA tertimpa karena identifier sama | Satu GUI QA aktif; giliran; tutup proses setelah uji |
| Murid 1 masih retry 502 | Cek ulang status; bila masih gagal, laporkan sebagai blocker, jangan dianggap selesai |
| Agen mengirim PASS tanpa repro | Kontrak temuan wajib memuat dampak + langkah reproduksi |
| Interupsi kerja yang sehat | Pesan koordinasi bersifat instruksi ringkas, bukan perpindahan tugas |
| Mengarang hasil pilot manusia | Prasyarat eksternal ditandai PENDING |

---

## 8. Log tindakan orkestrator

- Inspeksi API: 3 agen berstatus `running` + sesi ini.
- Inspeksi pesan: agent test 44/44 assistant berisi, murid 1 ada 1 retry 502, murid 2 aktif menjalankan skrip.
- Inspeksi proses: PID 2364 `target-qa/release/lernen-app.exe` aktif; PID 14544 sudah tidak ada.
- Konfigurasi: `tauri.qa.conf.json` → `app.lernen.qa.audio` (sama untuk semua build QA).
- Dokumen ini diperbarui dari versi awal yang memakai pemetaan sesi lama.
- Kontrak koordinasi dikirim ke ketiga agen lewat `POST /api/session/{id}/prompt` — HTTP 200 untuk ketiganya. Pesan sudah masuk ke konteks agent test dan murid 2; pada murid 1 masih antre karena sesi sedang retry 502.
- Mandat agent test juga meluas lewat pesan pengguna: "uji secara keseluruhan aplikasi lernen" lalu "uji secara fungsi sebagai manusia bukan menguji programnya" — selaras dengan tujuan orkestrasi ini.
- 19 Nov: ketiga agen selesai; laporan disatukan di `outputs/koordinasi-opencode/laporan-masuk/LAPORAN-GABUNGAN-2026-11-19.md`, usulan perbaikan di `docs/architecture/USULAN-PERBAIKAN-HASIL-PENGUJIAN-2026-11-19.md`. Jalur kirim langsung (`laporan-masuk/README.md`) sudah disosialisasikan ke ketiga agen (HTTP 200, pesan terverifikasi masuk).
