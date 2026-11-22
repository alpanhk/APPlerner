// ===== Bab 2 · „Jam yang Terlipat" — Unit 2: jam & harga =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { ORIGIN } from "./shared";

const NUM = "(ein|eins|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn|elf|zwolf|[0-9]+)";
const ASK_PRICE = ["(was|wie viel|wieviel) kostet (das|ein) brot", "(was|wie viel|wieviel) kostet das"];

export const bab02 = chapter({
  id: "bab-02",
  no: 2,
  unit: 2,
  title: "Jam yang Terlipat",
  tagline: "Sabtu pagi di pasar: sebuah janji, dua euro, dan angka yang mudah tertukar.",
  cover: "u02-pasar",
  place: "Pasar Sabtu",
  objectives: [
    { id: "time", title: "Menyebut jam", phrase: "Es ist neun Uhr." },
    { id: "price", title: "Menanyakan harga dan membeli", phrase: "Was kostet das Brot?" },
  ],
  next: "Berikutnya: mengenalkan keluarga — Oma Helga pasti bertanya tentang keluargamu.",
  beats: [
    opening({
      bg: "u02-jadwal",
      lines: [n("Sabtu pagi. Kertas dari Mia terlipat rapi seperti jam saku. Di dinding, jam berdetak pelan.")],
      prompt: "Apa yang kamu periksa?",
      look: [
        { label: "Buka lipatan kertas", lines: [nd("Neun Uhr. Bring zwei Euro mit!", "Jam sembilan. Bawa dua euro!", { overlay: paper("note", "Neun Uhr.\nBring zwei Euro mit!", "— Mia"), sfx: "paper" })] },
        { label: "Lihat jam dinding", lines: [n("Jarum pendek tepat di angka sembilan. Kamu harus bergegas.")] },
      ],
      go: "Ambil dua euro dari meja",
    }),

    lesson({
      obj: "time",
      intro: [tu("Kota ini berjalan menurut jam. Kalau kamu bisa menyebut jam, kamu bisa menepati janji.")],
      models: [
        td("Wie spät ist es?", "Jam berapa sekarang? (spät = larut)"),
        td("Es ist neun Uhr.", "Sekarang jam sembilan. (die Uhr = jam)"),
      ],
      tip: "Angka dasarnya: eins, zwei, drei, vier, fünf, sechs, sieben, acht, neun, zehn, elf, zwölf. Polanya selalu „Es ist … Uhr.“ Lihat jam dinding itu, lalu jawab aku.",
      practice: {
        ask: [d("tutor", "Wie spät ist es?", "Jam berapa sekarang?", "question")],
        chips: "Es ist neun acht zehn Uhr . Euro",
        hints: ["Jam dinding menunjuk angka sembilan. Sebutkan jamnya.", "Mulai dengan: „Es ist … Uhr.“"],
        model: "Es ist neun Uhr.",
        ok: ["es ist (neun|9) uhr"],
        part: [
          { when: ["(neun|9)( uhr)?", "es ist (neun|9)"], say: [tu("Angkanya tepat. Sekarang kalimat utuh: „Es ist neun Uhr.“")] },
          { when: [`(es ist )?${NUM}( uhr)?`], say: [tu("Polanya benar — tapi lihat lagi jarumnya: angka sembilan, „neun“.", "question")] },
        ],
      },
      praise: "Tepat. „Es ist … Uhr“ — tiga kata tetap, satu angka yang berganti.",
      go: "Berangkat ke pasar",
    }),

    encounter({
      who: "demir",
      bg: "jalan",
      intro: [n("Di halte trem, seorang ibu dengan keranjang belanja melirik pergelangan tangannya yang kosong. Jam menara di ujung jalan menunjuk pukul sembilan.", { sfx: "tram" })],
      open: [d("demir", "Entschuldigung! Wie spät ist es?", "Permisi! Jam berapa sekarang?", "question")],
      turns: [
        {
          obj: "time",
          prompt: "Giliranmu. Jam menara menunjuk pukul sembilan.",
          chips: "Es ist neun zehn acht Uhr .",
          hints: ["Ia tidak membawa jam dan ingin tahu pukul berapa sekarang.", "Mulai dengan: „Es ist … Uhr.“"],
          model: "Es ist neun Uhr.",
          ok: ["es ist (neun|9) uhr"],
          part: [
            { when: ["(neun|9)( uhr)?", "es ist (neun|9)"], accept: true },
            { when: [`(es ist )?${NUM}( uhr)?`], say: [d("demir", "Wirklich? Aber die Uhr dort sagt neun!", "Benarkah? Tapi jam di sana menunjuk sembilan!", "think")] },
          ],
          then: [d("demir", "Schon neun? Danke schön! Der Markt beginnt!", "Sudah jam sembilan? Terima kasih banyak! Pasarnya mulai!", "smile")],
        },
      ],
    }),

    lesson({
      obj: "price",
      bg: "u02-pasar",
      intro: [tu("Pasar Sabtu. Di sini tidak semua barang berlabel harga — kamu harus bertanya.")],
      models: [
        td("Was kostet das Brot?", "Berapa harga roti itu? (kosten = berharga)"),
        td("Das Brot kostet zwei Euro.", "Roti itu harganya dua euro."),
        td("Ein Brot, bitte.", "Satu roti, tolong. (bitte = tolong / silakan)"),
      ],
      tip: "„Was kostet …?“ untuk satu barang. Kalau lupa nama barangnya, tunjuk saja dan katakan „Was kostet das?“. Coba tanyakan harga roti.",
      practice: {
        prompt: "Latihan: tanyakan harga roti.",
        chips: "Was kostet das Brot ? Wie viel ein",
        hints: ["Kamu ingin tahu harga roti.", "Mulai dengan: „Was kostet …?“"],
        model: "Was kostet das Brot?",
        ok: ASK_PRICE,
        part: [
          { when: ["(das |ein )?brot( bitte)?"], say: [tu("Itu nama barangnya. Untuk menanyakan harga, awali dengan „Was kostet …?“")] },
          { when: ["(was|wie viel) kosten ~"], say: [tu("Untuk satu barang kata kerjanya „kostet“: „Was kostet das Brot?“", "question")] },
        ],
      },
      praise: "Bagus. Dengarkan jawabannya baik-baik — angka adalah bagian tersulit di pasar.",
      go: "Masuk ke deretan lapak",
    }),

    hub({
      bg: "u02-pasar",
      intro: [n("Lapak berjajar di bawah tenda. Mia belum terlihat. Di lapak roti, penjual berapron hijau menimbang apel; tak jauh darimu, ibu dari halte tadi memilih tomat.")],
      prompt: "Ke mana kamu melangkah?",
      side: {
        label: "Sapa ibu dari halte tadi",
        leave: "Kamu melambai dan berjalan terus.",
        enc: {
          who: "demir",
          open: [d("demir", "Ach, hallo wieder! Sie sind neu hier, oder? Woher kommen Sie?", "Oh, halo lagi! Anda baru di sini, ya? Anda berasal dari mana?", "smile")],
          turns: [
            {
              obj: "origin",
              chips: "Ich komme aus Indonesien . bin",
              hints: ["Ia menanyakan asalmu dengan sopan (Sie = Anda).", "Jawabannya sama seperti kepada Mia: „Ich komme aus …“"],
              model: "Ich komme aus Indonesien.",
              ok: ORIGIN,
              part: [{ when: ["aus ~"], accept: true }],
              then: [d("demir", "Wie interessant! Willkommen hier!", "Menarik sekali! Selamat datang di sini!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Beli roti di lapak Herr Aydın",
        enc: {
          who: "aydin",
          open: [d("aydin", "Guten Morgen! Was darf es sein?", "Selamat pagi! Mau beli apa?", "smile")],
          turns: [
            {
              obj: "price",
              prompt: "Giliranmu. Tanyakan harga roti.",
              chips: "Was kostet das Brot ? Wie viel bitte",
              hints: ["Kamu hanya punya dua euro. Tanyakan dulu harga rotinya.", "Mulai dengan: „Was kostet …?“"],
              model: "Was kostet das Brot?",
              ok: ASK_PRICE,
              part: [{ when: ["(ein |das )?brot( bitte)?"], accept: true }],
              then: [d("aydin", "Das Brot kostet zwei Euro.", "Roti itu harganya dua euro.", "smile")],
            },
            {
              obj: "price",
              ask: [d("aydin", "Also zwei Brote?", "Jadi dua roti?", "question")],
              chips: "Nein Ja , ein zwei Brot Brote bitte .",
              hints: ["Penjual salah tangkap: ia mengira kamu mau dua roti. Uangmu hanya cukup untuk satu.", "Mulai dengan: „Nein, ein …“"],
              model: "Nein, ein Brot, bitte.",
              ok: ["nein (nur )?(ein|eins|1) brot( bitte)?", "(nur )?(ein|1) brot bitte"],
              part: [
                { when: ["(ein|1) brot", "eins", "nein (ein|eins)"], accept: true },
                { when: ["nein( danke)?"], say: [d("aydin", "Nein? Wie viele dann?", "Bukan? Lalu berapa?", "question")] },
                {
                  when: ["ja( ~)?", "zwei brote( bitte)?"],
                  say: [d("aydin", "Zwei Brote kosten vier Euro.", "Dua roti harganya empat euro.", "neutral"), n("Kamu merogoh saku: hanya ada dua euro.")],
                },
              ],
              then: [d("aydin", "Ein Brot, zwei Euro. Bitte schön!", "Satu roti, dua euro. Silakan!", "smile")],
            },
          ],
          close: [d("aydin", "Moment — bist du {name}? Mia war hier. Das ist für dich.", "Sebentar — kamu {name}? Mia tadi di sini. Ini untukmu.", "smile")],
        },
      },
      exit: "Buka titipan dari Mia",
    }),

    payoff({
      lines: [
        n("Di dalam kantong roti terselip sebuah kartu.", { sfx: "paper" }),
        nd("Sonntag, 15 Uhr: Kaffee bei Oma Helga. Komm mit!", "Minggu, jam 15: minum kopi di rumah Oma Helga. Ikutlah! — Di baliknya tertempel sebuah foto keluarga kecil.", {
          overlay: paper("note", "Sonntag, 15 Uhr:\nKaffee bei Oma Helga.\nKomm mit!", "— Mia"),
        }),
      ],
    }),
  ],
});
