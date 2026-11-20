# Catatan perubahan produk — UIUX-VISUAL-NOVEL-20261121

**Dicatat:** 21 November 2026 02:42 WIB oleh 3c (koordinasi & dokumentasi).
**Repo:** `APPlerner-verify`, cabang `uiux-visual-novel-20261121`, HEAD `2b75b671…`.
Bukan edit PRD paket pilot 21 Nov; PRD tetap beku `1bb834e2…`.

## Referensi tunggal dan inventaris

- Brief: `outputs/koordinasi-opencode/revisi-rak-dialog-20261120/ROMBAK-UIUX-BRIEF.md` (di repo
  `lernen-app`). Referensi **tunggal**: `<referensi-visual-novel-20261121>`;
  `lernen-design/outputs` sudah dihentikan.
- Manifest `outputs/koordinasi-opencode/ref-visual-novel-manifest.json`: **96 berkas**, agregat
  `a562f171a09e789036467595bf5eeac90bfcba3e15bf4188fe664d9fd78238de`. Verifikasi 3c: **96/96
  berkas ada dan SHA-256 cocok**, 0 missing, 0 hash beda.
- Komponen referensi: TitleScreen, CharacterCreator, Stage, DialogPanel (AnswerInput/ChoiceList/
  NextButton), Panels (Journal/Library/HistoryPanel/SettingsPanel/Modal), ResultScreen; gaya latar
  `#1f2740`, aksen `#b5533c`, kream `#f7efdd`, biru `#2c3e6b`; font Atkinson Hyperlegible; fokus
  3 px; fade 500 ms; reduced motion; tombol primary/secondary/ghost/choice/chip.
- Audio: AudioController dengan status tuturan, ambience, default mati, pengaturan tersimpan.

## Perubahan produk yang direncanakan pemilik (belum dibuktikan [P])

| Pemilik | Area | Status |
|---|---|---|
| 1a | Peta rute `title`/`create`/`story` + panel, integrasi data/SQLite, kontrak rute ke 2a/4a/3b/AD | Diterima (status 21 Nov); laporan `integrasi-1a.md` sedang disiapkan |
| 2a | Interaksi tokoh/audio, dialog dua giliran, umpan balik, koreksi | Mandat terkirim HTTP 200; sesi aktif |
| 3a | Satu build kandidat di `kandidat-qa/`, profil QA unik, CDP berbeda, bukti temporal | Skenario `SKENARIO-3A.md` ada; **menunggu hash final**, belum EXE |
| 3b | Regresi non-GUI, data, keyboard, reduced motion, benturan klik | Mandat terkirim HTTP 200; sesi aktif |
| 4a | Visual/token/komponen seluruh layar mengikuti referensi | Mandat terkirim HTTP 200; sesi aktif |
| AD | Koordinasi, tinjau independen N1–N13, pengalihan pintasan setelah lulus | Kriteria disiapkan; pintasan belum diubah |

## Batas

Logika belajar, SQLite, progres, backup/restore, paket pilot 21 Nov, dan data kerja dipertahankan.
Tanpa Xfigura/agen gambar/publikasi/reset/clean/commit/push/profil peserta/stok pending. EXE lama
dan pintasan desktop tidak ditimpa/diubah; jendela pengguna tidak ditutup. Status produk tetap
**LAYAK BERSYARAT** sampai build normal + tinjau [P] pada hash EXE yang sama dan pilot manusia.
