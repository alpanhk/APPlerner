# Identitas kandidat pilot v1.6 — 21 Nov 2026

## Keputusan satu entry point

Sumber kandidat yang direproduksi dan di-QA adalah **working tree** `lernen-app`, bukan commit `fec2d7a`.

```
src/main.tsx  →  src/DesktopEntry.tsx  →  src/arena/App.tsx  (+ src/klab/StoryPage.tsx)
```

`src/klab/novel/**` adalah modul acuan/tidur. Satu-satunya suntingan ke sana pada putaran ini adalah sinkronisasi `engine/evaluate.ts` agar aturan penilaian identik; modul itu **bukan** entry yang dijalankan.

## Bukti sumber aktif

- `src/main.tsx` (working tree): `import App from "./DesktopEntry"` — 9 baris.
- `src/DesktopEntry.tsx`: `import Arena from "./arena/App"`, fallback `Desktop` ("Materi A1–B2") lewat `onDesktop`.
- QA `d805a8fc…` merekam U01 Lulus: layar judul Arena dan tombol *Mulai cerita* muncul dari peluncuran normal. Ini hanya mungkin bila entry aktif = Arena.

## Perbandingan dengan checkout bersih `fec2d7a`

`git show fec2d7a:src/main.tsx` memuat `NovelRoot` → `NovelApp` dari `./klab/novel/App` + `LegacyApp` dari `./App`. Itu **implementasi visual novel lain**, bukan modul `src/arena/**` yang di-QA. Perbedaan bersifat substansial (komponen, aset, dan jalur data berbeda), bukan sekadar perubahan lokal kecil.

| Aspek | Working tree (kandidat QA) | `fec2d7a:src/main.tsx` |
|---|---|---|
| Entry | `DesktopEntry` → `arena/App` | `NovelRoot` → `klab/novel/App` |
| Cerita | `src/klab/StoryPage.tsx` (story.json sinkron) | `src/klab/novel/**` |
| Status | Pernah di-QA U01 (d805a8fc) | Tidak pernah di-QA putaran ini |

Kesimpulan: untuk kandidat revisi R2 dan update GitHub, **gunakan `src/main.tsx` working tree**. Jangan mengambil `src/main.tsx` dari `fec2d7a`.

## Perubahan lokal di atas checkout bersih

- `src/main.tsx`: diganti dari `NovelRoot` ke `DesktopEntry` (perubahan lokal, sudah ada sebelum audit).
- Perbaikan QA-V16: 279 aset VP8L→PNG + referensi, `avatar-hallo` di media-manifest, tombol *Dengar suara*/*Latih keterampilan*, `StoryPage` sinkron, tombol *Peron berubah*.
- Perbaikan audit v1.7: `objectiveLevel` tidak lagi mengklaim "mandiri" dari nama saja; `conversationSucceeded` ditambahkan di `src/arena/engine/evaluate.ts` dan disinkronkan ke `src/klab/novel/engine/evaluate.ts`.

## Identitas build

- Kandidat gagal: `outputs/pilot-lernen-v16/kandidat-qa/lernen-app-qa.exe` — SHA `d805a8fcde6c195a7e07a589a41a349b299095dbb2fe5ff45c58cb20b058f390`.
- Kandidat revisi: `outputs/pilot-lernen-v16/kandidat-r2/lernen-app-qa.exe` — SHA menyusul setelah build selesai; akan dicatat di sini dan di `HANDOFF-INTEGRATOR.md`.

Status keberhasilan tidak dinaikkan; target >80% tetap menunggu kohor peserta dan protokol §4.
