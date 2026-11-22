// ===== Bab 12 · „Surat dari Kamu" — Unit 12: menelepon & mengundang =====
// Lingkaran cerita menutup: dulu surat itu untukmu, sekarang surat itu darimu.
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { INTRO_FULL, NAME_ONLY } from "./shared";

const CALL = ["hier ist {name}", "hier spricht {name}"];
const CALL_CHIPS = "Hallo , hier ist {name} . Ich bin";
const INVITE = [
  "(kommst du|kommen sie) morgen (zum|auf einen) kaffee( zu mir)?",
  "mochtest du morgen (einen )?kaffee( trinken)?",
  "trinken wir morgen (einen )?kaffee( zusammen)?",
];
const INVITE_CHIPS = "Kommst du morgen zum Kaffee ? Hast Zeit";
const ADJ = "(schon|hell|gross|klein|ruhig|gemutlich|super|toll|gut|perfekt)";

export const bab12 = chapter({
  id: "bab-12",
  no: 12,
  unit: 12,
  title: "Surat dari Kamu",
  tagline: "Ada penghuni baru di sebelah kamarmu. Kamu ingat betul rasanya hari pertama.",
  cover: "u12-telepon-pesan",
  place: "Lindenstraße 7",
  objectives: [
    { id: "phone", title: "Membuka percakapan telepon", phrase: "Hallo, hier ist …" },
    { id: "invite", title: "Mengundang seseorang", phrase: "Kommst du morgen zum Kaffee?" },
  ],
  next: "Kamu menamatkan perjalanan A1. Ulangi misi mana pun tanpa petunjuk untuk mengubah „Sudah berlatih“ menjadi „Mandiri“.",
  beats: [
    opening({
      bg: "u06-rumah",
      lines: [n("Senin pagi di kamarmu di Lindenstraße. Pesan Mia masih menyala di layar. Dari balik dinding terdengar kardus digeser: ada penghuni baru di sebelah.")],
      prompt: "Apa yang kamu perhatikan?",
      look: [
        { label: "Baca lagi pesan Mia", lines: [nd("Ruf mich an!", "Telepon aku!", { overlay: paper("phone", "Ruf mich an!", "Mia") })] },
        { label: "Dengarkan suara dari sebelah", lines: [n("Seseorang bersenandung sambil membongkar kardus. Kamu teringat hari pertamamu sendiri di kota ini — dan secarik kertas di atas meja.")] },
      ],
      go: "Ambil ponsel",
    }),

    lesson({
      obj: "phone",
      intro: [tu("Menelepon dalam bahasa asing menakutkan karena tidak ada wajah yang bisa dibaca. Karena itu pembukaannya selalu sama — hafalkan saja.")],
      models: [
        td("Hallo, hier ist {name}.", "Halo, ini {name}. (hier ist … = di sini …)"),
        td("Kann ich bitte Mia sprechen?", "Bisakah saya berbicara dengan Mia? (sprechen = berbicara)"),
        td("Auf Wiederhören!", "Sampai jumpa! (khusus di telepon)"),
      ],
      tip: "Di telepon orang tidak berkata „Ich bin …“, melainkan „Hier ist …“. Bayangkan aku mengangkat telepon.",
      practice: {
        ask: [d("tutor", "Hallo?", "Halo?", "question")],
        chips: CALL_CHIPS,
        hints: ["Seseorang mengangkat telepon. Sebutkan siapa yang menelepon.", "Mulai dengan: „Hallo, hier ist …“"],
        model: "Hallo, hier ist {name}.",
        ok: CALL,
        part: [
          { when: ["(ich bin|ich heisse) {name}"], say: [tu("Dimengerti — tetapi di telepon lazimnya: „Hier ist {name}.“")] },
          { when: ["{name}"], say: [tu("Namamu jelas. Lengkapi dengan pembuka telepon: „Hallo, hier ist {name}.“")] },
          { when: ["hier (ist|spricht) ~"], say: [tu("Polanya benar, tetapi itu bukan namamu.", "question")] },
        ],
      },
      praise: "Bagus. „Hier ist …“ — dan orang di seberang langsung tahu siapa kamu.",
      go: "Tekan nomor Mia",
    }),

    encounter({
      who: "jonas",
      bg: "u12-telepon-pesan",
      intro: [n("Nada sambung. Sekali, dua kali. Lalu sebuah suara yang kamu kenal — tetapi bukan Mia.", { sfx: "ring" })],
      open: [d("jonas", "Hallo?", "Halo?", "question")],
      turns: [
        {
          obj: "phone",
          chips: CALL_CHIPS,
          hints: ["Jonas yang mengangkat. Sebutkan siapa yang menelepon.", "Mulai dengan: „Hallo, hier ist …“"],
          model: "Hallo, hier ist {name}.",
          ok: CALL,
          part: [{ when: ["(ich bin|ich heisse) {name}", "{name}"], accept: true }],
          then: [d("jonas", "Ah, {name}! Hier ist Jonas.", "Ah, {name}! Ini Jonas.", "smile")],
        },
        {
          obj: "phone",
          prompt: "Giliranmu. Mintalah berbicara dengan Mia.",
          chips: "Kann ich bitte Mia sprechen ? Ist da",
          hints: ["Kamu ingin berbicara dengan Mia, bukan Jonas.", "Mulai dengan: „Kann ich bitte … sprechen?“"],
          model: "Kann ich bitte Mia sprechen?",
          ok: ["kann ich (bitte )?(mit )?mia sprechen( bitte)?", "ist mia da( bitte)?"],
          part: [{ when: ["mia( bitte)?", "kann ich (bitte )?mia", "ich mochte mia sprechen"], accept: true }],
          then: [
            d("jonas", "Klar! Mia! Telefon für dich!", "Tentu! Mia! Telepon untukmu!", "smile"),
            d("mia", "{name}! Du rufst an — auf Deutsch! Ich bin so stolz.", "{name}! Kamu menelepon — dalam bahasa Jerman! Aku bangga sekali.", "smile"),
            d("mia", "Hör zu: Neben dir wohnt jetzt jemand Neues. Weißt du noch, dein erster Tag?", "Dengar: di sebelahmu sekarang tinggal orang baru. Kamu masih ingat hari pertamamu?", "smile"),
          ],
        },
      ],
    }),

    lesson({
      obj: "invite",
      bg: "u06-rumah",
      intro: [tu("Kamu tahu apa yang Mia maksud. Dulu seseorang mengundangmu dengan secarik kertas. Sekarang giliranmu — dan kamu sudah punya hampir semua katanya.")],
      models: [
        td("Hast du morgen Zeit?", "Kamu punya waktu besok? (morgen = besok)"),
        td("Kommst du morgen zum Kaffee?", "Kamu datang besok untuk minum kopi? (zum Kaffee = untuk minum kopi)"),
        td("Bis morgen!", "Sampai besok!"),
      ],
      tip: "Undangan sering berupa pertanyaan sederhana dengan kata kerja di depan: „Kommst du …?“. Cobalah mengundangku.",
      practice: {
        prompt: "Latihan: undang Frau Lehmann minum kopi besok.",
        chips: INVITE_CHIPS,
        hints: ["Kamu ingin mengundang seseorang minum kopi besok.", "Mulai dengan: „Kommst du morgen …?“"],
        model: "Kommst du morgen zum Kaffee?",
        ok: INVITE,
        part: [
          { when: ["hast du morgen zeit"], say: [tu("Pembuka yang bagus! Sekarang undangannya: „Kommst du morgen zum Kaffee?“")] },
          { when: ["du kommst morgen zum kaffee"], say: [tu("Untuk bertanya, kata kerja di depan: „Kommst du morgen zum Kaffee?“", "question")] },
          { when: ["kommst du( ~)?"], say: [tu("Hampir! Lengkapnya: „Kommst du morgen zum Kaffee?“", "question")] },
        ],
      },
      praise: "Dengan senang hati aku datang! Lihat — kamu baru saja mengundang seseorang dalam bahasa Jerman.",
      go: "Keluar ke lorong",
    }),

    hub({
      bg: "pintu",
      intro: [n("Lorong lantai dua. Pintu di sebelah kamarmu terbuka; di ambangnya berdiri seorang pemuda berkemeja hijau di antara tumpukan kardus. Di tangga, Eva menyiram tanaman.")],
      prompt: "Siapa yang kamu hampiri?",
      side: {
        label: "Sapa Eva di tangga",
        leave: "Kamu melangkah ke pintu sebelah.",
        enc: {
          who: "eva",
          open: [d("eva", "Na, {name}? Wie findest du dein Zimmer jetzt?", "Nah, {name}? Bagaimana kamarmu sekarang menurutmu?", "smile")],
          turns: [
            {
              obj: "room",
              chips: "Das Zimmer ist schön hell groß und . sehr",
              hints: ["Eva menanyakan pendapatmu tentang kamarmu.", "Seperti di hari pindahan: „Das Zimmer ist …“"],
              model: "Das Zimmer ist schön.",
              ok: [`(das zimmer|mein zimmer|es) ist (sehr )?${ADJ}( und (sehr )?${ADJ})?`],
              part: [{ when: [`(sehr )?${ADJ}( und ${ADJ})?`], accept: true }],
              then: [d("eva", "Das freut mich. Du gehörst jetzt hierher.", "Aku senang. Sekarang kamu bagian dari tempat ini.", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Hampiri penghuni baru",
        enc: {
          who: "karim",
          open: [
            d("karim", "Oh, hallo! Ich bin Karim. Und du?", "Oh, halo! Aku Karim. Dan kamu?", "smile"),
            n("„Und du?“ — persis kata-kata Mia di hari pertamamu."),
          ],
          turns: [
            {
              obj: "introduce",
              chips: "Hallo ! Ich heiße bin {name} .",
              hints: ["Karim menyebut namanya lalu bertanya „Und du?“ — seperti Mia dulu.", "Mulai dengan: „Ich heiße …“"],
              model: "Ich heiße {name}.",
              ok: INTRO_FULL,
              part: [{ when: NAME_ONLY, accept: true }],
              then: [d("karim", "Freut mich, {name}! Ich bin neu hier und kenne niemanden.", "Senang berkenalan, {name}! Aku baru di sini dan tidak kenal siapa pun.", "smile")],
            },
            {
              obj: "invite",
              prompt: "Giliranmu. Undang Karim minum kopi besok.",
              chips: INVITE_CHIPS,
              hints: ["Ia belum kenal siapa pun — seperti kamu dulu. Undang dia minum kopi besok.", "Mulai dengan: „Kommst du morgen …?“"],
              model: "Kommst du morgen zum Kaffee?",
              ok: INVITE,
              part: [
                { when: ["hast du morgen zeit"], say: [d("karim", "Morgen? Ja, ich habe Zeit. Warum?", "Besok? Ya, aku punya waktu. Kenapa?", "question")] },
                { when: ["(morgen )?(zum )?kaffee( morgen)?", "kommst du( ~)?", "du kommst morgen zum kaffee"], accept: true },
              ],
              then: [
                d("karim", "Zum Kaffee? Sehr gern! Wo wohnst du?", "Minum kopi? Dengan senang hati! Kamu tinggal di mana?", "smile"),
                n("Kamu menunjuk pintu di sebelahnya. Karim tertawa."),
              ],
            },
          ],
          close: [d("karim", "Nebenan! Dann bis morgen, {name}!", "Di sebelah! Kalau begitu sampai besok, {name}!", "smile")],
        },
      },
      exit: "Kembali ke kamar dan ambil secarik kertas",
    }),

    payoff({
      bg: "u06-rumah",
      lines: [
        n("Kamu duduk di meja dan menulis — dengan tulisan tanganmu sendiri, dalam bahasa yang beberapa bulan lalu belum kamu pahami."),
        nd("Guten Morgen! Kaffee bei mir? Bis morgen!", "Selamat pagi! Ngopi di tempatku? Sampai besok! — Di bawahnya kamu menggambar sebuah cangkir kecil.", {
          overlay: paper("letter", "Guten Morgen!\nKaffee bei mir?\nBis morgen!", "— {name}"),
          sfx: "paper",
        }),
        n("Kamu menyelipkan kertas itu di bawah pintu Karim. Dulu surat itu untukmu. Sekarang surat itu darimu."),
      ],
    }),
  ],
});
