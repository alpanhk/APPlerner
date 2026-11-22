// RAK-DIALOG / INTERAKSI-LERNEN 1a: resolver sampul tunggal untuk rak &
// cuplikan (67 textId) + data halaman Koleksi aset untuk 4a.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const repo = path.resolve(__dirname, "..");
const design = "../lernen-design/outputs";
const sha256 = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");

// Urutan textId sama dengan src/klab/learning/logic.ts (TEXT_FILES).
const TEXT_FILES = [
  "texts_a1.json", "texts_a1a2_extra.json", "texts_a2.json",
  "texts_b1.json", "texts_b2.json", "texts_extra.json",
];
const readings = [];
for (const file of TEXT_FILES) {
  const json = JSON.parse(fs.readFileSync(path.join(repo, "src/data/reading", file), "utf8"));
  for (const text of json.texts) readings.push({ textId: readings.length + 1, ...text });
}
if (readings.length !== 67) throw new Error(`harapan 67 bacaan, dapat ${readings.length}`);

const inventory = JSON.parse(fs.readFileSync(path.join(repo, "outputs/penyelesaian-windows/rak-dialog-inventory-1a.json"), "utf8"));
const verifiedCovers = new Map(inventory.rows.filter((r) => r.mediaType === "sampul" && r.status === "terpakai")
  .map((r) => [r.textId, r]));
const scenes = inventory.rows.filter((r) => r.mediaType === "ilustrasi-adegan" && r.status === "terpakai" && r.textId);
const sceneByText = new Map(scenes.map((r) => [r.textId, r]));

// Latar tematik nyata sebagai dasar sampul editorial bertitel.
const latarInv = JSON.parse(fs.readFileSync(path.join(design, "stok-aset-materi-2026-11-20/latar-properti/latar/inventaris.json"), "utf8"));
const byLevel = {
  A1: latarInv.aset.find((a) => a.id === "taman-waktu-luang"),
  A2: latarInv.aset.find((a) => a.id === "galeri"),
  B1: latarInv.aset.find((a) => a.id === "elbe"),
  B2: latarInv.aset.find((a) => a.id === "ostsee"),
};
for (const asset of Object.values(byLevel)) {
  if (!asset) continue;
  const dest = path.join(repo, "public/media/themes", `${asset.id}.webp`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const source = path.join(design, "stok-aset-materi-2026-11-20/latar-properti", asset.webp);
  if (!fs.existsSync(source)) throw new Error(`latar hilang: ${source}`);
  if (!fs.existsSync(dest)) fs.copyFileSync(source, dest);
  if (sha256(dest) !== asset.sha256) throw new Error(`hash latar beda: ${dest}`);
}

function cleanLabel(reading) {
  const tags = String(reading.tags || "")
    .split(/[·,]/)
    .map((s) => s.trim())
    .filter((s) => s && !/^seed$/i.test(s));
  return [reading.level, ...tags].filter(Boolean).join(" · ");
}

const covers = readings.map((reading) => {
  const cover = verifiedCovers.get(reading.textId);
  if (cover) {
    return {
      textId: reading.textId, title: reading.title, level: reading.level,
      label: cleanLabel(reading), src: `/klab/sampul/${reading.textId}/cover.webp`,
      kind: "khusus", status: "verified", hash: cover.hash,
    };
  }
  const scene = sceneByText.get(reading.textId);
  if (scene) {
    return {
      textId: reading.textId, title: reading.title, level: reading.level,
      label: cleanLabel(reading), src: `/${scene.tujuan}`,
      kind: "tematik", status: "tersedia", hash: scene.hash, sceneId: scene.id,
    };
  }
  const theme = byLevel[reading.level];
  return {
    textId: reading.textId, title: reading.title, level: reading.level,
    label: cleanLabel(reading), src: `/media/themes/${theme.id}.webp`,
    kind: "tematik-editorial", status: "tersedia", hash: theme.sha256,
  };
});

const coverMap = {
  task: "RAK-DIALOG-20261120",
  owner: "1a",
  rule: "satu resolver untuk rak dan cuplikan; judul dirender sebagai teks HTML, gambar sebagai ilustrasi",
  counts: {
    total: covers.length,
    khusus: covers.filter((c) => c.kind === "khusus").length,
    tematik: covers.filter((c) => c.kind !== "khusus").length,
  },
  covers,
};
fs.writeFileSync(path.join(repo, "src/data/cover-map.json"), JSON.stringify(coverMap, null, 2) + "\n", "utf8");

// Data halaman koleksi milik 4a: hanya produksi unik/layak ditinjau.
const collection = inventory.rows
  .filter((r) => ["terpakai", "draf"].includes(r.status) && r.tujuan && !r.id.startsWith("legacy:"))
  .map((r) => ({
    id: r.id,
    group: r.mediaType,
    title: r.title || r.id,
    textId: r.textId ?? null,
    speaker: r.speaker ?? null,
    sentence: r.sentence ?? null,
    src: r.tujuan.startsWith("public/") ? "/" + r.tujuan.slice("public/".length) : "/" + r.tujuan,
    status: r.status === "draf" ? "draft" : "available",
    reason: r.reason || null,
    hash: r.hash,
  }));
const collectionMap = {
  task: "RAK-DIALOG-20261120",
  owner: "4a",
  note: "4a pemilik halaman; file ini hanya data. Item draft wajib berlabel. Duplikat/QA/prompt/screenshot tidak disertakan.",
  groups: ["karakter-latar-properti", "latar", "properti", "sampul", "ilustrasi-adegan", "suara-tunggal", "musik", "ambience", "efek", "contoh-tampilan"],
  items: collection,
};
fs.writeFileSync(path.join(repo, "src/data/collection-map.json"), JSON.stringify(collectionMap, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ covers: coverMap.counts, collectionItems: collection.length }, null, 2));
