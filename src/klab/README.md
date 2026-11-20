# Infrastruktur frontend KLAB

Fondasi frontend Lernen yang **terpisah dari aplikasi awal**. Pengguna mengizinkan persiapan ini pada17November2026; backend dan aplikasi awal tetap milik agent1–2–3 OpenCode. Tidak ada perubahan pada App/main produksi, Rust, database, konten atau audio lama.

## Menjalankan

```powershell
pnpm exec vite --config vite.frontend.config.ts
```

Buka [preview lokal](http://127.0.0.1:1425/frontend-preview/). Port1425/cache Vite tersendiri, bukan port1420. Entry `frontend-preview/index.html` memuat `src/klab/preview.tsx`; main aplikasi awal tidak mengimpornya. Fixture tidak disimpan ke file/localStorage/SQL. Refresh mereset contoh.

```powershell
node scripts/test_klab_frontend.cjs
pnpm exec tsc --noEmit --incremental false
pnpm exec vite build --config vite.frontend.config.ts
node scripts/qa/klab_frontend_browser.cjs
```

Perintah browser memerlukan server preview aktif dan Chromium; default Chrome Windows, override executable `KLAB_QA_CHROME` bila perlu. Script memakai profil **headless terisolasi** di temp, tidak profil browser pengguna. Tidak menginstal Playwright/dependency baru. `KLAB_PREVIEW_URL` dapat menunjuk server static hasil build. Hasil build dan screenshot/log ada di `outputs/frontend-infrastructure-2026-11-17/`, bukan dist/release utama. Build memakai `emptyOutDir:false` agar tidak menghapus hasil lain.

## Pemakaian modul

- `routes.ts`: `Route`, `Tab`, `TABS`, `homeRoute`, `tabForRoute`, `legacyRoute`.
- `navigation.ts`: factory store Zustand vanilla terisolasi. `back()` false pada root; adapter native nanti memutuskan root-back. Tab memulihkan stack; gunakan Kembali untuk naik satu tingkat. Stack20termasuk root.
- `contracts.ts`: kontrak TypeScript tanpa implementasi DB. Import domain type-only tidak membundel bank/tts/native. [Handoff backend](../../docs/architecture/lernen-klab-backend-handoff.md) menjelaskan invariant/error/receipt.
- `Shell.tsx`: props route,onNavigate,theme,onThemeChange,notice?,children. Satu children tree saat resize. Tidak memutuskan soal, progres, akses atau penyimpanan.
- `tokens.css`: scoped `.klab-app`, light/dark, bottom nav/rail, touch48, focus/skip-link, safe areas/reduced motion. Belum mengganti App.css.
- `Icon.tsx`, `Mascot.tsx`: SVG original untuk studi antarmuka, tanpa font/aset jaringan. Maskot **prototipe**, bukan set pose final berlisensi yang sudah ditinjau.
- `preview.tsx`: fixture UI saja. Rute Hören/Schreiben/Percakapan/Drill/UjiA1 tetap dapat ditemukan, tetapi layar domain lengkap sengaja belum disambungkan. Catatan memori, gagal/retry simulasi, hasil73%fixture bukan record belajar.

Contoh mengonsumsi shell nanti: controller domain memuat state via adapter yang memenuhi kontrak, mengirim view props/callback ke children, lalu menginvalidasi query setelah receipt commit. Jangan impor preview ke App, jangan silent fallback native gagal→fixture. Jangan hubungkan backend tanpa membaca [rencana migrasi](../../docs/architecture/lernen-klab-frontend-migration-plan.md).

## Verifikasi dan batas

Hasil aktual terbaru dan ukuran emitted dicatat di [laporan frontend](../../outputs/frontend-infrastructure-2026-11-17/README.md). Browser screenshot bukan bukti Android/SQLite/installer/pedagogi. Font sistem dan SVG prototipe dipakai sementara; panel komik final, lima pose maskot, font lokal berlisensi, ikon/lencana/reaksi produksi masih backlog. Identitas/komposisi KLAB wajib dibandingkan dengan JPG per viewport sebelum implementasi penuh dinyatakan selesai.

## Produksi visual 4a (KLAB-WINDOWS-20261119)

Penerus pekerjaan desain mengubah fondasi di atas menjadi komponen React produksi. Kontrak lengkap: [`docs/architecture/klab-presentational-contract-4a.md`](../../docs/architecture/klab-presentational-contract-4a.md). Semua komponen **presentasional**: menerima data + state + callback; tidak berisi SQL/native/penilaian/navigasi global.

### Katalog komponen

| Modul | Ekspor | Fokus dan keadaan |
| --- | --- | --- |
| `assets.ts` | `assets`, `assetCredits` | Empat aset lokal dari prototipe (dua maskot alpha, adegan kafe, sampul Im Café). Judul sampul tetap teks HTML. Tidak ada aset gambar baru; kebutuhan baru lewat director ke agen gambar. |
| `components/ui.tsx` | `KButton`, `Eyebrow`, `SegmentedProgress`, `SaveStatus`, `EmptyState`, `ErrorState`, `Tabs`, `LoadingState`, `RowLink` | `KButton` empat varian (primary/secondary/text/back), satu CTA per layar. `SegmentedProgress` role=img + label. `SaveStatus` role=alert hanya saat `failed`, tombol Coba lagi memakai identitas dari pemanggil. `ErrorState` role=alert. `EmptyState` tanpa data contoh. `Tabs` role=tablist + aria-pressed. Fokus ring 3px dari `tokens.css`. |
| `components/session.tsx` | `FocusHeader`, `SessionCard`, `Choice`, `ChoiceGroup`, `Feedback`, `AudioButton`, `ComicPanel` | `FocusHeader` sticky, breadcrumb + progress + `onBack` dari pemanggil (naik satu tingkat). `SessionCard` satu CTA + maskot dekoratif `alt=""`. `Choice`/`ChoiceGroup` menampilkan `state` hasil penilaian 2a; grader tetap di 2a. `Feedback` slot alasan/contoh; saat `exampleOpen` dua kolom, pada 900x600 bergulir; fokus-kembali & gulir tanggung jawab 2a. `AudioButton` label "Dengarkan" + status inline saat klip gagal. `ComicPanel` balon teks DOM yang bisa dipilih. |
| `components/book.tsx` | `BookCover`, `BookCard`, `Shelf`, `BookPreview`, `Reader`, `ShelfEmpty`, `PreviewActions` | `data-entering` hanya saat masuk dari rak (270 ms, 0 ms reduced motion). `BookPreview` menerima `eyebrow?` opsional. Sampul bebas tulisan; `.cover-label` memakai teks `#12265c` di atas `#ffffff` (≈14,3:1). `Reader` memakai `[lang=de]`/`[lang=id]`. |
| `pages/TodayPage.tsx` | `TodayPage` | Eyebrow + judul + `SessionCard` + tautan remedial/SRS + buku/progres (eyebrow "Kurikulum A1") + motivasi. `secondaryAction?` diteruskan ke `SessionCard.secondary` dan tampil juga bila `agenda===null`. `loadState==='failed'` → ErrorState + retry. |
| `pages/ExplorePage.tsx` | `ExplorePage` | Siap 100% aset: 42 unit dengan badge A1/A2/B1/B2 (grid saat >12 unit), 67 buku di rak dengan `lead` dinamis di `BookPreview entering`, 2.134 kata dengan pencarian + paginasi 150 + tombol `Ulangi dengan SRS` (`onOpenSrs`), Latihan lengkap. Pintasan `Drill D1–D10`/`Uji A1` selalu tampil. Kategori kosong → EmptyState. |
| `pages/NotesPage.tsx` | `NotesPage` | Desktop daftar+editor+pratinjau; HP satu kolom. `orphaned` → label "Bagian sumber berubah". `SaveStatus` menjaga draft saat gagal; debounce/revisi milik 1a. |
| `pages/ProfilePage.tsx` | `ProfilePage` | Ringkasan/Statistik/Pengaturan/Rekaman/Pemulihan/Peralatan lama. Angka hanya dari data 1a; tidak menghitung XP/lulus. Recovery & legacy tools tetap dapat ditemukan. |
| `pages/viewModels.ts` | tipe data halaman | `LoadState`, `AgendaCardData`, `QuickLinkData`, `UnitItemData` (+`level`), `BookItemData` (+`lead`, `level`), `VocabularyItemData`, `PracticeLinkData`, `NoteItemData`, `StatsSummary`, `PreferencesView`. |

### Pemakaian oleh 1a dan 2a

1a memasang empat halaman di `App.tsx` lewat komposisi rute yang ada; meneruskan `loadState`, data, dan callback. 2a mengimpor komponen `session.tsx`/`book.tsx` di `src/klab/learning/**` dan tetap pemilik penilaian, audio, fokus-kembali, dan alur. Tidak ada komponen 4a yang menulis data atau memutuskan rute.

`preview.tsx` sekarang menyusun halaman dan komponen di atas dengan fixture terisolasi sebagai bukti dapat dijalankan (`pnpm exec vite --config vite.frontend.config.ts`, port 1425). Build memancarkan aset lokal; tidak ada WAV/SQLite/native bridge di output.

### Keadaan kosong dan gagal

Belum ada progres, catatan, atau isi kategori memakai `EmptyState`. Bootstrap/seed/load gagal memakai `ErrorState` dengan retry aman dan akses backup; tidak reset data. Bank tidak cukup dan audio gagal disampaikan lewat slot/pesan inline tanpa skor fiktif. Simpan gagal mempertahankan input dan menawarkan retry dengan identitas sama.

### Verifikasi 4a

`pnpm exec tsc --noEmit --incremental false` (bersih untuk file 4a; error sementara dari `src/klab/learning/**` milik 2a dilaporkan ke inbox), `node scripts/test_klab_frontend.cjs` (isolasi preview LULUS), `pnpm exec vite build --config vite.frontend.config.ts` (LULUS). Fidelity visual final, paritas, installer, dan QA browser tetap milik 3a serta comparison manusia.

## Ledger singkat

- F1 RED: assertion modul routes belum ada (exit1), lalu implementasi dan GREEN.
- Boundary guard awal salah mengikuti import type ke domain; diubah menelusuri JavaScript hasil transpile, sesuai runtime. Tidak menghapus type reuse.
- Browser QA awal mengasumsikan tab langsung ke root; nested tab sengaja restore sesi, maka tes memakai tombol Kembali. Reload keyboard diperbaiki menunggu document baru melalui timeOrigin.
- F1–F3 disiapkan dalam namespace baru; existing code hashes diperiksa pada laporan. Backend integration, persistence dan final fidelity belum dilakukan.
