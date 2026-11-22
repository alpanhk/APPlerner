// RAK-DIALOG-20261120 / 1a: inventaris seluruh media produksi dari worktree
// desain + media lokal lama, dedup SHA-256, salin aset unik ke public/media/,
// dan tulis peta textId/judul/jenis/penutur/src/layar/aksi.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const designOut = "../lernen-design/outputs";
const repo = path.resolve(__dirname, "..");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const rel = (file) => path.relative(repo, file).replace(/\\/g, "/");
const abs = (file) => path.resolve(file).replace(/\\/g, "/");
const MEDIA_EXT = new Set([".webp", ".png", ".jpg", ".jpeg", ".wav", ".opus", ".ogg", ".mp3"]);
const EXCLUDE_DIR = /review|screenshot|bukti|qa|arsip|archive|prompt|catatan/i;

const rows = [];
const seen = new Map(); // hash -> canonical id (dedup)

function add(row, source, dest, copy = true) {
  if (!fs.existsSync(source)) {
    row.status = "tidak";
    row.reason = "berkas sumber tidak ada";
    rows.push(row);
    return;
  }
  const hash = sha256(source);
  if (seen.has(hash)) {
    rows.push({ ...row, hash, status: "duplikat", duplicateOf: seen.get(hash), reason: "hash sama dengan entri lain" });
    return;
  }
  seen.set(hash, row.id);
  if (copy && dest) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    if (!fs.existsSync(dest)) fs.copyFileSync(source, dest);
    if (sha256(dest) !== hash) throw new Error(`salinan tidak cocok: ${dest}`);
  }
  rows.push({
    ...row, hash,
    sumber: abs(source),
    tujuan: dest ? rel(dest) : row.tujuan || null,
    status: row.status || "terpakai",
  });
}

// ---- 1. Sampul inventaris (verified + berkas ada) -------------------------
const coverInv = JSON.parse(fs.readFileSync(path.join(designOut, "stok-aset-materi-2026-11-20/sampul/inventaris.json"), "utf8"));
for (const reading of coverInv.readings) {
  const cover = (reading.files || []).find((f) => /cover\.webp$/i.test(f));
  if (!cover || reading.status !== "verified") {
    rows.push({
      id: `cover:${reading.textId}`, textId: reading.textId, title: reading.title,
      mediaType: "sampul", status: "tidak", reason: `status=${reading.status}; tanpa cover.webp`,
    });
    continue;
  }
  add({
    id: `cover:${reading.textId}`, textId: reading.textId, title: reading.title,
    mediaType: "sampul", level: reading.level, screen: "Jelajah › Bacaan; Cuplikan",
    action: "buka cuplikan; tampil juga di rak",
    tujuan: path.join(repo, "public/klab/sampul", String(reading.textId), "cover.webp"),
  }, path.join(designOut, "stok-aset-materi-2026-11-20/sampul", cover));
}

// ---- 2. Adegan unit (13 scene WebP + original PNG) ------------------------
const sceneInv = JSON.parse(fs.readFileSync(path.join(designOut, "stok-aset-materi-2026-11-20/INVENTARIS.json"), "utf8"));
for (const asset of sceneInv.assets) {
  const textIds = (asset.readings || []).map((r) => r.textId);
  add({
    id: `scene:${asset.id}`, textId: textIds[0] ?? null,
    textIds, title: asset.title, mediaType: "ilustrasi-adegan",
    speaker: null, sentence: asset.description,
    screen: "Materi; Bacaan", action: "buka pelajaran/bacaan terkait",
  }, path.join(designOut, "stok-aset-materi-2026-11-20", asset.webp),
    path.join(repo, "public/media/scenes", asset.id, "scene.webp"));
  if (asset.original) {
    add({
      id: `scene:${asset.id}:original`, textId: textIds[0] ?? null, title: asset.title,
      mediaType: "ilustrasi-sumber", screen: "Koleksi aset", action: "pratinjau sumber",
    }, path.join(designOut, "stok-aset-materi-2026-11-20", asset.original),
      path.join(repo, "public/media/scenes", asset.id, "original.png"));
  }
}

// ---- 3. Cel Im Café (7 layer) -------------------------------------------
const cafeManifest = JSON.parse(fs.readFileSync(path.join(designOut, "aset-im-cafe-produksi-2026-11-20/manifest.json"), "utf8"));
function walkCafe(node, key) {
  if (!node || typeof node !== "object") return;
  if (node.webp && node.webp.file && node.runtimeFile) {
    const layer = key.split("/").filter(Boolean).pop() || key;
    add({
      id: `cafe:${path.basename(node.runtimeFile)}`, textId: 10, title: "Im Café",
      mediaType: "karakter-latar-properti", layer, speaker: layer.includes("barista") ? "Barista" : layer.includes("learner") ? "Pemelajar" : null,
      screen: "Jelajah › Bacaan › Im Café; Dialog", action: "Mulai percakapan; Dengarkan dialog",
      tujuan: path.join(repo, node.runtimeFile),
    }, path.join(designOut, "aset-im-cafe-produksi-2026-11-20", node.webp.file), false);
  }
  for (const [k, v] of Object.entries(node)) walkCafe(v, `${key}/${k}`);
}
walkCafe(cafeManifest.assets, "cafe");

// ---- 4. Audio: tuturan baru, pratinjau, sound design ---------------------
const audioManifest = JSON.parse(fs.readFileSync(path.join(designOut, "stok-aset-audio-lernen-2026-11-20/audio-manifest.json"), "utf8"));
for (const [assetId, asset] of Object.entries(audioManifest.assets)) {
  if (asset.status !== "created" && asset.status !== "preview") continue;
  const rowEntry = Object.values(audioManifest.rows).find((r) => r.assetId === assetId);
  add({
    id: `audio:${assetId}`, textId: rowEntry?.designTextId ?? null,
    title: rowEntry?.title ?? rowEntry?.materialId ?? assetId,
    mediaType: asset.status === "preview" ? "pratinjau-audio" : "suara-tunggal",
    speaker: rowEntry?.speaker ?? null, sentence: rowEntry?.german ?? null,
    meaning: rowEntry?.indonesian ?? null,
    screen: "Dialog; Bacaan; Hören; Koleksi aset", action: "putar klip",
    codec: asset.codec, decodeCheck: asset.decodeCheck || null,
  }, path.resolve(designOut, "stok-aset-audio-lernen-2026-11-20", asset.file),
    path.join(repo, "public/audio", asset.file));
}
function walkSound(node, name) {
  if (!node || typeof node !== "object") return;
  if (node.file && node.sha256) {
    const type = name === "idle" ? "musik" : name === "ambience" ? "ambience" : "efek";
    add({
      id: `audio:${name}:${path.basename(node.file)}`, title: `${name} · ${path.basename(node.file)}`,
      mediaType: type, screen: name === "idle" ? "Hari Ini; Jelajah" : "Dialog kafe",
      action: node.loop ? "putar loop saat diaktifkan" : "putar sekali saat pemicu",
      codec: node.codec, decodeCheck: node.decodeCheck || null,
    }, path.resolve(designOut, "stok-aset-audio-lernen-2026-11-20", node.file),
      path.join(repo, "public/audio", node.file));
  }
  for (const [k, v] of Object.entries(node)) if (k !== "files") walkSound(v, name);
}
for (const [name, design] of Object.entries(audioManifest.soundDesign)) walkSound(design.files || design, name);

// ---- 5. Sepuluh sampel UI/UX (mockup -> pratinjau berlabel) -------------
const sampleRoot = path.join(designOut, "sampel-aset-uiux-lernen-2026-11-20");
for (const dir of fs.readdirSync(sampleRoot, { withFileTypes: true }).filter((d) => d.isDirectory())) {
  const files = fs.readdirSync(path.join(sampleRoot, dir.name)).filter((f) => MEDIA_EXT.has(path.extname(f).toLowerCase()));
  for (const file of files) {
    add({
      id: `sample:${dir.name}:${file}`, title: `${dir.name} · contoh tampilan`,
      mediaType: "contoh-tampilan", status: "draf",
      screen: "Koleksi aset › Pratinjau media", action: "lihat contoh (berlabel draf)",
      reason: "mockup antarmuka; bukan ilustrasi produksi",
    }, path.join(sampleRoot, dir.name, file),
      path.join(repo, "public/media/samples", dir.name, file));
  }
}

// ---- 6. Media lokal lama yang dipakai (tts_core, tanpa menyalin) --------
const oldManifest = JSON.parse(fs.readFileSync(path.join(repo, "src/assets/tts_core/manifest.json"), "utf8"));
const oldFiles = Object.values(oldManifest).flatMap((v) => Array.isArray(v) ? v : (v && typeof v === "object" ? Object.values(v) : []));
const oldClips = new Set();
for (const value of oldFiles) {
  if (typeof value === "string" && MEDIA_EXT.has(path.extname(value).toLowerCase())) oldClips.add(value);
}
for (const clip of oldClips) {
  rows.push({
    id: `legacy:${clip}`, title: clip, mediaType: "suara-tunggal-lama",
    screen: "Bacaan; Materi; Dialog", action: "putar klip lokal",
    sumber: abs(path.join(repo, "src/assets/tts_core", clip)),
    tujuan: "src/assets/tts_core/" + clip,
    status: "terpakai", reason: "media lama sudah di-bundle; tidak disalin ulang",
  });
}

// ---- Peta akhir ----------------------------------------------------------
const groups = rows.reduce((acc, r) => { acc[r.mediaType || "lain"] = (acc[r.mediaType || "lain"] || 0) + 1; return acc; }, {});
const statuses = rows.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
const map = {
  task: "RAK-DIALOG-20261120",
  owner: "1a",
  generatedAt: new Date().toISOString(),
  dedup: "SHA-256",
  uniqueHashes: seen.size,
  groups, statuses,
  coverResolverContract: {
    input: "textId:number",
    output: { src: "URL relatif aplikasi", title: "judul asli", level: "A1|A2|B1|B2", kind: "khusus|tematik|tipografis", status: "verified|draft|fallback" },
    rule: "satu resolver dipakai rak dan cuplikan; tidak boleh memilih gambar berbeda untuk textId yang sama",
    targetOwner: "4a",
  },
  routesContract: {
    reading: { name: "reader", textId: "number", mode: "read|listen", trigger: "Baca/Dengarkan dari cuplikan" },
    dialog: { name: "dialog", textId: "number", scene: "cafe", trigger: "Mulai percakapan/Dengarkan dialog" },
    listen: { name: "reader", textId: "number", mode: "listen", trigger: "tombol Dengarkan" },
    owner: "2a",
  },
  rows,
};
const outDir = path.join(repo, "outputs/penyelesaian-windows");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "rak-dialog-inventory-1a.json");
fs.writeFileSync(out, JSON.stringify(map, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ rows: rows.length, uniqueHashes: seen.size, groups, statuses, map: rel(out) }, null, 2));
