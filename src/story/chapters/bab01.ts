// ===== Bab 1 · „Tanda Cangkir" — Unit 1: asal & kabar =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { INTRO_FULL, NAME_ONLY, ORIGIN, WELL } from "./shared";

export const bab01 = chapter({
  id: "bab-01",
  no: 1,
  unit: 1,
  title: "Tanda Cangkir",
  tagline: "Gambar cangkir di surat Mia ternyata sebuah undangan.",
  cover: "u01-perkenalan",
  place: "Apartemen Mia",
  objectives: [
    { id: "origin", title: "Menyebut negara asal", phrase: "Ich komme aus …" },
    { id: "wellbeing", title: "Menanyakan dan menjawab kabar", phrase: "Wie geht's? — Gut, danke!" },
  ],
  next: "Berikutnya: angka, harga, dan jam — supaya kamu tidak tersesat di pasar hari Sabtu.",
  beats: [
    opening({
      bg: "kamar",
      lines: [n("Pagi berikutnya. Surat Mia masih tergeletak di meja: „Bis morgen!“ — dan gambar cangkir kecil itu.")],
      prompt: "Apa yang kamu perhatikan?",
      look: [
        {
          label: "Balik suratnya",
          lines: [
            nd("Kaffee bei mir? 10 Uhr.", "Ngopi di tempatku? Jam 10.", { overlay: paper("letter", "Kaffee bei mir?\n10 Uhr.", "— Mia"), sfx: "paper" }),
            n("Jadi itu arti cangkirnya: sebuah undangan."),
          ],
        },
        {
          label: "Lihat peta dunia di dinding",
          lines: [n("Peta dunia tua. Seseorang menandai kota ini dengan paku payung merah. Rumahmu sendiri terasa jauh sekali di ujung peta.")],
        },
      ],
      go: "Bersiap ke sebelah",
    }),

    lesson({
      obj: "origin",
      intro: [tu("Undangan pertamamu! Orang yang baru kenal hampir selalu menanyakan satu hal: dari mana asalmu.")],
      models: [
        td("Woher kommst du?", "Dari mana asalmu? (woher = dari mana)"),
        td("Ich komme aus Indonesien.", "Saya berasal dari Indonesia. (aus = dari)"),
      ],
      tip: "Kata kerjanya mengikuti subjek: ich komm-e, du komm-st. Nama negaranya tinggal kamu ganti. Sekarang jawab pertanyaanku.",
      practice: {
        ask: [d("tutor", "Woher kommst du?", "Dari mana asalmu?", "question")],
        chips: "Ich komme aus Indonesien Deutschland wohne .",
        hints: ["Kamu ingin memberi tahu negara asalmu.", "Mulai dengan: „Ich komme aus …“"],
        model: "Ich komme aus Indonesien.",
        ok: ORIGIN,
        part: [
          { when: ["aus ~", "(indonesien|indonesia)"], say: [tu("Maksudmu sudah jelas. Sekarang bungkus dalam kalimat utuh: „Ich komme aus …“")] },
          { when: ["ich (komme|kommen|kommst|komm)( aus)?( ~)?"], say: [tu("Hampir! Dengan „ich“ kata kerjanya berakhiran -e, lalu „aus“ dan nama negara: „Ich komme aus …“", "question")] },
        ],
      },
      praise: "Bagus. Pasang telinga untuk kata „Woher …?“ — begitu kata itu muncul, jawabanmu sudah siap.",
      go: "Ketuk pintu Mia",
    }),

    encounter({
      who: "mia",
      bg: "u01-perkenalan",
      open: [
        d("mia", "Hallo, {name}! Komm rein!", "Halo, {name}! Masuklah!", "smile", { sfx: "door" }),
        d("mia", "Der Kaffee ist fertig. Sag mal: Woher kommst du?", "Kopinya sudah siap. Omong-omong: dari mana asalmu?", "question"),
      ],
      turns: [
        {
          obj: "origin",
          chips: "Ich komme aus Indonesien Japan bin . ,",
          hints: ["Mia bertanya dari negara mana kamu berasal.", "Mulai dengan: „Ich komme aus …“"],
          model: "Ich komme aus Indonesien.",
          ok: ORIGIN,
          part: [
            { when: ["aus ~", "(indonesien|indonesia)"], accept: true },
            { when: ["(ich heisse|ich bin) ~"], say: [d("mia", "Ja, das weiß ich schon! Aber woher kommst du?", "Ya, itu aku sudah tahu! Tapi dari mana asalmu?", "smile")] },
          ],
          then: [d("mia", "Oh, wie schön! Ich komme aus Leipzig.", "Wah, bagus sekali! Aku berasal dari Leipzig.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "wellbeing",
      intro: [tu("Sebelum mengobrol lebih jauh, orang di sini saling menanyakan kabar. Jawabannya pendek saja.")],
      models: [
        td("Wie geht's?", "Apa kabar? (kepada teman)"),
        td("Gut, danke! Und dir?", "Baik, terima kasih! Dan kamu? (dir = kepadamu)"),
        td("Wie geht es Ihnen?", "Apa kabar? (sopan, kepada orang yang belum akrab)"),
      ],
      tip: "Kepada teman: „Und dir?“. Kepada orang yang kamu sapa Herr atau Frau: „Und Ihnen?“. Coba jawab aku.",
      practice: {
        ask: [d("tutor", "Wie geht's?", "Apa kabar?", "question")],
        chips: "Gut danke ! Und dir ? , sehr Ihnen",
        hints: ["Kamu ingin bilang kabarmu baik, lalu berterima kasih.", "Mulai dengan: „Gut, …“"],
        model: "Gut, danke!",
        ok: WELL,
        part: [{ when: ["danke( schon)?"], say: [tu("Sopan sekali! Tambahkan kabarmu di depannya: „Gut, danke!“")] }],
      },
      praise: "Persis. Kalau kamu menambahkan „Und dir?“, percakapan jadi berbalas — itu yang membuat orang betah mengobrol.",
      go: "Lanjutkan obrolan",
    }),

    hub({
      bg: "pintu",
      intro: [n("Mia ke dapur mengambil kue. Dari kamar sebelah muncul seseorang membawa dua cangkir, dan di lorong terdengar langkah kaki penjaga gedung.")],
      prompt: "Siapa yang kamu hampiri?",
      side: {
        label: "Sapa penjaga gedung di lorong",
        leave: "Kamu tersenyum sopan dan kembali ke ruang tamu Mia.",
        enc: {
          who: "kaya",
          open: [d("kaya", "Guten Tag! Sie sind neu hier, oder? Wie heißen Sie?", "Selamat siang! Anda baru di sini, ya? Siapa nama Anda?", "question")],
          turns: [
            {
              obj: "introduce",
              chips: "Guten Tag ! Ich heiße bin {name} . ,",
              hints: ["Ia menanyakan namamu dengan sopan: „Sie“ = Anda.", "Jawabannya tetap sama: „Ich heiße …“"],
              model: "Ich heiße {name}.",
              ok: INTRO_FULL,
              part: [{ when: NAME_ONLY, accept: true }],
              then: [d("kaya", "Willkommen im Haus, {name}!", "Selamat datang di gedung ini, {name}!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Berkenalan dengan teman serumah Mia",
        enc: {
          who: "jonas",
          open: [d("jonas", "Hi! Ich bin Jonas. Wie geht's?", "Hai! Aku Jonas. Apa kabar?", "smile")],
          turns: [
            {
              obj: "wellbeing",
              chips: "Gut danke ! Und dir ? , sehr",
              hints: ["Jonas menanyakan kabarmu.", "Mulai dengan: „Gut, …“ lalu berterima kasih."],
              model: "Gut, danke! Und dir?",
              ok: WELL,
              part: [{ when: ["danke( schon)?"], say: [d("jonas", "Bitte! Aber … wie geht's dir?", "Sama-sama! Tapi … apa kabarmu?", "question")] }],
              then: [d("jonas", "Auch gut, danke!", "Baik juga, terima kasih!", "smile")],
            },
            {
              obj: "origin",
              ask: [d("jonas", "Mia sagt, du bist neu hier. Kommst du aus Japan?", "Kata Mia, kamu baru di sini. Kamu dari Jepang?", "question")],
              chips: "Nein Ja , ich komme aus Indonesien Japan .",
              hints: ["Jonas salah menebak negaramu. Luruskan dengan sopan.", "Mulai dengan: „Nein, ich komme aus …“"],
              model: "Nein, ich komme aus Indonesien.",
              ok: ORIGIN,
              part: [
                { when: ["nein( aus)?( ~)?", "aus ~"], say: [d("jonas", "Nein? Woher kommst du dann?", "Bukan? Lalu kamu dari mana?", "question")] },
                { when: ["ja"], say: [d("jonas", "Wirklich? Mia sagt etwas anderes. Woher kommst du?", "Benarkah? Mia bilang lain. Dari mana asalmu?", "think")] },
              ],
              then: [d("jonas", "Ach so! Entschuldigung. Das ist ja weit weg!", "Oh begitu! Maaf. Itu jauh sekali!", "smile")],
            },
          ],
        },
      },
      exit: "Kembali ke meja kopi",
    }),

    payoff({
      bg: "u01-perkenalan",
      lines: [
        n("Mia kembali dan menyelipkan selembar kertas terlipat ke tanganmu.", { sfx: "paper" }),
        nd("Samstag, 9 Uhr: Markt!", "Sabtu, jam 9: pasar! — Di sudutnya Mia menggambar sebuah jam kecil.", { overlay: paper("note", "Samstag, 9 Uhr:\nMarkt!", "— Mia") }),
      ],
    }),
  ],
});
