# Kontrak runtime integrasi KLAB — 19 November 2026

**ID:** KLAB-WINDOWS-20261119 · **Pemilik kontrak:** Agent 1a (integrasi produksi dan data).
Mandat: `mandat-migrasi-klab-2026-11-19.md`. Kontrak ini mengikat 1a/2a/4a/3a agar
potongan parallel dapat disatukan tanpa saling menimpa.

## 1. Cutover entry produksi (milik 1a)

`src/App.tsx` adalah composition root tunggal. Urutan bootstrap **tidak berubah** dari
kandidat 09: `initializeDatabase()` (seed idempotent → `PRAGMA integrity_check`),
`startStudyClock`, preferensi/audio onboarding, `maybeAutoBackup`, dan `FatalDatabase`
jika integritas gagal. Perubahan hanya pada lapisan presentasi dan navigasi:

```
App -> klab/Shell (4a) -> RouteView (1a registry) -> [4a tab view | 2a feature view | runner lama]
```

- `src/app/bootstrap.ts` — `initializeDatabase(): Promise<string>`; melempar error integritas yang sama.
- `src/app/navigation.ts` — `navigation` (dari `src/klab/navigation`, milik 4a), `pageForRoute`,
  `installNavBridge()`, `persistLastRoute`, `loadLastRoute`. Jembatan `useNav` lama dua arah
  dengan guard loop; `setPage`/`startDrill` lama tetap berfungsi.
- `src/app/sessionRegistry.ts` — `loadContinueTargets()` menghasilkan kartu "Lanjutkan belajar"
  dari `lesson_drafts` nyata (`lernen_lesson_U_L`, `checkpoint_session:U`), bukan fixture.
- `src/app/routeView.tsx` — registry dan fallback. Tidak ada rute buntu: fitur lama tetap
  dirender lewat runner/halaman produksi sampai 2a/4a mendaftarkan penggantinya.
- Impor `./App.css` dan `./klab/tokens.css` keduanya dipertahankan; token lama masih dipakai
  halaman transisi.

## 2. Rute dan back

Rute memakai `src/klab/routes.ts` (milik 4a) apa adanya — **jangan** menambah router/library baru.
Route session menyimpan **`sessionId` saja**, bukan soal/jawaban. `sessionId` berawalan
`resume:` berarti target berasal dari data tersimpan nyata di `lesson_drafts`.

Back: `navigation.getState().back()` dipakai oleh tombol "← Kembali" di ruang belajar dan
Alt+Left. Kembali dari sesi menangguhkan, bukan menghapus draft. `selectTab` memulihkan stack
tab terakhir. Rute terakhir yang tervalidasi ditulis ke `config.ui_navigation_v1`; kegagalan
tulis tidak memblokir belajar.

## 3. Kontrak untuk 2a (alur belajar)

Daftarkan layar fitur dari `src/app/routeView.tsx`:

```ts
registerFeatureView(name, Component);
// name: 'lesson'|'checkpoint'|'unit'|'drills'|'srs'|'reader'|'practice'|'exam'
```

Props wajib (`ViewProps`):

```ts
type ViewProps = {
  route: Route;                       // bawa sessionId, unitNo/lessonNo/kind/contentId
  navigate: (route: Route) => void;   // gunakan ini, jangan useNav.setPage langsung
  back: () => void;                   // satu aksi dengan tombol/Alt+Left
  targets: ContinueTarget[];          // posisi tersimpan nyata dari sessionRegistry
};
```

Aturan:
- `navigate`/`back` saja untuk berpindah; jangan memasang history kedua.
- Jawaban, draft, hasil → transaksi Rust/`lesson_drafts` yang sudah ada (`save_attempt_with_draft`,
  `save_checkpoint_result`) atau adapter 1a. Jangan menulis `app.lernen.desktop`.
- Jangan menampilkan skor/status fiktif. "Soal sejenis" hanya bila soal tambahan tersedia.
- Kor Unit 4 yang diminta mandat: materi → satu pilihan → koreksi → Mengapa einen? →
  contoh + WAV → kembali dengan jawaban dan fokus dipertahankan; jalur benar, audio gagal,
  checkpoint/remedial, dan rak Im Café → cuplikan → baca/dengar → kembali.

## 4. Kontrak untuk 4a (presentasional)

Daftarkan tampilan tab-root:

```ts
registerKlabView('today'|'explore'|'notes'|'profile', Component); // props = ViewProps di atas
```

- `Shell.tsx`, `tokens.css`, `Icon.tsx`, `Mascot.tsx`, `routes.ts`, `navigation.ts`, `contracts.ts`,
  `preview.tsx` tetap milik 4a; 1a hanya mengonsumsinya.
- Komponen 4a menerima data/state/status/callback; **tidak** mengimpor `localStorage`, `getDb`,
  `invoke`, grader, FSRS, atau aturan bank. `SaveStatus` hanya menampilkan `SaveState`.
- Aset gambar baru **hanya** lewat agen gambar yang diminta 4a kepada director. Tanpa Xfigura
  dan tanpa agen UI/UX Codex. Aset lokal prototipe boleh disalin ke `src/assets/klab/`.

## 5. Data dan pemulihan

- Identitas aplikasi dan data lama dipertahankan. Seed/migrasi v3, backup/restore, karantina
  payload invalid, attempt/draft/hasil tidak diubah oleh cutover.
- `sessionRegistry` hanya membaca envelope valid; payload rusak dilewati (mekanisme karantina
  P8 tetap berjalan di `persistence.ts`).
- Tidak ada reset/clean/pergantian branch/commit/push. QA memakai `app.lernen.qa.audio` atau
  salinan DB terisolasi; tidak menyentuh produksi.

## 6. Build dan QA (3a)

1. Tunggu sinyal stabilization 1a/2a/4a di hub.
2. `pnpm exec tsc --noEmit` harus 0 (termasuk file `src/klab/learning/**` milik 2a).
3. `node scripts/test_klab_cutover.cjs` (1a) + `node scripts/test_klab_learning.cjs` (2a)
   + tes frontend 4a + seluruh `scripts/test_*.cjs`.
4. `pnpm build` lalu build Tauri QA dengan `src-tauri/tauri.qa.conf.json`, profil terisolasi.
5. Uji entry produksi: Hari Ini → Unit 4 → latihan/koreksi → kembali, jalur bacaan, dan
   seluruh rute lama dapat dijangkau. Screenshot 1280×800 dan 900×600, light/dark, reduced
   motion, keyboard, audio gagal, restart/retry, backup/restore.

## 7. Batas status

Cutover menghasilkan kandidat lokal. Publikasi/instalasi pada profil pengguna, telaah pengajar,
pilot, dan clean install tetap merupakan tindakan terpisah dengan bukti sendiri.
