# DATA-BERIKUTNYA — modul tidur clone persis (21 Nov 2026)

Entry aplikasi sekarang adalah `src/klab/novel/App.tsx` (tampilan referensi).
Modul lama **tidak dihapus**: tetap dikompilasi, tersimpan di repo, dan siap
diaktifkan lagi untuk pengembangan berikutnya. Tidak ada data SQLite yang
dihapus atau di-reset.

## Daftar modul tidur

| Domain | Path | Catatan |
|---|---|---|
| Shell 4 tab & rute produksi | `src/App.tsx` (`LegacyApp`), `src/klab/Shell.tsx`, `src/klab/routes.ts`, `src/klab/navigation.ts`, `src/app/navigation.ts`, `src/app/routeView.tsx`, `src/ui/pages.ts` | Seluruh UI Hari Ini/Jelajah/Catatan/Profil + Koleksi media. Tidak dirender dari `main.tsx`. |
| 67 materi & bacaan | `src/lessons/units.ts`, `src/klab/learning/logic.ts` (`allReadings`), `src/data/reading/**`, `src/data/seedLoader.ts`, `src/data/importWords.ts`, `src/data/pronunciation.ts` | 42 unit / 67 teks tetap di DB dan kode. |
| SRS / kartu | `src/srs/{cards,fsrs,queue,review,session,answers,tts}.ts`, `src/stores/nav.ts` | Antrean, FSRS, sesi ulang, TTS lama. |
| Statistik & waktu belajar | `src/stats/{dates,queries,studyClock}.ts` | `studyClock` masih dijalankan bootstrap entry baru agar data waktu tidak berhenti. |
| Catatan | `src/app/notesRepository.ts`, `src/klab/pages/NotesPage.tsx`, `src/klab/contracts.ts` (`Note`) | Tabel catatan tidak disentuh. |
| Backup / restore | `src/stores/backup.ts`, `src/app/bootstrap.ts` | `maybeAutoBackup()` masih dipanggil entry baru; jalur manual ada di `LegacyApp`. |
| Preferensi & progres UI | `src/app/preferencesRepository.ts`, `src/app/uiSettings.ts`, `src/app/novelProgress.ts`, `src/app/flowPersistence.ts`, `src/app/sessionRegistry.ts` | Tema, suara, reduced motion, posisi pelajaran. |
| Dialog dua tokoh & audio lama | `src/klab/learning/{CafeConversation,CafeDialog,CafeScene,LessonFlow,ReadingFlow,CheckpointFlow}.tsx`, `src/klab/learning/audio.ts`, `soundController.ts`, `src/assets/klab/cafe-cel/**` | Pertahankan kontrak U4 L2 bila diaktifkan lagi. |
| Koleksi media | `src/klab/pages/AssetCollectionPage.tsx`, `src/klab/mediaCollection.ts`, `src/app/mediaResolver.ts` | Resolver media referensi tetap dipakai entry baru. |

## Cara mengaktifkan lagi (tanpa menghapus clone)

1. Kembalikan entry di `src/main.tsx` menjadi `import App from "./App";` dan
   kembalikan `export function LegacyApp()` di `src/App.tsx` menjadi
   `export default function App()`.
2. Hapus atau ganti `import "./index.css"` pada entry referensi bila tema lama
   dipakai; namespace CSS referensi ada di `src/klab/novel/index.css`.
3. Modul tidur langsung dapat dipanggil lewat rute lama (`src/app/routeView.tsx`)
   — tidak ada migrasi data yang diperlukan karena semua memakai DB SQLite yang
   sama (`src/stores/db.ts`, tabel `config`, `lesson_progress`, `srs_state`, dll).
4. Untuk memakai bersama, daftarkan komponen lama sebagai panel tambahan di
   `NovelShell` (`src/klab/novel/App.tsx`) dengan tetap memakai
   `createNovelLocalStore` sebagai jembatan progres.

## Konsekuensi yang disengaja

- Layar utama tidak menampilkan 4 tab, Koleksi media, atau fitur latihan lama.
- Data tetap utuh: adapter `createNovelLocalStore` menulis ke `novelStore` →
  SQLite/config dengan kunci `novel.progress.v1` / `novel.settings.v1`.
- Status produk tetap `LAYAK BERSYARAT` sampai pilot manusia.
