# Desain ringkas: header kanan + pencarian kosakata melayang (2026-11-20)

Disetujui pengguna lewat konfirmasi "iya" dengan amandemen: pencarian kosakata memakai jendela terpisah dan melayang agar pengguna tetap bisa mengerjakan tugas sambil mencari.

## Maksud
1. Saat layar lebar/fullscreen, tombol tema dan menu navigasi berada di **kanan** jendela (bukan menumpuk di tengah).
2. Saat tab **Kosakata** aktif, bagian tengah header menampilkan search bar: keterangan **"Kosakata"** + kolom placeholder **"cari kata disini..."**.
3. Menekan/fokus pada search bar membuka **panel kosakata melayang** (modeless): tetap tampil saat pengguna berpindah tab/halaman, bisa digeser lewat bilah judul, bisa ditutup. Panel punya kolom pencarian sendiri + daftar hasil (DE–ID).

## Pendekatan yang dipilih
Panel melayang **di dalam jendela aplikasi** (`position: fixed`, z-index tinggi, modeless), bukan jendela OS-native baru. Alasan: satu WebView, tanpa izin/kapabilitas Tauri baru, tanpa perubahan Rust, dan tepat memenuhi "tetap bisa mengerjakan tugas sambil mencari". Jika kemudian diinginkan jendela OS yang bisa di-alt-tab, itu pekerjaan terpisah (WebviewWindow + capability + entry point baru).

Alternatif yang tidak dipilih:
- Search bar inline di bawah tab saja → hilang saat pindah halaman, tidak memenuhi.
- WebviewWindow native → lebih berat, menyentuh Rust/capability/entry point, risiko build lebih tinggi.

## Perubahan
- `src/klab/vocabPanelStore.ts` (baru): store zustand `{open, query, items, setItems, openPanel, closePanel, setQuery}` — diimpor Shell dan ExplorePage.
- `src/klab/pages/ExplorePage.tsx`: publikasikan `vocabulary` ke store saat tab Kosakata siap; tampilkan search bar tengah (keterangan "Kosakata", placeholder "cari kata disini...") yang membuka panel; tombol SRS & jumlah tetap.
- `src/klab/Shell.tsx`: render panel melayang (selalu terpasang agar survive pergantian rute); bilah judul "Kosakata" + tombol tutup + drag; daftar hasil dari store.
- `src/klab/shell.css`: header lebar penuh pada viewport >= 1100px → brand kiri, kontrol/ikon kanan.
- `src/klab/editorial.css`: gaya search bar tengah + panel melayang + daftar hasil; mengikuti tema terang/gelap.

## Kriteria terima
- [P] GUI: pada 1920×1080, ikon tema/menu berada di kanan atas.
- [P] Tab Kosakata: search bar tengah bertuliskan "Kosakata" dan placeholder "cari kata disini..."; mengetik menyaring daftar.
- [P] Panel melayang terbuka, bisa digeser, tetap tampil setelah pindah ke tab/halaman lain, dan menutup dengan tombol × / Esc.
- Regresi: CTA/SQLite U4 L2, fullscreen dialog, kontras dua tema, 0 proses QA, console.error=0.
- Status produk tetap `LAYAK BERSYARAT` sampai pilot manusia.

## Batas
Tanpa reset/clean/commit/push, paket pilot 21 Nov, profil peserta, Xfigura/agen gambar, stok aset baru, asisten lama. Build kandidat baru di `outputs/penyelesaian-windows/`; jangan timpa EXE terverifikasi.
