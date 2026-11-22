#!/usr/bin/env node
// PILOT-AGENT-1 · tes struktural kandidat visual novel (Mandat §8).
// Memvalidasi tanpa UI:
//  1. Graf cerita prolog + Bab 11 + Bab 12: semua target node ada, tidak ada
//     node yatim pada jalur misi, node end terjangkau.
//  2. Anti-bocor U05: teks tampil soal menyimak tidak memuat angka peron baru;
//     papan pada node soal masih data lama (fresh=false); label pilihan tidak
//     menandai jawaban benar; spokenText/transkrip memuat angka dari audio.
//  3. Semua id audio node ada di manifest a1-story (berlisensi) atau berkas
//     prolog; pola {avatar} tersedia untuk 4 avatar produksi.
//  4. Isolasi misi (Mandat §1.3): node Bab 11/12 tidak menyentuh flag prolog;
//     prolog tidak menunjuk ke Bab 11/12 (misi hanya lewat App, slot terpisah).
// Keluaran: ringkas per kelompok + exit 0 bila semua lulus.
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.resolve(__dirname, "..");
const fails = [];
const passes = [];
const ok = (name) => passes.push(name);
const bad = (name, detail) => fails.push(`${name}${detail ? " — " + detail : ""}`);

function loadStoryModule(rel) {
  const file = path.join(ROOT, rel);
  const source = fs.readFileSync(file, "utf8");
  const out = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      isolatedModules: false,
    },
  });
  const mod = { exports: {} };
  // Cerita hanya mengimpor tipe (dihilangkan transpile); aman dievaluasi.
  new Function("module", "exports", out.outputText)(mod, mod.exports);
  return mod.exports;
}

const prolog = loadStoryModule("src/klab/novel/data/story/prolog.ts");
const bab11 = loadStoryModule("src/klab/novel/data/story/bab-11.ts");
const bab12 = loadStoryModule("src/klab/novel/data/story/bab-12.ts");

const NODES = {
  ...(prolog.PROLOG_NODES ?? {}),
  ...(bab11.CH11_NODES ?? {}),
  ...(bab12.CH12_NODES ?? {}),
};
const nodeIds = Object.keys(NODES);

/** Hasil penilai node (evaluate) berupa literal di dalam fungsi — ambil semua
 *  "next: \"...\"" dari sumbernya agar graf tetap dapat ditelusuri penuh. */
const evalEdges = (n) => {
  if (!n.evaluate) return [];
  return [...n.evaluate.toString().matchAll(/next:\s*"([^"]+)"/g)].map((m) => m[1]);
};

// ---------- 1. Graf cerita ----------
{
  const targets = new Set();
  for (const n of Object.values(NODES)) {
    if (n.kind === "line") targets.add(n.next);
    if (n.kind === "choice") for (const o of n.options) targets.add(o.next);
    if (n.kind === "input") {
      if (n.mic) targets.add(n.mic.next);
      if (n.skip) targets.add(n.skip.next);
      for (const h of n.handlers ?? []) targets.add(h.next);
      for (const t of evalEdges(n)) targets.add(t);
    }
  }
  const missing = [...targets].filter((t) => !NODES[t]);
  missing.length ? bad("graf: target node hilang", missing.join(", ")) : ok("graf: semua target node ada");

  for (const n of Object.values(NODES)) {
    if (n.kind === "input") {
      if (!n.handlers?.length && !n.evaluate) bad(`graf: input tanpa penilai/handler (${n.id})`);
      if (n.mic && !n.mic.next) bad(`graf: mic tanpa node tujuan (${n.id})`);
      if (n.mic && !n.mic.modelText) bad(`graf: mic tanpa modelText (${n.id})`);
    }
  }
  ok("graf: input memiliki penilai atau handler");

  // Node end misi terjangkau dari awal misi (BFS).
  const reach = (start) => {
    const seen = new Set([start]);
    const q = [start];
    while (q.length) {
      const id = q.shift();
      const n = NODES[id];
      if (!n) continue;
      const nexts = [];
      if (n.kind === "line") nexts.push(n.next);
      if (n.kind === "choice") nexts.push(...n.options.map((o) => o.next));
      if (n.kind === "input") {
        if (n.mic) nexts.push(n.mic.next);
        if (n.skip) nexts.push(n.skip.next);
        for (const h of n.handlers ?? []) nexts.push(h.next);
        for (const t of evalEdges(n)) nexts.push(t);
      }
      for (const t of nexts) if (!seen.has(t)) { seen.add(t); q.push(t); }
    }
    return seen;
  };
  const fromMission = reach("ch11-start");
  // "Coba jadwal lain" dimasuki lewat tindakan pemain (App → CH11_TRANSFER_START),
  // bukan tepi graf cerita; kedua pintu misi harus menjangkau akhirnya.
  const fromTransfer = reach("ch11-transfer-start");
  const missionUnion = new Set([...fromMission, ...fromTransfer]);
  for (const end of ["ch11-transfer-end", "ch12-end"]) {
    missionUnion.has(end) ? ok(`graf: ${end} terjangkau dari pintu misi`) : bad(`graf: ${end} tidak terjangkau dari misi`);
  }
  const fromProlog = reach(prolog.PROLOG_START);
  fromProlog.has("e_end") ? ok("graf: e_end terjangkau dari prolog") : bad("graf: e_end tidak terjangkau dari prolog");
}

// ---------- 2. Anti-bocor U05 ----------
{
  const SPOILER = /(gleis\s*(vier|4|fuenf|f\u00fcnf|5)\b|von\s*gleis\s*(vier|fuenf|f\u00fcnf))/i;
  const listenNodes = ["ch11-s02-petugas", "ch11-s02-announce", "ch11-transfer-announce"];
  for (const id of listenNodes) {
    const n = NODES[id];
    if (!n?.spokenText) { bad(`U05: ${id} bukan node menyimak (spokenText hilang)`); continue; }
    if (SPOILER.test(n.text)) bad(`U05: teks tampil ${id} bocor angka peron baru`, JSON.stringify(n.text));
    else ok(`U05: teks tampil ${id} bebas bocoran`);
    if (!SPOILER.test(n.spokenText)) bad(`U05: spokenText ${id} tidak memuat peron baru`);
    else ok(`U05: spokenText ${id} memuat peron dari audio`);
  }
  const boards = [
    ["ch11-s02-arrive", "2", false],
    ["ch11-s02-q", "2", false],
    ["ch11-s02-right", "4", true],
    ["ch11-transfer-q", "3", false],
    ["ch11-transfer-right", "5", true],
  ];
  for (const [id, gleis, fresh] of boards) {
    const n = NODES[id];
    if (!n?.stage?.board) { bad(`U05: papan ${id} tidak ada`); continue; }
    if (n.stage.board.gleis !== gleis || n.stage.board.fresh !== fresh) {
      bad(`U05: papan ${id} harus Gleis ${gleis} fresh=${fresh}, aktual Gleis ${n.stage.board.gleis} fresh=${n.stage.board.fresh}`);
    } else ok(`U05: papan ${id} konsisten (Gleis ${gleis}, fresh=${fresh})`);
  }
  // Label pilihan tidak menandai jawaban benar.
  for (const [id, correctNext, wrongNums] of [
    ["ch11-s02-q", "ch11-s02-right", ["2", "5"]],
    ["ch11-transfer-q", "ch11-transfer-right", ["3", "4"]],
  ]) {
    const n = NODES[id];
    const correct = n.options.find((o) => o.next === correctNext);
    if (!correct?.record?.full) { bad(`U05: opsi benar ${id} tidak tercatat penuh`); continue; }
    const labels = n.options.map((o) => o.label);
    if (labels.some((l) => /sesuai|pengumuman|benar|tiket/i.test(l))) {
      bad(`U05: label pilihan ${id} menandai jawaban`, labels.join(" | "));
    } else ok(`U05: label pilihan ${id} netral (${labels.join(", ")})`);
    for (const o of n.options) if (!o.record) bad(`U05: pilihan ${id} tanpa record (hasil pertama harus tersimpan)`);
    ok(`U05: setiap pilihan ${id} menyimpan hasil pertama`);
    void wrongNums;
  }
}

// ---------- 3. Validasi id audio ----------
{
  const ch11Manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public/a1-story/audio/a1-ch11/manifest.json"), "utf8"));
  const ch12Manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "public/a1-story/audio/a1-ch12/manifest.json"), "utf8"));
  const storyAssetIds = new Set([
    ...ch11Manifest.assets.map((a) => a.assetId),
    ...ch12Manifest.assets.map((a) => a.assetId),
  ]);
  const transcriptById = new Map([
    ...ch11Manifest.assets.map((a) => [a.assetId, a.transcript ?? ""]),
    ...ch12Manifest.assets.map((a) => [a.assetId, a.transcript ?? ""]),
  ]);
  const AVATARS = ["player-01", "player-02", "player-03", "player-04"];
  let audioChecked = 0;
  for (const n of Object.values(NODES)) {
    const ids = [];
    if (n.kind === "line" && n.audio) ids.push(n.audio);
    if (n.kind === "input" && n.modelAudio) ids.push(n.modelAudio);
    for (const id of ids) {
      if (id.includes("{avatar}")) {
        for (const av of AVATARS) {
          if (!storyAssetIds.has(id.replace(/\{avatar\}/g, av))) bad(`audio: varian avatar hilang ${id} → ${av}`);
        }
        ok(`audio: ${id} tersedia untuk 4 avatar`);
      } else if (id.startsWith("a1-ch11.") || id.startsWith("a1-ch12.")) {
        if (!storyAssetIds.has(id)) bad(`audio: id tidak ada di manifest — ${id}`);
      } else if (id.startsWith("prolog:")) {
        const file = id.replace(/^prolog:/, "");
        const found = ["mia", "pos", "tetangga", "tutor"].some((c) =>
          fs.existsSync(path.join(ROOT, `src/klab/novel/assets/voices/prolog/${c}/${file}.mp3`)));
        if (!found) bad(`audio: klip prolog tidak ada — ${id}`);
      } else if (!id.startsWith("speech:") && !id.startsWith("avatar:")) {
        bad(`audio: id tidak dikenal — ${id}`);
      }
      audioChecked++;
    }
  }
  ok(`audio: ${audioChecked} id audio node tervalidasi`);

  // Transkrip pengumuman cocok dengan manifest (sumber fakta tunggal).
  const norm = (s) => s.toLowerCase().replace(/\u00e4/g, "a").replace(/\u00fc/g, "u").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const ann = NODES["ch11-s02-announce"];
  const annAsset = transcriptById.get(ann.audio);
  if (norm(ann.spokenText) !== norm(annAsset)) {
    bad("audio: transkrip pengumuman berbeda dari manifest", `${ann.spokenText} vs ${annAsset}`);
  } else ok("audio: transkrip pengumuman = manifest (sumber fakta tunggal)");
}

// ---------- 4. Isolasi misi ----------
{
  for (const n of [...Object.values(bab11.CH11_NODES), ...Object.values(bab12.CH12_NODES)]) {
    for (const k of Object.keys(n.setFlags ?? {})) {
      if (!/^ch1[12]/.test(k)) bad(`misi: node ${n.id} menyentuh flag non-misi "${k}"`);
    }
  }
  ok("misi: node Bab 11/12 hanya memasang flag ch11*/ch12*");

  for (const n of Object.values(prolog.PROLOG_NODES)) {
    if (n.kind === "line" && /^ch1[12]-/.test(n.next)) bad(`misi: prolog ${n.id} menunjuk ke ${n.next}`);
  }
  ok("misi: prolog tidak menunjuk ke node Bab 11/12 (misi masuk lewat App, slot novel.mission.v1)");

  // Pesan Bab 12 terkirim tepat sekali: penilai memasang ch12MessageSent dan
  // hanya ch12-s03-write yang menuju ch12-s03-sent.
  const write = NODES["ch12-s03-write"];
  const src = write.evaluate.toString();
  if (!/ch12MessageSent/.test(src)) bad("misi: penilai pesan tidak memasang ch12MessageSent (idempoten)");
  else ok("misi: pengiriman pesan tercatat sekali (bendera ch12MessageSent)");
  const writers = Object.values(NODES).filter((n) =>
    (n.kind === "line" && n.next === "ch12-s03-sent") ||
    (n.kind === "input" && [n.mic?.next, n.skip?.next, ...(n.handlers ?? []).map((h) => h.next), ...evalEdges(n)].includes("ch12-s03-sent")));
  if (writers.length !== 1 || writers[0].id !== "ch12-s03-write") bad("misi: jalur menuju ch12-s03-sent tidak unik");
  else ok("misi: ch12-s03-sent hanya dicapai dari penilai pesan (satu kali kirim)");
}

// ---------- Ringkasan ----------
console.log(`LULUS ${passes.length}`);
for (const f of fails) console.log(`GAGAL ${f}`);
if (fails.length) {
  console.log(`test_pilot_agent1: ${fails.length} kegagalan, ${passes.length} lulus`);
  process.exit(1);
}
console.log(`test_pilot_agent1: SEMUA LULUS (${passes.length} pemeriksaan)`);
