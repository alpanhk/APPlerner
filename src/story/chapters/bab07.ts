// ===== Bab 7 · „Peta Bertanda Silang" — Unit 7: menanyakan & menunjukkan arah =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const ASK_LIB = ["wo ist (hier )?(die|eine) bibliothek( bitte)?", "wie komme ich zur bibliothek( bitte)?"];
const ASK_CHIPS = "Entschuldigung , wo ist die der Bibliothek Bahnhof ?";
const DIR_CHIPS = "Gehen Sie geradeaus nach links rechts . Dann";
const SIB_ONE = "(einen bruder|eine schwester|(zwei|drei|vier|[2-9]) (bruder|schwestern))";

export const bab07 = chapter({
  id: "bab-07",
  no: 7,
  unit: 7,
  title: "Peta Bertanda Silang",
  tagline: "Tinta peta luntur tepat di belokan terakhir. Kamu harus bertanya — lalu ditanya.",
  cover: "u07-kota-arah",
  place: "Alun-alun kota",
  objectives: [
    { id: "askway", title: "Menanyakan jalan", phrase: "Entschuldigung, wo ist …?" },
    { id: "direct", title: "Menunjukkan arah", phrase: "Gehen Sie geradeaus." },
  ],
  next: "Berikutnya: hari kerja pertamamu — jam kerja dan tugas.",
  beats: [
    opening({
      bg: "u07-kota-arah",
      lines: [n("Selasa pagi. Kamu berdiri di alun-alun dengan peta lusuh. Tanda silang merahnya jelas — tetapi nama jalannya sudah luntur.")],
      prompt: "Apa yang kamu periksa?",
      look: [
        { label: "Baca papan penunjuk jalan", lines: [nd("Rathaus links, Bahnhof rechts", "Balai kota ke kiri, stasiun ke kanan", { overlay: paper("sign", "← Rathaus\nBahnhof →") })] },
        { label: "Periksa peta dari Mia", lines: [n("Dari alun-alun: lurus, lalu satu belokan. Ke kiri atau ke kanan? Tintanya luntur persis di situ.")] },
      ],
      go: "Cari orang untuk ditanya",
    }),

    lesson({
      obj: "askway",
      intro: [tu("Tersesat itu biasa. Yang penting kamu berani bertanya — dan di sini orang selalu membukanya dengan satu kata sopan.")],
      models: [
        td("Entschuldigung, wo ist die Bibliothek?", "Permisi, di mana perpustakaan? (Entschuldigung = permisi / maaf)"),
        td("Wo ist der Bahnhof?", "Di mana stasiun?"),
        td("Vielen Dank!", "Terima kasih banyak!"),
      ],
      tip: "Polanya: „Entschuldigung, wo ist …?“ lalu nama tempat beserta der/die/das-nya: die Bibliothek, der Bahnhof, das Rathaus. Tanyakan perpustakaan kepadaku.",
      practice: {
        prompt: "Latihan: tanyakan letak perpustakaan.",
        chips: ASK_CHIPS,
        hints: ["Kamu ingin tahu letak perpustakaan.", "Mulai dengan: „Entschuldigung, wo ist …?“"],
        model: "Entschuldigung, wo ist die Bibliothek?",
        ok: ASK_LIB,
        part: [
          { when: ["wo ist ((der|das) )?bibliothek"], say: [tu("Hampir! „Bibliothek“ itu die: „Wo ist die Bibliothek?“", "question")] },
          { when: ["(die )?bibliothek"], say: [tu("Itu tempatnya. Jadikan pertanyaan: „Wo ist die Bibliothek?“")] },
        ],
      },
      praise: "Bagus. Dan jangan lupa „Vielen Dank!“ sesudahnya.",
      go: "Hampiri seorang pejalan kaki",
    }),

    encounter({
      who: "tetangga",
      open: [d("tetangga", "Ah, {name}! Guten Morgen! Suchst du etwas?", "Ah, {name}! Selamat pagi! Kamu mencari sesuatu?", "smile")],
      turns: [
        {
          obj: "askway",
          prompt: "Giliranmu. Tanyakan letak perpustakaan.",
          chips: ASK_CHIPS,
          hints: ["Herr Brandt menawarkan bantuan. Tanyakan di mana perpustakaan.", "Mulai dengan: „Entschuldigung, wo ist …?“"],
          model: "Entschuldigung, wo ist die Bibliothek?",
          ok: ASK_LIB,
          part: [{ when: ["wo ist ((der|das) )?bibliothek", "(ja )?(die )?bibliothek( bitte)?"], accept: true }],
          then: [
            d("tetangga", "Die Bibliothek? Geh geradeaus und dann nach rechts.", "Perpustakaan? Jalan lurus, lalu ke kanan.", "smile"),
            n("Lurus, lalu ke kanan. Tinta yang luntur di peta itu akhirnya terjawab."),
          ],
        },
      ],
    }),

    lesson({
      obj: "direct",
      intro: [tu("Kamu baru saja menerima petunjuk arah. Suatu hari orang lain akan bertanya kepadamu — jadi mari pelajari cara memberikannya.")],
      models: [
        td("Gehen Sie geradeaus.", "Jalanlah lurus. (sopan, kepada orang asing)"),
        td("Gehen Sie nach links.", "Jalanlah ke kiri."),
        td("Dann nach rechts.", "Lalu ke kanan. (dann = lalu)"),
      ],
      tip: "Tiga arah saja: geradeaus (lurus), nach links (ke kiri), nach rechts (ke kanan). Kepada orang asing: „Gehen Sie …“. Suruh aku berjalan lurus.",
      practice: {
        prompt: "Latihan: suruh Frau Lehmann berjalan lurus.",
        chips: DIR_CHIPS,
        hints: ["Kamu ingin menyuruh seseorang berjalan lurus, dengan sopan.", "Mulai dengan: „Gehen Sie …“"],
        model: "Gehen Sie geradeaus.",
        ok: ["gehen sie (immer )?geradeaus", "geh (immer )?geradeaus"],
        part: [
          { when: ["sie gehen geradeaus"], say: [tu("Untuk menyuruh, kata kerjanya di depan: „Gehen Sie geradeaus.“", "question")] },
          { when: ["gehen sie (nach )?(links|rechts)"], say: [tu("Kalimatnya benar, tetapi arahnya lurus: „geradeaus“.")] },
          { when: ["(immer )?geradeaus"], say: [tu("Arahnya benar. Kalimat sopannya: „Gehen Sie geradeaus.“")] },
        ],
      },
      praise: "Bagus! Sekarang kamu bukan hanya bisa bertanya, tetapi juga menolong.",
      go: "Berjalan menuju perpustakaan",
    }),

    hub({
      bg: "u07-kota-arah",
      intro: [n("Kamu berjalan lurus. Di persimpangan, seorang pelancong beransel memutar-mutar peta dengan bingung. Di bangku taman, Herr Brandt beristirahat.")],
      prompt: "Siapa yang kamu hampiri?",
      side: {
        label: "Duduk sebentar bersama Herr Brandt",
        leave: "Kamu melambai kepada Herr Brandt dan berjalan terus.",
        enc: {
          who: "tetangga",
          open: [d("tetangga", "Setz dich kurz! Sag mal, hast du Geschwister?", "Duduklah sebentar! Omong-omong, kamu punya saudara kandung?", "smile")],
          turns: [
            {
              obj: "siblings",
              chips: "Ich habe einen eine keine Bruder Schwester Geschwister . Ja Nein , zwei",
              hints: ["Ia menanyakan kakak-adikmu, seperti Onkel Stefan dulu.", "Mulai dengan: „Ich habe …“"],
              model: "Ich habe einen Bruder.",
              ok: [`((ja|nein) )?ich habe ${SIB_ONE}( und ${SIB_ONE})?`, "((ja|nein) )?ich habe keine geschwister"],
              part: [{ when: ["ja", "nein", SIB_ONE, "keine geschwister", "((ja|nein) )?ich habe (ein|eine|einen) (bruder|schwester)"], accept: true }],
              then: [d("tetangga", "Schön! Familie ist wichtig.", "Bagus! Keluarga itu penting.", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Tolong pelancong yang kebingungan",
        enc: {
          who: "marek",
          open: [
            d("marek", "Entschuldigung! Wo ist der Bahnhof?", "Permisi! Di mana stasiun?", "question"),
            n("Kamu ingat papan penunjuk tadi: ke stasiun — lurus dulu, lalu ke kanan."),
          ],
          turns: [
            {
              obj: "direct",
              prompt: "Giliranmu. Mula-mula ia harus berjalan lurus.",
              chips: DIR_CHIPS,
              hints: ["Pelancong itu mencari stasiun. Langkah pertamanya: lurus.", "Mulai dengan: „Gehen Sie …“"],
              model: "Gehen Sie geradeaus.",
              ok: ["gehen sie (immer )?geradeaus( und dann (nach )?rechts)?", "geh (immer )?geradeaus"],
              part: [
                { when: ["(immer )?geradeaus( bitte)?", "sie gehen geradeaus"], accept: true },
                { when: ["(gehen sie )?(nach )?(links|rechts)"], say: [d("marek", "Jetzt gleich? Aber hier ist eine Wand!", "Sekarang juga? Tapi di sini ada tembok!", "think")] },
              ],
              then: [d("marek", "Geradeaus, okay.", "Lurus, oke.", "neutral")],
            },
            {
              obj: "direct",
              ask: [d("marek", "Und dann nach links?", "Lalu ke kiri?", "question")],
              chips: "Nein Ja , dann nach rechts links . gehen Sie",
              hints: ["Ia salah menebak belokan. Stasiun ada di sebelah kanan.", "Mulai dengan: „Nein, dann nach …“"],
              model: "Nein, dann nach rechts.",
              ok: ["nein (dann )?(gehen sie )?(dann )?nach rechts", "(dann )?gehen sie (dann )?nach rechts", "dann nach rechts"],
              part: [
                { when: ["(nein )?(nach )?rechts"], accept: true },
                { when: ["nein"], say: [d("marek", "Nicht links? Wohin dann?", "Bukan kiri? Lalu ke mana?", "question")] },
                { when: ["ja( ~)?", "(dann )?(nach )?links"], say: [d("marek", "Links? Aber dort ist das Rathaus …", "Kiri? Tapi di sana balai kota …", "think")] },
              ],
              then: [d("marek", "Geradeaus und dann nach rechts. Vielen Dank!", "Lurus lalu ke kanan. Terima kasih banyak!", "smile")],
            },
          ],
          close: [d("marek", "Ich bin übrigens Marek. Vielleicht sehen wir uns am Bahnhof!", "Omong-omong, aku Marek. Mungkin kita bertemu di stasiun!", "smile")],
        },
      },
      exit: "Belok kanan menuju perpustakaan",
    }),

    payoff({
      lines: [
        n("Perpustakaan kota. Di pintu kacanya tertempel selembar pengumuman — dan sebuah catatan kecil bertuliskan namamu."),
        nd("Aushilfe gesucht! Start: Montag, 8 Uhr.", "Dicari tenaga bantu! Mulai: Senin, jam 8. — Di catatan kecilnya Mia menulis: „Das ist dein Job, {name}!“ — Ini pekerjaanmu!", {
          overlay: paper("sign", "Aushilfe gesucht!\nStart: Montag, 8 Uhr", "Das ist dein Job, {name}! — Mia"),
          sfx: "paper",
        }),
      ],
    }),
  ],
});
