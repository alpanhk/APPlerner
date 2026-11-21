# TINJAU INDEPENDEN CLONE PERSIS r2 — 21 November 2026

**Mandat:** SINYAL GO tinjau independen clone persis r2, orkestrator / agent utama uji (`ses_e0c636994ffejfdkGOfzzgKZxt`)
**Peninjau:** Agent utama uji — review **independen**, tidak menerima laporan 3a sebagai fakta
**Hash EXE:** `961e664ac36ff662423d724f83fe739f549d0bdf4a6de7e5ef66a03434a4d062` — **diverifikasi mandiri** (66.789.376 B, build normal 15:46:01–15:55:16 WIB)
**EXE:** `<clone APPlerner-verify>/outputs/penyelesaian-windows/clone-persis-20261121/kandidat-r2/lernen-app-qa.exe`
**Profil QA:** `app.lernen.qa.cloner2`, CDP 9248, WebView2 UDF unik
**Status produk:** **TETAP LAYAK BERSYARAT** — tidak saya naikkan
**Transfer:** saya **TIDAK** mengirim sinyal transfer — itu milik AD setelah SESAI final

---

## 1. Kesimpulan

> ## **SESAI** — pada hash EXE `961e664a…`

Seluruh acceptance yang dapat dibuktikan dengan **[P]** lolos. Regresi kritis **CP-CLONE-01** saya konfirmasi mandiri. Perbedaan screenshot yang tersisa (Story/Input/Choice 4,2–5,4% dan **Perpustakaan 35,3%**) saya putuskan sebagai **perbedaan lingkungan yang dapat diterima**, bukan cacat produk — dengan bukti berpasangan (lihat §3).

Tiga hal tetap **PENDING** dan tidak saya ubah menjadi lulus: **CP-CLONE-02** ("Dengar lagi" belum teramati), penilaian telinga/pilot manusia, dan prasyarat eksternal. Itu sebabnya **status produk tetap LAYAK BERSYARAT** meski konformitas visual dinyatakan SESAI.

---

## 2. Verifikasi mandiri [P] — regresi CP-CLONE-01

Saya menjalankan jalur asli: Title → `Mulai cerita` → CharacterCreator → `Mulai prolog` → Story → `Riwayat` → `Tutup`, dengan probe `Runtime.exceptionThrown` **terpasang sebelum interaksi**.

| Cek | Hasil mandiri saya | Bukti |
|---|---|---|
| Story tercapai | **[P]** `rootLen=276`, header `Jurnal/Riwayat/Perpustakaan/Pengaturan/Judul`, narasi `Dari balik jendela terdengar trem lewat…` | `riwayat-final.json` → `steps.ke-story` |
| Riwayat terbuka | **[P]** `opened=true`, `aria="Riwayat percakapan"`, `root 276→435` (tidak kosong) | `steps.riwayat` |
| Riwayat ditutup | **[P]** `root 435→276` — kembali utuh, **tidak crash** | `steps.riwayat` |
| Exception | **[P]** `Runtime.exceptionThrown = 0` | `R.exceptions=[]` |
| Console | **[P]** `console.error = 0` | `steps.riwayat.consoleErrors=0` |
| 3 panel lain | **[P]** Jurnal `root=4628`, Perpustakaan `root=3680`, Pengaturan `root=1353` — semua normal | `steps.panel` |

Ini menutup CP-CLONE-01: bug sebelumnya (`#root` 0 saat Tutup Riwayat) **tidak teramati lagi** pada hash ini.

---

## 3. Perbandingan berpasangan referensi vs EXE — keputusan beda

Saya memeriksa screenshot berdampingan `diff/side-05-panel-library.png` dan `diff-report.json` (10 pasangan, viewport sama).

| Layar | Beda | Keputusan | Alasan |
|---|---|---|---|
| Title 0,103%, Create 0,198%, Result 0,045%, Pengaturan 0,35%, 900×600 0,04% | ≤0,4% | **SESAI [P]** | Praktis identik |
| Panel story 2,441% | minor | **SESAI [P]** | Pergeseran kecil, konten identik |
| Story 4,863%, Input 5,379%, Choice 4,234% | 4–5% | **SESAI (dapat diterima) [P]** | Heatmap terkonsentrasi pada baris status **"Suara mati — seluruh cerita tetap bisa dibaca."** yang memang disyaratkan EXE (audio **default mati**), sedangkan referensi memakai `soundOn=true`; ini menggeser teks dialog beberapa piksel. Saya **tidak** menyatakan pixel-identik |
| **Perpustakaan 35,311%** | besar | **SESAI (perbedaan lingkungan, bukan cacat) [P/T]** | Saya lihat `side-05-panel-library.png`: **grid 5×2 sampul identik**, judul & filter `67 bacaan · semua A1 A2 B1 B2` identik, panel `Perpustakaan`/tombol `Tutup` identik. Area merah adalah **heatmap diff** (delta piksel pada teks/anti-aliasing/font rendering), bukan hilangnya konten. Referensi memuat **Google Fonts via CDN** (Caveat lazy-load) dan dijalankan via `vite dev`; EXE **offline** dengan **TTF ter-embed**. Perbedaan rendering ini diharapkan |

**Kesimpulan beda:** tidak ada cacat produk pada 10 layar yang dibandingkan. Beda 35,3% Perpustakaan adalah artefak perbandingan lintas-lingkungan (CDN font vs offline TTF), bukan perubahan desain. Saya tetap mencantumkan catatan ini sebagai batas bukti, bukan klaim "sempurna".

---

## 4. Cek lainnya [P]

| Aspek | Hasil | Bukti |
|---|---|---|
| Tanpa shell lama | **LOLOS** — `.klab-app=false`, "Koleksi media"=0, 4 tab lama=0; hanya `VISUAL NOVEL BAHASA JERMAN` + `Lernen` | `tinjau-clone-r2-orkestrator.json` → `steps.awal.oldShell` |
| Font lokal | **LOLOS** — body/root = `"Atkinson Hyperlegible", …`; **0/10 tombol buruk**; TTF ter-embed; `index.html` tanpa Google Fonts | `steps.font-audio`, laporan 3a |
| Audio default mati / opt-in | **LOLOS** — 5 media `volume=0` → naik setelah opt-in; 0 URL eksternal | `clone-qa-report.json` |
| First-run / restart | **LOLOS** — tanpa progres & tanpa tombol "Lanjutkan"; restart `stage/flags/prologCompleted/attempts` identik | `clone-qa-report.json` |
| Keyboard | **LOLOS** — Tab → fokus `BUTTON`, Esc tidak merusak root (`rootLen=276`) | `steps.keyboard`, `steps.keyboard` di riwayat |
| Reduced motion | **LOLOS** — `matchMedia(reduce)` aktif, konten tetap lengkap | `steps.reduced` |
| 900×600 & 1280×800 | **LOLOS** — `sw=cw`, tanpa overflow | `steps.viewport` |
| Offline | **LOLOS** — 0 request eksternal | `steps.integritas.external=[]` |
| Integritas | **LOLOS** — `console.error=0`, exception 0, 0 proses QA | `steps.integritas`, `steps.close` |

---

## 5. Artefak harness — bukan cacat produk

| Observasi | Penjelasan |
|---|---|
| Beberapa uji gagal mencapai Story (`opened=false`, `rootLen=160/278/318`) | Saya memakai jalur Title lama (`Jelajah→Latihan`) dan mengisi input lewat `el.value=` yang tidak memicu React. Setelah memakai `Input.insertText` + tombol `Mulai prolog`, Story tercapai normal. **Harness**, bukan produk |
| `fokusSetelahTab = "Normal"` dan `rootLen=160` pada satu uji | Keadaan halaman Pengaturan dari uji sebelumnya; bukan cacat |
| `Perpustakaan 35,3%` | Heatmap lintas-lingkungan (CDN font vs TTF offline), sudah dianalisis di §3 |

---

## 6. Pemisahan bukti & batas (pertahankan)

- **(a) Integritas/dekode:** 96/96 hash manifest [T]; `console.error=0`; exception 0; 0 eksternal; 0 proses QA.
- **(b) Benar-benar diputar:** opt-in volume terbukti; **CP-CLONE-02** ("Dengar lagi" tak memicu `play`/`tts`/`cancel` pada probe) **masih PENDING** — perlu pendengaran manusia/WebView2 TTS.
- **(c) Penilaian telinga manusia:** **PENDING** — Budi/Anna/Schlüssel/Apfelsaft, musik/ambience, cue cangkir, klip lama.
- **Bukti temporal:** 31 frame WebView bertimestamp + event, **bukan video desktop** (`ffmpeg` tidak tersedia).
- Pilot pembelajar/pengajar, host Windows bersih, pengamat Narrator/NVDA, persetujuan seni, hak distribusi suara — **PENDING**.

---

## 7. Rekomendasi ke AD

1. Tetapkan **SESAI** untuk hash `961e664a…` (konformitas visual & regresi CP-CLONE-01 lolos).
2. **Saya tidak mengirim sinyal transfer** — AD yang menindaklanjuti ke agen transfer.
3. Terus bawa catatan **CP-CLONE-02** dan batas telinga/pilot §6; **jangan** menjadikannya lulus.
4. Status produk **tetap `LAYAK BERSYARAT`** sampai pilot manusia selesai.

---

## 8. Integritas uji

- EXE divergerifikasi `961e664a…` sebelum uji; tidak menimpa build lama/paket pilot, tidak mengubah pintasan, tidak menutup jendela pengguna.
- DB profil QA `app.lernen.qa.cloner2` tidak saya tulis permanen; 3a mencatat DB kembali ke kondisi awal (absen).
- Semua proses QA saya ditutup (`remaining=[]`).
- Harness mandiri: `tinjau-clone-orkestrator.mjs`, `riwayat-orkestrator.mjs`, `riwayat-koreksi.mjs`, `riwayat-final.mjs`; bukti `tinjau-clone-r2-orkestrator.json`, `riwayat-final.json`, screenshot `screenshots-orkestrator-r2/`.
- Status produk **tetap `LAYAK BERSYARAT`**.
