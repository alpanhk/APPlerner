# Lernen — belajar bahasa Jerman lewat cerita (A1)

Novel visual berbasis Next.js + PostgreSQL. Dibangun ulang dari cabang `arena` repo APPlerner dengan satu tujuan:
**setiap bab membawakan materi seperti prolog.**

> **Penggantian total basis aplikasi (Arena).** Root repo ini sekarang adalah aplikasi
> Next.js dari paket `refining-applerner-material-consistency.zip`
> (SHA-256 `6f18aba7b901e737cc11385148ca0b7cdde1f878061af28abc219577150da1de`,
> 255804 byte, 50 berkas). Aplikasi Vite/Tauri lama dipindahkan utuh ke
> `legacy/vite-tauri/` (tidak dihapus; `main` dan PR #4 tetap sebagai riwayat).
> Detail penggantian, pemetaan media, status Windows/offline, dan cakupan A2–B2 ada di
> `docs/STATUS-ARENA-REPLACEMENT.md`. Perintah `dev`/`build`/`preview` di root mengarah
> ke aplikasi Next.js ini — bukan skin baru di Vite.

## Menjalankan (preview terisolasi)

```bash
npm install
npm run preview:db          # Postgres tertanam di port 5433 (terminal 1, biarkan berjalan)
# terminal 2:
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db
npm run db:push
npm run dev                 # http://localhost:3000
```

Untuk build produksi:

```bash
export DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db
npm run build
npm run preview             # next start
```

`DATABASE_URL` dibaca dari environment (lihat `.env.example`). Jangan memasukkan
rahasia ke Git. Kredensial `postgres:postgres` di atas hanya untuk preview lokal
terisolasi.

## Masalah yang diperbaiki

Di versi sebelumnya hanya prolog yang mengajar dengan rapi. Bab 1 dan 2 langsung menguji tanpa mengajar, teks
Indonesia ditandai sebagai Jerman, beberapa giliran menerima jawaban apa pun, dan ada tautan node yang putus.
Bab 3–8 ditulis sebagai komponen terpisah dengan alur masing-masing.

## Pola Prolog

Prolog mengajar dengan lima langkah. Lima langkah itu kini menjadi cetakan di `src/story/dsl.ts`:

| # | Langkah | Cetakan | Isi |
|---|---------|---------|-----|
| 1 | Tiba | `opening()` | Narasi + benda berbahasa Jerman yang diperiksa pemain |
| 2 | Belajar | `lesson()` | Frau Lehmann memodelkan, memberi kiat, lalu latihan terbimbing |
| 3 | Bertemu | `encounter()` | Kalimat yang sama dipakai kepada tokoh; tokoh bereaksi dalam bahasa Jerman |
| 4 | Menjelajah | `hub()` | Pertemuan pilihan (ulangan bab lama) + misi utama yang berkelok |
| 5 | Temuan | `payoff()` | Benda cerita yang menarik ke bab berikutnya |

Penulis materi tidak menulis node. Ia mengisi cetakan, dan cetakan menjamin petunjuk tiga tingkat
(makna → awal kalimat → contoh lengkap), tombol „Minta bantuan Frau Lehmann“, pilihan mengulang penjelasan,
serta pencatatan bukti. Prolog sendiri ditulis ulang lewat cetakan yang sama.

## Menambah bab

1. Salin salah satu berkas di `src/story/chapters/` dan ubah isinya.
2. Daftarkan di `src/story/chapters/index.ts`.
3. Jalankan `npm run audit`.

Auditor (`src/story/audit.ts`, juga tampil di `/pola` dan `/api/audit`) menolak bab yang:
menguji sebelum mengajar, tidak punya pertemuan nyata untuk suatu tujuan, contoh lengkapnya tidak diterima
gilirannya sendiri, kepingan katanya tidak cukup, kalimat Jermannya tanpa arti, atau alurnya putus.

## Pola jawaban

Setiap giliran menulis polanya sendiri (`src/story/match.ts`):

- `ich komme aus ~` — `~` = satu sampai empat kata bebas
- `ich heisse {name}` — `{name}` = nama pemain
- `(guten )?morgen`, `(ein|eine)` — kurung, `|`, dan `?` seperti regex

Huruf besar, tanda baca, ß, dan umlaut diseragamkan (`moechte` = `möchte`). Jawaban yang hampir benar mendapat
umpan balik khusus: salah urutan atau salah eja.

## Penilaian

Hanya kalimat yang ditulis pemain yang dihitung. „Mandiri“ = kalimat utuh kepada tokoh, tanpa petunjuk
(`src/story/evaluate.ts`). Latihan bersama Frau Lehmann tercatat, tetapi tidak dihitung sebagai bukti mandiri.

## Data

Tabel `profiles`, `chapter_progress`, dan `attempts` (`src/db/schema.ts`). Terapkan dengan `npm run db:push`.

Migrasi konservatif dari backup SQLite lama tersedia di `scripts/migrate-legacy.mjs`
(lihat `docs/STATUS-ARENA-REPLACEMENT.md`). Skrip itu tidak memalsukan bukti dan
tidak menghapus data lama.
