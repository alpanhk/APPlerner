// ROMBAK UI/UX — bukti [P] mesin cerita port referensi (tanpa localStore).
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const auditRecords = [];
const recordAudit = (name, detail) => auditRecords.push({ name, ...detail });
const dir = path.join(root, 'src/klab/learning/story');
const load = (name, modules) => {
  const file = path.join(dir, `${name}.ts`);
  const out = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function('require', 'module', 'exports', out)(
    (id) => {
      if (Object.prototype.hasOwnProperty.call(modules, id)) return modules[id];
      throw new Error(`import tak terduga ${id} di ${name}`);
    }, mod, mod.exports,
  );
  return mod.exports;
};

const prolog = load('prolog', { './types': {} });
const matchers = load('matchers', { './types': {} });
const evaluate = load('evaluate', { './types': {} });
const engine = load('engine', { './types': {}, './prolog': prolog, './matchers': matchers });
const { newGame, transition, nodeOf, INITIAL_STAGE } = engine;
const { detectIntents, resolveInputHandler, fillTemplate } = matchers;
const { objectiveLevel, demonstratedFullSentence, LEVEL_LABEL, buildSummary } = evaluate;

const player = { name: 'Alex', hair: 'short', hairColor: '#3a3027', outfit: '#2c3e6b', skin: '#d9a679' };

// [P] state awal & node lookup.
let game = newGame(player, prolog.PROLOG_START);
assert.equal(game.nodeId, 'a_intro');
assert.deepEqual(game.stage, INITIAL_STAGE);
assert.deepEqual(game.flags, {});
assert.equal(game.attempts.length, 0);
assert.equal(game.prologCompleted, false);
assert.equal(nodeOf('a_intro').kind, 'line');
assert.throws(() => nodeOf('tidak-ada'), /Node cerita tidak ditemukan/);

// [P] transisi menulis riwayat & tidak mengubah state lama.
const first = transition(game, nodeOf(game.nodeId).next);
assert.equal(first.g.nodeId, 'a_look');
assert.equal(first.g.history.length, game.history.length, 'node choice tidak menambah baris dialog');
assert.equal(game.history.length, 0, 'state lama tidak bermutasi');
assert.equal(first.g.visit, 1);
game = first.g;

// [P] node line Jerman menambah riwayat, choice opsi mencatat flag.
const afterNote = transition(game, 'a_note', { setFlags: { sawNote: true } });
assert.ok(afterNote.g.history.length > game.history.length, 'line menambah riwayat');
assert.equal(afterNote.g.flags.sawNote, true);
assert.equal(afterNote.g.history.some((h) => h.text === 'Guten Morgen!'), true);

// [P] deteksi niat & template.
assert.deepEqual(detectIntents('Hallo, ich heiße Alex', 'Alex'), ['greet', 'intro_full']);
assert.deepEqual(detectIntents('Ich bin Alex', 'Alex'), ['intro_full']);
assert.deepEqual(detectIntents('Alex', 'Alex'), ['name_only']);
assert.deepEqual(detectIntents('', 'Alex'), ['empty']);
assert.equal(fillTemplate('Halo {name}', 'Alex'), 'Halo Alex');

// [P] input node -> handler -> attempt nyata masuk ke Game.
const practice = prolog.PROLOG_NODES['b_practice'];
assert.equal(practice.kind, 'input');
const intents = detectIntents('Ich heiße Alex', 'Alex');
const handler = resolveInputHandler(practice, intents, { flags: {}, name: 'Alex', hintCounts: {} });
assert.ok(handler && handler.intents.includes('intro_full'));
const withAttempt = transition(afterNote.g, 'b_practice', {
  record: { objective: 'introduce', where: 'tutor', text: 'Ich heiße Alex', hintsUsed: 0, full: true, at: 1 },
  playerLine: 'Ich heiße Alex',
});
assert.equal(withAttempt.g.attempts.length, 1);
assert.equal(objectiveLevel(withAttempt.g.attempts, 'introduce'), 'mandiri');
assert.equal(demonstratedFullSentence(withAttempt.g.attempts, 'introduce'), true);
assert.equal(LEVEL_LABEL.mandiri, 'Berhasil mandiri');
const summary = buildSummary(withAttempt.g.attempts, withAttempt.g.flags, 'Alex');
assert.ok(summary.lines.length > 0 && summary.next.length > 0);

// [P] akhir cerita menandai prologCompleted.
const ending = transition(withAttempt.g, 'e_end');
assert.equal(ending.g.prologCompleted, true);
assert.equal(ending.g.nodeId, 'e_end');

// [P] tidak ada localStore di mesin/prolog.
for (const name of ['engine', 'prolog', 'matchers', 'evaluate']) {
  const text = fs.readFileSync(path.join(dir, `${name}.ts`), 'utf8');
  assert.equal(text.includes('localStorage') || text.includes('localStore'), false, `${name} bebas localStore`);
}

// [P] Kontrak komponen StoryFlow siap dipanggil rute `story` oleh 1a.
const flowFile = path.join(root, 'src/klab/learning/StoryFlow.tsx');
const flow = fs.readFileSync(flowFile, 'utf8');
for (const token of [
  'data-testid="story-title"', 'data-testid="story-create"', 'data-testid="story-stage"',
  'data-testid="story-result"', 'initialPlayer?', 'initialNodeId?', 'onNodeChange?',
  'onChoice?', 'onAnswer?', 'onResult?', 'onExit?', 'route?', 'activePanel',
  'soundController.get().optIn', "setSpeaking(effect.char, effect.key, 'idle')",
]) {
  assert.ok(flow.includes(token), `[P] StoryFlow contract: ${token}`);
}
assert.equal(/\blocalStore\.(load|save|clear)|\blocalStorage\.(getItem|setItem)/.test(flow), false, '[P] StoryFlow tidak memanggil localStore/localStorage');
assert.equal((flow.match(/setSpeaking\(effect\.char, effect\.key, 'playing'\)/g) ?? []).length, 0, '[P] tidak mengklaim playing saat diam');
recordAudit('[P] StoryFlow contract untuk rute story', { exported: true, silentDefault: true, callbacks: 6 });

// [P] StoryView 2a benar-benar memasang StoryFlow, bukan placeholder 1a.
const viewFile = path.join(root, 'src/klab/learning/StoryView.tsx');
const view = fs.readFileSync(viewFile, 'utf8');
for (const token of [
  'data-testid="story-view"', '<StoryFlow', 'store={adapter}', 'initialNodeId={initialNodeId}',
  'novelStore.loadProgress()', 'soundController.setOptIn', 'PROLOG_START',
]) {
  assert.ok(view.includes(token), `[P] StoryView: ${token}`);
}
assert.equal(view.includes('Prolog dimulai. Jawaban dan koreksi'), false, '[P] StoryView bukan placeholder');
recordAudit('[P] StoryView 2a menggantikan placeholder', { storyView: true, placeholder: false });

console.log('Story engine [P]: newGame/transition/nodeOf/branch/input/attempt/evaluate/end OK; StoryFlow siap dipanggil rute story; tanpa localStore.');
