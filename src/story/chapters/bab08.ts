// ===== Bab 8 · „Hari Pertama" — Unit 8: jam kerja & pekerjaan =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

export const WORKTIME = ["ich arbeite von ~ bis ~"];
export const WORKTIME_CHIPS = "Ich arbeite von acht bis zwölf Uhr . Montag Freitag";

export const bab08 = chapter({
  id: "bab-08",
  no: 8,
  unit: 8,
  title: "Hari Pertama",
  tagline: "Tanda pengenal baru, troli penuh buku, dan pengunjung yang mengira kamu tahu segalanya.",
  cover: "u08-hari-kerja",
  place: "Perpustakaan kota",
  objectives: [
    { id: "worktime", title: "Menyebut jam kerja", phrase: "Ich arbeite von acht bis zwölf Uhr." },
    { id: "job", title: "Menjelaskan pekerjaan", phrase: "Ich arbeite in der Bibliothek." },
  ],
  next: "Berikutnya: menjelaskan keluhan di praktik dokter dan apotek.",
  beats: [
    opening({
      bg: "u08-hari-kerja",
      lines: [n("Senin, pukul delapan kurang lima. Hari pertamamu di perpustakaan. Di meja kerjamu sudah ada dua lembar kertas.")],
      prompt: "Kertas mana yang kamu baca?",
      look: [
        { label: "Baca jadwal kerja", lines: [nd("Montag bis Freitag: 8 bis 12 Uhr", "Senin sampai Jumat: jam 8 sampai 12", { overlay: paper("note", "Arbeitsplan\nMontag bis Freitag\n8 bis 12 Uhr") })] },
        { label: "Baca daftar tugas", lines: [nd("Bücher sortieren, E-Mails schreiben", "Menyortir buku, menulis e-mail", { overlay: paper("note", "Aufgaben:\nBücher sortieren\nE-Mails schreiben") })] },
      ],
      go: "Kenakan tanda pengenal",
    }),

    lesson({
      obj: "worktime",
      intro: [tu("Hari kerja pertama! Pertanyaan pertama rekan kerja biasanya praktis: kapan kamu bekerja?")],
      models: [
        td("Wann arbeitest du?", "Kapan kamu bekerja? (wann = kapan)"),
        td("Ich arbeite von acht bis zwölf Uhr.", "Saya bekerja dari jam delapan sampai jam dua belas. (von … bis … = dari … sampai …)"),
        td("Ich arbeite von Montag bis Freitag.", "Saya bekerja dari Senin sampai Jumat."),
      ],
      tip: "„von … bis …“ berlaku untuk jam maupun hari. Kata kerjanya: ich arbeite, du arbeitest. Lihat jadwalmu: jam 8 sampai 12.",
      practice: {
        ask: [d("tutor", "Wann arbeitest du?", "Kapan kamu bekerja?", "question")],
        chips: WORKTIME_CHIPS,
        hints: ["Jadwalmu: mulai jam delapan, selesai jam dua belas.", "Mulai dengan: „Ich arbeite von … bis …“"],
        model: "Ich arbeite von acht bis zwölf Uhr.",
        ok: WORKTIME,
        part: [
          { when: ["von ~ bis ~", "~ bis ~"], say: [tu("Rentangnya tepat. Kalimat utuhnya: „Ich arbeite von … bis …“")] },
          { when: ["ich arbeite( ~)?"], say: [tu("Sebutkan rentangnya dengan „von … bis …“: „Ich arbeite von acht bis zwölf Uhr.“", "question")] },
        ],
      },
      praise: "Bagus. „von … bis …“ — dua kata kecil yang mengatur seluruh jadwalmu.",
      go: "Sapa rekan kerja",
    }),

    encounter({
      who: "vogel",
      open: [
        d("vogel", "Guten Morgen! Ich bin Frau Vogel. Sie sind neu, oder?", "Selamat pagi! Saya Frau Vogel. Anda baru, kan?", "smile"),
        d("vogel", "Wann arbeiten Sie?", "Kapan Anda bekerja?", "question"),
      ],
      turns: [
        {
          obj: "worktime",
          chips: WORKTIME_CHIPS,
          hints: ["Frau Vogel menanyakan jam kerjamu: jam 8 sampai 12.", "Mulai dengan: „Ich arbeite von … bis …“"],
          model: "Ich arbeite von acht bis zwölf Uhr.",
          ok: WORKTIME,
          part: [{ when: ["von ~ bis ~", "~ bis ~"], accept: true }],
          then: [d("vogel", "Von acht bis zwölf — wie ich! Dann arbeiten wir zusammen.", "Dari jam delapan sampai dua belas — sama seperti saya! Kalau begitu kita bekerja bersama.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "job",
      intro: [tu("Pengunjung perpustakaan akan mengira kamu tahu segalanya. Kamu perlu bisa menjelaskan siapa kamu di sini.")],
      models: [
        td("Ich arbeite in der Bibliothek.", "Saya bekerja di perpustakaan. (in der = di dalam)"),
        td("Ich sortiere Bücher.", "Saya menyortir buku. (das Buch → die Bücher)"),
        td("Ich bin neu hier.", "Saya baru di sini."),
      ],
      tip: "Tempat kerja: „Ich arbeite in der Bibliothek.“ Tugas: kata kerja + benda. Katakan di mana kamu bekerja.",
      practice: {
        prompt: "Latihan: katakan bahwa kamu bekerja di perpustakaan.",
        chips: "Ich arbeite in der Bibliothek . bin neu hier sortiere Bücher",
        hints: ["Kamu ingin menjelaskan tempat kerjamu.", "Mulai dengan: „Ich arbeite in …“"],
        model: "Ich arbeite in der Bibliothek.",
        ok: ["(ja )?ich arbeite (hier )?in der bibliothek"],
        part: [
          { when: ["(ja )?ich arbeite (in|im|in die|in dem|in das) bibliothek"], say: [tu("Hampir! Untuk menyebut tempat, „die Bibliothek“ menjadi „in der Bibliothek“.", "question")] },
          { when: ["in der bibliothek", "ich arbeite( hier)?"], say: [tu("Benar, tapi lengkapi: „Ich arbeite in der Bibliothek.“")] },
        ],
      },
      praise: "Bagus. Dan kalau ada pertanyaan yang terlalu sulit, „Ich bin neu hier“ adalah penyelamatmu.",
      go: "Mulai menyortir buku",
    }),

    hub({
      bg: "u08-hari-kerja",
      intro: [n("Troli buku penuh. Seorang pengunjung berkacamata mendekat ke mejamu dengan setumpuk buku. Di pojok, Frau Vogel sibuk membuka-buka laci.")],
      prompt: "Siapa yang kamu layani dulu?",
      side: {
        label: "Bantu Frau Vogel mencari kunci",
        leave: "Kamu kembali ke troli buku.",
        enc: {
          who: "vogel",
          open: [d("vogel", "Wo liegt nur der Schlüssel für das Archiv?", "Di mana ya kunci arsip itu?", "question")],
          turns: [
            {
              obj: "place",
              prompt: "Giliranmu. Kunci arsip tergeletak di atas meja.",
              chips: "Der Schlüssel liegt auf dem Tisch Regal .",
              hints: ["Frau Vogel mencari kunci arsip. Kamu melihatnya tergeletak di atas meja.", "Seperti di kamarmu: „Der Schlüssel liegt auf …“"],
              model: "Der Schlüssel liegt auf dem Tisch.",
              ok: ["(der schlussel|er) (liegt|ist) auf dem tisch"],
              part: [{ when: ["auf (dem|das|den) tisch", "(der schlussel|er) (liegt|ist) auf (das|der|den) tisch"], accept: true }],
              then: [d("vogel", "Ah, da ist er! Danke.", "Ah, itu dia! Terima kasih.", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Layani pengunjung berkacamata",
        enc: {
          who: "kaya",
          open: [d("kaya", "Guten Tag! Ach, wir kennen uns doch! Arbeiten Sie hier?", "Selamat siang! Lho, kita kan saling kenal! Anda bekerja di sini?", "question")],
          turns: [
            {
              obj: "job",
              chips: "Ja , ich arbeite in der Bibliothek . hier",
              hints: ["Frau Kaya, penjaga gedung Mia, heran melihatmu di balik meja. Benarkan: kamu bekerja di sini.", "Mulai dengan: „Ja, ich arbeite in …“"],
              model: "Ja, ich arbeite in der Bibliothek.",
              ok: ["(ja )?ich arbeite (hier|(hier )?in der bibliothek)"],
              part: [{ when: ["ja( ~)?"], accept: true }],
              then: [d("kaya", "Wie schön! Gratuliere!", "Bagus sekali! Selamat!", "smile")],
            },
            {
              obj: "job",
              ask: [d("kaya", "Dann leiten Sie jetzt die Bibliothek, oder?", "Kalau begitu sekarang Anda yang memimpin perpustakaan, ya?", "question")],
              chips: "Nein Ja , ich bin neu hier . sortiere Bücher",
              hints: ["Ia mengira kamu memimpin perpustakaan. Luruskan: kamu baru di sini.", "Mulai dengan: „Nein, ich bin …“"],
              model: "Nein, ich bin neu hier.",
              ok: ["(nein )?ich bin (ganz )?neu( hier)?", "nein ich sortiere (nur )?(die )?bucher"],
              part: [
                { when: ["ich sortiere (nur )?(die )?bucher"], accept: true },
                { when: ["nein( ~)?"], say: [d("kaya", "Nein? Was machen Sie dann hier?", "Bukan? Lalu apa yang Anda kerjakan di sini?", "question")] },
                { when: ["ja( ~)?"], say: [d("kaya", "Wirklich? Schon am ersten Tag?", "Sungguh? Sudah di hari pertama?", "think")] },
              ],
              then: [d("kaya", "Ach so! Dann viel Erfolg am ersten Tag!", "Oh begitu! Kalau begitu semoga sukses di hari pertama!", "smile")],
            },
          ],
          close: [n("Menjelang siang, punggungmu pegal karena troli buku. Frau Kaya menyelipkan sesuatu di antara buku yang dikembalikannya.")],
        },
      },
      exit: "Periksa buku yang dikembalikan",
    }),

    payoff({
      lines: [
        n("Di antara halaman buku itu ada pembatas buku — dengan tulisan tangan yang sudah kamu kenal.", { sfx: "paper" }),
        nd("Rückenschmerzen? Praxis Dr. Becker, Mittwoch, 10 Uhr.", "Sakit punggung? Praktik Dr. Becker, Rabu, jam 10. — Mia rupanya tahu betul rasanya minggu pertama di perpustakaan.", {
          overlay: paper("note", "Rückenschmerzen?\nPraxis Dr. Becker\nMittwoch, 10 Uhr", "— Mia"),
        }),
      ],
    }),
  ],
});
