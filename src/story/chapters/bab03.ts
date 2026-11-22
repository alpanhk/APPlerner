// ===== Bab 3 · „Foto Keluarga" — Unit 3: keluarga & saudara =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const F = "(mutter|schwester|oma|tante|freundin|tochter|frau|nachbarin)";
const M = "(vater|bruder|opa|onkel|freund|sohn|mann)";
const MANY = "(zwei|drei|vier|funf|[2-9]) (bruder|schwestern)";
const SIB_ONE = `(einen bruder|eine schwester|${MANY})`;
const SIB = [`((ja|nein) )?ich habe ${SIB_ONE}( und ${SIB_ONE})?`, "((ja|nein) )?ich habe keine geschwister"];
const SIB_CHIPS = "Ich habe einen eine keine Bruder Schwester Geschwister . Ja Nein , zwei und";

export const bab03 = chapter({
  id: "bab-03",
  no: 3,
  unit: 3,
  title: "Foto Keluarga",
  tagline: "Minum kopi Minggu sore di rumah Oma Helga — dan semua orang ingin tahu keluargamu.",
  cover: "u03-keluarga",
  place: "Rumah Oma Helga",
  objectives: [
    { id: "family", title: "Mengenalkan anggota keluarga", phrase: "Das ist meine Mutter." },
    { id: "siblings", title: "Menyebut saudara kandung", phrase: "Ich habe einen Bruder." },
  ],
  next: "Berikutnya: memesan makanan dan minuman di Café Linde.",
  beats: [
    opening({
      bg: "jalan",
      lines: [n("Minggu sore. Kamu berdiri di depan sebuah rumah tua dengan kartu undangan di tangan. Di balik kartu itu tertempel foto.")],
      prompt: "Apa yang kamu amati?",
      look: [
        {
          label: "Lihat foto di balik kartu",
          lines: [
            nd("Meine Familie", "Keluargaku", { overlay: paper("note", "Meine Familie", "(foto: Mia di antara dua orang)") }),
            n("Mia berdiri di antara seorang nenek berambut perak dan seorang pria berjas merah marun."),
          ],
        },
        { label: "Baca papan nama di pintu", lines: [nd("Familie Hoffmann", "Keluarga Hoffmann", { overlay: paper("sign", "Familie Hoffmann") })] },
      ],
      go: "Tekan bel",
    }),

    lesson({
      obj: "family",
      intro: [tu("Di rumah keluarga, orang saling memperkenalkan sambil menunjuk: ini ibuku, ini kakakku. Kuncinya ada di satu kata kecil: mein atau meine.")],
      models: [
        td("Das ist mein Vater.", "Ini ayah saya. (der Vater → mein)"),
        td("Das ist meine Mutter.", "Ini ibu saya. (die Mutter → meine)"),
        td("Mia ist meine Nachbarin.", "Mia adalah tetangga saya. (die Nachbarin → meine)"),
      ],
      tip: "Untuk laki-laki „mein“: mein Vater, mein Bruder, mein Opa. Untuk perempuan „meine“: meine Mutter, meine Schwester, meine Oma. Bayangkan kamu menunjukkan foto ibumu.",
      practice: {
        prompt: "Latihan: perkenalkan ibumu di foto.",
        chips: "Das ist mein meine Mutter Vater Oma .",
        hints: ["Kamu menunjuk foto ibumu dan mengenalkannya.", "Mulai dengan: „Das ist meine …“"],
        model: "Das ist meine Mutter.",
        ok: ["das ist meine mutter"],
        part: [
          { when: ["das ist mein mutter"], say: [tu("Hampir! „Mutter“ perempuan, jadi „meine“: „Das ist meine Mutter.“", "question")] },
          { when: [`(das ist )?(mein|meine) (${F}|${M})`], say: [tu("Susunannya benar — tetapi yang kutanyakan ibumu: „Mutter“.")] },
          { when: ["mutter"], say: [tu("Orangnya benar. Sekarang kalimat utuh: „Das ist meine Mutter.“")] },
        ],
      },
      praise: "Bagus! mein untuk laki-laki, meine untuk perempuan — telingamu akan cepat terbiasa.",
      go: "Masuk ke ruang keluarga",
    }),

    encounter({
      who: "helga",
      bg: "u03-keluarga",
      open: [
        d("helga", "Herzlich willkommen! Ich bin Helga, Mias Oma.", "Selamat datang! Aku Helga, nenek Mia.", "smile", { sfx: "bell" }),
        n("Kamu menunjukkan foto keluargamu di ponsel. Oma Helga menunjuk seseorang di foto itu."),
        d("helga", "Oh, ein Foto! Wer ist das?", "Oh, sebuah foto! Siapa ini?", "question"),
      ],
      turns: [
        {
          obj: "family",
          chips: "Das ist mein meine Mutter Vater Schwester Bruder .",
          hints: ["Oma Helga menunjuk seseorang di fotomu dan bertanya siapa dia.", "Mulai dengan: „Das ist meine …“ atau „Das ist mein …“"],
          model: "Das ist meine Mutter.",
          ok: [`das ist meine ${F}`, `das ist mein ${M}`],
          part: [
            { when: [`das ist mein ${F}`], say: [d("helga", "Ah, eine Frau — also „meine“! Noch einmal, bitte.", "Ah, seorang perempuan — jadi „meine“! Sekali lagi, ya.", "smile")] },
            { when: [`das ist meine ${M}`], say: [d("helga", "Ah, ein Mann — also „mein“! Noch einmal, bitte.", "Ah, seorang laki-laki — jadi „mein“! Sekali lagi, ya.", "smile")] },
            { when: [`(mein |meine )?(${F}|${M})`], accept: true },
          ],
          then: [d("helga", "Wie schön! Ein sehr nettes Foto.", "Bagus sekali! Foto yang sangat manis.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "siblings",
      intro: [tu("Pertanyaan berikutnya di meja kopi keluarga hampir pasti: kamu punya saudara?")],
      models: [
        td("Hast du Geschwister?", "Kamu punya saudara kandung? (Geschwister = kakak-adik)"),
        td("Ich habe einen Bruder.", "Saya punya satu saudara laki-laki. (der Bruder → einen)"),
        td("Ich habe eine Schwester.", "Saya punya satu saudara perempuan. (die Schwester → eine)"),
        td("Ich habe keine Geschwister.", "Saya tidak punya saudara kandung. (keine = tidak punya)"),
      ],
      tip: "Setelah „ich habe“: einen Bruder, eine Schwester. Lebih dari satu: zwei Brüder, zwei Schwestern. Jawab sesuai keluargamu sendiri.",
      practice: {
        ask: [d("tutor", "Hast du Geschwister?", "Kamu punya saudara kandung?", "question")],
        chips: SIB_CHIPS,
        hints: ["Ceritakan saudara kandungmu — atau katakan bahwa kamu tidak punya.", "Mulai dengan: „Ich habe …“"],
        model: "Ich habe einen Bruder.",
        ok: SIB,
        part: [
          { when: ["((ja|nein) )?ich habe (ein|eine|einen) (bruder|schwester)"], say: [tu("Hampir! Laki-laki: „einen Bruder“. Perempuan: „eine Schwester“.", "question")] },
          { when: ["ja", "nein", SIB_ONE, "keine geschwister"], say: [tu("Maksudmu jelas. Sekarang kalimat utuh: „Ich habe …“")] },
        ],
      },
      praise: "Bagus. Perhatikan akhiran kecil itu: einen untuk laki-laki, eine untuk perempuan.",
      go: "Duduk di meja kopi",
    }),

    hub({
      bg: "u03-keluarga",
      intro: [n("Kue apel sudah dipotong. Oma Helga sibuk di dapur. Di sofa, seorang pria berjas merah marun membolak-balik album foto.")],
      prompt: "Siapa yang kamu temani?",
      side: {
        label: "Bantu Oma Helga di dapur",
        leave: "Kamu kembali ke ruang keluarga.",
        enc: {
          who: "helga",
          open: [d("helga", "Oh, meine Brille ist weg! Wie spät ist es, bitte?", "Aduh, kacamataku hilang! Jam berapa sekarang?", "question")],
          turns: [
            {
              obj: "time",
              prompt: "Giliranmu. Jam dapur menunjuk pukul empat.",
              chips: "Es ist vier drei fünf Uhr .",
              hints: ["Oma Helga tidak bisa melihat jam. Jam dapur menunjuk angka empat.", "Mulai dengan: „Es ist … Uhr.“"],
              model: "Es ist vier Uhr.",
              ok: ["es ist (vier|4|sechzehn|16) uhr"],
              part: [{ when: ["(vier|4|16)( uhr)?", "es ist (vier|4)"], accept: true }],
              then: [d("helga", "Schon vier? Dann gibt es jetzt Kuchen!", "Sudah jam empat? Kalau begitu sekarang waktunya kue!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Duduk di sebelah pria dengan album foto",
        enc: {
          who: "stefan",
          open: [d("stefan", "Hallo! Ich bin Stefan, Mias Onkel. Hast du Geschwister?", "Halo! Aku Stefan, paman Mia. Kamu punya saudara kandung?", "question")],
          turns: [
            {
              obj: "siblings",
              chips: SIB_CHIPS,
              hints: ["Stefan ingin tahu apakah kamu punya kakak atau adik.", "Mulai dengan: „Ich habe …“"],
              model: "Ich habe einen Bruder.",
              ok: SIB,
              part: [
                { when: ["((ja|nein) )?ich habe (ein|eine|einen) (bruder|schwester)"], say: [d("stefan", "Einen Bruder oder eine Schwester?", "Seorang saudara laki-laki atau perempuan?", "question")] },
                { when: ["ja", "nein", SIB_ONE, "keine geschwister"], accept: true },
              ],
              then: [d("stefan", "Schön! Ich habe eine Schwester: Mias Mutter.", "Bagus! Aku punya satu saudara perempuan: ibunya Mia.", "smile")],
            },
            {
              obj: "family",
              ask: [d("stefan", "Und Mia … ist Mia deine Schwester?", "Dan Mia … apakah Mia saudara perempuanmu?", "question")],
              chips: "Nein Ja , Mia ist meine mein Nachbarin Schwester .",
              hints: ["Stefan salah sangka. Mia bukan saudaramu, melainkan tetanggamu: die Nachbarin.", "Mulai dengan: „Nein, Mia ist meine …“"],
              model: "Nein, Mia ist meine Nachbarin.",
              ok: ["(nein )?(mia|sie) ist meine (nachbarin|freundin)", "nein meine (nachbarin|freundin)"],
              part: [
                { when: ["(nein )?(mia|sie) ist mein (nachbarin|freundin)"], say: [d("stefan", "Eine Nachbarin — also „meine“, nicht wahr?", "Seorang tetangga perempuan — jadi „meine“, bukan?", "smile")] },
                { when: ["nein( ~)?"], say: [d("stefan", "Nein? Wer ist Mia dann?", "Bukan? Lalu Mia itu siapa?", "question")] },
                { when: ["ja( ~)?"], say: [d("stefan", "Wirklich? Das ist neu für mich!", "Sungguh? Itu baru bagiku!", "think"), n("Mia tertawa dari dapur dan menggeleng.")] },
              ],
              then: [d("stefan", "Ach so, die Nachbarin! Trotzdem: Du gehörst jetzt zur Familie.", "Oh begitu, tetangga! Meski begitu: sekarang kamu bagian dari keluarga.", "smile")],
            },
          ],
        },
      },
      exit: "Bantu membereskan meja",
    }),

    payoff({
      lines: [
        n("Saat kamu berpamitan, Oma Helga menekankan sebuah kartu resep ke tanganmu. Di baliknya ada tulisan Mia.", { sfx: "paper" }),
        nd("Freitag, 19 Uhr: Café Linde. Tisch für drei!", "Jumat, jam 19: Café Linde. Meja untuk bertiga! — Bertiga? Siapa orang ketiga?", {
          overlay: paper("note", "Freitag, 19 Uhr:\nCafé Linde.\nTisch für drei!", "— Mia"),
        }),
      ],
    }),
  ],
});
