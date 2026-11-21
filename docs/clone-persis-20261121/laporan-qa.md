# CLONE PERSIS / Task 5 — revisi r2 (CP-FIX-01) & QA [P]

**WIB 15:58.** Klon `APPlerner-verify`, cabang `clone-persis-20261121`, HEAD `18edbf8`.
Tanpa commit/push/Xfigura/reset/clean/profil peserta/paket pilot; pintasan & jendela pengguna utuh.

## 1. Build jalur normal
- **EXE:** `outputs/penyelesaian-windows/clone-persis-20261121/kandidat-r2/lernen-app-qa.exe`
- **SHA-256 `961e664ac36ff662423d724f83fe739f549d0bdf4a6de7e5ef66a03434a4d062`** · 66.789.376 B
- `pnpm tauri build --no-bundle --config outputs/…/kandidat-r2/tauri.qa.cloner2.conf.json`,
  `BUILD_EXIT=0`, `tsc && vite build` sukses (140 modul). Jendela build **15:46:01 → 15:55:16 WIB**
  (555 dtk). `CARGO_TARGET_DIR` terisolasi, config `{"identifier":"app.lernen.qa.cloner2"}`,
  profil unik `app.lernen.qa.cloner2`, CDP **9248**, WebView2 UDF `kandidat-r2/webview2-profile`.
- Hash perbaikan diverifikasi: Panels `14cc4063`, ResultScreen `f2da2ecf`, TitleScreen `2f8e4d92`,
  novel/App `409f3ab6`, tes `68dbc887` — 5/5 cocok.
- Tidak menimpa `d27a387c` (kandidat gagal), `bbf336c9`, `77994b89`, `4899110c`, `27dda68d`
  (pintasan/proses pengguna), atau paket pilot.

## 2. Hasil [P] — 21 PASS / 0 FAIL
Bukti: `clone-qa-report.json` (SHA `24c107bf…`), screenshot di `exe/` + `screenshots/`,
frame temporal `screenshots/temporal-clone.{json,html}`, `diff-report.json` (SHA `30555797…`).

| Mandat | Status | Bukti ringkas |
|---|---|---|
| **CP-CLONE-01 regresi** | **PASS** | Title→Story→Riwayat→Tutup: `#root` **1952** karakter (sebelum 0), 6 tombol kembali, `Runtime.exceptionThrown=0`, `console.error=0`; 3 panel lain (Jurnal/Perpustakaan/Pengaturan) normal |
| Tanpa shell lama | PASS | `.klab-app`/topbar/shell-controls = false; "Koleksi media" = 0; 4 tab = 0 |
| Font & audio lokal | PASS | body/root/tombol Atkinson; reg/bold/italic/Caveat `fonts.check=true`; 4 TTF ter-embed; `index.html` tanpa Google Fonts; 5 klip lokal |
| Audio default mati / opt-in | PASS | 5 media `volume=0` saat mati → `0.25/0.36` setelah opt-in; 0 URL eksternal |
| Adapter | PASS | first-run tanpa progres & tanpa tombol "Lanjutkan"; restart `stage`, `flags`, `prologCompleted`, `attempts` identik |
| Alur Story | PASS | 30 langkah: pilihan → input → koreksi `✎ Ketik atau susun jawabanmu dulu…` → `Hasil belajar`, 4 baris |
| Keyboard/reduced/viewport/offline | PASS | Tab/Enter/Esc; `matchMedia(reduce)`; 900×600 & 1280×800 `sw=cw`; 0 eksternal; `console.error=0`; 0 proses QA; DB profil dikembalikan absen |
| Temporal | PASS | 31 frame WebView bertimestamp + event pada hash EXE yang sama |

## 3. Perbandingan screenshot berpasangan (hash `961e664a…`)
Sumber referensi: `<referensi-visual-novel-20261121>` via `vite dev`, tangkap pada
viewport yang sama (1280×800; satu 900×600). Heatmap dan side-by-side di `kandidat-r2/diff/`.

| Layar | Beda piksel | Catatan |
|---|---|---|
| Title | 0.103% | praktis identik |
| Create | 0.198% | praktis identik |
| Result | 0.045% | praktis identik |
| Pengaturan (dari Title) | 0.35% | praktis identik |
| Panel story | 2.441% | minor |
| Story | 4.863% | lihat catatan di bawah |
| Input | 5.379% | lihat catatan di bawah |
| Choice | 4.234% | lihat catatan di bawah |
| Viewport 900×600 | 0.04% | praktis identik |
| **Perpustakaan** | **35.311%** | tetap; heatmap terkonsentrasi pada grid sampul — **butuh tinjauan berdampingan manusia** |

Beda Story/Input/Choice konsisten dengan baris status "Suara mati — seluruh cerita tetap bisa dibaca."
yang memang disyaratkan EXE (default mati; referensi memakai `soundOn=true`), menggeser teks dialog
beberapa piksel. Saya tidak menyatakan pixel-identik untuk layar-layar ini.

## 4. Batas & temuan tertunda
- **CP-CLONE-02 (P2, PENDING):** tombol "▶ Dengar lagi" tidak memicu `play`/`tts`/`cancel` pada probe;
  opt-in sendiri terbukti (volume naik). Perlu pendengaran manusia/WebView2 TTS.
- **Penilaian telinga & pilot manusia: PENDING** — Budi/Anna/Schlüssel/Apfelsaft, musik/ambience,
  cue cangkir, klip lama; host bersih/Narrator-NVDA/art approval/hak suara.
- **Batas temporal:** `ffmpeg` tidak tersedia → frame WebView bertimestamp + event (31 frame),
  **bukan video desktop**.
- **Batas diff:** canvas CDP, bukan ImageMagick; referensi memuat Google Fonts via CDN (Caveat
  lazy-load, `check=false` di Title), dicatat apa adanya.
- Integritas: manifest 96 berkas agregat `a562f171…`; 0 request eksternal; `console.error=0`;
  0 proses QA; DB profil kembali ke kondisi awal (absen).

## 5. Kesimpulan & serah-terima
**Semua acceptance yang dapat dibuktikan dengan [P] lolos pada hash `961e664a…`** — CP-CLONE-01
tertutup dan regresi penuh hijau. Saya **tidak** mengklaim SESAI: CP-CLONE-02, Perpustakaan 35.3%,
dan penilaian telinga/pilot masih PENDING serta perlu tinjau independen pada hash yang sama.
Status produk tetap **`LAYAK BERSYARAT`**. Gerbang transfer **tertutup** sampai konformitas SESAI
final dan `GO-TRANSFER-UPDATE` dari AD. Tidak ada sinyal transfer dari saya.
