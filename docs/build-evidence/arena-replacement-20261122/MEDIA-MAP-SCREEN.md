# Peta aset per layar (bukti render)

Diambil dari aplikasi hasil build (`next start`, port pratinjau) dengan profil uji baru `Peta Layar` (avatar `player-02`).
Setiap bab dibuka dari peta perjalanan, lalu dijalankan sampai tokoh pertama muncul di panggung;
latar & tokoh dibaca dari elemen panggung dan dicek `naturalWidth > 0` serta tidak ada HTTP >= 400 untuk `/media/**`.

## prolog

- Panggung: ← Peta PROLOG Surat untuk Siapa? 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/bg/kamar.jpg`, `/media/bg/jendela.jpg`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-prolog.jpg`

## bab-01

- Panggung: ← Peta BAB 1 Tanda Cangkir 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/bg/kamar.jpg`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-01.jpg`

## bab-02

- Panggung: ← Peta BAB 2 Jam yang Terlipat 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u02-jadwal.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-02.jpg`

## bab-03

- Panggung: ← Peta BAB 3 Foto Keluarga 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/bg/jalan.jpg`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-03.jpg`

## bab-04

- Panggung: ← Peta BAB 4 Meja untuk Tiga 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/bg/jalan.jpg`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-04.jpg`

## bab-05

- Panggung: ← Peta BAB 5 Jaket Biru 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u05-toko.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-05.jpg`

## bab-06

- Panggung: ← Peta BAB 6 Kunci Lindenstraße 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/bg/pintu.jpg`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-06.jpg`

## bab-07

- Panggung: ← Peta BAB 7 Peta Bertanda Silang 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u07-kota-arah.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-07.jpg`

## bab-08

- Panggung: ← Peta BAB 8 Hari Pertama 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u08-hari-kerja.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-08.jpg`

## bab-09

- Panggung: ← Peta BAB 9 Catatan Dokter 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u09-klinik.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-09.jpg`

## bab-10

- Panggung: ← Peta BAB 10 Sabtu di Kolam 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u10-renang.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-10.jpg`

## bab-11

- Panggung: ← Peta BAB 11 Peron Tiga 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u11-stasiun.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-11.jpg`

## bab-12

- Panggung: ← Peta BAB 12 Surat dari Kamu 2 · Belajar Suara nyala Catatan Riwayat
- Latar: `/media/scenes/u06-rumah.webp`
- Tokoh: `/media/actors/tutor.webp`, `/media/actors/tutor-open.webp`
- Tangkapan layar: `screens/screen-bab-12.jpg`

Berkas media yang gagal dimuat: **0** (nol)

## Bukti identitas tokoh (semua 21 pemeran)

`20-cast-semua-tokoh.jpg` adalah montase tangkapan layar asli dari setiap kemunculan tokoh
(dibuka dari checkpoint tiap bab, bukan render ulang aset). Ringkasan yang terlihat:

| id | nama di layar | peran | berkas aktor | bingkai mulut |
| --- | --- | --- | --- | --- |
| tutor | Frau Lehmann | Pendampingmu | `tutor` | ada |
| mia | Mia | Tetangga sebelah | `mia` | ada |
| pos | Petugas Pos | Pengantar surat | `pos` | ada |
| tetangga | Herr Brandt | Tetangga | `tetangga` | ada |
| kaya | Frau Kaya | Penjaga gedung | `penjaga-buku-ch01` | ada |
| aydin | Herr Aydın | Penjual di pasar | `penjual-pasar` | ada |
| demir | Frau Demir | Pembeli di pasar | `penjual-mandiri-ch02` | ada |
| helga | Oma Helga | Nenek Mia | `pemilik-foto-ch03` | ada |
| stefan | Onkel Stefan | Paman Mia | `kerabat-ch03` | tidak ada di repo (tetap diam) |
| jonas | Jonas | Teman serumah Mia | `tamu-kafe-ch04` | tidak ada di repo (tetap diam) |
| lena | Lena | Barista Café Linde | `barista` | ada (`speaking.png`) |
| sommer | Frau Sommer | Pramuniaga | `penjual-pakaian` | ada |
| timo | Timo | Kasir | `kasir` | ada |
| eva | Eva | Pemilik kamar | `eva` | ada |
| marek | Marek | Pelancong | `tamu-kota` | ada |
| vogel | Frau Vogel | Rekan kerja | `rekan-panitia` | ada |
| yilmaz | Frau Yılmaz | Resepsionis praktik | `petugas-praktik` | ada |
| wagner | Herr Wagner | Apoteker | `apoteker` | ada |
| kim | Kim | Pengurus klub renang | `petugas-klub` | ada |
| richter | Frau Richter | Petugas stasiun | `petugas-stasiun` | ada |
| karim | Karim | Tetangga baru | `pendatang-baru` | ada |

Catatan identitas: paket menyebut “tamu kafe bab 4” untuk Jonas dan “kerabat bab 3” untuk
Onkel Stefan; di repo aset itu adalah potret orang yang sama yang dipakai paket, jadi
pemetaannya dipertahankan apa adanya (tidak menukar tokoh antar-bab).
Berkas `-open` hanya dibuat untuk pemeran yang di `cast.ts` punya `open: true`; untuk
`jonas` dan `stefan` tidak ada bingkai mulut, sehingga animasi bicara tidak dipaksakan
(memakai `actorUrl(...)` yang mengembalikan berkas yang sama).
