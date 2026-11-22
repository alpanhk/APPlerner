// ===== Bab 6 · „Kunci Lindenstraße" — Unit 6: ruangan & letak barang =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const ADJ = "(schon|hell|gross|klein|ruhig|gemutlich|super|toll|gut|nett|perfekt|dunkel|laut)";
const ROOM = [`(das zimmer|es) ist (sehr |zu )?${ADJ}( und (sehr )?${ADJ})?`, `ich finde (das zimmer|es) (sehr )?${ADJ}( und ${ADJ})?`];
const ROOM_CHIPS = "Das Zimmer ist schön hell groß klein und . sehr";
const CHAIR = ["(der sessel|er) (steht|ist) neben dem (regal|bucherregal)"];
const CHAIR_CHIPS = "Der Sessel steht liegt neben auf dem das Regal Tisch .";

export const bab06 = chapter({
  id: "bab-06",
  no: 6,
  unit: 6,
  title: "Kunci Lindenstraße",
  tagline: "Sebuah kunci, sebuah kamar kosong, dan perabot yang harus menemukan tempatnya.",
  cover: "u06-rumah",
  place: "Lindenstraße 7",
  objectives: [
    { id: "room", title: "Menggambarkan ruangan", phrase: "Das Zimmer ist schön." },
    { id: "place", title: "Menyebut letak barang", phrase: "Der Sessel steht neben dem Regal." },
  ],
  next: "Berikutnya: menanyakan dan menunjukkan arah — tanda silang di peta menunggumu.",
  beats: [
    opening({
      bg: "pintu",
      lines: [n("Senin, pukul lima sore. Lindenstraße 7, lantai dua. Kunci dari saku jaket itu pas di lubangnya.")],
      prompt: "Apa yang kamu baca dulu?",
      look: [
        { label: "Baca papan nama di bel", lines: [nd("E. Schneider — Zimmer frei", "E. Schneider — kamar kosong", { overlay: paper("sign", "E. Schneider\nZimmer frei") })] },
        { label: "Baca selebaran di dinding lorong", lines: [nd("Zimmer, 14 Quadratmeter, hell und ruhig", "Kamar, 14 meter persegi, terang dan tenang", { overlay: paper("note", "Zimmer · 14 m²\nhell und ruhig") })] },
      ],
      go: "Putar kuncinya",
    }),

    lesson({
      obj: "room",
      intro: [tu("Saat melihat kamar, pemiliknya ingin tahu pendapatmu. Cukup satu kalimat: kamarnya bagaimana?")],
      models: [
        td("Wie findest du das Zimmer?", "Bagaimana kamarnya menurutmu? (finden = menilai)"),
        td("Das Zimmer ist schön.", "Kamarnya bagus."),
        td("Das Zimmer ist hell und ruhig.", "Kamarnya terang dan tenang. (und = dan)"),
      ],
      tip: "Kata sifat yang berguna: schön (bagus), hell (terang), groß (besar), klein (kecil), ruhig (tenang). Polanya: „Das Zimmer ist …“ Jawab pertanyaanku.",
      practice: {
        ask: [d("tutor", "Wie findest du das Zimmer?", "Bagaimana kamarnya menurutmu?", "question")],
        chips: ROOM_CHIPS,
        hints: ["Berikan pendapatmu tentang kamar itu dengan satu kata sifat.", "Mulai dengan: „Das Zimmer ist …“"],
        model: "Das Zimmer ist schön.",
        ok: ROOM,
        part: [
          { when: [`(sehr )?${ADJ}( und ${ADJ})?`], say: [tu("Kata sifatnya pas. Sekarang kalimat utuh: „Das Zimmer ist …“")] },
          { when: ["das zimmer ~"], say: [tu("Jangan lupa kata kerjanya „ist“: „Das Zimmer ist …“", "question")] },
        ],
      },
      praise: "Bagus. Pola „… ist …“ ini bisa kamu pakai untuk menilai apa saja.",
      go: "Masuk ke kamar",
    }),

    encounter({
      who: "eva",
      bg: "u06-rumah",
      open: [
        d("eva", "Hallo! Du bist {name}, oder? Ich bin Eva. Das ist das Zimmer.", "Halo! Kamu {name}, kan? Aku Eva. Ini kamarnya.", "smile", { sfx: "door" }),
        d("eva", "Wie findest du das Zimmer?", "Bagaimana kamarnya menurutmu?", "question"),
      ],
      turns: [
        {
          obj: "room",
          chips: ROOM_CHIPS,
          hints: ["Eva ingin tahu pendapatmu tentang kamar itu.", "Mulai dengan: „Das Zimmer ist …“"],
          model: "Das Zimmer ist schön.",
          ok: ROOM,
          part: [{ when: [`(sehr )?${ADJ}( und ${ADJ})?`], accept: true }],
          then: [d("eva", "Das freut mich! Dann ist es jetzt dein Zimmer.", "Aku senang mendengarnya! Kalau begitu sekarang ini kamarmu.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "place",
      intro: [tu("Kamarnya milikmu. Sekarang perabot harus ditata — dan untuk itu kamu perlu kata-kata letak.")],
      models: [
        td("Wo steht der Sessel?", "Di mana kursi berlengan itu berdiri? (wo = di mana; stehen = berdiri)"),
        td("Der Sessel steht neben dem Regal.", "Kursi itu berdiri di sebelah rak. (neben = di sebelah)"),
        td("Der Schlüssel liegt auf dem Regal.", "Kunci itu terletak di atas rak. (liegen = terletak; auf = di atas)"),
      ],
      tip: "Benda yang tegak „steht“, benda yang rebah „liegt“. Untuk menyebut letak, der dan das menjadi „dem“: neben dem Regal, auf dem Tisch. Lihat kursi biru itu.",
      practice: {
        ask: [d("tutor", "Wo steht der Sessel?", "Di mana kursi berlengan itu berdiri?", "question")],
        prompt: "Latihan: kursi itu berdiri di sebelah rak.",
        chips: CHAIR_CHIPS,
        hints: ["Kursi biru itu berdiri tepat di sebelah rak buku.", "Mulai dengan: „Der Sessel steht neben …“"],
        model: "Der Sessel steht neben dem Regal.",
        ok: CHAIR,
        part: [
          { when: ["(der sessel|er) (steht|ist) neben (das|der|den) (regal|bucherregal)"], say: [tu("Hampir! Untuk letak, „das Regal“ menjadi „dem Regal“: neben dem Regal.", "question")] },
          { when: ["(der sessel|er) liegt neben ~"], say: [tu("Kursi itu tegak, jadi „steht“, bukan „liegt“.")] },
          { when: ["neben (dem|das) regal"], say: [tu("Letaknya benar. Kalimat utuhnya: „Der Sessel steht neben dem Regal.“")] },
        ],
      },
      praise: "Tepat! steht untuk yang tegak, liegt untuk yang rebah, dan „dem“ setelah kata letak.",
      go: "Mulai menata kamar",
    }),

    hub({
      bg: "u06-rumah",
      intro: [n("Di tangga terdengar napas terengah: Jonas datang membantu sambil memeluk sebuah lampu. Eva muncul dari dapur membawa nampan.", { sfx: "knock" })],
      prompt: "Siapa yang kamu tanggapi?",
      side: {
        label: "Terima tawaran minum dari Eva",
        leave: "Kamu kembali menata kamar.",
        enc: {
          who: "eva",
          open: [d("eva", "Eine Pause? Möchtest du einen Tee oder einen Kaffee?", "Istirahat dulu? Kamu mau teh atau kopi?", "smile")],
          turns: [
            {
              obj: "order",
              chips: "Ich möchte einen Tee Kaffee , bitte . ein",
              hints: ["Eva menawarimu minum. Jawab seperti saat memesan di Café Linde.", "Mulai dengan: „Ich möchte einen …“"],
              model: "Ich möchte einen Tee, bitte.",
              ok: ["ich (mochte|nehme|hatte gern) (einen tee|einen kaffee)( bitte)?"],
              part: [{ when: ["((einen|ein) )?(tee|kaffee)( bitte)?"], accept: true }],
              then: [d("eva", "Gern! Einen Moment.", "Tentu! Sebentar.", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Tata perabot bersama Jonas",
        enc: {
          who: "jonas",
          open: [d("jonas", "Puh! Ich helfe dir. Wo steht der Sessel?", "Fiuh! Aku bantu kamu. Kursi berlengannya berdiri di mana?", "question")],
          turns: [
            {
              obj: "place",
              prompt: "Giliranmu. Kursi itu berdiri di sebelah rak.",
              chips: CHAIR_CHIPS,
              hints: ["Jonas ingin tahu letak kursi. Kursi itu berdiri di sebelah rak.", "Mulai dengan: „Der Sessel steht neben …“"],
              model: "Der Sessel steht neben dem Regal.",
              ok: CHAIR,
              part: [{ when: ["neben (dem|das|der|den) regal", "(der sessel|er) (steht|ist|liegt) neben (das|der|den) regal"], accept: true, say: [d("jonas", "Ah, neben dem Regal! Alles klar.", "Ah, di sebelah rak — neben dem Regal! Beres.", "smile")] }],
              then: [d("jonas", "Gut. Und die Lampe steht jetzt auf dem Tisch.", "Baik. Dan lampunya sekarang berdiri di atas meja.", "smile")],
            },
            {
              obj: "place",
              ask: [
                d("jonas", "Oh nein! Wo ist der Schlüssel? Liegt er auf dem Tisch?", "Aduh! Di mana kuncinya? Apakah terletak di atas meja?", "question"),
                n("Kamu melihat sekeliling: kunci itu tergeletak di atas rak."),
              ],
              chips: "Nein , der Schlüssel liegt auf dem Regal Tisch . er",
              hints: ["Kuncinya tidak di meja. Kamu melihatnya tergeletak di atas rak.", "Mulai dengan: „Nein, der Schlüssel liegt auf …“"],
              model: "Nein, der Schlüssel liegt auf dem Regal.",
              ok: ["(nein )?(der schlussel|er) (liegt|ist) auf dem (regal|bucherregal)"],
              part: [
                { when: ["(nein )?auf (dem|das) regal", "(nein )?(der schlussel|er) (liegt|ist) auf (das|der|den) regal"], accept: true },
                { when: ["nein"], say: [d("jonas", "Nein? Wo liegt er dann?", "Tidak? Lalu di mana letaknya?", "question")] },
                { when: ["ja( ~)?"], say: [d("jonas", "Auf dem Tisch? Hier ist nur die Lampe …", "Di atas meja? Di sini cuma ada lampu …", "think")] },
              ],
              then: [d("jonas", "Auf dem Regal! Na klar. Danke!", "Di atas rak! Tentu saja. Terima kasih!", "smile")],
            },
          ],
          close: [d("jonas", "Moment — unter dem Schlüssel liegt ein Stadtplan!", "Sebentar — di bawah kunci itu ada peta kota!", "question")],
        },
      },
      exit: "Ambil peta di bawah kunci",
    }),

    payoff({
      lines: [
        n("Peta kota itu sudah lusuh. Seseorang menggambar tanda silang merah di atasnya.", { sfx: "paper" }),
        nd("Bibliothek — Dienstag, 10 Uhr. Frag nach dem Weg!", "Perpustakaan — Selasa, jam 10. Tanyakan jalannya! — Tulisan Mia lagi. Ia sengaja tidak memberimu alamatnya.", {
          overlay: paper("note", "Bibliothek  ✕\nDienstag, 10 Uhr.\nFrag nach dem Weg!", "— Mia"),
        }),
      ],
    }),
  ],
});
