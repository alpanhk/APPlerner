// ===== Bab 11 · „Peron Tiga" — Unit 11: tiket & peron =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const TICKET = ["(ich mochte |ich brauche |ich nehme )?(eine|1) (fahrkarte|karte) nach hamburg( bitte)?", "(ich mochte |ich brauche )?ein ticket nach hamburg( bitte)?"];
const TICKET_CHIPS = "Eine Fahrkarte nach Hamburg Berlin , bitte . Ich möchte";
const PLAT = [
  "(von|auf) welchem gleis fahrt der zug( nach hamburg)?( ab)?",
  "wo fahrt der zug nach hamburg( ab)?",
];
const PLAT_CHIPS = "Von welchem Gleis fährt der Zug nach Hamburg ? Wo";

export const bab11 = chapter({
  id: "bab-11",
  no: 11,
  unit: 11,
  title: "Peron Tiga",
  tagline: "Mesin tiket rusak, pengumuman terlalu cepat, dan peron tiga ternyata kosong.",
  cover: "u11-stasiun",
  place: "Stasiun kota",
  objectives: [
    { id: "ticket", title: "Membeli tiket", phrase: "Eine Fahrkarte nach Hamburg, bitte." },
    { id: "platform", title: "Menanyakan peron dan tujuan", phrase: "Von welchem Gleis fährt der Zug?" },
  ],
  next: "Bab terakhir: menelepon, mengundang, dan menulis pesanmu sendiri.",
  beats: [
    opening({
      bg: "u11-stasiun",
      lines: [n("Minggu, pukul setengah sembilan. Stasiun ramai. Kereta merah menunggu di bawah atap kaca, dan papan keberangkatan berkedip-kedip.", { sfx: "tram" })],
      prompt: "Apa yang kamu periksa?",
      look: [
        { label: "Baca papan keberangkatan", lines: [nd("Hamburg, 9 Uhr, Gleis 3", "Hamburg, jam 9, peron 3", { overlay: paper("sign", "Abfahrt\nHamburg · 9:00 · Gleis 3") })] },
        {
          label: "Periksa mesin tiket",
          lines: [nd("Außer Betrieb", "Tidak beroperasi", { overlay: paper("sign", "Außer Betrieb") }), n("Mesinnya rusak. Kamu harus membeli tiket di loket — dengan berbicara.")],
        },
      ],
      go: "Antre di loket",
    }),

    lesson({
      obj: "ticket",
      intro: [tu("Mesin rusak adalah guru terbaik. Di loket, kalimatmu pendek saja: tiket apa, ke mana.")],
      models: [
        td("Eine Fahrkarte nach Hamburg, bitte.", "Satu tiket ke Hamburg, tolong. (die Fahrkarte = tiket; nach = ke)"),
        td("Einfach oder hin und zurück?", "Sekali jalan atau pulang-pergi?"),
        td("Hin und zurück, bitte.", "Pulang-pergi, tolong."),
      ],
      tip: "„nach“ + nama kota: nach Hamburg, nach Berlin. Petugas hampir selalu menyusul dengan „Einfach oder hin und zurück?“. Mintalah tiket ke Hamburg.",
      practice: {
        prompt: "Latihan: minta satu tiket ke Hamburg.",
        chips: TICKET_CHIPS,
        hints: ["Kamu ingin membeli satu tiket ke Hamburg.", "Mulai dengan: „Eine Fahrkarte nach …“"],
        model: "Eine Fahrkarte nach Hamburg, bitte.",
        ok: TICKET,
        part: [
          { when: ["(eine )?(fahrkarte|karte) (zu|in|bis|nach zu) hamburg( bitte)?"], say: [tu("Hampir! Untuk kota dipakai „nach“: nach Hamburg.", "question")] },
          { when: ["(nach )?hamburg( bitte)?"], say: [tu("Tujuannya benar. Tambahkan barangnya: „Eine Fahrkarte nach Hamburg, bitte.“")] },
          { when: ["(eine )?(fahrkarte|karte)( bitte)?"], say: [tu("Tiket ke mana? Tambahkan „nach Hamburg“.", "question")] },
        ],
      },
      praise: "Bagus. Pendek, sopan, lengkap — begitulah cara orang sini membeli tiket.",
      go: "Maju ke loket",
    }),

    encounter({
      who: "richter",
      open: [d("richter", "Guten Morgen! Wohin möchten Sie?", "Selamat pagi! Anda mau ke mana?", "smile")],
      turns: [
        {
          obj: "ticket",
          chips: TICKET_CHIPS,
          hints: ["Petugas loket menanyakan tujuanmu. Minta satu tiket ke Hamburg.", "Mulai dengan: „Eine Fahrkarte nach …“"],
          model: "Eine Fahrkarte nach Hamburg, bitte.",
          ok: TICKET,
          part: [{ when: ["(nach )?hamburg( bitte)?", "ich (mochte|fahre) nach hamburg"], accept: true }],
          then: [d("richter", "Nach Hamburg, gern. Einfach oder hin und zurück?", "Ke Hamburg, baik. Sekali jalan atau pulang-pergi?", "question")],
        },
        {
          obj: "ticket",
          chips: "Hin und zurück , bitte . Einfach",
          hints: ["Kamu akan pulang lagi malam ini — jadi pulang-pergi.", "Mulai dengan: „Hin und …“"],
          model: "Hin und zurück, bitte.",
          ok: ["hin und zuruck( bitte)?", "einfach( bitte)?"],
          part: [{ when: ["(hin )?zuruck( bitte)?"], accept: true }],
          then: [d("richter", "Bitte schön, Ihre Fahrkarte. Gute Reise!", "Silakan, tiket Anda. Selamat jalan!", "smile")],
        },
      ],
    }),

    lesson({
      obj: "platform",
      intro: [
        n("[Pengeras suara berderak. Sebuah pengumuman bergema, terlalu cepat untuk kamu tangkap.]", { sfx: "bell" }),
        tu("Pengumuman stasiun sulit ditangkap, bahkan bagi penutur asli. Jadi jangan menebak — tanyakan peronnya."),
      ],
      models: [
        td("Von welchem Gleis fährt der Zug nach Hamburg?", "Dari peron mana kereta ke Hamburg berangkat? (das Gleis = peron; fahren = berangkat)"),
        td("Der Zug fährt von Gleis fünf.", "Keretanya berangkat dari peron lima."),
        td("Ich fahre nach Hamburg.", "Saya pergi ke Hamburg."),
      ],
      tip: "Pertanyaannya panjang, tetapi „Von welchem Gleis?“ pun sudah dimengerti. Latih dulu versi lengkapnya denganku.",
      practice: {
        prompt: "Latihan: tanyakan dari peron mana kereta ke Hamburg berangkat.",
        chips: PLAT_CHIPS,
        hints: ["Kamu ingin tahu nomor peron kereta ke Hamburg.", "Mulai dengan: „Von welchem Gleis fährt …?“"],
        model: "Von welchem Gleis fährt der Zug nach Hamburg?",
        ok: PLAT,
        part: [
          { when: ["von welchem gleis der zug( nach hamburg)? fahrt( nach hamburg)?"], say: [tu("Kata-katanya lengkap — tetapi kata kerja „fährt“ datang tepat setelah „Gleis“.", "question")] },
          { when: ["(von )?welche(m|s)? gleis( bitte)?"], say: [tu("Itu sudah dimengerti petugas. Sekarang versi lengkapnya: „Von welchem Gleis fährt der Zug nach Hamburg?“")] },
        ],
      },
      praise: "Bagus. Dengan pertanyaan itu, pengumuman secepat apa pun tidak bisa menjebakmu.",
      go: "Berjalan ke peron tiga",
    }),

    hub({
      bg: "u11-stasiun",
      intro: [n("Peron 3 kosong. Tidak ada kereta, tidak ada rombongan klub. Seorang petugas berseragam biru berdiri dekat tangga, dan di bangku peron duduk sosok beransel yang kamu kenal.")],
      prompt: "Siapa yang kamu hampiri?",
      side: {
        label: "Sapa Marek di bangku peron",
        leave: "Kamu mengangguk kepada Marek dan mencari petugas.",
        enc: {
          who: "marek",
          open: [d("marek", "Hallo! Du schon wieder! Entschuldigung, wo ist der Ausgang?", "Halo! Kamu lagi! Permisi, di mana pintu keluar?", "smile")],
          turns: [
            {
              obj: "direct",
              prompt: "Giliranmu. Pintu keluar ada lurus di depan.",
              chips: "Gehen Sie geradeaus nach links rechts .",
              hints: ["Marek lagi-lagi bingung arah. Pintu keluar ada lurus di depan.", "Seperti di alun-alun: „Gehen Sie …“"],
              model: "Gehen Sie geradeaus.",
              ok: ["(gehen sie|geh) (immer )?geradeaus"],
              part: [{ when: ["(immer )?geradeaus( bitte)?"], accept: true }],
              then: [d("marek", "Geradeaus — wie immer bei dir! Danke!", "Lurus — seperti biasa darimu! Terima kasih!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Tanya petugas berseragam biru",
        enc: {
          who: "richter",
          open: [d("richter", "Kann ich Ihnen helfen?", "Ada yang bisa saya bantu?", "question")],
          turns: [
            {
              obj: "platform",
              prompt: "Giliranmu. Tanyakan dari peron mana kereta ke Hamburg berangkat.",
              chips: PLAT_CHIPS,
              hints: ["Peron 3 kosong. Tanyakan dari peron mana kereta ke Hamburg berangkat.", "Mulai dengan: „Von welchem Gleis fährt …?“"],
              model: "Von welchem Gleis fährt der Zug nach Hamburg?",
              ok: PLAT,
              part: [{ when: ["(von )?welche(m|s)? gleis( ~)?", "(der )?zug nach hamburg"], accept: true }],
              then: [d("richter", "Heute von Gleis fünf, nicht von Gleis drei!", "Hari ini dari peron lima, bukan dari peron tiga!", "smile")],
            },
            {
              obj: "platform",
              ask: [d("richter", "Moment — fahren Sie nach Berlin?", "Sebentar — Anda pergi ke Berlin?", "question")],
              chips: "Nein Ja , ich fahre nach Hamburg Berlin .",
              hints: ["Petugas ingin memastikan tujuanmu. Kamu ke Hamburg, bukan Berlin.", "Mulai dengan: „Nein, ich fahre nach …“"],
              model: "Nein, ich fahre nach Hamburg.",
              ok: ["(nein )?ich fahre nach hamburg"],
              part: [
                { when: ["(nein )?(nach )?hamburg"], accept: true },
                { when: ["nein"], say: [d("richter", "Nicht nach Berlin? Wohin fahren Sie?", "Bukan ke Berlin? Anda pergi ke mana?", "question")] },
                { when: ["ja( ~)?", "(ich fahre )?nach berlin"], say: [d("richter", "Nach Berlin? Aber auf Ihrer Fahrkarte steht Hamburg!", "Ke Berlin? Tapi di tiket Anda tertulis Hamburg!", "think")] },
              ],
              then: [d("richter", "Hamburg, Gleis fünf. Schnell, der Zug fährt gleich!", "Hamburg, peron lima. Cepat, keretanya segera berangkat!", "smile")],
            },
          ],
        },
      },
      exit: "Lari ke peron lima",
    }),

    payoff({
      lines: [
        n("Kamu melompat masuk tepat sebelum pintu menutup. Rombongan klub bersorak. Begitu kereta bergerak, ponselmu bergetar.", { sfx: "tram" }),
        nd("Wo bist du? Ruf mich an!", "Kamu di mana? Telepon aku! — Pesan dari Mia.", { overlay: paper("phone", "Wo bist du?\nRuf mich an!", "Mia · 09:01"), sfx: "ring" }),
      ],
    }),
  ],
});
