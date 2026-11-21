// CLONE PERSIS / 4a — salin komponen & aset visual referensi (path import saja).
// Tidak menyalin assets/audio/** (milik 2a) dan tidak mengubah gaya.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const ref = process.env.VISUAL_NOVEL_REFERENCE || root;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/data/ref-visual-novel-manifest.json'), 'utf8'));
const evidenceDir = path.join(root, 'outputs/penyelesaian-windows/clone-persis-20261121');
fs.mkdirSync(evidenceDir, { recursive: true });
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

// --- Komponen: path relatif identik dengan struktur novel 1a ---
// Referensi menyimpan CharacterCreator di dalam TitleScreen.tsx (6 berkas).
// Kita salin 6 berkas apa adanya + CharacterCreator.tsx sebagai re-export murni.
const components = ['TitleScreen.tsx', 'Stage.tsx', 'DialogPanel.tsx', 'Portrait.tsx', 'ResultScreen.tsx', 'Panels.tsx'];
const componentDir = path.join(root, 'src/klab/novel/components');
fs.mkdirSync(componentDir, { recursive: true });
for (const name of components) {
  const src = path.join(ref, 'src/components', name);
  const dest = path.join(componentDir, name);
  if (!fs.existsSync(src)) throw new Error(`komponen referensi tidak ada: ${src}`);
  fs.copyFileSync(src, dest);
}

// CharacterCreator diekspor dari TitleScreen.tsx di referensi; sediakan path
// modul yang diminta mandat tanpa menyalin/merestoril kode.
fs.writeFileSync(path.join(componentDir, 'CharacterCreator.tsx'),
  '// Re-export murni: definisi asal ada di TitleScreen.tsx (referensi).\n' +
  'export { CharacterCreator, HAIR_STYLES, HAIR_COLORS, OUTFITS, SKINS } from "./TitleScreen";\n');

// --- media-manifest.ts: path relatif identik (../assets/*, ../data/*) ---
const manifestSrc = path.join(ref, 'src/data/media-manifest.ts');
fs.copyFileSync(manifestSrc, path.join(root, 'src/klab/novel/data/media-manifest.ts'));

// --- Aset visual dari manifest: bg (jpg), cover/scene (webp), props (webp) ---
const assetRoots = ['src/assets/bg/', 'src/assets/covers/', 'src/assets/scenes/', 'public/media/bg/', 'public/media/scenes/'];
const copied = [];
const skippedAudio = [];
const problems = [];
for (const row of manifest.rows) {
  if (!assetRoots.some((prefix) => row.path.startsWith(prefix))) {
    if (row.path.startsWith('src/assets/audio/')) skippedAudio.push(row.path);
    continue;
  }
  const src = path.join(ref, row.path);
  if (!fs.existsSync(src)) { problems.push({ path: row.path, reason: 'sumber tidak ada' }); continue; }
  const hash = sha(src);
  if (hash !== row.sha256) { problems.push({ path: row.path, reason: 'hash tidak cocok manifest' }); continue; }
  // src/assets/* → src/klab/novel/assets/* ; public/media/* → src/klab/novel/assets/*
  let rel;
  if (row.path.startsWith('src/assets/')) rel = row.path.replace('src/assets/', 'src/klab/novel/assets/');
  else rel = row.path.replace('public/media/', 'src/klab/novel/assets/');
  const dest = path.join(root, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  if (sha(dest) !== hash) problems.push({ path: row.path, reason: 'hash salinan tidak cocok' });
  copied.push({ manifest: row.path, dest: rel, sha256: hash, bytes: row.bytes });
}

// Props kafe (dipakai Stage/Portrait bila ada) dari folder referensi.
const propsRef = path.join(ref, 'src/assets/props');
if (fs.existsSync(propsRef)) {
  for (const name of fs.readdirSync(propsRef)) {
    const src = path.join(propsRef, name);
    if (!fs.statSync(src).isFile()) continue;
    const destDir = path.join(root, 'src/klab/novel/assets/props');
    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, path.join(destDir, name));
    copied.push({ manifest: `src/assets/props/${name}`, dest: `src/klab/novel/assets/props/${name}`, sha256: sha(src), bytes: fs.statSync(src).size });
  }
}

const report = {
  task: 'CLONE-PERSIS-20261121', owner: '4a',
  components: [...components, 'CharacterCreator.tsx'].map((name) => ({ name, sha256: sha(path.join(componentDir, name)) })),
  mediaManifest: { src: 'src/klab/novel/data/media-manifest.ts', sha256: sha(path.join(root, 'src/klab/novel/data/media-manifest.ts')) },
  visualAssets: copied,
  visualAssetCount: copied.length,
  skippedAudio,
  problems,
  at: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'assets-4a.json'), JSON.stringify(report, null, 2));
console.log(`components=${components.length} visualAssets=${copied.length} skippedAudio=${skippedAudio.length} problems=${problems.length}`);
if (problems.length) { console.log(JSON.stringify(problems.slice(0, 10), null, 2)); process.exitCode = 1; }
