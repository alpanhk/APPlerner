// ===== Bab 5 · „Jaket Biru" — Unit 5: di toko & membayar =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { WELL } from "./shared";

const PAY = ["ich (zahle|bezahle) (mit karte|mit der karte|bar|in bar)( bitte)?"];
const PAY_SHORT = ["(mit karte|mit der karte|bar|karte)( bitte)?"];

export const bab05 = chapter({
  id: "bab-05",
  no: 5,
  unit: 5,
  title: "Jaket Biru",
  tagline: "Dua jaket di gantungan, satu warna yang kamu mau, dan kasir yang salah dengar.",
  cover: "u05-toko",
  place: "Toko serba ada",
  objectives: [
    { id: "shop", title: "Mencari barang dan menyebut warna", phrase: "Ich suche eine Jacke." },
    { id: "pay", title: "Membayar di kasir", phrase: "Ich zahle mit Karte." },
  ],
  next: "Berikutnya: ruangan, perabot, dan letak barang — sebuah kunci menunggumu.",
  beats: [
    opening({
      bg: "u05-toko",
      lines: [n("Sabtu, pukul sebelas. Toko serba ada itu masih sepi. Di gantungan dekat kamar pas tergantung dua jaket.")],
      prompt: "Jaket mana yang kamu periksa?",
      look: [
        { label: "Periksa label jaket biru", lines: [nd("Jacke, blau, Größe M — 49 Euro", "Jaket, biru, ukuran M — 49 euro", { overlay: paper("ticket", "Jacke · blau\nGröße M\n49 €") })] },
        { label: "Periksa label jaket merah", lines: [nd("Jacke, rot, Größe L — 59 Euro", "Jaket, merah, ukuran L — 59 euro", { overlay: paper("ticket", "Jacke · rot\nGröße L\n59 €") })] },
      ],
      go: "Cari pramuniaga",
    }),

    lesson({
      obj: "shop",
      intro: [tu("Di toko, kamu tidak perlu berkeliling sendiri. Katakan apa yang kamu cari — dan dalam warna apa.")],
      models: [
        td("Ich suche eine Jacke.", "Saya mencari jaket. (suchen = mencari; die Jacke → eine)"),
        td("Haben Sie die Jacke in Blau?", "Apakah Anda punya jaket itu dalam warna biru? (Sie = Anda)"),
        td("Die Jacke ist zu groß.", "Jaketnya terlalu besar. (zu = terlalu; klein = kecil)"),
      ],
      tip: "Warna: blau (biru), rot (merah), grün (hijau), schwarz (hitam), weiß (putih). Kepada pramuniaga selalu „Sie“. Katakan padaku apa yang kamu cari.",
      practice: {
        prompt: "Latihan: katakan bahwa kamu mencari jaket.",
        chips: "Ich suche eine einen Jacke Hose . möchte",
        hints: ["Kamu ingin memberi tahu barang yang kamu cari.", "Mulai dengan: „Ich suche eine …“"],
        model: "Ich suche eine Jacke.",
        ok: ["ich (suche|brauche|mochte) eine jacke( in ~)?"],
        part: [
          { when: ["ich (suche|brauche|mochte) (ein|einen) jacke"], say: [tu("Hampir! „Jacke“ itu die, jadi „eine Jacke“.", "question")] },
          { when: ["(eine )?jacke"], say: [tu("Barangnya benar. Kalimat utuhnya: „Ich suche eine Jacke.“")] },
        ],
      },
      praise: "Bagus. „Ich suche …“ berlaku di toko mana pun — tinggal ganti barangnya.",
      go: "Hampiri pramuniaga",
    }),

    encounter({
      who: "sommer",
      open: [d("sommer", "Guten Tag! Kann ich Ihnen helfen?", "Selamat siang! Ada yang bisa saya bantu?", "smile")],
      turns: [
        {
          obj: "shop",
          chips: "Ja , ich suche eine Jacke . bitte",
          hints: ["Pramuniaga menawarkan bantuan. Katakan apa yang kamu cari.", "Mulai dengan: „Ja, ich suche eine …“"],
          model: "Ja, ich suche eine Jacke.",
          ok: ["(ja )?(bitte )?ich (suche|brauche|mochte) eine jacke( in ~)?"],
          part: [
            { when: ["(ja )?ich (suche|brauche|mochte) (ein|einen) jacke"], say: [d("sommer", "Eine Jacke suchen Sie? Wie bitte?", "Anda mencari sebuah jaket (eine Jacke)? Maaf, bagaimana?", "question")] },
            { when: ["(ja )?(eine )?jacke( bitte)?", "ja( bitte)?"], accept: true },
          ],
          then: [d("sommer", "Sehr gern. Hier, die Jacke in Rot!", "Dengan senang hati. Ini, jaket yang merah!", "smile")],
        },
        {
          obj: "shop",
          ask: [n("Ia menyodorkan jaket merah. Kamu melirik jaket biru di gantungan.")],
          prompt: "Giliranmu. Kamu ingin yang biru.",
          chips: "Haben Sie die Jacke in Blau Rot ? Nein , bitte",
          hints: ["Pramuniaga membawa warna yang salah. Tanyakan jaket itu dalam warna biru.", "Mulai dengan: „Haben Sie die Jacke in …?“"],
          model: "Haben Sie die Jacke in Blau?",
          ok: ["(nein )?haben sie (die|eine) jacke (auch )?in blau", "(nein )?haben sie (die|das) (auch )?in blau", "(nein )?ich (mochte|suche|nehme) (die|eine) jacke in blau"],
          part: [{ when: ["(nein )?(die jacke )?(in )?blau( bitte)?", "nein( danke)?"], accept: true }],
          then: [d("sommer", "In Blau? Natürlich! Größe M — die passt perfekt.", "Yang biru? Tentu! Ukuran M — pas sekali.", "smile")],
        },
      ],
    }),

    lesson({
      obj: "pay",
      intro: [tu("Jaketnya pas. Tinggal satu langkah: kasir. Pertanyaannya selalu sama — tunai atau kartu?")],
      models: [
        td("Bar oder mit Karte?", "Tunai atau dengan kartu? (bar = tunai)"),
        td("Ich zahle mit Karte.", "Saya bayar dengan kartu. (zahlen = membayar)"),
        td("Ich zahle bar.", "Saya bayar tunai."),
      ],
      tip: "Jawaban pendek „Mit Karte, bitte.“ pun sopan. Tapi latih dulu kalimat utuhnya denganku.",
      practice: {
        ask: [d("tutor", "Bar oder mit Karte?", "Tunai atau dengan kartu?", "question")],
        chips: "Ich zahle mit Karte bar . , bitte",
        hints: ["Pilih cara membayar: tunai atau kartu.", "Mulai dengan: „Ich zahle …“"],
        model: "Ich zahle mit Karte.",
        ok: PAY,
        part: [
          { when: ["ich (zahle|bezahle) (karte|mit bar)"], say: [tu("Hampir! Kartu memakai „mit“: „mit Karte“. Tunai tanpa „mit“: „bar“.", "question")] },
          { when: PAY_SHORT, say: [tu("Itu sudah dipahami kasir mana pun. Sekarang kalimat utuhnya: „Ich zahle …“")] },
        ],
      },
      praise: "Bagus. „bar“ tanpa „mit“, „Karte“ dengan „mit“.",
      go: "Bawa jaket ke kasir",
    }),

    hub({
      bg: "u05-toko",
      intro: [n("Kasir berada di ujung ruangan. Di dekat gantungan, Frau Sommer merapikan baju sambil tersenyum ke arahmu.")],
      prompt: "Ke mana kamu melangkah?",
      side: {
        label: "Berbasa-basi dengan Frau Sommer",
        leave: "Kamu mengangguk dan berjalan ke kasir.",
        enc: {
          who: "sommer",
          open: [d("sommer", "Die Jacke steht Ihnen gut! Und sonst — wie geht es Ihnen?", "Jaketnya cocok untuk Anda! Dan selebihnya — apa kabar Anda?", "smile")],
          turns: [
            {
              obj: "wellbeing",
              chips: "Gut danke ! Und Ihnen ? , sehr dir",
              hints: ["Ia menanyakan kabarmu dengan sopan (Ihnen = Anda).", "Seperti kepada Jonas, tetapi ditutup dengan „Und Ihnen?“"],
              model: "Gut, danke! Und Ihnen?",
              ok: WELL,
              part: [{ when: ["danke( schon)?"], accept: true }],
              then: [d("sommer", "Auch gut, danke! Viel Freude mit der Jacke!", "Baik juga, terima kasih! Selamat menikmati jaketnya!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Bayar di kasir",
        enc: {
          who: "timo",
          open: [d("timo", "Hallo! Die Jacke in Rot, richtig?", "Halo! Jaket yang merah, benar?", "question")],
          turns: [
            {
              obj: "shop",
              chips: "Nein Ja , die Jacke in Blau Rot . ist",
              hints: ["Kasir salah menyebut warna. Jaketmu biru.", "Mulai dengan: „Nein, die Jacke in …“"],
              model: "Nein, die Jacke in Blau.",
              ok: ["nein (die jacke )?(ist )?(in )?blau( bitte)?", "die jacke (ist )?(in )?blau"],
              part: [
                { when: ["nein( danke)?", "(in )?blau"], accept: true },
                { when: ["ja( ~)?"], say: [d("timo", "Rot? Aber die Jacke hier ist blau!", "Merah? Tapi jaket ini biru!", "think")] },
              ],
              then: [d("timo", "Ach ja, Blau! Das macht 49 Euro. Bar oder mit Karte?", "Oh iya, biru! Jadinya 49 euro. Tunai atau dengan kartu?", "smile")],
            },
            {
              obj: "pay",
              chips: "Ich zahle mit Karte bar . , bitte",
              hints: ["Kasir menanyakan cara pembayaranmu.", "Mulai dengan: „Ich zahle …“"],
              model: "Ich zahle mit Karte.",
              ok: PAY,
              part: [{ when: PAY_SHORT, accept: true }],
              then: [d("timo", "Danke! Hier ist die Quittung.", "Terima kasih! Ini kuitansinya.", "smile")],
            },
          ],
          close: [d("timo", "Moment! In der Tasche ist etwas.", "Sebentar! Di dalam sakunya ada sesuatu.", "question")],
        },
      },
      exit: "Rogoh saku jaket baru",
    }),

    payoff({
      lines: [
        n("Di saku jaket biru itu ada sebuah kunci dengan secarik label.", { sfx: "paper" }),
        nd("Lindenstraße 7, 2. Stock. Montag, 17 Uhr — dein Zimmer?", "Lindenstraße 7, lantai 2. Senin, jam 17 — kamarmu? — Mia ternyata sudah mencarikan tempat tinggal tetap untukmu.", {
          overlay: paper("ticket", "Lindenstraße 7\n2. Stock\nMontag, 17 Uhr", "dein Zimmer? — Mia"),
        }),
      ],
    }),
  ],
});
