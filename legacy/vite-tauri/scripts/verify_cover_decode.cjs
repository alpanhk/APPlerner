// RAK-DIALOG-20261120 / 4a — uji dekode nyata 67 sampul di Chrome headless.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const chrome = 'chrome';
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/klab/coverManifest.json'), 'utf8'));
const evidenceDir = path.join(root, 'outputs/penyelesaian-windows/rak-dialog-20261120');
fs.mkdirSync(evidenceDir, { recursive: true });

const urls = manifest.covers.map((cover) => {
  const src = cover.kind === 'special'
    ? `/klab/sampul/${cover.textId}/cover.webp`
    : `/klab/tematik/${cover.source.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '')}.webp`;
  return { textId: cover.textId, kind: cover.kind, src: `../../../public${src}` };
});

const html = `<!doctype html><meta charset="utf-8"><body><pre id="result">PENDING</pre><script>
const items = ${JSON.stringify(urls)};
(async () => {
  const out = [];
  for (const item of items) {
    const img = new Image();
    const result = await new Promise((resolve) => {
      img.onload = () => resolve({ ok: img.naturalWidth > 0 && img.naturalHeight > 0, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ ok: false, w: 0, h: 0 });
      img.src = item.src;
    });
    out.push({ ...item, ...result });
  }
  document.getElementById('result').textContent = JSON.stringify(out);
})();
</script></body>`;
const htmlPath = path.join(evidenceDir, 'decode-check.html');
fs.writeFileSync(htmlPath, html);

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
const dom = execFileSync(chrome, [
  '--headless', '--disable-gpu', '--no-sandbox', '--disable-web-security',
  '--allow-file-access-from-files', '--virtual-time-budget=12000', '--dump-dom', fileUrl,
], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

const match = dom.match(/<pre id="result">([\s\S]*?)<\/pre>/);
if (!match || match[1].trim() === 'PENDING') {
  console.error('Gagal membaca hasil dekode dari Chrome');
  process.exit(1);
}
const results = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
const failed = results.filter((item) => !item.ok);
const report = {
  mandat: 'RAK-DIALOG-20261120', owner: '4a',
  total: results.length,
  decoded: results.length - failed.length,
  failed,
  byKind: {
    special: results.filter((r) => r.kind === 'special').length,
    thematic: results.filter((r) => r.kind === 'thematic').length,
  },
  results,
  at: new Date().toISOString(),
};
fs.writeFileSync(path.join(evidenceDir, 'cover-decode.json'), JSON.stringify(report, null, 2));
console.log(`decode: ${report.decoded}/${report.total} berhasil (special=${report.byKind.special}, thematic=${report.byKind.thematic}), gagal=${failed.length}`);
if (failed.length) { console.log(JSON.stringify(failed.slice(0, 10), null, 2)); process.exitCode = 1; }
