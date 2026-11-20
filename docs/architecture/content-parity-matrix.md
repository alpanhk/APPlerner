# Matriks Kesetaraan Konten A1-B2

**ID:** CONTENT-PARITY-MATRIX-20261117-01  
**Baseline:** CONTENT-PARITY-20261117-01  
**Dibuat:** 2026-11-17T18:18:16+07:00 oleh Agent 2  
**Data lengkap:** `docs/architecture/content-parity-matrix.json` (isi lengkap unit, pelajaran, tujuan, bank, kosakata, bacaan, praktik, ujian, audio).

## Ringkasan

| Area | Jumlah | Sumber | API/pemilik | Rute lama | Rute KLAB |
|---|---|---|---|---|---|
| Unit/pelajaran | 42 / 96 | units_a1-b2.json | units.ts | Kurikulum | explore.materials, unit, lesson |
| Tujuan A1 | 60 | a1_objectives.json | objectives.ts | Kurikulum > checkpoint | checkpoint + UnitRounds |
| Bank A1 | 300 | a1_unit1-12_bank.json | objectives.ts | Checkpoint/remedial | checkpoint |
| Kosakata seed | 2134 unik | words_*.json | seedLoader.ts -> entries | Kosakata/Membaca/SRS | explore.vocabulary |
| Bacaan | 67 | texts_*.json | seedLoader + texts.ts | Membaca | reader |
| Drill | D1-D10 | items.ts + d4-d10 | drills/items.ts | Drill | drills |
| Latihan | 5 dialog/10 soal, 5 tulisan, 4/30/39 percakapan | practice/*.json | Latihan.tsx | Latihan | practice |
| Uji A1 | 4 bagian | a1_mock_exam.json | UjiTiruan.tsx | Uji A1 | exam |
| Audio | 454 WAV / 453 frasa / 200 alias | tts_core | tts.ts | semua tombol audio | AudioService |

## Unit dan pelajaran

### A1 (12 unit, 36 pelajaran)

| Unit | Pelajaran | Tujuan unit | Sumber |
|---|---|---|---|
| 1 Salam & perkenalan diri | 1. Hallo! Ich heiße … (5 slide)<br>2. Woher kommen Sie? (5 slide)<br>3. Freunde & Alter (4 slide) | Menyapa sesuai waktu hari / Memperkenalkan nama, asal, dan tempat tinggal / Menyebut teman, umur, dan bentuk plural | units_a1.json |
| 2 Angka, waktu, harga | 1. Zahlen & Preise (4 slide)<br>2. Uhrzeit & Wochentage (4 slide)<br>3. Zeitausdrücke: um, am, im (4 slide) | Menyebut angka, harga, dan jam / Memakai nama hari dan waktu (heute, morgen, gestern) / Bertanya dan menjawab harga dengan um/am/im | units_a1.json |
| 3 Keluarga & hubungan | 1. Meine Familie (4 slide)<br>2. Eltern, Geschwister & Status (4 slide)<br>3. Possessiv & besuchen (4 slide) | Menyebut anggota keluarga dengan artikel yang benar / Menceritakan status dan jumlah saudara / Memakai mein/meine dan kalimat dengan objek Akkusativ | units_a1.json |
| 4 Makanan & minuman | 1. Essen & Trinken (4 slide)<br>2. Im Restaurant bestellen (4 slide)<br>3. Mahlzeiten & Verben (4 slide) | Menyebut makanan dan minuman dengan artikel yang benar / Memesan di restoran dengan möchte + Akkusativ / Menceritakan waktu makan dan kebiasaan makan | units_a1.json |
| 5 Belanja & harga | 1. Farben und Größen (3 slide)<br>2. Im Geschäft (3 slide)<br>3. Bezahlen und umtauschen (3 slide) | Menyebut pakaian, warna, dan ukuran / Menanyakan harga serta membayar / Meminta barang dan menukar barang dengan sopan | units_a1.json |
| 6 Rumah & tempat tinggal | 1. Zimmer und Möbel (3 slide)<br>2. Wo steht was? (3 slide)<br>3. Arbeit im Haushalt (3 slide) | Menyebut bagian rumah dan perabot / Menjelaskan letak benda di rumah / Membicarakan pekerjaan rumah sederhana | units_a1.json |
| 7 Kota & petunjuk arah | 1. Orte in der Stadt (3 slide)<br>2. Nach dem Weg fragen (3 slide)<br>3. Mit Bus und Bahn (3 slide) | Mengenali tempat umum di kota / Meminta dan memberi petunjuk arah / Menyebut cara pergi ke suatu tempat | units_a1.json |
| 8 Pekerjaan & kegiatan harian | 1. Ein Arbeitstag (3 slide)<br>2. Aufgaben und Kollegen (3 slide)<br>3. Arbeitszeit und Pflichten (3 slide) | Menceritakan rutinitas kerja / Menyebut jadwal kerja dan waktu istirahat / Membicarakan tugas serta kemampuan di tempat kerja | units_a1.json |
| 9 Kesehatan & tubuh | 1. Körper und Beschwerden (3 slide)<br>2. Beim Arzt (3 slide)<br>3. In der Apotheke (3 slide) | Menyebut keluhan kesehatan umum / Membuat janji dan menjelaskan gejala / Memahami saran sederhana dari dokter | units_a1.json |
| 10 Waktu luang & hobi | 1. Hobbys und Vorlieben (3 slide)<br>2. Freizeit planen (3 slide)<br>3. Im Verein (3 slide) | Menyebut hobi dan kegiatan waktu luang / Menyatakan kesukaan dan kemampuan / Mengajak teman melakukan kegiatan bersama | units_a1.json |
| 11 Transportasi & perjalanan | 1. Eine Reise planen (3 slide)<br>2. Am Bahnhof (3 slide)<br>3. Informationen und Reservierung (3 slide) | Merencanakan perjalanan dengan kereta / Memahami jadwal, peron, dan keterlambatan / Memesan tempat dan meminta informasi perjalanan | units_a1.json |
| 12 Komunikasi & janji | 1. Einladen und verabreden (3 slide)<br>2. Am Telefon (3 slide)<br>3. Eine Nachricht schreiben (3 slide) | Mengundang dan membuat janji / Menelepon serta meninggalkan pesan singkat / Menulis pesan sederhana dan memberi jawaban | units_a1.json |

### A2 (10 unit, 20 pelajaran)

| Unit | Pelajaran | Tujuan unit | Sumber |
|---|---|---|---|
| 101 Wohnen & Miete | 1. Perfekt dengan haben (3 slide)<br>2. Anwendung: Wohnen & Miete (4 slide) | Mendeskripsikan rumah dan apartemen / Berbicara soal sewa, pemilik, dan biaya tambahan / Memakai Perfekt dan preposisi tempat | units_a2.json |
| 102 Arbeit & Beruf | 1. Modalverben im Präteritum (3 slide)<br>2. Anwendung: Arbeit & Beruf (4 slide) | Berbicara tentang pekerjaan dan lamaran / Menuliskan pengalaman dan kualifikasi / Memakai modalverben bentuk lampau | units_a2.json |
| 103 Einkaufen & Konsum | 1. Präteritum haben & sein (3 slide)<br>2. Anwendung: Einkaufen & Konsum (4 slide) | Berbelanja dan menanyakan harga/diskon / Mengembalikan barang dan meminta struk / Memakai bentuk lampau haben/sein | units_a2.json |
| 104 Gesundheit & Arzt | 1. sollen & dürfen (3 slide)<br>2. Anwendung: Gesundheit & Arzt (4 slide) | Menceritakan keluhan kesehatan / Membuat janji dengan dokter / Memakai modalverben sollen/dürfen dan imperatif | units_a2.json |
| 105 Reisen & Urlaub | 1. Perfekt dengan sein (3 slide)<br>2. Anwendung: Reisen & Urlaub (4 slide) | Merencanakan perjalanan dan pemesanan / Berbicara tentang hotel, penerbangan, dan tujuan / Memakai Perfekt dengan sein | units_a2.json |
| 106 Verkehr & Orientierung | 1. Imperativ: Sie & du (3 slide)<br>2. Anwendung: Verkehr & Orientierung (4 slide) | Menggunakan transportasi umum / Menanyakan dan memberi arah / Memakai imperatif dan verba terpisah | units_a2.json |
| 107 Freizeit & Hobbys | 1. gern, lieber, am liebsten (3 slide)<br>2. Anwendung: Freizeit & Hobbys (4 slide) | Menceritakan hobi dan waktu luang / Menyatakan kesukaan (gern/lieber) / Berbicara tentang rencana dengan werden | units_a2.json |
| 108 Medien & Kommunikation | 1. Nebensatz mit dass (3 slide)<br>2. Anwendung: Medien & Kommunikation (4 slide) | Berbicara tentang media dan teknologi / Menjelaskan masalah komunikasi / Memakai nebensatz dass dan bentuk lampau | units_a2.json |
| 109 Feste & Traditionen | 1. Temporale Nebensätze: wenn & als (3 slide)<br>2. Anwendung: Feste & Traditionen (4 slide) | Berbicara tentang pesta dan tradisi / Mengundang dan memberi selamat / Memakai wenn/als untuk waktu | units_a2.json |
| 110 Umwelt & Alltag | 1. Passiv Präsens (3 slide)<br>2. Anwendung: Umwelt & Alltag (4 slide) | Berbicara tentang lingkungan sehari-hari / Menjelaskan kebiasaan memilah sampah / Memakai kalimat pasif dan man | units_a2.json |

### B1 (10 unit, 20 pelajaran)

| Unit | Pelajaran | Tujuan unit | Sumber |
|---|---|---|---|
| 201 Wohnen & Nachbarschaft | 1. Relativsätze (3 slide)<br>2. Anwendung: Wohnen & Nachbarschaft (4 slide) | Mengurus kontrak sewa dan deposit / Berbicara tentang tetangga dan lingkungan rumah / Memakai kalimat relatif dan pasif | units_b1.json |
| 202 Gesundheit & Lebensstil | 1. Konjunktiv II: sollte, wäre, hätte (3 slide)<br>2. Anwendung: Gesundheit & Lebensstil (4 slide) | Berbicara tentang gaya hidup sehat / Memberi saran dengan Konjunktiv II / Memakai verba dengan preposisi | units_b1.json |
| 203 Arbeit & Karriere | 1. Passiv mit Modalverben (3 slide)<br>2. Anwendung: Arbeit & Karriere (4 slide) | Membahas karier dan tanggung jawab / Memakai pasif lampau dan konjungsi / Menjelaskan pengalaman kerja | units_b1.json |
| 204 Medien & Meinung | 1. Indirekte Rede (Konjunktiv I) (3 slide)<br>2. Anwendung: Medien & Meinung (4 slide) | Menyampaikan pendapat dan argumen / Memakai kalimat relatif lanjutan / Membahas berita dan sumbernya | units_b1.json |
| 205 Umwelt & Klima | 1. Passiv mit Modalverben (3 slide)<br>2. Anwendung: Umwelt & Klima (4 slide) | Membahas perubahan iklim / Menjelaskan sebab dan akibat / Memakai pasif dengan modalverba | units_b1.json |
| 206 Reisen & Kultur | 1. Plusquamperfekt (3 slide)<br>2. Anwendung: Reisen & Kultur (4 slide) | Membahas budaya dan wisata / Menceritakan pengalaman sebelum perjalanan / Memakai Plusquamperfekt | units_b1.json |
| 207 Gesellschaft & Zusammenleben | 1. Konjunktiv II für Wünsche (3 slide)<br>2. Anwendung: Gesellschaft & Zusammenleben (4 slide) | Membahas masyarakat dan integrasi / Menyampaikan saran dan harapan / Memakai verba dengan preposisi | units_b1.json |
| 208 Bildung & Lernen | 1. Infinitiv mit zu (3 slide)<br>2. Anwendung: Bildung & Lernen (4 slide) | Membahas pendidikan dan ujian / Menjelaskan tujuan belajar / Memakai infinitif dengan zu | units_b1.json |
| 209 Geld & Finanzen | 1. Konditional mit wenn (3 slide)<br>2. Anwendung: Geld & Finanzen (4 slide) | Membahas anggaran dan pengeluaran / Menjelaskan saran keuangan / Memakai kalimat syarat | units_b1.json |
| 210 Technik & Zukunft | 1. Passiv mit werden (Zukunft) (3 slide)<br>2. Anwendung: Technik & Zukunft (4 slide) | Membahas teknologi dan masa depan / Menjelaskan perkembangan / Memakai pasif dan kalimat relatif | units_b1.json |

### B2 (10 unit, 20 pelajaran)

| Unit | Pelajaran | Tujuan unit | Sumber |
|---|---|---|---|
| 301 Arbeitswelt im Wandel | 1. Nominalisierung (3 slide)<br>2. Anwendung: Arbeitswelt im Wandel (4 slide) | Membahas perubahan dunia kerja / Menjelaskan konsekuensi sosial / Memakai nominalisasi dan konjungsi lanjut | units_b2.json |
| 302 Politik & Gesellschaft | 1. Indirekte Rede: Konjunktiv I (3 slide)<br>2. Anwendung: Politik & Gesellschaft (4 slide) | Membahas politik dan demokrasi / Menyampaikan pendapat kritis / Memakai Konjunktiv I dalam laporan | units_b2.json |
| 303 Wissenschaft & Forschung | 1. Partizipialkonstruktionen (3 slide)<br>2. Anwendung: Wissenschaft & Forschung (4 slide) | Membahas penelitian dan hasil studi / Menjelaskan bukti dan teori / Memakai Partizipialkonstruktionen | units_b2.json |
| 304 Wirtschaft & Unternehmen | 1. Funktionsverbgefüge (3 slide)<br>2. Anwendung: Wirtschaft & Unternehmen (4 slide) | Membahas ekonomi dan bisnis / Menjelaskan tren pasar / Memakai Funktionsverbgefüge | units_b2.json |
| 305 Klimapolitik & Ressourcen | 1. Nominalisierung mit Präposition (3 slide)<br>2. Anwendung: Klimapolitik & Ressourcen (4 slide) | Membahas kebijakan iklim / Menjelaskan target dan tindakan / Memakai konjungsi lanjut dan nominalisasi | units_b2.json |
| 306 Medien & Desinformation | 1. Indirekte Rede mit Konjunktiv I (3 slide)<br>2. Anwendung: Medien & Desinformation (4 slide) | Menganalisis pemberitaan / Memakai indirekte Rede secara kritis / Menilai sumber informasi | units_b2.json |
| 307 Kultur & Identität | 1. Relativsätze im Genitiv (3 slide)<br>2. Anwendung: Kultur & Identität (4 slide) | Membahas identitas dan budaya / Menyampaikan refleksi pribadi / Memakai kalimat relatif dan nominalisasi | units_b2.json |
| 308 Medizin & Gesundheit | 1. Passiv mit Modalverben (3 slide)<br>2. Anwendung: Medizin & Gesundheit (4 slide) | Membahas diagnosa dan pengobatan / Menjelaskan risiko kesehatan / Memakai pasif dan nominalisasi medis | units_b2.json |
| 309 Recht & Verwaltung | 1. Passiv in Amtsdeutsch (3 slide)<br>2. Anwendung: Recht & Verwaltung (4 slide) | Mengurus urusan administratif / Menjelaskan hak dan kewajiban / Memakai kalimat pasif formal | units_b2.json |
| 310 Zukunft & Ethik | 1. Abwägen mit einerseits … andererseits (3 slide)<br>2. Anwendung: Zukunft & Ethik (4 slide) | Membahas dilema etika teknologi / Menyampaikan pertimbangan seimbang / Memakai Konjunktiv II dan pasif | units_b2.json |

## Tujuan A1 dan bank

| Tujuan | Unit | Judul | Pelajaran | Bank | Review |
|---|---|---|---|---|---|
| a1-u1-o1 | 1 | Menyapa sesuai waktu hari | 1 | 5 item | not-reviewed |
| a1-u1-o2 | 1 | Memperkenalkan dan menanyakan nama | 1 | 5 item | not-reviewed |
| a1-u1-o3 | 1 | Menyebut asal dan tempat tinggal | 2 | 5 item | not-reviewed |
| a1-u1-o4 | 1 | Menyebut teman dan umur | 3 | 5 item | not-reviewed |
| a1-u1-o5 | 1 | Artikel dan bentuk plural | 1,3 | 5 item | not-reviewed |
| a1-u2-o1 | 2 | Menyebut angka 1–100 | 1 | 5 item | not-reviewed |
| a1-u2-o2 | 2 | Menanyakan dan menjawab harga | 1 | 5 item | not-reviewed |
| a1-u2-o3 | 2 | Menanyakan dan menyebut jam | 2 | 5 item | not-reviewed |
| a1-u2-o4 | 2 | Menyebut hari dan menanyakan jadwal | 2 | 5 item | not-reviewed |
| a1-u2-o5 | 2 | Memakai preposisi waktu um, am, im | 3 | 5 item | not-reviewed |
| a1-u3-o1 | 3 | Menyebut anggota keluarga dengan artikel | 1,2 | 5 item | not-reviewed |
| a1-u3-o2 | 3 | Memakai mein/meine sesuai gender dan jumlah | 1 | 5 item | not-reviewed |
| a1-u3-o3 | 3 | Menanyakan dan menyebut jumlah saudara/anak | 2 | 5 item | not-reviewed |
| a1-u3-o4 | 3 | Menyebut status pernikahan dan tinggal bersama | 2 | 5 item | not-reviewed |
| a1-u3-o5 | 3 | Memakai possessiv dein/sein/ihr dan Akkusativ setelah besuchen | 3 | 5 item | not-reviewed |
| a1-u4-o1 | 4 | Menyebut makanan dan minuman dengan artikel | 1 | 5 item | not-reviewed |
| a1-u4-o2 | 4 | Menyatakan rasa dan keadaan lapar/haus | 1 | 5 item | not-reviewed |
| a1-u4-o3 | 4 | Memesan dengan möchte + Akkusativ | 2 | 5 item | not-reviewed |
| a1-u4-o4 | 4 | Berinteraksi di restoran | 2 | 5 item | not-reviewed |
| a1-u4-o5 | 4 | Menyebut waktu makan dan kebiasaan dengan essen/trinken | 3 | 5 item | not-reviewed |
| a1-u5-o1 | 5 | Menyebut warna dan menyelaraskan kata sifat | 1 | 5 item | not-reviewed |
| a1-u5-o2 | 5 | Menanyakan ukuran dan menyatakan cocok/tidak | 1,2 | 5 item | not-reviewed |
| a1-u5-o3 | 5 | Mencari dan meminta barang dengan Akkusativ | 1,2 | 5 item | not-reviewed |
| a1-u5-o4 | 5 | Mencoba pakaian dan menanyakan ruang ganti | 2 | 5 item | not-reviewed |
| a1-u5-o5 | 5 | Menanyakan harga, membayar, dan menukar barang | 3 | 5 item | not-reviewed |
| a1-u6-o1 | 6 | Menyebut bagian rumah dan perabot dengan artikel | 1 | 5 item | not-reviewed |
| a1-u6-o2 | 6 | Menyatakan keberadaan dengan es gibt + Akkusativ | 1 | 5 item | not-reviewed |
| a1-u6-o3 | 6 | Menjelaskan letak dengan Wo? dan preposisi Dativ | 2 | 5 item | not-reviewed |
| a1-u6-o4 | 6 | Membedakan Wo? dan Wohin? | 2 | 5 item | not-reviewed |
| a1-u6-o5 | 6 | Membicarakan pekerjaan rumah dengan aufräumen dan müssen | 3 | 5 item | not-reviewed |
| a1-u7-o1 | 7 | Menyebut tempat umum di kota dengan artikel | 1 | 5 item | not-reviewed |
| a1-u7-o2 | 7 | Menjelaskan letak relatif dengan preposisi Dativ | 1 | 5 item | not-reviewed |
| a1-u7-o3 | 7 | Memberi arahan dengan imperatif formal | 2 | 5 item | not-reviewed |
| a1-u7-o4 | 7 | Menanyakan jalan dengan zum/zur | 2 | 5 item | not-reviewed |
| a1-u7-o5 | 7 | Menyebut transportasi dengan mit + Dativ | 3 | 5 item | not-reviewed |
| a1-u8-o1 | 8 | Menceritakan urutan rutinitas kerja | 1 | 5 item | not-reviewed |
| a1-u8-o2 | 8 | Memakai anfangen sebagai verba pisah | 1 | 5 item | not-reviewed |
| a1-u8-o3 | 8 | Menyebut tempat kerja dan departemen | 1 | 5 item | not-reviewed |
| a1-u8-o4 | 8 | Membicarakan tugas dan rekan kerja | 2 | 5 item | not-reviewed |
| a1-u8-o5 | 8 | Menyatakan kewajiban, kemampuan, dan jam kerja | 3 | 5 item | not-reviewed |
| a1-u9-o1 | 9 | Menyebut keluhan kesehatan dengan haben | 1 | 5 item | not-reviewed |
| a1-u9-o2 | 9 | Menanyakan kondisi dan durasi dengan seit | 1 | 5 item | not-reviewed |
| a1-u9-o3 | 9 | Membuat janji dokter | 2 | 5 item | not-reviewed |
| a1-u9-o4 | 9 | Menjelaskan gejala dan pemeriksaan | 2 | 5 item | not-reviewed |
| a1-u9-o5 | 9 | Memahami saran obat dengan sollen | 3 | 5 item | not-reviewed |
| a1-u10-o1 | 10 | Menyatakan kesukaan dengan gern/lieber/am liebsten | 1 | 5 item | not-reviewed |
| a1-u10-o2 | 10 | Menyebut hobi dan kegiatan waktu luang | 1 | 5 item | not-reviewed |
| a1-u10-o3 | 10 | Mengajak teman dan merespons ajakan | 2 | 5 item | not-reviewed |
| a1-u10-o4 | 10 | Menyebut jadwal kegiatan dengan am dan um | 2 | 5 item | not-reviewed |
| a1-u10-o5 | 10 | Membicarakan keanggotaan klub dan jadwal latihan | 3 | 5 item | not-reviewed |
| a1-u11-o1 | 11 | Menyebut tujuan perjalanan dengan nach dan in + negara | 1 | 5 item | not-reviewed |
| a1-u11-o2 | 11 | Menyebut jadwal keberangkatan dan kedatangan | 1 | 5 item | not-reviewed |
| a1-u11-o3 | 11 | Membawa barang bawaan dengan mitnehmen | 1 | 5 item | not-reviewed |
| a1-u11-o4 | 11 | Menanyakan peron, keterlambatan, dan sambungan | 2 | 5 item | not-reviewed |
| a1-u11-o5 | 11 | Memesan tiket/tempat duduk dan meminta informasi | 2,3 | 5 item | not-reviewed |
| a1-u12-o1 | 12 | Mengundang dan menyepakati waktu | 1 | 5 item | not-reviewed |
| a1-u12-o2 | 12 | Menerima atau menolak ajakan dan mengusulkan waktu lain | 1 | 5 item | not-reviewed |
| a1-u12-o3 | 12 | Memulai percakapan telepon | 2 | 5 item | not-reviewed |
| a1-u12-o4 | 12 | Memakai anrufen pisah dan meninggalkan pesan | 2 | 5 item | not-reviewed |
| a1-u12-o5 | 12 | Menulis dan membalas pesan sederhana | 3 | 5 item | not-reviewed |

## Praktik dan ujian

| Bagian | ID | Isi | Rute lama | Rute KLAB |
|---|---|---|---|---|
| Mendengar | a1-listen-cafe | 4 baris, 2 pertanyaan | Latihan > Mendengar | practice/listening |
| Mendengar | a1-listen-bahnhof | 4 baris, 2 pertanyaan | Latihan > Mendengar | practice/listening |
| Mendengar | a1-listen-arzt | 4 baris, 2 pertanyaan | Latihan > Mendengar | practice/listening |
| Mendengar | a1-listen-wohnung | 5 baris, 2 pertanyaan | Latihan > Mendengar | practice/listening |
| Mendengar | a1-listen-verabredung | 4 baris, 2 pertanyaan | Latihan > Mendengar | practice/listening |
| Menulis | a1-write-absage | 4 unsur wajib, 4 checklist | Latihan > Menulis | practice/writing |
| Menulis | a1-write-kino | 5 unsur wajib, 5 checklist | Latihan > Menulis | practice/writing |
| Menulis | a1-write-arzt | 4 unsur wajib, 4 checklist | Latihan > Menulis | practice/writing |
| Menulis | a1-write-aufgabe | 4 unsur wajib, 4 checklist | Latihan > Menulis | practice/writing |
| Menulis | a1-write-postkarte | 5 unsur wajib, 5 checklist | Latihan > Menulis | practice/writing |
| Percakapan | a1-talk-cafe | 8 node | Latihan > Percakapan | practice/conversation |
| Percakapan | a1-talk-weg | 5 node | Latihan > Percakapan | practice/conversation |
| Percakapan | a1-talk-arzt | 8 node | Latihan > Percakapan | practice/conversation |
| Percakapan | a1-talk-geschaeft | 9 node | Latihan > Percakapan | practice/conversation |
| Uji A1 | hoeren | 5 item, 0 prompt | Uji A1 | exam |
| Uji A1 | lesen | 5 item, 0 prompt | Uji A1 | exam |
| Uji A1 | schreiben | 0 item, 0 prompt | Uji A1 | exam |
| Uji A1 | sprechen | 0 item, 3 prompt | Uji A1 | exam |

## Gap PRD (terpisah dari kesetaraan konten lama)

- Telaah pengajar Jerman belum dilaksanakan; semua tujuan A1 review=not-reviewed.
- Pilot pembelajar manusia belum dilaksanakan; tidak ada klaim efektivitas belajar.
- A2/B1/B2 belum memakai bank tujuan/checkpoint transfer seperti A1 (masih checkpoint lama).
- Asesmen pelafalan/bicara otomatis belum ada; rubrik Sprechen mandiri.
- Audio teks bebas A2-B2 di luar klip bawaan bergantung Piper/Windows.
- 1213 kata seed tanpa contoh kalimat dan 47 kata benda tanpa plural; bukan kehilangan baseline, tetapi gap kualitas PRD.
- Pembanding/kesalahan umum per slide A1 belum seragam.
- F7 AI lokal, Android/APK, dan UI besar KLAB berada di luar tahap Windows.

## Batas bukti

- Matriks membuktikan pemetaan dan isi konten; bukan bukti UI baru sudah merender semuanya.
- Rute KLAB adalah target kontrak `src/klab/routes.ts`; adapter produksi belum dipasang (gate integrasi).
- Telaah pengajar/pilot dan asesmen bicara tetap gap terpisah.
