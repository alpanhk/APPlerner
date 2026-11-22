// ===== Prolog · „Surat untuk Siapa?" =====
// Naskah asli dipertahankan. Bedanya: kini ditulis lewat cetakan yang sama dengan
// semua bab lain, sehingga prolog bukan lagi pengecualian melainkan teladannya.
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { GREET, INTRO_FULL, INTRO_OTHER, JA, NAME_ONLY, NEIN } from "./shared";

const CHIPS = "Hallo Ich heiße bin {name} Mia ! .";

export const prolog = chapter({
  id: "prolog",
  no: 0,
  unit: 1,
  title: "Surat untuk Siapa?",
  tagline: "Kamu terbangun di kota asing. Seseorang mengetuk pintu.",
  cover: "kamar",
  place: "Kamar barumu",
  objectives: [
    { id: "greet", title: "Menyapa seseorang", phrase: "Hallo! · Guten Morgen!" },
    { id: "introduce", title: "Memperkenalkan nama ketika ditanya", phrase: "Ich heiße …" },
  ],
  next: "Berikutnya, ceritakan dari mana asalmu: „Ich komme aus …“ — Mia menunggumu besok.",
  beats: [
    opening({
      bg: "kamar",
      lines: [n("Dari balik jendela terdengar trem lewat. Di atas meja ada secarik kertas. Kamu bisa membaca hurufnya, tetapi belum tahu artinya.", { sfx: "tram" })],
      prompt: "Apa yang ingin kamu lakukan?",
      look: [
        {
          label: "Periksa catatan",
          lines: [
            nd("Guten Morgen!", "Selamat pagi!", { overlay: paper("note", "Guten Morgen!") }),
            n("Tulisan tangannya rapi. Di bawahnya ada gambar kecil: sebuah cangkir.", { overlay: paper("note", "Guten Morgen!", "(gambar cangkir kecil)") }),
          ],
        },
        {
          label: "Lihat ke jendela",
          lines: [
            n("Di jalan, seseorang menuntun sepeda melewati deretan rumah. Rel trem berkilau kena cahaya pagi.", { bg: "jendela" }),
            n("Kamu kembali ke dalam kamar.", { bg: "kamar" }),
          ],
        },
      ],
      go: "Duduk sebentar di tepi ranjang",
    }),

    lesson({
      obj: "introduce",
      also: ["greet"],
      intro: [
        tu("Selamat pagi, {name}. Aku Frau Lehmann. Mulai hari ini kamu tinggal di kota ini."),
        tu("Misimu sederhana tapi panjang: belajar bahasa Jerman supaya kamu bisa mengenal orang-orang di sini dan hidup mandiri."),
        tu("Kita mulai dari yang paling dekat: orang yang tinggal di sebelahmu.", "neutral"),
        n("[Dua ketukan di pintu.]", { sfx: "knock" }),
        tu("Ada yang mengetuk. Mari belajar menyapa supaya kamu sendiri bisa membuka pintu."),
      ],
      models: [
        td("Hallo!", "Halo! — sapaan santai, cocok kapan saja."),
        td("Ich heiße {name}.", "Nama saya {name}. (ich = saya, heiße = bernama)"),
      ],
      tip: "Kalau mau lebih pendek, „Ich bin {name}“ juga lazim. Sekarang giliranmu mencoba. Ketik atau susun kalimatnya.",
      practice: {
        prompt: "Latihan: beri tahu siapa namamu.",
        chips: CHIPS,
        hints: ["Kamu ingin memberi tahu siapa namamu.", "Mulai dengan: „Ich heiße …“"],
        model: "Ich heiße {name}.",
        ok: INTRO_FULL,
        part: [
          { when: INTRO_OTHER, say: [tu("Susunannya sudah benar! Tapi nama itu bukan namamu. Coba lagi dengan nama {name}.", "question")] },
          { when: NAME_ONLY, say: [tu("Namamu sudah terdengar. Sekarang bungkus dalam kalimat utuh: „Ich heiße {name}.“")] },
          { when: GREET, say: [tu("Sapaanmu bagus. Lanjutkan dengan namamu: „Ich heiße {name}.“")] },
        ],
        miss: "Belum pas. Kalimat perkenalan diawali „Ich heiße“ atau „Ich bin“, lalu namamu.",
      },
      praise: "Tepat sekali. Kalau nanti ditanya „Und du?“ artinya „Dan kamu?“ — itu saatnya kamu menyebut nama.",
      go: "Buka pintu",
    }),

    encounter({
      who: "mia",
      bg: "pintu",
      open: [d("mia", "Hallo! Ich bin Mia. Und du?", "Halo! Aku Mia. Dan kamu?", "smile", { sfx: "door" })],
      turns: [
        {
          obj: "introduce",
          prompt: "Giliranmu. Mia menunggu jawabanmu.",
          chips: CHIPS,
          hints: ["Mia baru saja menyebut namanya, lalu bertanya „Und du?“ — dia ingin tahu namamu.", "Mulai dengan: „Ich heiße …“ atau „Ich bin …“"],
          model: "Ich heiße {name}.",
          ok: INTRO_FULL,
          part: [
            { when: NAME_ONLY, accept: true },
            { when: INTRO_OTHER, say: [d("mia", "Oh? Ich bin Mia. Und wie heißt du?", "Oh? Aku Mia. Dan siapa namamu? (Mia bingung karena nama yang kamu sebut bukan namamu.)", "question")] },
            { when: GREET, say: [d("mia", "Hallo! Und wie heißt du?", "Halo! Dan siapa namamu?", "question")] },
            { when: [...JA, ...NEIN], say: [d("mia", "Hm? Wie heißt du?", "Hm? Siapa namamu?", "question")] },
          ],
          miss: "Mia belum paham. Coba sebutkan namamu dengan „Ich heiße …“.",
          then: [
            d("mia", "Freut mich, {name}!", "Senang berkenalan, {name}!", "smile"),
            d("mia", "Ich wohne nebenan. Bis später!", "Aku tinggal di sebelah. Sampai nanti!", "smile"),
          ],
        },
      ],
      close: [tu("Kamu baru saja berkenalan dengan tetangga. Udara pagi di luar segar — ayo lihat jalan di depan rumah.")],
    }),

    hub({
      bg: "jalan",
      intro: [
        n("Jalan kecil dengan fasad rumah berwarna lembut, sepeda bersandar di dinding, kotak surat kuning, dan pot geranium. Seorang petugas pos berdiri di depan deretan kotak surat sambil memegang amplop.", { sfx: "bell" }),
      ],
      prompt: "Ke mana kamu melangkah?",
      side: {
        label: "Sapa tetangga yang menyiram bunga",
        leave: "Kamu mengangguk sopan dan melanjutkan langkah.",
        enc: {
          who: "tetangga",
          open: [d("tetangga", "Guten Morgen!", "Selamat pagi!", "smile")],
          turns: [
            {
              obj: "greet",
              prompt: "Balas sapaannya, atau lanjutkan perjalanan.",
              chips: "Guten Morgen Hallo ! Ich heiße {name}",
              hints: ["Ia menyapa „Selamat pagi“. Kamu bisa membalas dengan sapaan yang sama.", "Coba: „Guten Morgen!“ atau „Hallo!“"],
              model: "Guten Morgen!",
              // Hanya sapaan yang dihitung sebagai bukti menyapa. „Hallo, ich heiße …“ tetap lolos karena memuat sapaan.
              ok: GREET,
              part: [
                { when: INTRO_FULL, say: [d("tetangga", "Freut mich, {name}! Aber zuerst: Guten Morgen!", "Senang berkenalan, {name}! Tapi pertama-tama: selamat pagi!", "smile")] },
                { when: [...NAME_ONLY, ...INTRO_OTHER, ...JA, ...NEIN], say: [d("tetangga", "Wie bitte? Guten Morgen!", "Maaf, apa? Selamat pagi!", "question")] },
              ],
              miss: "Cukup balas sapaannya: „Guten Morgen!“",
              then: [d("tetangga", "Schönen Tag noch!", "Semoga harimu menyenangkan!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Temui petugas pos",
        enc: {
          who: "pos",
          open: [d("pos", "Hallo! Bist du Mia?", "Halo! Apakah kamu Mia? (Ia membandingkan nama di amplop dengan nama di kotak surat.)", "question")],
          turns: [
            {
              obj: "introduce",
              prompt: "Giliranmu. Petugas pos menunggu.",
              chips: "Nein Ja Hallo ich Ich heiße bin {name} Mia ! . ,",
              hints: ["Petugas mengira kamu Mia. Kamu perlu memberi tahu siapa dirimu.", "Kamu bisa menjawab „Nein“ lalu menyebut nama: „Nein, ich heiße …“"],
              model: "Nein, ich heiße {name}.",
              ok: INTRO_FULL,
              end: true,
              part: [
                { when: NAME_ONLY, accept: true },
                { when: ["nein", "(nein )?ich bin nicht( mia)?", "(nein )?nicht mia"], to: "next", say: [d("pos", "Hm. Wie heißt du?", "Hm. Siapa namamu? (Surat masih di tangannya.)", "question")] },
                { when: INTRO_OTHER, to: "next", say: [d("pos", "Hm, so heißt du? Hier steht „{name}“.", "Hm, itu namamu? Di sini tertulis „{name}“. (Nama yang kamu sebut tidak cocok dengan amplop.)", "think")] },
                { when: JA, to: "next", say: [d("pos", "Mia? Hm … Mia wohnt doch nebenan. Wie heißt du?", "Mia? Hm … Mia kan tinggal di sebelah. Siapa namamu? (Ia melihat nama di amplop dan meminta kejelasan.)", "think")] },
                { when: GREET, say: [d("pos", "Hallo! Also — bist du Mia?", "Halo! Jadi — kamu Mia?", "question")] },
              ],
              miss: "Petugas belum paham. Jawab „Nein“ atau sebutkan namamu: „Ich heiße {name}.“",
            },
            {
              obj: "introduce",
              prompt: "Giliranmu. Petugas bertanya namamu.",
              chips: "Ich heiße bin {name} Hallo ! .",
              hints: ["„Wie heißt du?“ artinya „Siapa namamu?“ — jawab dengan namamu.", "Mulai dengan: „Ich heiße …“"],
              model: "Ich heiße {name}.",
              ok: INTRO_FULL,
              part: [
                { when: NAME_ONLY, accept: true },
                { when: INTRO_OTHER, say: [d("pos", "Hm, so heißt du? Hier steht „{name}“.", "Hm, itu namamu? Di sini tertulis „{name}“.", "think")] },
                { when: [...JA, ...NEIN, ...GREET], say: [d("pos", "Okay … aber wie heißt du?", "Oke … tapi siapa namamu?", "question")] },
              ],
              miss: "Sebutkan namamu: „Ich heiße {name}.“",
            },
          ],
          close: [d("pos", "Ah, {name}! Hier, für dich.", "Ah, {name}! Ini, untukmu.", "smile")],
        },
      },
      exit: "Periksa amplop dari petugas pos",
    }),

    payoff({
      lines: [
        n("Amplop itu tertutup rapat. Di depannya tertulis namamu dengan tinta biru.", { overlay: paper("envelope", "{name}"), sfx: "paper" }),
        nd("Bis morgen!", "Sampai besok! — Di bawahnya tergambar sebuah cangkir, dan tanda tangan: Mia.", { overlay: paper("letter", "Bis morgen!", "— Mia"), sfx: "paper" }),
      ],
    }),
  ],
});
