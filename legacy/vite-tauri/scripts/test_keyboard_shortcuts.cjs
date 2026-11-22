const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function mount(file, store, input = "") {
  const handlers = [];
  const effects = [];
  let stateIndex = 0;
  const react = {
    useState(initial) {
      const value = stateIndex++ === 0 && file.includes("ReviewCard") ? input : initial;
      return [value, () => {}];
    },
    useRef(value) { return { current: value }; },
    useEffect(effect) { effects.push(effect); },
  };
  const jsx = (type, props) => ({ type, props });
  const noop = () => {};
  const mocks = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "../../srs/session": { useSrsSession: select => select(store) },
    "../../srs/fsrs": { GRADES: [], GRADE_LABEL: {} },
    "../../srs/review": { loadSrsRow: async () => null },
    "../../srs/answers": { checkProduce: () => true, checkWord: () => true },
    "../../srs/tts": { speak: async () => null, drillAudioReadyAsync: async () => false, hasBundledAudio: () => false },
    "../../drills/items": { DRILL_META: { D1: { nama: "Artikel", teori: [] } } },
    "../../drills/session": { useDrillSession: select => select(store), drillTitle: () => "Artikel" },
    "../../stores/nav": { useNav: select => select({ pendingDrill: null }) },
    "../PageShell": { default: noop },
  };
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false },
  }).outputText;
  new Function("require", "module", "exports", code)(id => {
    assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id}`);
    return mocks[id];
  }, module, module.exports);
  global.window = { addEventListener: (_, handler) => handlers.push(handler), removeEventListener: noop, setTimeout: () => 0, clearTimeout: noop };
  const tree = module.exports.default();
  // Mount only keyboard effects. Audio, timers and database effects are unrelated.
  for (const effect of effects) if (effect.toString().includes("keydown")) effect();
  assert.equal(handlers.length, 1);
  return { handler: handlers[0], tree };
}

function event(key, extra = {}) {
  return { key, defaultPrevented: false, repeat: false, isComposing: false, keyCode: 0,
    target: { tagName: "BODY", closest: () => null },
    preventDefault() { this.defaultPrevented = true; }, ...extra };
}

function findNode(tree, predicate) {
  if (Array.isArray(tree)) return tree.map(node => findNode(node, predicate)).find(Boolean);
  if (!tree?.props) return null;
  return predicate(tree) ? tree : findNode(tree.props.children, predicate);
}

const item = { key: "qa", code: "D1", prompt: "Artikel", mode: "choice", options: ["der", "die"], answer: "der" };
const ignored = [
  { repeat: true }, { isComposing: true }, { keyCode: 229 },
  { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { defaultPrevented: true },
];

async function main() {
  let grades = 0;
  let revealed = 0;
  let chosen = 0;
  let next = 0;
  const review = { phase: "back", index: 0, itemStartedAt: Date.now(),
    queue: [{ type: "recog", card_id: 1, entry: { de: "Haus", meaning_id: "rumah", kind: "noun" } }],
    reveal: () => { revealed += 1; }, grade: async () => { grades += 1; } };
  const back = mount("src/ui/review/ReviewCard.tsx", review).handler;
  for (const flags of ignored) back(event("1", flags));
  assert.equal(grades, 0, "Modified/repeated/composing keys must not grade SRS cards");
  back(event("1"));
  assert.equal(grades, 1, "Plain 1 still grades the card");
  back(event("1", { target: { tagName: "INPUT", closest: () => ({}) } }));
  assert.equal(grades, 1, "Typing a number in an editable control must not grade a card");

  const front = mount("src/ui/review/ReviewCard.tsx", { ...review, phase: "front" }).handler;
  for (const flags of ignored) front(event("Enter", flags));
  assert.equal(revealed, 0, "IME or modified Enter must not reveal a card");
  front(event("Enter"));
  assert.equal(revealed, 1);
  front(event("Enter", { target: { tagName: "BUTTON", closest: selector => /button/.test(selector) ? {} : null } }));
  assert.equal(revealed, 1, "Enter on a focused button keeps its native action");

  const typedTree = mount("src/ui/review/ReviewCard.tsx", {
    ...review, phase: "front", queue: [{ ...review.queue[0], type: "produce" }],
  }, "das Haus").tree;
  const answer = findNode(typedTree, node => node.type?.name === "InputAnswer");
  assert.ok(answer, "Typed review uses its input handler");
  const typedHandler = answer.type(answer.props).props.onKeyDown;
  for (const flags of ignored) typedHandler(event("Enter", {
    nativeEvent: { isComposing: Boolean(flags.isComposing) }, ...flags,
  }));
  assert.equal(revealed, 1, "Typed review keeps IME and modified Enter out of submission");
  typedHandler(event("Enter", { nativeEvent: { isComposing: false } }));
  assert.equal(revealed, 2, "Plain Enter submits a typed review");

  const store = { phase: "feedback", code: "D1", items: [item], index: 0, input: "", order: [],
    correct: true, next: () => { next += 1; }, choose: async () => { chosen += 1; } };
  const feedback = mount("src/ui/pages/Drill.tsx", store).handler;
  for (const flags of ignored) feedback(event("Enter", flags));
  assert.equal(next, 0, "Held or modified Enter must not advance a drill");
  feedback(event("Enter"));
  assert.equal(next, 1);
  feedback(event("Enter", { target: { tagName: "BUTTON", closest: selector => /button/.test(selector) ? {} : null } }));
  assert.equal(next, 1, "A focused toolbar button must keep its own Enter action");

  const question = mount("src/ui/pages/Drill.tsx", { ...store, phase: "question" }).handler;
  for (const flags of ignored) question(event("1", flags));
  assert.equal(chosen, 0, "Modified or composing number must not answer a drill");
  question(event("1"));
  assert.equal(chosen, 1);
  question(event("1", { target: { tagName: "SELECT", closest: () => ({}) } }));
  assert.equal(chosen, 1, "Select input must not also answer a drill");

  console.log("Keyboard shortcuts preserve plain actions and ignore repeat, IME, modifiers, editable controls and native button Enter.");
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
