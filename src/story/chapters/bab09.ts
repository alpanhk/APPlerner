// ===== Bab 9 · „Catatan Dokter" — Unit 9: keluhan & obat =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";
import { WORKTIME, WORKTIME_CHIPS } from "./bab08";

const PAIN = "(rucken ?|kopf ?|hals ?|bauch ?|zahn ?)schmerzen";
const BACK = "rucken ?schmerzen";
const THING = "(etwas|eine salbe|ein medikament|tabletten)";
const NEED_BACK = [`ich (brauche|mochte|suche) ${THING} gegen ${BACK}`, `haben sie ${THING} gegen ${BACK}`];

export const bab09 = chapter({
  id: "bab-09",
  no: 9,
  unit: 9,
  title: "Catatan Dokter",
  tagline: "Punggungmu pegal sejak hari Senin. Di ruang tunggu, kamu harus menjelaskan apa yang sakit.",
  cover: "u09-klinik",
  place: "Praktik dokter & apotek",
  objectives: [
    { id: "symptom", title: "Menyebut keluhan", phrase: "Ich habe Rückenschmerzen." },
    { id: "need", title: "Meminta obat", phrase: "Ich brauche etwas gegen …" },
  ],
  next: "Berikutnya: hobi dan rencana akhir pekan — dokter berpesan agar kamu lebih banyak bergerak.",
  beats: [
    opening({
      bg: "u09-klinik",
      lines: [n("Rabu, pukul sepuluh. Ruang tunggu praktik dokter berbau antiseptik. Punggungmu masih pegal sejak hari Senin.")],
      prompt: "Apa yang kamu baca sambil menunggu?",
      look: [
        { label: "Baca poster di dinding", lines: [nd("Wo tut es weh? Kopf, Hals, Rücken, Bauch", "Di mana sakitnya? Kepala, tenggorokan, punggung, perut", { overlay: paper("sign", "Wo tut es weh?\nKopf · Hals\nRücken · Bauch") })] },
        { label: "Baca papan di meja resepsionis", lines: [nd("Bitte hier anmelden", "Silakan mendaftar di sini", { overlay: paper("sign", "Bitte hier anmelden") })] },
      ],
      go: "Maju ke meja resepsionis",
    }),

    lesson({
      obj: "symptom",
      intro: [tu("Di praktik dokter, kamu harus bisa mengatakan apa yang sakit. Bahasa Jerman membuatnya mudah: bagian tubuh + „schmerzen“.")],
      models: [
        td("Was fehlt Ihnen?", "Apa keluhan Anda? (harfiah: apa yang kurang pada Anda?)"),
        td("Ich habe Rückenschmerzen.", "Saya sakit punggung. (der Rücken + die Schmerzen)"),
        td("Ich habe Kopfschmerzen.", "Saya sakit kepala. (der Kopf = kepala)"),
        td("Ich habe kein Fieber.", "Saya tidak demam. (kein = tidak ada)"),
      ],
      tip: "Kopfschmerzen, Halsschmerzen, Bauchschmerzen, Rückenschmerzen — selalu satu kata, dan selalu dengan „Ich habe …“. Katakan keluhanmu.",
      practice: {
        ask: [d("tutor", "Was fehlt Ihnen?", "Apa keluhan Anda?", "question")],
        chips: "Ich habe Rückenschmerzen Kopfschmerzen Fieber kein .",
        hints: ["Punggungmu sakit. Katakan itu seperti kepada dokter.", "Mulai dengan: „Ich habe …“"],
        model: "Ich habe Rückenschmerzen.",
        ok: [`ich habe (starke )?${BACK}`, "mein rucken tut weh"],
        part: [
          { when: [`ich habe (starke )?${PAIN}`], say: [tu("Kalimatnya benar — tetapi yang sakit punggungmu: „Rückenschmerzen“.")] },
          { when: [BACK, "(mein )?rucken"], say: [tu("Bagian tubuhnya benar. Kalimat utuhnya: „Ich habe Rückenschmerzen.“")] },
        ],
      },
      praise: "Bagus. Satu pola untuk semua sakit: Ich habe + bagian tubuh + schmerzen.",
      go: "Daftar di resepsionis",
    }),

    encounter({
      who: "yilmaz",
      open: [d("yilmaz", "Guten Morgen! Sie sind {name}, richtig? Was fehlt Ihnen?", "Selamat pagi! Anda {name}, benar? Apa keluhan Anda?", "question")],
      turns: [
        {
          obj: "symptom",
          chips: "Ich habe Rückenschmerzen Kopfschmerzen . Ja ,",
          hints: ["Resepsionis menanyakan keluhanmu.", "Mulai dengan: „Ich habe …“"],
          model: "Ich habe Rückenschmerzen.",
          ok: [`(ja )?ich habe (starke )?${PAIN}`, "(ja )?mein (rucken|kopf|hals|bauch) tut weh"],
          part: [{ when: [`(ja )?${PAIN}`, "(ja )?(mein )?(rucken|kopf|hals|bauch)"], accept: true }],
          then: [
            d("yilmaz", "Oh je. Der Doktor kommt gleich. Bitte nehmen Sie Platz.", "Aduh. Dokter segera datang. Silakan duduk.", "smile"),
            n("Dokter memeriksamu sebentar dan menulis resep: salep, istirahat, dan lebih banyak bergerak."),
          ],
        },
      ],
    }),

    lesson({
      obj: "need",
      intro: [tu("Resep sudah di tangan. Di apotek kamu perlu satu kalimat lagi: aku butuh sesuatu untuk melawan sakit ini.")],
      models: [
        td("Ich brauche etwas gegen Rückenschmerzen.", "Saya butuh sesuatu untuk sakit punggung. (brauchen = membutuhkan; gegen = melawan)"),
        td("Haben Sie etwas gegen Kopfschmerzen?", "Apakah Anda punya sesuatu untuk sakit kepala?"),
        td("Gute Besserung!", "Semoga lekas sembuh!"),
      ],
      tip: "„etwas gegen …“ = sesuatu untuk melawan … Polanya: „Ich brauche etwas gegen“ + keluhan. Mintalah obat sakit punggung.",
      practice: {
        prompt: "Latihan: minta sesuatu untuk sakit punggung.",
        chips: "Ich brauche etwas gegen Rückenschmerzen Kopfschmerzen . habe",
        hints: ["Kamu ingin meminta obat untuk sakit punggung.", "Mulai dengan: „Ich brauche etwas gegen …“"],
        model: "Ich brauche etwas gegen Rückenschmerzen.",
        ok: NEED_BACK,
        part: [
          { when: [`ich brauche ${THING} fur ~`], say: [tu("Hampir! Obat itu „melawan“ sakit: „gegen“, bukan „für“.", "question")] },
          { when: [`ich (brauche|mochte|suche) ${THING} gegen ${PAIN}`], say: [tu("Kalimatnya benar — tetapi keluhanmu sakit punggung: „Rückenschmerzen“.")] },
          { when: [`(${THING} )?gegen ${PAIN}`, `ich brauche ${THING}`], say: [tu("Dipahami. Kalimat utuhnya: „Ich brauche etwas gegen Rückenschmerzen.“")] },
        ],
      },
      praise: "Bagus. „etwas gegen …“ — kalimat yang akan kamu syukuri setiap musim flu.",
      go: "Pergi ke apotek",
    }),

    hub({
      bg: "u09-klinik",
      intro: [n("Apotek berada persis di sebelah praktik. Di balik meja, seorang apoteker berjas putih menata kotak obat. Di bangku tunggu, Frau Yılmaz baru saja selesai bertugas.", { sfx: "bell" })],
      prompt: "Ke mana kamu melangkah?",
      side: {
        label: "Mengobrol dengan Frau Yılmaz",
        leave: "Kamu berpamitan dan menuju meja apotek.",
        enc: {
          who: "yilmaz",
          open: [d("yilmaz", "Sie arbeiten in der Bibliothek, oder? Wann arbeiten Sie?", "Anda bekerja di perpustakaan, kan? Kapan Anda bekerja?", "smile")],
          turns: [
            {
              obj: "worktime",
              chips: WORKTIME_CHIPS,
              hints: ["Ia menanyakan jam kerjamu di perpustakaan: jam 8 sampai 12.", "Seperti kepada Frau Vogel: „Ich arbeite von … bis …“"],
              model: "Ich arbeite von acht bis zwölf Uhr.",
              ok: WORKTIME,
              part: [{ when: ["von ~ bis ~", "~ bis ~"], accept: true }],
              then: [d("yilmaz", "Dann haben Sie nachmittags Zeit für Sport!", "Kalau begitu sore hari Anda punya waktu untuk olahraga!", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Tebus obat di meja apotek",
        enc: {
          who: "wagner",
          open: [d("wagner", "Guten Tag! Was brauchen Sie?", "Selamat siang! Anda butuh apa?", "smile")],
          turns: [
            {
              obj: "need",
              chips: "Ich brauche etwas gegen Rückenschmerzen . Haben Sie ?",
              hints: ["Apoteker menanyakan kebutuhanmu. Minta sesuatu untuk sakit punggung.", "Mulai dengan: „Ich brauche etwas gegen …“"],
              model: "Ich brauche etwas gegen Rückenschmerzen.",
              ok: [`ich (brauche|mochte|suche) ${THING} gegen ${PAIN}`, `haben sie ${THING} gegen ${PAIN}`],
              part: [{ when: [`(${THING} )?gegen ${PAIN}`, PAIN, `ich habe ${PAIN}`], accept: true }],
              then: [d("wagner", "Hier, eine Salbe. Zweimal täglich, bitte.", "Ini, salep. Dua kali sehari, ya.", "smile")],
            },
            {
              obj: "symptom",
              ask: [d("wagner", "Haben Sie auch Fieber?", "Apakah Anda juga demam?", "question")],
              chips: "Nein Ja , ich habe kein Fieber . auch",
              hints: ["Apoteker memastikan gejala lain. Kamu tidak demam.", "Mulai dengan: „Nein, ich habe kein …“"],
              model: "Nein, ich habe kein Fieber.",
              ok: ["(nein )?ich habe kein fieber"],
              part: [
                { when: ["nein( danke)?", "(nein )?kein fieber", "(nein )?ich habe (keine|keinen|nicht) fieber"], accept: true },
                { when: ["ja( ~)?"], say: [d("wagner", "Fieber? Sie sehen aber ganz gesund aus …", "Demam? Tapi Anda terlihat sehat sekali …", "think")] },
              ],
              then: [d("wagner", "Gut. Dann reicht die Salbe. Gute Besserung!", "Baik. Kalau begitu salepnya cukup. Semoga lekas sembuh!", "smile")],
            },
          ],
          close: [d("wagner", "Ach, und der Arzt sagt: mehr Bewegung! Hier, ein Tipp für Sie.", "Oh ya, dan dokter berpesan: lebih banyak bergerak! Ini, ada saran untuk Anda.", "smile")],
        },
      },
      exit: "Baca saran dari apoteker",
    }),

    payoff({
      lines: [
        n("Di balik kuitansi apotek tertempel sebuah brosur kecil — dan di pojoknya, coretan tangan Mia.", { sfx: "paper" }),
        nd("Schwimmverein Blau-Weiß: Samstag, 10 Uhr. Ich komme mit!", "Klub renang Blau-Weiß: Sabtu, jam 10. Aku ikut! — Rupanya seluruh kota tahu Mia sedang menjagamu.", {
          overlay: paper("ticket", "Schwimmverein Blau-Weiß\nSamstag, 10 Uhr", "Ich komme mit! — Mia"),
        }),
      ],
    }),
  ],
});
