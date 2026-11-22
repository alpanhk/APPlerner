# APPlerner
Aplikasi Belajar Bahasa German

Aplikasi desktop Windows offline-first untuk belajar bahasa Jerman (A1–B2),
berbasis **Tauri 2 + React + TypeScript + Vite + Tailwind v4** dan SQLite
(`tauri-plugin-sql`). Dokumen inti ada di **root repo**:
`PRD-Aplikasi-Belajar-Bahasa-Jerman.md` dan `GLOSSARY.md`. Catatan pengembangan
lengkap di `docs/README-PROYEK.md` dan arsitektur di `docs/architecture/`.

## Prasyarat

- Windows 10/11 64-bit, **WebView2 Runtime**, **Microsoft Visual C++ Build Tools**
  (komponen “Desktop development with C++”).
- **Node.js `^20.19.0 || >=22.12.0`** (sesuai field `engines` Vite 8) dan **pnpm**
  (disarankan lewat Corepack: `corepack enable`). Transfer ini diverifikasi dengan
  Node 26.8.1 + pnpm 11.7.0; seluruh perintah di bawah memakai `pnpm`.
- **Rust toolchain** stabil via [rustup](https://rustup.rs) (diperlukan hanya untuk
  build/desktop Tauri, bukan untuk build frontend saja).

## Clone

```powershell
git clone https://github.com/alpanhk/APPlerner.git
cd APPlerner
```

Repo ini **privat** — autentikasi HTTPS memakai Git Credential Manager
(akun `alpanhk`). Jangan menyimpan token di dalam repo.

## Install

```powershell
pnpm install
```

## Development

```powershell
pnpm dev            # Vite dev server (frontend saja, http://localhost:5173)
pnpm tauri dev      # aplikasi desktop Tauri + hot reload
```

## Build

```powershell
pnpm build          # tsc --noEmit types + vite build -> dist/
pnpm tauri build    # bundel desktop Windows (MSI + NSIS) -> src-tauri/target/release/bundle/
```

> `pnpm tauri build` memerlukan WebView2, MSVC Build Tools, dan Rust.
> Artefak build (`dist/`, `src-tauri/target/`, installer, EXE) sengaja **tidak**
> dimasukkan ke git; hasilkan dari perintah di atas.

## Struktur sumber

- `src/` — aplikasi React, data JSON, aset UI/audio (`src/assets/`, `src/klab/`).
- `public/` — aset runtime berlisensi (audio, sampul, latar, ikon).
- `src-tauri/src/` — kode Rust, migrasi, dan logika SQLite.
- `src-tauri/capabilities/`, `src-tauri/icons/` — izin Tauri dan ikon aplikasi.
- `scripts/` — generator konten, aset, dan pengujian (kecuali `scripts/qa/` yang
  memakai profil/host lokal sengaja tidak diikutsertakan).
- `docs/` — dokumentasi desain dan arsitektur.

Aset di `public/` dan `src/assets/` adalah aset proyek; hak cipta melekat pada
pemilik proyek dan tidak boleh dipublikasikan terpisah.

## Catatan transfer

Snapshot awal diimpor sebagai satu commit di atas commit awal remote agar riwayat
tetap linier (fast-forward). Riwayat lokal yang tidak teraudit, profil/DB pengguna,
log, kredensial, EXE, `node_modules`, `target`, dan `dist` tidak dibawa.

## Pratinjau terisolasi (frontend preview)

Tiga konfigurasi Vite berikut memakai HTML di `frontend-preview/` dan entry point
di `src/klab/`. Masing-masing punya port dan direktori keluaran sendiri sehingga
tidak mengganggu build utama:

```powershell
pnpm vite build --config vite.frontend.config.ts     # output: manifest + dist preview KLAB
pnpm vite --config vite.frontend.config.ts           # http://127.0.0.1:1425
pnpm vite --config vite.lanjutpilot.config.ts        # http://127.0.0.1:1427
pnpm vite --config vite.rpg.config.ts                # http://127.0.0.1:1432
```

InputHTML: `frontend-preview/index.html` → `src/klab/preview.tsx`,
`frontend-preview/pilot.html` → `src/klab/pilotPreview.tsx`, dan
`frontend-preview/rpg.html` → `src/klab/rpg/rpgPreview.tsx`.

Pratinjau RPG membaca data dan aset dari `outputs/preview-dialog-rpg/`,
`outputs/aset-bacaan-percakapan-review/Im-Cafe/v01|v02/`, dan
`outputs/penyelesaian-windows/dialog-catalog/`. Direktori `outputs/` pada
umumnya diabaikan git, tetapi **subset tepat** di atas sengaja di-`force-add`
karena merupakan input build/runtime, bukan artefak hasil build. Jangan hapus.

## Catatan untuk agen yang bekerja dari clone

- Transfer ini memakai klon staging terpisah; **jangan** commit, checkout, reset,
  clean, atau push dari working tree sumber di `lernen-app` / `lernen-design`.
- Seluruh perubahan sumber setelah saat snapshot dicatat sebagai HANDOFF di
  `STATUS.md` pada folder koordinasi `outputs/koordinasi-opencode/transfer-github/`
  di working tree sumber. Periksa berkas itu sebelum melanjutkan integrasi.
- Profil QA, `scripts/qa/`, `tauri.qa.conf.json`, `tauri.design.conf.json`, DB,
  log, EXE, `node_modules`, `target`, dan `dist` sengaja tidak ikut. Hasilkan
  kembali dengan perintah install/build di atas.
- Push hanya dilakukan oleh agen transfer tunggal. Repository bersifat privat;
  autentikasi memakai Git Credential Manager, bukan token di dalam repo.
