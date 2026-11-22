// RAK-DIALOG-20261120 / 4a. Salin ilustrasi tematik yang dipakai sampul editorial
// dan verifikasi dekode WebP + hash. Tidak menyentuh aset 1a/2a.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const design = '../lernen-design/outputs';
const stock = path.join(design, 'stok-aset-materi-2026-11-20');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/klab/coverManifest.json'), 'utf8'));
const evidenceDir = path.join(root, 'outputs/penyelesaian-windows/rak-dialog-20261120');
fs.mkdirSync(evidenceDir, { recursive: true });

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function resolveSource(source) {
  if (source.startsWith('sampul/')) return null; // sudah di public/klab/sampul
  const parts = source.split('/');
  if (parts[0] === 'latar' || parts[0] === 'properti') {
    return path.join(stock, 'latar-properti', parts[0], parts[1], 'aset.webp');
  }
  // scene unit: uNN-nama -> scene.webp
  return path.join(stock, source, 'scene.webp');
}

function decodeWebP(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error(`bukan WebP: ${file}`);
  }
  const chunk = b.toString('ascii', 12, 16);
  let w = 0, h = 0;
  if (chunk === 'VP8X') {
    w = 1 + b.readUIntLE(24, 3);
    h = 1 + b.readUIntLE(27, 3);
  } else if (chunk === 'VP8L') {
    const bits = b.readUInt32LE(21);
    w = 1 + (bits & 0x3fff);
    h = 1 + ((bits >>> 14) & 0x3fff);
  } else if (chunk === 'VP8 ') {
    w = b.readUInt16LE(26) & 0x3fff;
    h = b.readUInt16LE(28) & 0x3fff;
  } else {
    throw new Error(`chunk WebP tidak dikenal: ${chunk}`);
  }
  if (!w || !h || w > 4096 || h > 4096) throw new Error(`dimensi WebP tidak wajar: ${w}x${h}`);
  return { width: w, height: h, chunk, bytes: b.length };
}

const outDir = path.join(root, 'public/klab/tematik');
fs.mkdirSync(outDir, { recursive: true });

const assets = [];
const usedSources = new Map();
const problems = [];
for (const cover of manifest.covers) {
  if (cover.kind !== 'thematic') continue;
  const src = resolveSource(cover.source);
  if (!fs.existsSync(src)) { problems.push({ textId: cover.textId, reason: 'sumber tidak ada', src }); continue; }
  let destName = usedSources.get(cover.source);
  if (!destName) {
    destName = cover.source.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '');
    const dest = path.join(outDir, `${destName}.webp`);
    fs.copyFileSync(src, dest);
    const sourceHash = sha(src);
    const destHash = sha(dest);
    if (sourceHash !== destHash) problems.push({ textId: cover.textId, reason: 'hash salinan tidak cocok' });
    let decoded = null;
    try { decoded = decodeWebP(dest); }
    catch (error) { problems.push({ textId: cover.textId, reason: `dekode gagal: ${error.message}` }); }
    assets.push({ source: path.relative(root, src).replace(/\\/g, '/'), dest: `public/klab/tematik/${destName}.webp`, sha256: destHash, ...decoded });
    usedSources.set(cover.source, destName);
  }
}

// Verifikasi 18 sampul khusus juga benar-benar terdekode.
const specials = [];
for (const cover of manifest.covers) {
  if (cover.kind !== 'special') continue;
  const file = path.join(root, 'public/klab/sampul', String(cover.textId), 'cover.webp');
  if (!fs.existsSync(file)) { problems.push({ textId: cover.textId, reason: 'sampul khusus tidak ada', file }); continue; }
  let decoded = null;
  try { decoded = decodeWebP(file); }
  catch (error) { problems.push({ textId: cover.textId, reason: `sampul khusus dekode gagal: ${error.message}` }); }
  specials.push({ textId: cover.textId, file: `public/klab/sampul/${cover.textId}/cover.webp`, sha256: sha(file), ...decoded });
}

const result = {
  mandat: 'RAK-DIALOG-20261120',
  owner: '4a',
  totalCovers: manifest.covers.length,
  special: specials.length,
  thematic: manifest.covers.filter((c) => c.kind === 'thematic').length,
  uniqueThematicAssets: assets.length,
  problems,
  thematicAssets: assets,
  specialCovers: specials,
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'cover-assets.json'), JSON.stringify(result, null, 2));
console.log(`covers=${result.totalCovers} special=${result.special} thematic=${result.thematic} uniqueAssets=${assets.length} problems=${problems.length}`);
if (problems.length) { console.log(JSON.stringify(problems, null, 2)); process.exitCode = 1; }
