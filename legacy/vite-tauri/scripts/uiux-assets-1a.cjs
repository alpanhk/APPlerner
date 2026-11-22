// UIUX-VISUAL-AUDIO-20261120 / 1a: salin HANYA aset terverifikasi dari worktree
// desain ke public/ (Vite menyalin public/ ke dist/, sehingga offline).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const design = "../lernen-design/outputs";
const repo = path.resolve(__dirname, "..");
const cafeDir = path.join(design, "aset-im-cafe-produksi-2026-11-20");
const stockDir = path.join(design, "stok-aset-materi-2026-11-20");
const audioDir = path.join(design, "stok-aset-audio-lernen-2026-11-20");
const map = {
  task: "UIUX-VISUAL-AUDIO-20261120",
  owner: "1a",
  generatedAt: new Date().toISOString(),
  policy: "hanya entri verified/created/preview dengan berkas ada dan hash cocok",
  cafe: [], covers: [], audio: [], gaps: [],
};

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}
function copyVerified(source, dest, expected, entry) {
  if (!fs.existsSync(source)) {
    map.gaps.push({ ...entry, status: "tidak", alasan: "berkas sumber tidak ada" });
    return false;
  }
  const hash = sha256(source);
  if (expected && hash !== expected) {
    map.gaps.push({ ...entry, status: "tidak", alasan: "hash sumber tidak cocok manifest" });
    return false;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.existsSync(dest)) {
    if (sha256(dest) !== hash) {
      throw new Error(`tujuan sudah ada dengan isi berbeda: ${dest}`);
    }
  } else {
    fs.copyFileSync(source, dest);
  }
  if (sha256(dest) !== hash) throw new Error(`salinan gagal diverifikasi: ${dest}`);
  return true;
}
function rel(file) { return path.relative(repo, file).replace(/\\/g, "/"); }

// 1. Tujuh WebP cel Im Café sesuai manifest dan runtimeFile.
const cafeManifest = JSON.parse(fs.readFileSync(path.join(cafeDir, "manifest.json"), "utf8"));
function walkCafe(node) {
  if (!node || typeof node !== "object") return;
  if (node.webp && node.webp.file && node.webp.sha256 && node.runtimeFile) {
    const source = path.join(cafeDir, node.webp.file);
    const dest = path.join(repo, node.runtimeFile);
    if (copyVerified(source, dest, node.webp.sha256, { klip: node.runtimeFile })) {
      map.cafe.push({
        klip: path.basename(node.runtimeFile),
        sumber: path.resolve(source).replace(/\\/g, "/"),
        tujuan: rel(dest),
        hash: sha256(dest),
        status: "terpakai",
        width: node.webp.width, height: node.webp.height, bytes: node.webp.bytes,
      });
    }
  }
  for (const value of Object.values(node)) walkCafe(value);
}
walkCafe(cafeManifest.assets);

// 2. Sampul: hanya status verified DAN semua files ada.
const inventory = JSON.parse(fs.readFileSync(path.join(stockDir, "sampul/inventaris.json"), "utf8"));
for (const reading of inventory.readings) {
  const files = reading.files || [];
  if (reading.status !== "verified" || files.length === 0) {
    map.gaps.push({ textId: reading.textId, title: reading.title, status: "tidak", alasan: `status=${reading.status}` });
    continue;
  }
  const copied = [];
  for (const file of files) {
    const source = path.join(stockDir, "sampul", file);
    const dest = path.join(repo, "public/klab/sampul", String(reading.textId), path.basename(file));
    if (copyVerified(source, dest, null, { textId: reading.textId, file })) {
      copied.push({
        sumber: path.resolve(source).replace(/\\/g, "/"),
        tujuan: rel(dest), hash: sha256(dest), status: "terpakai",
      });
    }
  }
  if (copied.length === files.length) {
    map.covers.push({
      textId: reading.textId, title: reading.title, level: reading.level,
      sourceCatalog: reading.source, files: copied, status: "terpakai",
    });
  } else {
    map.gaps.push({ textId: reading.textId, title: reading.title, status: "tidak", alasan: "sebagian berkas tidak ada" });
  }
}

// 3. Audio: 13 tuturan baru, 2 pratinjau, dan 3 sampel sound design (WAV + Opus).
const audioManifest = JSON.parse(fs.readFileSync(path.join(audioDir, "audio-manifest.json"), "utf8"));
for (const [assetId, asset] of Object.entries(audioManifest.assets)) {
  if (asset.status !== "created" && asset.status !== "preview") continue;
  const source = path.resolve(audioDir, asset.file);
  const dest = path.join(repo, "public/audio", asset.file);
  if (copyVerified(source, dest, asset.sha256, { klip: assetId })) {
    map.audio.push({
      klip: assetId,
      sumber: source.replace(/\\/g, "/"),
      tujuan: rel(dest),
      hash: sha256(dest),
      status: asset.status === "preview" ? "verified-preview" : "terpakai",
      codec: asset.codec, bytes: asset.bytes, decodeCheck: asset.decodeCheck || null,
    });
  }
}
function walkSound(node, name) {
  if (!node || typeof node !== "object") return;
  if (node.file && node.sha256) {
    const source = path.resolve(audioDir, node.file);
    const dest = path.join(repo, "public/audio", node.file);
    if (copyVerified(source, dest, node.sha256, { klip: name + ":" + path.basename(node.file) })) {
      map.audio.push({
        klip: `${name}:${path.basename(node.file)}`,
        sumber: source.replace(/\\/g, "/"), tujuan: rel(dest), hash: sha256(dest),
        status: "terpakai", codec: node.codec, bytes: node.bytes,
        decodeCheck: node.decodeCheck || null,
      });
    }
  }
  for (const [key, value] of Object.entries(node)) {
    if (key !== "files") walkSound(value, name);
  }
}
for (const [name, design] of Object.entries(audioManifest.soundDesign)) {
  walkSound(design.files || design, name);
}

// 4. Peta kekurangan yang jujur.
map.gaps.push(
  { klip: "sampul pending", status: "tidak", jumlah: inventory.readings.filter((r) => r.status !== "verified").length, alasan: "tidak diimpor sesuai mandat" },
  { klip: "SRS headword tanpa offline", status: "tidak", jumlah: audioManifest.summary.remainingSrsHeadwordsWithoutOffline, alasan: "belum ada tuturan terverifikasi" },
  { klip: "SRS example tanpa offline", status: "tidak", jumlah: audioManifest.summary.remainingSrsExamplesWithoutOffline, alasan: "belum ada tuturan terverifikasi" },
  { klip: "Opus WebView2", status: "pending", alasan: "dekode Opus belum diuji di EXE; WAV disalin sebagai fallback dan dipakai default" },
  { klip: "Anna-Budi dialog pair", status: "pending", alasan: "pasangan dua giliran dari dua materi menunggu persetujuan naskah" },
);

const outDir = path.join(repo, "outputs/penyelesaian-windows");
fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, "uiux-asset-map-1a.json");
fs.writeFileSync(out, JSON.stringify(map, null, 2) + "\n", "utf8");
console.log(JSON.stringify({
  cafe: map.cafe.length, covers: map.covers.length, audio: map.audio.length,
  gaps: map.gaps.length, map: rel(out),
}, null, 2));
