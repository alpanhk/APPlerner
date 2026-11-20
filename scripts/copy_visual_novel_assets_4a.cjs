// UIUX-VISUAL-NOVEL-20261121 / 4a — salin 96 aset referensi terverifikasi.
// Referensi: aset terverifikasi di repo (src/data/ref-visual-novel-manifest.json).
// Dedup SHA-256; uji header WebP/JPEG; tanpa stok pending.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const reference = process.env.VISUAL_NOVEL_REFERENCE || root;
const manifestPath = path.join(root, 'src/data/ref-visual-novel-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const evidenceDir = path.join(root, 'outputs/penyelesaian-windows/uiux-visual-novel-20261121');
fs.mkdirSync(evidenceDir, { recursive: true });

const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function decodeInfo(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = b.toString('ascii', 12, 16);
    let w = 0, h = 0;
    if (chunk === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
    else if (chunk === 'VP8L') { const bits = b.readUInt32LE(21); w = 1 + (bits & 0x3fff); h = 1 + ((bits >>> 14) & 0x3fff); }
    else if (chunk === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
    if (!w || !h || w > 4096 || h > 4096) throw new Error(`WebP dimensi tidak wajar ${w}x${h}`);
    return { format: 'webp', w, h, bytes: b.length };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2, w = 0, h = 0;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break;
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    if (!w || !h) throw new Error('JPEG dimensi tidak terbaca');
    return { format: 'jpeg', w, h, bytes: b.length };
  }
  throw new Error('format gambar tidak dikenal');
}

const rows = [];
const problems = [];
let copied = 0, deduped = 0;
const seen = new Map();

for (const row of manifest.rows) {
  if (!/^(public\/|src\/assets\/)/.test(row.path)) continue;
  const src = path.join(reference, row.path);
  if (!fs.existsSync(src)) { problems.push({ path: row.path, reason: 'sumber tidak ada' }); continue; }
  const sourceHash = sha(src);
  if (sourceHash !== row.sha256) { problems.push({ path: row.path, reason: 'hash sumber tidak cocok manifest' }); continue; }
  const dest = path.join(root, row.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const key = sourceHash;
  if (seen.has(key)) deduped++; else seen.set(key, row.path);
  if (!fs.existsSync(dest) || sha(dest) !== sourceHash) {
    fs.copyFileSync(src, dest);
    copied++;
  }
  let decoded = null;
  try { decoded = decodeInfo(dest); }
  catch (error) { problems.push({ path: row.path, reason: `dekode gagal: ${error.message}` }); }
  rows.push({ path: row.path, sha256: sourceHash, status: fs.existsSync(dest) ? 'ok' : 'missing', ...decoded });
}

const report = {
  task: 'UIUX-VISUAL-NOVEL-20261121', owner: '4a',
  manifestFiles: manifest.files,
  manifestAggregate: manifest.aggregate_sha256,
  mediaRows: rows.length,
  uniqueHashes: seen.size,
  copied, deduped, problems,
  rows,
  at: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'assets-4a.json'), JSON.stringify(report, null, 2));
console.log(`media=${rows.length} copied=${copied} dedup=${deduped} unique=${seen.size} problems=${problems.length}`);
if (problems.length) { console.log(JSON.stringify(problems.slice(0, 10), null, 2)); process.exitCode = 1; }
