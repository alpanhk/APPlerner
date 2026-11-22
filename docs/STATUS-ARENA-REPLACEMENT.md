# Status Penggantian Total — Arena (Next.js)

Tanggal: 2026-11-22 · Cabang kerja: `arena/fc58e5ee-applerner` (dari `883543b` di `arena/ff65eef5-applerner`).
`main` dan PR #4 (`arena/ff65eef5-applerner`) dipertahankan sebagai riwayat — tidak di-merge,
tidak dihapus. PR penggantian ini dibuka sebagai **draft terpisah** untuk review.

## 1. Verifikasi lampiran

Lampiran: `Lernen-Arena-Sumber-Aplikasi-6f18aba7.txt` (350446 byte).
Data di antara `BEGIN LERNEN ZIP` dan `END LERNEN ZIP` didekode Base64 (spasi/baris baru diabaikan):

- Byte ZIP: **255804 byte**
- SHA-256: `6f18aba7b901e737cc11385148ca0b7cdde1f878061af28abc219577150da1de` ✅ cocok
- Berkas di dalam ZIP: **50 berkas** (66 entri termasuk direktori) ✅ cocok
- Nama arsip: `refining-applerner-material-consistency.zip`

Isi ZIP menjadi aplikasi utama di root: Next.js (layar Title/Journey/Play/Result,
`globals.css`, mesin cerita, evaluator, DSL, prolog + 12 bab A1, API dan skema
Drizzle/PostgreSQL). Perintah `dev`/`build`/`preview` di root mengarah ke aplikasi
ini. Source ZIP tidak dijadikan demo kedua dan tidak dipasang sebagai skin baru di Vite.

## 2. Struktur setelah penggantian

| Lokasi | Isi |
|---|---|
| Root (`src/`, `package.json`, `next.config.ts`, …) | Aplikasi Next.js dari ZIP (50 berkas, plus `drizzle.config.ts`, `scripts/preview-db.mjs`, `scripts/migrate-legacy.mjs`, `.env.example`) |
| `legacy/vite-tauri/` | Aplikasi Vite/Tauri lama utuh: `src/`, `src-tauri/`, `public/a1-story|audio|klab|media/samples|media/themes|media/scenes`, `index.html`, `vite*.config.ts`, `tsconfig*.json`, `package.json`, `pnpm-lock.yaml`, `scripts/`, `frontend-preview/`, `README.md` |
| `public/media/` (root) | Aset runtime aplikasi baru (lihat §3) |
| `docs/`, `PRD-*.md`, `GLOSSARY.md`, `all-readings.txt`, `arena-pilot/`, `outputs/` | Sumber materi dan riwayat — dipertahankan di root untuk kelanjutan A1–B2 |

Pemindahan memakai `git mv` agar riwayat Git tetap tertaut. Tidak ada database
pengguna yang dihapus; tidak ada deploy publik.

Perubahan kecil terhadap ZIP (agar dapat dijalankan dengan aman):

- `package.json`: nama `lernen`, skrip `preview`/`audit`/`db:push`/`preview:db`/
  `migrate:legacy`, devDeps `tsx` (untuk `scripts/audit.ts`) dan
  `embedded-postgres` (Postgres terisolasi untuk preview). UI, teks, ritme cerita,
  dan navigasi paket tidak diubah.
- `drizzle.config.json` (berisi URL hardcoded `postgres:postgres@127.0.0.1:5432`)
  diganti `drizzle.config.ts` yang membaca `DATABASE_URL` dari environment.
  Rahasia tidak dimasukkan ke Git; lihat `.env.example`.
- `next.config.ts`: tambah `allowedDevOrigins: ["*.e2b.app"]` agar pratinjau live
  Arena dapat mengakses dev server. Di produksi, hapus bila tidak diperlukan.
- `.gitignore`: tambah pengabaian Next (`.next/`, `out/`, `.env*.local`, …).

## 3. Pemetaan media (paket tidak menyertakan `public/media`)

ZIP merujuk aset lewat `src/lib/media.ts`:

- `bgUrl(bg)`: `kamar|jendela|jalan|pintu|judul` → `/media/bg/<bg>.jpg`,
  selain itu → `/media/scenes/<bg>.webp`
- `actorUrl(id, avatar, open)`: `/media/actors/<base>.webp` dan
  `/media/actors/<base>-open.webp` (bingkai mulut terbuka)

Semua rujukan dipetakan ke aset benar dari repo dengan identitas tokoh konsisten
(`src/story/cast.ts` tidak diubah):

| Rujukan ZIP | Sumber di repo | Hasil di root |
|---|---|---|
| `/media/bg/kamar.jpg`, `jendela.jpg`, `jalan.jpg`, `pintu.jpg`, `judul.jpg` | `public/media/bg/*.jpg` (sudah benar) | tetap di `public/media/bg/` |
| `/media/scenes/u01-perkenalan.webp` … `u12-telepon-pesan.webp` (13 adegan, dipakai sebagai `bg` dan `cover`) | `src/arena/assets/scenes/*.webp` (salinan identik `public/media/scenes/<nama>/scene.webp`) | `public/media/scenes/<nama>.webp` |
| `/media/actors/<img>.webp` (21 pemeran + 4 avatar pemain) | `public/a1-story/actors/<img>/neutral.png` | `public/media/actors/<img>.webp` (konversi ImageMagick, quality 85) |
| `/media/actors/<img>-open.webp` | `talk-open.png` (umum), `speak-open.png` (player-01/02), `speaking.png` (barista) | `public/media/actors/<img>-open.webp` |

Catatan identitas:

- `jonas` (`tamu-kafe-ch04`) dan `stefan` (`kerabat-ch03`) tidak memiliki bingkai
  terbuka di sumber maupun di `cast.ts` (`open` tidak diset) — `actorUrl` tidak
  pernah meminta `-open` untuk keduanya. Tidak ada berkas `-open` untuk mereka,
  dan itu benar.
- `flip: true` (`kaya`, `aydin`) adalah pembalikan CSS di `Play.tsx`, bukan aset
  terpisah.
- Props (`note`/`letter`/`envelope`/`sign`/`ticket`/`phone`) adalah overlay CSS
  di `globals.css`, bukan berkas gambar — tidak ada aset props yang diperlukan.

Verifikasi: semua `bg`/`cover` (17 nilai) dan semua `img` pemeran (21 nilai)
terdaftar di atas terkonfirmasi ada di disk; bingkai `-open` terkonfirmasi ada
untuk semua pemeran yang `open: true` plus keempat avatar pemain.

## 4. Suara: sintetis vs rekaman berizin

Aplikasi baru memakai **suara sintetis saja** (sesuai ZIP, tidak diubah):

- Kalimat Jerman dibacakan `speechSynthesis` peramban (`speak()` di
  `src/lib/media.ts`, `lang="de-DE"`, rate 0.88).
- Efek bunyi (`knock`/`door`/`bell`/`paper`/`tram`/`ring`) disintesis WebAudio
  (`playSfx()`), tanpa berkas audio.

Rekaman berizin dari repo **dipertahankan tetapi belum dihubungkan** (agar preview
setia pada ZIP):

- `legacy/vite-tauri/public/a1-story/audio/` — 759 klip tuturan baru + 1 rujukan
  terverifikasi (Supertonic 3 + Piper; barista merujuk M-AILABS via Eva K;
  lihat `README.md` dan `SUPERTONIC-LICENSE.txt` di folder itu). Izin distribusi
  publik barista perlu diperiksa sebelum rilis.
- `legacy/vite-tauri/public/audio/` — ambience, cue, pratinjau, tuturan lama.

Menghubungkan rekaman ke `media.ts` adalah pekerjaan lanjutan yang disengaja
tidak dilakukan di penggantian ini (prioritas: preview setia, dapat dimainkan,
dapat ditinjau). Saat dihubungkan, suara sintetis dan rekaman harus dibedakan
jelas di UI/dokumentasi.

## 5. Database: Postgres terisolasi untuk preview

- Skema: `src/db/schema.ts` (`profiles`, `chapter_progress`, `attempts`).
  `src/db/index.ts` membaca `DATABASE_URL` dari environment dan melempar error
  bila tidak ada.
- Preview terisolasi: `npm run preview:db` (`scripts/preview-db.mjs`) menyalakan
  Postgres tertanam (`embedded-postgres`, biner dari npm — tanpa apt/Docker)
  di port **5433**, direktori data `/tmp/lernen-preview-pg-data`, dan mencetak
  `DATABASE_URL`. Terapkan skema dengan `npm run db:push`.
- Tidak ada rahasia di Git. `.env.example` hanya berisi contoh lokal.
- Draf dan bukti dipisahkan per pemain: `chapter_progress` (checkpoint terakhir
  per profil+bab, `state` = Game JSON, `notes` = buku catatan) dan `attempts`
  (bukti kalimat per profil). Profil yang dikenal perangkat disimpan di
  `localStorage` (`lernen.profiles`/`lernen.active`) — ganti profil tidak
  mencampur draf/bukti antar pemain.

## 6. Data lama: migrasi yang dapat diuji

Aplikasi lama memakai SQLite `lernen.db` (Tauri `plugin-sql`) dengan skema
`decks/entries/cards/srs_state/attempts/drills/lesson_progress/texts/reading_log/
progress_daily/saved_from_chat/config/lesson_drafts` dan backup JSON
`lernen-backup` v1. Skema baru tidak 1:1, sehingga migrasi otomatis penuh tidak
dilakukan (dan tidak memalsukan bukti).

`scripts/migrate-legacy.mjs` menyediakan migrasi konservatif:

- Membuat satu profil baru dari backup, mengimpor `lesson_progress` (unit 1–12)
  hanya sebagai status `selesai`/`aktif` di `chapter_progress` (`state=null`).
- TIDAK mengimpor SRS, drafts, teks bacaan, atau attempts lama (tidak ada
  pemetaan jujur ke bukti kalimat baru). Semua tetap ada di file backup dan
  `legacy/vite-tauri/`.
- File backup tidak diubah; DB lama tidak dihapus.

Uji dengan salinan sintetis (tidak menyentuh data pengguna):

```bash
node scripts/migrate-legacy.mjs --synthetic-test
# dengan DB terisolasi:
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db node scripts/migrate-legacy.mjs --synthetic-test
```

## 7. Status Windows/offline dan cakupan A2–B2

- **Windows/offline (aplikasi baru):** Next.js + Postgres memerlukan Node ≥20 dan
  Postgres yang dapat dijangkau (lokal atau remote). Ini **bukan** aplikasi
  desktop offline-first seperti Tauri lama. Font Google (Fraunces/Nunito Sans/
  Caveat) dimuat lewat `<link>` di `layout.tsx`; bila offline, peramban memakai
  font sistem cadangan (serif/sans/cursive) — cerita tetap berjalan. Suara
  sintetis memerlukan `speechSynthesis`/`AudioContext` peramban; bila tidak
  tersedia, cerita tetap berjalan (lihat `media.ts`).
- **Windows/offline (aplikasi lama):** Tauri 2 + SQLite offline-first tetap
  tersedia utuh di `legacy/vite-tauri/` (prasyarat WebView2, MSVC Build Tools,
  Rust — lihat `legacy/vite-tauri/README.md`).
- **Cakupan aktual aplikasi baru: A1 saja** — prolog + Bab 1–12
  (`src/story/chapters/`). A2–B2 **belum ada** di aplikasi baru dan masih
  bergantung fitur lama: materi A2–B2, SRS, drills, bacaan, dan generator konten
  ada di `legacy/vite-tauri/src/data/`, `src/lessons/`, `src/drills/`,
  `src/reading/`, `src/srs/`, `scripts/` (generator), `docs/`, `PRD-*.md`,
  `GLOSSARY.md`, `all-readings.txt`, dan `arena-pilot/`. Sumber-sumber itu
  dipertahankan untuk kelanjutan A1–B2; jangan dihapus.

## 8. Bukti build ini

Semua dijalankan dari root pada build ini; berkas bukti di
`docs/build-evidence/arena-replacement-20261122/`.

| Berkas | Isi |
|---|---|
| `SHA-VERIFICATION.txt` | verifikasi SHA-256 lampiran & isi ZIP (255804 byte, 50 berkas) |
| `AUDIT.txt` | `npm run audit` — 13 bab, konsistensi lima langkah, simulasi tamat semua bab |
| `BUILD.txt` | `npm install` + `npm run build` (rute `/`, `/pola`, 6 API) |
| `TYPECHECK.txt`, `LINT.txt` | `tsc --noEmit` bersih; ESLint 0 error (12 peringatan `no-img-element` sesuai ZIP) |
| `API-BROWSER-CHECK.txt` | entri root, `/pola`, health/audit, semua URL `/media/**` 200, alur API profil/checkpoint/attempt + isolasi & validasi |
| `BROWSER-INTERACTION.txt` | uji browser nyata (Chromium headless) desktop 1280×900 dan layar kecil 390×844 |
| `MEDIA-MAP.txt` | pemetaan disk: 17 latar + 21 pemeran + 4 avatar, termasuk bingkai `-open` |
| `MEDIA-MAP-STORY.md` | aset yang benar-benar dirujuk mesin cerita per bab (17 latar, 0 hilang) |
| `MEDIA-MAP-SCREEN.md` | aset yang benar-benar dirender per bab + identitas 21 tokoh di layar |
| `MIGRATE-SYNTHETIC.txt` | migrasi konservatif diuji dengan backup sintetis (tanpa menyentuh data pengguna) |
| `screens/` | 21 tangkapan layar alur (desktop + layar kecil), 13 layar panggung per bab, montase 21 tokoh |

Alur yang diuji di browser (bukan hanya API): buat profil → pilih avatar → prolog →
bantuan bertingkat (petunjuk 1→2→3) → jawaban salah lalu revisi → interaksi NPC →
buku catatan → Result ("Yang kamu buktikan") → lanjut ke Bab 1 → kembali ke peta →
reload (langsung ke peta pemain, checkpoint utuh) → lanjutkan cerita → profil kedua
(draf & bukti terpisah) → kembali ke pemain pertama → layar kecil 390×844
(tanpa overflow horizontal, laci jurnal 359 px).

## 9. Kekurangan yang diketahui

- **Cakupan bahasa masih A1** (prolog + 12 bab). A2–B2 belum ada di aplikasi baru;
  materi/sumbernya masih di `legacy/vite-tauri/`, `docs/`, `PRD-*.md`, `GLOSSARY.md`,
  `all-readings.txt`, `arena-pilot/`.
- **Suara masih sintetis** (`speechSynthesis` de-DE + WebAudio). 759 rekaman berizin di
  `legacy/vite-tauri/public/a1-story/audio/` belum dihubungkan; izin distribusi klip
  barista (M-AILABS via Eva K) perlu diperiksa sebelum rilis publik.
- **Tidak offline-first**: butuh Node ≥20 + Postgres. Tauri/SQLite offline tetap ada di
  `legacy/` untuk pengguna desktop Windows.
- **Font Google** (Fraunces/Nunito/Caveat) dimuat dari jaringan; offline jatuh ke font
  sistem. Di sandbox pratinjau, `fonts.googleapis.com` diblokir sehingga tangkapan layar
  memakai font cadangan.
- **Kedua tokoh tanpa bingkai mulut** (`jonas`, `stefan`) tidak beranimasi bicara karena
  repo tidak punya `*-open` untuk mereka.
- **Migrasi lama bersifat konservatif**: SRS, drills, teks bacaan, dan attempts lama tidak
  dipindahkan (tidak ada pemetaan jujur) — hanya status `lesson_progress`.
- **Rekaman layar/video belum dibuat**; bukti berupa tangkapan layar + log uji.
