// ===== Bab 4 · „Meja untuk Tiga" — Unit 4: memesan & kesukaan =====
import { chapter, d, encounter, hub, lesson, n, nd, opening, paper, payoff, tu, td } from "../dsl";

const ITEM = "(einen tee|einen kaffee|einen kakao|einen saft|einen kuchen|einen apfelkuchen|ein wasser|eine limonade|eine cola|eine suppe)";
const BARE = "(tee|kaffee|kakao|saft|kuchen|apfelkuchen|wasser|limonade|cola|suppe)";
const ORDER = [`ich (mochte|nehme|hatte gern) ${ITEM}( und ${ITEM})?( bitte)?`];
const LIKE_EAT = ["ich esse (sehr )?gern(e)? ~"];

export const bab04 = chapter({
  id: "bab-04",
  no: 4,
  unit: 4,
  title: "Meja untuk Tiga",
  tagline: "Jumat malam di Café Linde. Satu kursi masih kosong — untuk siapa?",
  cover: "u04-makan",
  place: "Café Linde",
  objectives: [
    { id: "order", title: "Memesan makanan dan minuman", phrase: "Ich möchte einen Tee, bitte." },
    { id: "likes", title: "Menceritakan kesukaan", phrase: "Ich esse gern Kuchen." },
  ],
  next: "Berikutnya: warna, ukuran, dan membayar di toko — musim dingin sudah dekat.",
  beats: [
    opening({
      bg: "jalan",
      lines: [n("Jumat malam. Lampu Café Linde menyala hangat. Di depan pintunya berdiri papan tulis kecil.")],
      prompt: "Apa yang kamu perhatikan?",
      look: [
        { label: "Baca papan menu", lines: [nd("Heute: Apfelkuchen 3 Euro, Tee 2 Euro, Kaffee 2 Euro", "Hari ini: kue apel 3 euro, teh 2 euro, kopi 2 euro", { overlay: paper("sign", "Heute:\nApfelkuchen 3 €\nTee 2 € · Kaffee 2 €") })] },
        { label: "Intip lewat jendela", lines: [n("Di dalam, satu meja kecil sudah ditata untuk tiga orang. Mia duduk di sana; dua kursi lainnya masih kosong.")] },
      ],
      go: "Masuk ke kafe",
    }),

    lesson({
      obj: "order",
      intro: [tu("Di kafe, satu kalimat sopan membuka semuanya: „Ich möchte …“ — saya ingin.")],
      models: [
        td("Ich möchte einen Tee, bitte.", "Saya ingin teh, tolong. (der Tee → einen)"),
        td("Ich möchte ein Wasser, bitte.", "Saya ingin air, tolong. (das Wasser → ein)"),
        td("Ich nehme einen Kaffee.", "Saya ambil kopi. (nehmen = mengambil; sama sopannya)"),
      ],
      tip: "der → einen (einen Tee, einen Kaffee, einen Kuchen), das → ein (ein Wasser), die → eine (eine Limonade). Tutup dengan „bitte“. Pesanlah teh kepadaku.",
      practice: {
        prompt: "Latihan: pesan secangkir teh.",
        chips: "Ich möchte nehme einen ein Tee Kaffee , bitte .",
        hints: ["Kamu ingin memesan teh dengan sopan.", "Mulai dengan: „Ich möchte einen …“"],
        model: "Ich möchte einen Tee, bitte.",
        ok: ["ich (mochte|nehme|hatte gern) einen tee( bitte)?"],
        part: [
          { when: ["ich (mochte|nehme) ((ein|eine) )?tee( bitte)?"], say: [tu("Hampir! „Tee“ itu der, jadi „einen Tee“.", "question")] },
          { when: ["(einen |ein )?tee( bitte)?"], say: [tu("Itu dipahami — tetapi di kafe lebih sopan dengan kalimat utuh: „Ich möchte einen Tee, bitte.“")] },
          { when: [`ich (mochte|nehme) ${ITEM}( bitte)?`], say: [tu("Kalimatnya bagus! Tapi kali ini pesanlah teh: „einen Tee“.")] },
        ],
      },
      praise: "Sempurna. Dengan „Ich möchte … bitte“ kamu bisa memesan apa saja di kota ini.",
      go: "Menuju meja kasir",
    }),

    encounter({
      who: "lena",
      bg: "u04-makan",
      open: [d("lena", "Guten Abend! Willkommen im Café Linde. Was möchtest du trinken?", "Selamat malam! Selamat datang di Café Linde. Mau minum apa?", "smile", { sfx: "bell" })],
      turns: [
        {
          obj: "order",
          chips: "Ich möchte nehme einen ein eine Tee Kaffee Wasser , bitte .",
          hints: ["Lena menanyakan minuman pesananmu.", "Mulai dengan: „Ich möchte einen …“"],
          model: "Ich möchte einen Tee, bitte.",
          ok: ORDER,
          part: [
            { when: [`${ITEM}( bitte)?`, `${BARE}( bitte)?`], accept: true },
            { when: [`ich (mochte|nehme) ((ein|eine|einen) )?${BARE}( bitte)?`], say: [d("lena", "Gern! Also: einen Tee, einen Kaffee oder ein Wasser?", "Tentu! Jadi: einen Tee, einen Kaffee, atau ein Wasser?", "smile")] },
          ],
          then: [d("lena", "Kommt sofort!", "Segera datang!", "smile")],
        },
      ],
    }),

    lesson({
      obj: "likes",
      intro: [tu("Sambil menunggu pesanan, obrolan di meja biasanya soal selera. Satu kata kecil membuatmu terdengar alami: „gern“.")],
      models: [
        td("Was isst du gern?", "Kamu suka makan apa? (essen: ich esse, du isst)"),
        td("Ich esse gern Kuchen.", "Saya suka makan kue. (gern = dengan senang hati)"),
        td("Ich trinke gern Tee.", "Saya suka minum teh."),
        td("Ich trinke lieber Tee.", "Saya lebih suka minum teh. (lieber = lebih suka)"),
      ],
      tip: "„gern“ selalu sesudah kata kerja: Ich esse gern …, Ich trinke gern … Ceritakan makanan kesukaanmu.",
      practice: {
        ask: [d("tutor", "Was isst du gern?", "Kamu suka makan apa?", "question")],
        chips: "Ich esse trinke gern Kuchen Reis Brot Tee .",
        hints: ["Sebutkan makanan yang kamu sukai.", "Mulai dengan: „Ich esse gern …“"],
        model: "Ich esse gern Kuchen.",
        ok: LIKE_EAT,
        part: [
          { when: ["ich gern(e)? esse ~"], say: [tu("Kata-katanya lengkap, tinggal urutannya: kata kerja dulu, baru „gern“ — „Ich esse gern …“", "question")] },
          { when: ["ich trinke (gern|gerne|lieber) ~"], say: [tu("Itu minuman — bagus! Tapi pertanyaanku soal makanan: „Ich esse gern …“")] },
          { when: ["ich esse ~"], say: [tu("Benar, tapi tambahkan „gern“ supaya artinya suka: „Ich esse gern …“")] },
        ],
      },
      praise: "Bagus! esse + gern, trinke + gern. Dengan itu kamu sudah bisa bercerita tentang seleramu.",
      go: "Duduk di meja untuk tiga",
    }),

    hub({
      bg: "u04-makan",
      intro: [n("Mia melambai dari meja untuk tiga. Jonas sudah duduk di sebelahnya. Di etalase dekat kasir, kue apel yang baru matang masih mengepul.")],
      prompt: "Ke mana kamu melangkah?",
      side: {
        label: "Tanyakan harga kue di etalase",
        leave: "Kamu kembali ke meja.",
        enc: {
          who: "lena",
          open: [d("lena", "Unser Apfelkuchen ist ganz frisch!", "Kue apel kami baru matang!", "smile")],
          turns: [
            {
              obj: "price",
              prompt: "Giliranmu. Tanyakan harga kuenya.",
              chips: "Was kostet der Kuchen ? das",
              hints: ["Kamu ingin tahu harga kue apel itu.", "Seperti di pasar: „Was kostet …?“"],
              model: "Was kostet der Kuchen?",
              ok: ["(was|wie viel|wieviel) kostet (der|ein) (kuchen|apfelkuchen)", "(was|wie viel|wieviel) kostet das"],
              part: [{ when: ["(was|wie viel|wieviel) kostet (das|die|den)? ?(kuchen|apfelkuchen)"], accept: true }],
              then: [d("lena", "Drei Euro das Stück.", "Tiga euro sepotong.", "smile")],
            },
          ],
        },
      },
      main: {
        label: "Duduk bersama Mia dan Jonas",
        enc: {
          who: "jonas",
          open: [d("jonas", "Hey, {name}! Schön, dich zu sehen. Was isst du gern?", "Hei, {name}! Senang melihatmu. Kamu suka makan apa?", "smile")],
          turns: [
            {
              obj: "likes",
              chips: "Ich esse trinke gern Kuchen Reis Brot .",
              hints: ["Jonas ingin tahu makanan kesukaanmu.", "Mulai dengan: „Ich esse gern …“"],
              model: "Ich esse gern Kuchen.",
              ok: LIKE_EAT,
              part: [
                { when: ["ich gern(e)? esse ~"], say: [d("jonas", "Wie bitte? Was isst du gern?", "Maaf, apa? Kamu suka makan apa?", "question")] },
                { when: ["ich esse ~", "(gern |gerne )?(kuchen|reis|brot|nudeln|pizza|suppe)"], accept: true },
              ],
              then: [d("jonas", "Lecker! Dann nehmen wir drei Stück Kuchen.", "Enak! Kalau begitu kita ambil tiga potong kue.", "smile")],
            },
            {
              obj: "likes",
              ask: [d("jonas", "Ich trinke immer Kaffee. Trinkst du auch gern Kaffee?", "Aku selalu minum kopi. Kamu juga suka minum kopi?", "question")],
              chips: "Nein Ja , ich trinke lieber gern auch Tee Kaffee .",
              hints: ["Jonas menebak seleramu. Setujui, atau katakan apa yang lebih kamu sukai.", "Mulai dengan: „Nein, ich trinke lieber …“ atau „Ja, ich trinke gern …“"],
              model: "Nein, ich trinke lieber Tee.",
              ok: ["(nein )?ich trinke lieber ~", "(ja )?ich trinke (auch )?(sehr )?(gern|gerne)( auch)? ~", "nein ich trinke (nicht gern|keinen) kaffee"],
              part: [{ when: ["ja( gern| gerne)?", "nein( danke)?", `(nein )?(lieber )?${BARE}`], accept: true }],
              then: [d("jonas", "Gut zu wissen! Das merke ich mir.", "Bagus untuk diketahui! Akan kuingat.", "smile")],
            },
          ],
          close: [d("jonas", "Übrigens: Der dritte Platz ist für dich. Mia hat eine Überraschung!", "Omong-omong: kursi ketiga itu untukmu. Mia punya kejutan!", "smile")],
        },
      },
      exit: "Tanyakan kejutannya pada Mia",
    }),

    payoff({
      lines: [
        n("Mia mendorong sebuah serbet terlipat ke arahmu. Di dalamnya ada tulisan tangan.", { sfx: "paper" }),
        nd("Samstag, 11 Uhr: Kaufhaus. Du brauchst eine Jacke!", "Sabtu, jam 11: toko serba ada. Kamu butuh jaket! — Musim dingin sudah dekat, dan Mia memperhatikan kamu kedinginan.", {
          overlay: paper("note", "Samstag, 11 Uhr:\nKaufhaus.\nDu brauchst eine Jacke!", "— Mia"),
        }),
      ],
    }),
  ],
});
