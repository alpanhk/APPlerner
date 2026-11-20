# Kontrak presentasional KLAB · Agent 4a

19 November 2026 · KLAB-WINDOWS-20261119 · Pemilik: Agent 4a.
Lampiran implementasi dari `mandat-migrasi-klab-2026-11-19.md` dan `outputs/prototipe-interaksi-klab-2026-11-19/UI-CONTRACT.md`.

## Prinsip batas

Komponen di bawah **hanya presentasional**. Komponen menerima data + `SaveState`/`LoadState` + callback, lalu merender DOM yang dapat diakses. Komponen **tidak** berisi:

- `invoke`/SQL/`getDb`/`seedLoader`/`localStorage`/`indexedDB`;
- pemilihan soal, penilaian, FSRS, urutan opsi, atau logika benar/salah;
- navigasi global (rute, stack, tombol Kembali tingkat aplikasi);
- tulis/progres/reward.

1a tetap pemilik komposisi `App.tsx`, adapter data, rute/back, dan runner. 2a tetap pemilik `src/klab/learning/**` (alur pelajaran/latihan/koreksi/bacaan/hasil). 4a menyediakan kulit visual + halaman Hari Ini/Jelajah/Catatan/Profil yang dipakai keduanya.

Semua nama kelas CSS mengikuti `UI-CONTRACT.md` prototipe (`.app-shell`, `.focus-header`, `.session-card`, `.exercise`, `.feedback`, `.choices`, `.choice`, `.shelf`, `.book-card`, `.book-cover`, `.book-preview`, `.reader`, `.reading-pair`, `.button*`, `.actions`, `.screen-footer`). CSS discoping di bawah `.klab-app` agar tidak menimpa layar lama. Atribut `hidden` dipakai untuk bagian non-aktif. Teks Jerman memakai `lang="de"`.

## Modul dan ekspor

| Modul | Ekspor | Dipakai oleh |
| --- | --- | --- |
| `src/klab/assets.ts` | `assets.mascotSambut`, `mascotFeedback`, `adeganKafe`, `sampulImCafe` (URL lokal) | 1a, 2a, 4a |
| `src/klab/components/ui.tsx` | `KButton`, `SegmentedProgress`, `SaveStatus`, `EmptyState`, `ErrorState`, `Tabs`, `Eyebrow` | semua |
| `src/klab/components/session.tsx` | `FocusHeader`, `SessionCard`, `Choice`, `ChoiceGroup`, `Feedback`, `AudioButton`, `ComicPanel` | 2a (koreksi/latihan), 4a |
| `src/klab/components/book.tsx` | `BookCover`, `BookCard`, `Shelf`, `BookPreview`, `Reader` | 2a (bacaan), 4a |
| `src/klab/pages/viewModels.ts` | `LoadState`, `AgendaCardData`, `QuickLinkData`, `UnitItemData` (+`level`), `BookItemData` (+`lead`, `level`), `VocabularyItemData`, `NoteItemData`, `PracticeLinkData`, `StatsSummary`, `PreferencesView` | 1a, 2a |
| `src/klab/pages/TodayPage.tsx` | `TodayPage` | 1a |
| `src/klab/pages/ExplorePage.tsx` | `ExplorePage` | 1a |
| `src/klab/pages/NotesPage.tsx` | `NotesPage` | 1a |
| `src/klab/pages/ProfilePage.tsx` | `ProfilePage` | 1a |

## Komponen visual bersama

### `KButton`
`{ variant?: 'primary'|'secondary'|'text'|'back'; children: ReactNode; ...ButtonHTMLAttributes }`
Memetakan `variant` ke `.button-primary` / `.button-secondary` / `.button-text` / `.back-button`. Tombol aksi utama satu per layar. `:disabled` menjaga `aria-disabled` bawaan. Fokus: `:focus-visible` ring 3px + offset 3px (dari `tokens.css`). Keadaan: normal, hover, disabled, `aria-expanded` bila pemanggil mengaturnya.

### `SegmentedProgress`
`{ done: number; total: number; label?: string; variant?: 'segments'|'meter' }`
Segmen = satu `<span data-done>` per unit; `role="img"` + `aria-label` default `"{done} dari {total} selesai"`. Meter = `<progress>` asli. Tidak menghitung nilai sendiri.

### `SaveStatus`
`{ state: SaveState; message?: string; onRetry?: () => void }`
`SaveState` dari `contracts.ts` (`clean|dirty|saving|saved|failed`). `role="alert"` hanya saat `failed`, selain itu `role="status"` + `aria-live="polite"`. Saat `failed`, tombol "Coba lagi" memanggil `onRetry`; teks asli tetap dipertahankan pemanggil. Keadaan kosong/gagal tidak menampilkan angka atau status fiktif.

### `EmptyState`
`{ icon?: ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void }`
Untuk "belum ada progres/catatan/hasil pencarian". Tanpa contoh data. Fokus: tombol aksi bila ada, jika tidak judul dengan `tabIndex={-1}` untuk pindah fokus.

### `ErrorState`
`{ title: string; message: string; detail?: string; onRetry?: () => void; onBack?: () => void }`
`role="alert"`. Dipakai untuk bootstrap/seed/load gagal dan simpan gagal yang bersifat blokir. Detail diagnostik lokal (tidak memuat secret). Tidak menghapus data.

### `Tabs`
`{ items: ReadonlyArray<{ id: string; label: string }>; active: string; onChange(id: string): void; label: string }`
`role="tablist"` dengan `aria-label`, tiap tab `aria-pressed`. Pemanggil yang mengubah rute/state. Tidak menyimpan riwayat.

### `FocusHeader`
`{ breadcrumb: ReactNode; progressLabel?: string; onBack: () => void; children? }`
`.focus-header` sticky dengan `.back-button`, `.breadcrumb`, `.progress-label`. `onBack` adalah aksi naik satu tingkat yang **diberikan pemanggil** (2a/1a), bukan navigasi internal. Saat panel/example terbuka, pemanggil tetap mempertahankan posisi belajar di header.

### `SessionCard`
`{ eyebrow?: string; title: string; subtitle?: string; meta?: string; ribbon?: string; art?: string; done?: number; total?: number; actionLabel: string; onAction(): void; secondary?: { label: string; onClick(): void } }`
Kartu Hari Ini: `.session-card` → `.session-copy` + `.session-art` (gambar `alt=""`, dekoratif). `ribbon` memakai `.unit-ribbon`. Progress opsional via `SegmentedProgress`. Satu CTA utama.

### `Choice` / `ChoiceGroup`
`Choice`: `{ label: string; state?: 'selected'|'correct'|'incorrect'|'unselected'; statusLabel?: string; ...InputHTMLAttributes }`. State dapat digabung spasi; `.choice-status` untuk "Pilihanmu" / centang/silang. `ChoiceGroup`: `{ legend: string; name: string; choices: Array<{ value: string; label: string; state?: ...; statusLabel?: string }>; value?: string; onChange?(value: string): void; disabled?: boolean }`. Grup memakai `<fieldset><legend>`. Penilaian tetap dilakukan 2a; komponen hanya menampilkan `state` yang diterima.

### `Feedback`
`{ state: 'correct'|'incorrect'; title: string; correctSentence?: ReactNode; explanation?: ReactNode; example?: ReactNode; exampleOpen?: boolean; onToggleExample?(): void; art?: string; actions?: ReactNode }`
`.feedback[data-state]` + `.feedback-body`/`.feedback-art`. `.explanation` dan `.example-panel` adalah slot ReactNode. Saat `exampleOpen`, alasan dan contoh berdampingan (CSS grid) pada layar cukup lebar; pada 900×600 konten bergulir ke contoh. Fokus kembali dan pemulihan gulir menjadi tanggung jawab 2a (pemilik panel), dengan `exampleTitleId` yang bisa diberikan pada `example`. Tidak ada tombol "Dengarkan" bawaan — gunakan `AudioButton`.

### `AudioButton`
`{ label?: string; onClick(): void; playing?: boolean; disabled?: boolean; status?: string }`
Teks tetap "Dengarkan" (sesuai UI-CONTRACT), bukan ikon saja. `.audio-status` memuat pesan saat klip tidak ada/gagal dengan `role="status"`. Tidak memutar audio sendiri.

### `ComicPanel`
`{ bubble: ReactNode; art?: string; lang?: string; className? }`
Panel komik ber-outline tinta dengan balon teks DOM yang dapat dipilih. `art` memakai aset maskot lokal; bila kosong, komponen `Mascot` dipakai.

### `BookCover`, `BookCard`, `Shelf`, `BookPreview`, `Reader`
- `BookCover({ title, meta?, label?, image?, entering? })`: judul **dirender sebagai teks HTML**, bukan tertanam di gambar. `label` (mis. "A1 · Restoran") wajib memakai pasangan kontras yang sudah diperbaiki (lihat catatan kontras UI-CONTRACT).
- `BookCard({ title, meta?, label?, image?, actionLabel?: string; onOpen(): void })`: `.book-card` → `BookCover`.
- `Shelf({ title?, description?, children, empty?: ReactNode })`: `.shelf` + `.shelf-grid`; empty memakai `EmptyState`.
- `BookPreview({ title, lead, description?, image?, label?, eyebrow?, entering?: boolean, actions?: ReactNode, children? })`: `.book-preview`/`.preview-content`. `data-entering` **hanya** diberikan bila `entering === true` (masuk dari rak); animasi 270 ms dan 0 ms pada reduced motion. `eyebrow` dirender sebelum judul (mis. "Cuplikan"). `Jelajah → Bacaan` memakai komponen ini saat sampul dipilih, sehingga selector `.book-preview` dan `data-entering` hadir di DOM. `lead` berasal dari `BookItemData.lead` (kalimat pembuka teks asli); fallback hanya bila data tidak menyediakan.
- `Reader({ title?, lines: Array<{ de: string; id?: string; state?: string }>, actions?, children? })`: `.reader`/`.reader-content`, tiap pasangan `.reading-pair` dengan `[lang=de]` dan terjemahan `[lang=id]`.

## Halaman (milik penuh 4a, dikonsumsi 1a)

### `TodayPage`
```ts
{
  loadState: LoadState;
  agenda: AgendaCardData | null;
  quickLinks: QuickLinkData[];
  progress: { title: string; done: number; total: number; units: UnitItemData[] } | null;
  motivation?: string;
  secondaryAction?: { label: string; onClick(): void };
  onOpenAgenda(): void;
  onOpenQuickLink(id: string): void;
  onOpenUnit(unitNo: number): void;
  onRetry(): void;
}
```
Susunannya: eyebrow + judul "Hari Ini" → `SessionCard` lanjut → `QuickLink` (remedial/SRS) → kartu buku/progres + daftar unit (eyebrow "Kurikulum A1") → motivasi ringan. `secondaryAction` diteruskan ke `SessionCard.secondary`; bila `agenda === null`, tombol pintas juga ditampilkan di bawah `EmptyState` agar pintasan Unit 4 Pelajaran 2 tetap dapat dijangkau walau profil QA punya draft Unit 1. `progress === null` menghasilkan `EmptyState` "Mulai dari Unit 1", bukan angka contoh. `loadState==='failed'` → `ErrorState` + `onRetry`.

### `ExplorePage`
```ts
{
  section: 'materials'|'vocabulary'|'reading'|'practice';
  loadState: LoadState;
  units?: UnitItemData[];
  books?: BookItemData[];
  vocabulary?: VocabularyItemData[];
  practiceLinks?: PracticeLinkData[];
  onSectionChange(section): void;
  onOpenUnit?(unitNo): void;
  onOpenBook?(id, mode): void;
  onOpenPractice?(id): void;
  onOpenSrs?(): void;
  onRetry(): void;
}
```
Empat kategori: Materi (seluruh 42 unit A1–B2 dengan badge level; grid responsif bila >12 unit), Kosakata (2.134 kata: pencarian lokal, 150 per halaman dengan tombol lanjut, `onOpenSrs`), Bacaan (67 buku di `Shelf`; `BookPreview` memakai `lead` per buku), Latihan (Mendengar/Menulis/Percakapan/Drill D1–D10/Uji A1). Kategori tanpa data → `EmptyState`, bukan daftar identik dashboard. Semua daftar memakai `min-width:0` + `overflow-wrap:anywhere`; `vocab-grid` bergulir vertikal (`max-height:64vh`) agar tidak overflow horizontal pada 1280×800 maupun 900×600.

### `NotesPage`
```ts
{
  loadState: LoadState;
  notes: NoteItemData[];
  selectedId?: string;
  draft: { title: string; body: string };
  saveState: SaveState;
  onSelect(id): void;
  onDraftChange(change: { title?: string; body?: string }): void;
  onSave(): void;
  onNew(): void;
  onDelete?(id): void;
  onOpenSource?(id): void;
  onRetry(): void;
}
```
Desktop ≥1024: daftar + editor + pratinjau sumber (3 panel). Tablet: daftar + editor. HP: editor fullscreen satu kolom. `orphaned === true` menampilkan label "Bagian sumber berubah" tanpa menghapus catatan. `saveState==='failed'` mempertahankan `draft` dan menawarkan retry dengan identitas yang sama (milik 1a).

### `ProfilePage`
```ts
{
  section: 'overview'|'stats'|'settings'|'recordings'|'recovery'|'legacy-tools';
  loadState: LoadState;
  preferences?: PreferencesView;
  stats?: StatsSummary;
  onSectionChange(section): void;
  onPreferenceChange?(change: Partial<PreferencesView>): void;
  onOpenRecovery?(): void;
  onOpenLegacyTool?(id): void;
  onRetry(): void;
}
```
Profil mengarahkan ke Stats/Settings/Recordings/Recovery/Legacy tools. Recovery dan peralatan lama tetap dapat ditemukan untuk kompatibilitas Windows, bukan menu utama. `stats` hanya menampilkan angka yang diberikan 1a; tidak menghitung XP/lulus sendiri. `PreferencesView` memakai `Preferences` dari `contracts.ts` tanpa `version`.

## Keadaan kosong/gagal (ringkasan)

| Keadaan | Komponen | Perilaku |
| --- | --- | --- |
| Belum ada progres/unit | `EmptyState` di `TodayPage` | Ajak mulai U1; tanpa contoh Unit 4 |
| Belum ada catatan | `EmptyState` di `NotesPage` | Tombol "Buat catatan" |
| Kategori Jelajah kosong | `EmptyState` di `ExplorePage` | Reset filter / buka kategori lain |
| Bank tidak cukup | `EmptyState`/pesan inline (slot 2a) | "Checkpoint belum siap", materi tetap tersedia; tanpa skor fiktif |
| Audio tidak ada/gagal | `AudioButton.status` | Teks contoh tetap tampil; retry; bukan jawaban salah |
| Simpan gagal | `SaveStatus` / `ErrorState` | Buffer tetap, tombol retry identitas sama |
| Bootstrap/seed gagal | `ErrorState` (1a menampilkan lewat komposisi) | Retry aman + akses backup; tidak reset |
| Sumber catatan berubah | `NoteItemData.orphaned` | Label "Bagian sumber berubah", catatan tidak dihapus |

## Revisi Putaran 2 (19 Nov 2026)

- `ExplorePage` → `Bacaan`: cuplikan memakai `BookPreview entering` (bukan `div.book-preview-wrap`), sehingga `.book-preview[data-entering]` hadir saat sampul Im Café diklik. Lead contoh "Ich möchte einen Kaffee, bitte."; `eyebrow="Cuplikan"`.
- `TodayPage`: `secondaryAction?: { label; onClick }` diteruskan ke `SessionCard.secondary` dan ditampilkan juga saat `agenda === null` (pintasan Unit 4 Pelajaran 2 untuk 1a/QA).
- `.cover-label` pada sampul: teks `#12265c` di atas latar `#ffffff` (kontras ≈ 14,3:1, naik dari ~1,8:1), berlaku juga pada tema gelap. Tidak mengubah gambar sampul.
- Label rute lama yang dikenali QA: `SRS` (TodayPage lewat adapter), `Kurikulum A1` (TodayPage), `Latihan` + pintasan selalu tampil `Drill D1–D10`/`Uji A1 · Uji Tiruan` (ExplorePage), `Statistik`/`Pengaturan`/`Backup & Pemulihan data` (ProfilePage), `Catatan` (tab Shell). Verifikasi DOM preview: 9/9 istilah ditemukan, `.book-preview[data-entering=true]` hadir, 0 console error.

## Mandat Migrasi 100% (19 Nov 2026)

- `BookItemData` memiliki `lead?: string` dan `level?: LevelCodeView`; `UnitItemData` memiliki `level?` (badge A1/A2/B1/B2, fallback dari `meta`); tipe baru `VocabularyItemData` untuk 2.134 kata.
- `ExplorePage` menerima seluruh aset dari 1a: 42 unit (grid + badge), 67 buku (lead dinamis di `.book-preview`), kosakata dengan pencarian + paginasi 150 + tombol SRS, dan tautan latihan lengkap.
- `TodayPage`, `NotesPage`, `ProfilePage` tetap murni presentasional dan siap menerima data nyata 1a, termasuk Pemulihan & Peralatan lama (termasuk label `Backup`).
- Preview memiliki alat "Simulasikan beban penuh: 42 unit / 67 buku / 2134 kata" (fixture lokal, bukan data produksi) untuk memeriksa kapasitas tampilan. Hasil verifikasi browser: 42 unit + 4 badge level, 67 buku, `lead` buku ke-60 = "Kalimat pembuka 60", "Menampilkan 150 dari 2134 kata", `scrollWidth == clientWidth` pada lebar 985 px dan pada simulasi 900 px, 0 console error.

## Verifikasi yang dijanjikan 4a

- `pnpm exec tsc --noEmit --incremental false`
- `node scripts/test_klab_frontend.cjs` (guard isolasi preview tetap lulus)
- `pnpm exec vite build --config vite.frontend.config.ts`
- Bukti dan batas tercatat di `outputs/migrasi-klab-windows-2026-11-19/agent-4a.md`.

Bukti browser/paritas/installer tetap milik 3a. 4a tidak menandai fidelity visual final lulus tanpa comparison manusia dan aset produksi.
