const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(relative) {
  const file = path.resolve(root, relative);
  assert.ok(fs.existsSync(file), `Frontend infrastructure missing: ${relative}`);
  if (cache.has(file)) return cache.get(file).exports;
  const mod = { exports: {} };
  cache.set(file, mod);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', code)((id) => {
    if (!id.startsWith('.')) return require(id);
    const base = path.resolve(path.dirname(file), id);
    const target = ['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync);
    assert.ok(target, `Unresolved frontend dependency: ${id}`);
    return load(path.relative(root, target));
  }, mod, mod.exports);
  return mod.exports;
}
const { homeRoute, tabForRoute, legacyRoute } = load('src/klab/routes.ts');
const { createNavigation } = load('src/klab/navigation.ts');
assert.deepEqual(['today', 'explore', 'notes', 'profile'].map(tab => tabForRoute(homeRoute(tab))),
  ['today', 'explore', 'notes', 'profile']);
for (const id of ['hari-ini', 'kurikulum', 'drill', 'kosakata', 'membaca', 'latihan', 'uji-a1', 'statistik', 'pengaturan']) {
  assert.ok(legacyRoute(id), `Existing page is reachable: ${id}`);
}
assert.equal(legacyRoute('unknown'), null);
assert.equal(tabForRoute({ name: 'exam' }), 'explore');
const nav = createNavigation();
const unit = { name: 'unit', unitNo: 4 };
const lesson = { name: 'lesson', unitNo: 4, lessonNo: 2, sessionId: 'fixture-u4' };
nav.getState().selectTab('explore');
nav.getState().push(unit);
nav.getState().push(lesson);
nav.getState().push(lesson);
assert.equal(nav.getState().stacks.explore.length, 3, 'Duplicate navigation does not add a frame');
nav.getState().selectTab('notes');
nav.getState().selectTab('explore');
assert.deepEqual(nav.getState().route, lesson, 'Switching tabs restores the active nested session');
assert.equal(nav.getState().back(), true);
assert.deepEqual(nav.getState().route, unit, 'Back restores the unit context');
assert.equal(nav.getState().back(), true);
assert.equal(nav.getState().back(), false, 'Root delegates back to host instead of inventing navigation');
for (let i = 1; i <= 30; i++) nav.getState().push({ name: 'unit', unitNo: i });
assert.equal(nav.getState().stacks.explore.length, 20);
assert.equal(nav.getState().stacks.explore[0].name, 'explore', 'Bounded history retains its root');
nav.getState().replace(unit);
assert.deepEqual(nav.getState().route, unit);
// Audit the actual preview import closure: accidental native wiring can touch user data.
const seen = new Set();
function inspect(file) {
  if (seen.has(file)) return;
  seen.add(file);
  assert.ok(fs.existsSync(file), `Preview entry/dependency missing: ${file}`);
  const raw = fs.readFileSync(file, 'utf8');
  const source = /\.tsx?$/.test(file) ? ts.transpileModule(raw, {
    fileName: file, compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  }).outputText : raw;
  assert.doesNotMatch(source, /@tauri-apps|seedLoader|stores\/db|stores\/backup|assets\/tts_core|localStorage|indexedDB/,
    `Preview must stay isolated: ${path.relative(root, file)}`);
  for (const match of source.matchAll(/(?:from\s+|import\s*)["'](\.[^"']+)["']/g)) {
    const base = path.resolve(path.dirname(file), match[1]);
    const target = [base, base + '.ts', base + '.tsx', base + '.css'].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
    assert.ok(target, `Missing import ${match[1]}`);
    inspect(target);
  }
}
inspect(path.join(root, 'src/klab/preview.tsx'));
console.log('KLAB frontend OK: 9 legacy routes, nested back, tab/session retention, bounded history, isolated preview import graph.');
