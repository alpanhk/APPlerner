// WINDOWS-20261118-09 / P9: fokus setelah jawaban tidak boleh jatuh ke BODY.
// ReviewCard -> tombol nilai pertama; Drill -> "Lanjut (Enter)". Harus tetap
// menghormati fokus yang sudah ada dan tidak mengubah shortcut/IME/modifier.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function mount(file, store, mocksExtra = {}) {
  const effects = [];
  const refs = [];
  const focused = [];
  let refId = 0;
  const jsx = (type, props) => {
    if (props && typeof props.ref === "object" && props.ref) {
      const ref = props.ref;
      props.ref.current = { focus: () => focused.push(ref.__id) };
    }
    return { type, props };
  };
  const react = {
    useState: (initial) => [initial, () => {}],
    useRef: (value) => { const ref = { current: value, __id: ++refId }; refs.push(ref); return ref; },
    useEffect: (effect) => { effects.push(effect); },
  };
  const item = { key: "qa", code: "D1", prompt: "Artikel", sub: "", mode: "choice", options: ["der", "die"], answer: "der", tokens: [] };
  const mocks = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "../../srs/session": { useSrsSession: select => select(store) },
    "../../srs/fsrs": {
      GRADES: [{ key: "again", rating: 1 }, { key: "hard", rating: 2 }, { key: "good", rating: 3 }, { key: "easy", rating: 4 }],
      GRADE_LABEL: {}, previewInterval: () => "", rowToCard: () => null,
    },
    "../../srs/review": { loadSrsRow: async () => null },
    "../../srs/answers": { checkProduce: () => true, checkWord: () => true, clozeMask: () => "", findTargetToken: () => null },
    "../../srs/tts": { speak: async () => null, drillAudioReadyAsync: async () => false, hasBundledAudio: () => false, numberBundleReady: () => false },
    "../../drills/items": { DRILL_META: { D1: { nama: "Artikel", teori: [] } } },
    "../../drills/session": {
      useDrillSession: select => select(store), drillTitle: () => "Artikel",
      nextDrillRecommendation: () => "D1",
    },
    "../../stores/nav": { useNav: select => select({ pendingDrill: null, takePendingDrill: () => {} }) },
    "../PageShell": { default: () => null },
    ...mocksExtra,
  };
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false },
  }).outputText;
  new Function("require", "module", "exports", code)((id) => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id}`);
    return mocks[id];
  }, mod, mod.exports);
  global.window = { addEventListener: () => {}, removeEventListener: () => {}, setTimeout: () => 0, clearTimeout: () => {} };
  const tree = mod.exports.default();
  const focusEffect = effects.find((e) => e.toString().includes("activeElement"));
  assert.ok(focusEffect, `focus effect tidak ditemukan di ${file}`);
  return { refs, focused, focusEffect, tree, item };
}

(async () => {
  const reviewStore = {
    phase: "back", index: 0, itemStartedAt: Date.now(), reveal: () => {}, grade: async () => {},
    queue: [{ type: "recog", card_id: 1, entry: { de: "Haus", meaning_id: "rumah", kind: "noun", article: "die" } }],
  };
  const drillStore = {
    phase: "feedback", code: "D1", items: [{ key: "qa", code: "D1", prompt: "Artikel", sub: "", mode: "choice", options: ["der", "die"], answer: "der" }],
    index: 0, input: "", order: [], correct: true, explanation: "", correctCount: 1, wrongCount: 0,
    totalMs: 1000, next: () => {}, choose: async () => {}, submitTyped: async () => {},
    pickToken: () => {}, unpickToken: () => {}, submitOrder: async () => {}, timeout: async () => {},
    start: async () => {}, setInput: () => {}, reset: () => {},
  };

  // BODY -> pindah ke aksi berikutnya yang terlihat.
  global.document = { activeElement: { tagName: "BODY" }, body: { tagName: "BODY" } };
  global.document.activeElement = global.document.body;
  const review = mount("src/ui/review/ReviewCard.tsx", reviewStore);
  review.focusEffect();
  assert.deepEqual(review.focused, [review.refs[0].__id], "ReviewCard harus fokus ke tombol nilai pertama");
  const drill = mount("src/ui/pages/Drill.tsx", drillStore);
  drill.focusEffect();
  assert.deepEqual(drill.focused, [drill.refs[1].__id], "Drill harus fokus ke tombol Lanjut");

  // Fokus lain (misalnya tombol/toolbar) tidak boleh direbut.
  const other = { tagName: "BUTTON" };
  global.document = { activeElement: other, body: { tagName: "BODY" } };
  const review2 = mount("src/ui/review/ReviewCard.tsx", reviewStore);
  review2.focusEffect();
  assert.deepEqual(review2.focused, [], "ReviewCard tidak boleh merebut fokus yang sudah ada");
  const drill2 = mount("src/ui/pages/Drill.tsx", drillStore);
  drill2.focusEffect();
  assert.deepEqual(drill2.focused, [], "Drill tidak boleh merebut fokus yang sudah ada");

  const reviewSrc = fs.readFileSync("src/ui/review/ReviewCard.tsx", "utf8");
  const drillSrc = fs.readFileSync("src/ui/pages/Drill.tsx", "utf8");
  assert.match(reviewSrc, /ref=\{i === 0 \? firstGradeRef : undefined\}/);
  assert.match(drillSrc, /ref=\{nextButtonRef\}/);
  for (const src of [reviewSrc, drillSrc]) {
    assert.match(src, /document\.activeElement === document\.body/);
    assert.match(src, /e\.repeat \|\| e\.isComposing \|\| e\.keyCode === 229/);
    assert.match(src, /e\.altKey \|\| e\.ctrlKey \|\| e\.metaKey \|\| e\.shiftKey/);
  }

  console.log("P9 focus-after-answer: ReviewCard -> nilai pertama, Drill -> Lanjut (Enter); fokus lain dihormati, shortcut guards utuh.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
