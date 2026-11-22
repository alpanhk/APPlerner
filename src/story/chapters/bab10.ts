// ===== Bab 10 · „Sabtu di Kolam" — Unit 10: hobi & rencana =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const VERB = "(schwimme|lese|koche|tanze|singe|wandere|laufe|reise|male|spiele|fotografiere|jogge|zeichne|schreibe|hore|sehe|fahre)";
const HOBBY = [`ich ${VERB} (sehr )?(gern|gerne)( ~)?`, "mein hobby ist ~"];
const HOBBY_CHIPS = "Ich schwimme lese koche spiele tanze gern Fußball .";
const PLAN = [
  "(ja )?am sonntag habe ich zeit",
  "(ja )?ich habe (am sonntag )?zeit( am sonntag)?",
  "(nein )?am sonntag habe ich (leider )?keine zeit",
  "(nein )?ich habe (am sonntag )?(leider )?keine zeit( am sonntag)?",
];
const PLAN_CHIPS = "Ja Nein , am Sonntag habe ich Zeit keine .";

export const bab10 = chapter({
  id: "bab-10",
  no: 10,
  unit: 10,
  title: "Sabtu di Kolam",
  tagline: "Dokter menyuruhmu bergerak. Di klub renang, orang berkenalan lewat hobi dan rencana.",
  cover: "u10-renang",
  place: "Klub renang Blau-Weiß",
  objectives: [
    { id: "hobby", title: "Menceritakan hobi", phrase: "Ich schwimme gern." },
    { id: "plan", title: "Menjawab ajakan berencana", phrase: "Am Sonntag habe ich Zeit." },
  ],
  next: "Berikutnya: membeli tiket dan mencari peron — klub mengajakmu tamasya.",
  beats: [
    opening({
      bg: "u10-renang",
      lines: [n("Sabtu, pukul sepuluh. Kolam renang klub Blau-Weiß berkilau di bawah matahari. Di gerbangnya tergantung papan pengumuman.")],
      prompt: "Apa yang kamu baca?",
      look: [
        { label: "Baca papan klub", lines: [nd("Schwimmen, Fußball, Tanzen — für alle!", "Renang, sepak bola, menari — untuk semua!", { overlay: paper("sign", "Verein Blau-Weiß\nSchwimmen · Fußball · Tanzen\nfür alle!") })] },
        { label: "Baca jadwal latihan", lines: [nd("Schwimmen: Samstag und Sonntag, 10 Uhr", "Renang: Sabtu dan Minggu, jam 10", { overlay: paper("note", "Schwimmen:\nSamstag und Sonntag\n10 Uhr") })] },
      ],
      go: "Masuk lewat gerbang",
    }),

    lesson({
      obj: "hobby",
      intro: [tu("Di klub, orang berkenalan lewat hobi. Kamu sudah kenal kata „gern“ dari Café Linde — sekarang pakai untuk kegiatan.")],
      models: [
        td("Was machst du gern?", "Kamu suka melakukan apa? (machen = melakukan)"),
        td("Ich schwimme gern.", "Saya suka berenang."),
        td("Ich spiele gern Fußball.", "Saya suka bermain sepak bola."),
        td("Ich schwimme lieber.", "Saya lebih suka berenang."),
      ],
      tip: "Kata kerja + gern: ich schwimme gern, ich lese gern, ich koche gern, ich tanze gern. Ceritakan hobimu.",
      practice: {
        ask: [d("tutor", "Was machst du gern?", "Kamu suka melakukan apa?", "question")],
        chips: HOBBY_CHIPS,
        hints: ["Sebutkan satu kegiatan yang kamu sukai.", "Mulai dengan: „Ich … gern.“"],
        model: "Ich schwimme gern.",
        ok: HOBBY,
        part: [
          { when: [`ich (gern|gerne) ${VERB}( ~)?`], say: [tu("Kata-katanya benar, tinggal urutannya: kata kerja dulu, baru „gern“.", "question")] },
          { when: [`ich ${VERB}( ~)?`], say: [tu("Benar — tambahkan „gern“ supaya artinya suka: „Ich schwimme gern.“")] },
          { when: ["(schwimmen|lesen|kochen|tanzen|fussball)( spielen)?"], say: [tu("Itu kegiatannya. Kalimat utuhnya: „Ich schwimme gern.“")] },
        ],
      },
      praise: "Bagus! Rumus yang sama seperti di kafe: kata kerja + gern.",
      go: "Daftar di meja klub",
    }),

    encounter({
      who: "kim",
      open: [d("kim", "Hallo! Willkommen im Verein. Ich bin Kim. Was machst du gern?", "Halo! Selamat datang di klub. Aku Kim. Kamu suka melakukan apa?", "smile")],
      turns: [
        {
          obj: "hobby",
          chips: HOBBY_CHIPS,
          hints: ["Kim ingin tahu kegiatan kesukaanmu.", "Mulai dengan: „Ich … gern.“"],
          model: "Ich schwimme gern.",
          ok: HOBBY,
          part: [{ when: [`ich ${VERB}( ~)?`, "(schwimmen|lesen|kochen|tanzen|fussball)( spielen)?"], accept: true }],
          then: [d("kim", "Super! Dann bist du hier richtig.", "Bagus! Kalau begitu kamu berada di tempat yang tepat.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "plan",
      intro: [tu("Hobi lebih seru kalau direncanakan bersama. Untuk itu kamu perlu menjawab pertanyaan soal waktu luang.")],
      models: [
        td("Hast du am Sonntag Zeit?", "Kamu punya waktu hari Minggu? (die Zeit = waktu)"),
        td("Ja, am Sonntag habe ich Zeit.", "Ya, hari Minggu aku punya waktu. (kata kerja tetap di posisi kedua)"),
        td("Nein, am Sonntag habe ich keine Zeit.", "Tidak, hari Minggu aku tidak punya waktu."),
      ],
      tip: "Kalau kalimat dibuka dengan keterangan waktu, kata kerja tetap nomor dua: „Am Sonntag habe ich Zeit“ — bukan „Am Sonntag ich habe“. Jawab pertanyaanku.",
      practice: {
        ask: [d("tutor", "Hast du am Sonntag Zeit?", "Kamu punya waktu hari Minggu?", "question")],
        chips: PLAN_CHIPS,
        hints: ["Katakan apakah kamu punya waktu hari Minggu.", "Mulai dengan: „Ja, am Sonntag habe ich …“"],
        model: "Ja, am Sonntag habe ich Zeit.",
        ok: PLAN,
        part: [
          { when: ["(ja |nein )?am sonntag ich habe (keine )?zeit"], say: [tu("Hampir! Kata kerja harus tetap di posisi kedua: „Am Sonntag habe ich Zeit.“", "question")] },
          { when: ["ja", "nein"], say: [tu("Jelas — tetapi lengkapi: „Ja, am Sonntag habe ich Zeit.“")] },
        ],
      },
      praise: "Tepat! Kata kerja di posisi kedua — aturan yang paling sering dilupakan pemula, dan kamu sudah memegangnya.",
      go: "Menuju tepi kolam",
    }),

    hub({
      bg: "u10-renang",
      intro: [n("Mia sudah di dalam air dan melambai. Di tepi kolam, Jonas berdiri dengan bola di tangan. Di meja pendaftaran, Kim masih mengisi formulirmu.")],
      prompt: "Siapa yang kamu hampiri?",
      side: {
        label: "Lengkapi formulir bersama Kim",
        leave: "Kamu berjalan ke tepi kolam.",
        enc: {
          who: "kim",
          open: [d("kim", "Noch eine Frage für das Formular: Wo arbeitest du?", "Satu pertanyaan lagi untuk formulir: di mana kamu bekerja?", "question")],
          turns: [
            {
              obj: "job",
              chips: "Ich arbeite in der Bibliothek .",
              hints: ["Kim menanyakan tempat kerjamu.", "Seperti kepada Frau Kaya: „Ich arbeite in …“"],
              model: "Ich arbeite in der Bibliothek.",
              ok: ["ich arbeite in der bibliothek"],
              part: [{ when: ["(in der )?bibliothek", "ich arbeite (in|im|in die|in dem) bibliothek"], accept: true }],
              then: [d("kim", "Bibliothek — notiert. Danke!", "Perpustakaan — tercatat. Terima kasih!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Temui Jonas di tepi kolam",
        enc: {
          who: "jonas",
          open: [d("jonas", "Hey, {name}! Hast du am Sonntag Zeit?", "Hei, {name}! Kamu punya waktu hari Minggu?", "question")],
          turns: [
            {
              obj: "plan",
              chips: PLAN_CHIPS,
              hints: ["Jonas ingin tahu apakah kamu senggang hari Minggu.", "Mulai dengan: „Ja, am Sonntag habe ich …“"],
              model: "Ja, am Sonntag habe ich Zeit.",
              ok: PLAN,
              part: [
                { when: ["(ja |nein )?am sonntag ich habe (keine )?zeit"], say: [d("jonas", "Am Sonntag hast du … Zeit? Oder keine Zeit?", "Hari Minggu kamu … punya waktu? Atau tidak?", "question")] },
                { when: ["ja( gern)?", "nein( leider)?"], accept: true },
              ],
              then: [d("jonas", "Gut zu wissen!", "Bagus untuk diketahui!", "smile")],
            },
            {
              obj: "hobby",
              ask: [d("jonas", "Ich spiele am Sonntag Fußball. Spielst du auch gern Fußball?", "Aku main sepak bola hari Minggu. Kamu juga suka main sepak bola?", "question")],
              chips: "Nein Ja , ich schwimme lieber gern spiele auch Fußball .",
              hints: ["Jonas mengira kamu penggemar sepak bola. Katakan apa yang lebih kamu sukai — atau setujui.", "Mulai dengan: „Nein, ich schwimme lieber.“"],
              model: "Nein, ich schwimme lieber.",
              ok: [`(nein )?ich ${VERB} lieber( ~)?`, "(ja )?ich spiele (auch )?(sehr )?(gern|gerne)( auch)? fussball", `(nein )?ich ${VERB} (gern|gerne)( ~)?`],
              part: [{ when: ["ja( gern)?", "nein( danke)?", "(nein )?lieber schwimmen"], accept: true }],
              then: [d("jonas", "Alles klar! Hauptsache Bewegung — das sagt auch dein Arzt.", "Beres! Yang penting bergerak — itu juga kata doktermu.", "smile")],
            },
          ],
          close: [d("jonas", "Übrigens: Der Verein macht einen Ausflug. Hier, lies mal!", "Omong-omong: klub mengadakan tamasya. Ini, baca deh!", "smile")],
        },
      },
      exit: "Baca selebaran dari Jonas",
    }),

    payoff({
      lines: [
        nd("Vereinsausflug nach Hamburg! Sonntag, 9 Uhr, Gleis 3.", "Tamasya klub ke Hamburg! Minggu, jam 9, peron 3. — Di bawahnya Mia menulis: „Kauf deine Fahrkarte selbst!“ — Beli tiketmu sendiri!", {
          overlay: paper("ticket", "Vereinsausflug\nnach Hamburg!\nSonntag, 9 Uhr · Gleis 3", "Kauf deine Fahrkarte selbst! — Mia"),
          sfx: "paper",
        }),
      ],
    }),
  ],
});
