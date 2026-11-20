// RAK-DIALOG / INTERAKSI-LERNEN-01 / 1a: resolver sampul, status data,
// preferensi suara default mati dan reduced motion nyata.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false, resolveJsonModule: true,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id.endsWith("cover-map.json")) return { __esModule: true, default: require("../src/data/cover-map.json") };
    if (Object.hasOwn(mocks, id)) return mocks[id];
    throw new Error(`dependency tak terduga ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}

// Resolver 4a dimuat dari sumber nyata dengan aset statis diganti URL.
function loadSampleVisuals() {
  const code = ts.transpileModule(fs.readFileSync("src/klab/sampleVisuals.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (id.endsWith("coverManifest.json")) return require("../src/klab/coverManifest.json");
    if (id.includes("assets/")) return "/asset/" + id.split("/").pop().split(".")[0];
    throw new Error(`dependency tak terduga ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}

(async () => {
  const sampleVisuals = loadSampleVisuals();
  const covers = load("src/app/coverResolver.ts", { "../klab/sampleVisuals": sampleVisuals });
  const all = covers.allCovers();
  assert.equal(all.length, 67, "67 judul unik punya sampul");
  assert.equal(all.filter((c) => c.kind === "khusus").length, 18);
  assert.equal(all.filter((c) => c.kind !== "khusus").length, 49);
  for (const cover of all) {
    assert.ok(cover.src.startsWith("/"), `src absolut aplikasi: ${cover.textId}`);
    assert.ok(cover.title && cover.label, `judul/label hadir: ${cover.textId}`);
    assert.doesNotMatch(cover.label, /\bseed\b/i, "label internal seed dibuang");
    // Rak dan cuplikan memanggil fungsi yang sama untuk textId sama.
    assert.deepEqual(covers.resolveCover(cover.textId), cover);
  }
  assert.equal(covers.resolveCover(10).kind, "khusus", "Im Café sampul khusus");
  assert.equal(covers.resolveCover(999), null);

  const config = new Map();
  const db = {
    select: async (q, params) => config.has(params[0]) ? [{ value: config.get(params[0]) }] : [],
    execute: async (q, params) => { config.set(params[0], params[1]); return {}; },
  };
  const settings = load("src/app/uiSettings.ts", {
    "../stores/db": { __esModule: true, default: async () => db },
  });
  const defaults = await settings.loadUiSettings();
  assert.equal(defaults.soundEnabled, false, "suara default mati");
  assert.equal(defaults.reducedMotion, "system");
  assert.equal(settings.effectiveReducedMotion(defaults, false), false);
  assert.equal(settings.effectiveReducedMotion(defaults, true), true, "prefers-reduced-motion OS dipatuhi");
  const saved = await settings.saveUiSettings({ reducedMotion: "on" });
  assert.equal((await settings.loadUiSettings()).reducedMotion, "on");
  assert.equal(settings.effectiveReducedMotion(saved, false), true, "setelan aplikasi setara OS");

  const collection = JSON.parse(fs.readFileSync("src/data/collection-map.json", "utf8"));
  assert.ok(collection.items.length > 0);
  assert.equal(collection.items.some((i) => i.status === "draft"), true, "draf tetap ada di koleksi berlabel");
  assert.equal(collection.items.some((i) => i.src.startsWith("/media/") || i.src.startsWith("/klab/") || i.src.startsWith("/audio/")), true);
  for (const item of collection.items) {
    if (item.status === "draft") assert.ok(item.reason, "draf punya alasan");
  }

  // RAK-DIALOG-01/02/03: rute cuplikan 10 -> panggung, koleksi, indeks mesin.
  const jsx = (type, props) => ({ type, props });
  const marker = (name) => function Marker() { return name; };
  const CafeConversation = marker("CafeConversation");
  const AssetCollectionPage = marker("AssetCollectionPage");
  const routeDeps = {
    react: {
      useState: (initial) => [typeof initial === "function" ? initial() : initial, () => undefined],
      useEffect: () => undefined,
      useRef: (value) => ({ current: value }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "../klab/routes": {},
    "../klab/pages": {
      TodayPage: marker("TodayPage"), ExplorePage: marker("ExplorePage"),
      NotesPage: marker("NotesPage"), ProfilePage: marker("ProfilePage"), AssetCollectionPage,
    },
    "../klab/learning": {
      LessonFlow: marker("LessonFlow"), ReadingFlow: marker("ReadingFlow"),
      CheckpointFlow: marker("CheckpointFlow"), CafeConversation,
    },
    "../klab/components/session": { FocusHeader: marker("FocusHeader") },
    "./viewAdapters": {
      agendaFromTargets: () => ({ title: "Agenda" }), agendaRoute: () => ({ name: "today" }),
      todayQuickLinks: () => [], loadProgressModel: async () => null,
      loadExploreUnits: async () => [], exploreBooks: () => [], explorePracticeLinks: () => [],
      loadVocabulary: async () => [], notesToView: (v) => v,
      preferencesToView: (v) => v, loadStatsSummary: async () => ({}),
    },
    "./notesRepository": { listNotes: async () => [], saveNote: async () => ({}), removeNote: async () => undefined },
    "./flowPersistence": {
      saveLessonFlowProgress: async () => undefined, loadLessonFlowState: async () => null,
      saveCheckpointFlowResult: async () => undefined,
    },
    "./readingAdapter": { readingMeta: () => null, loadReadingMode: async () => null, saveReadingMode: async () => undefined },
    "../lessons/units": { getUnit: () => ({ unit: 4, lessons: [{ no: 2 }] }) },
    "../ui/lessons/LessonRunner": { __esModule: true, default: marker("LessonRunner") },
  };
  const view = load("src/app/routeView.tsx", routeDeps);
  const base = { navigate: () => {}, back: () => {}, targets: [], route: { name: "reader", textId: 10 } };
  const rendered = view.RouteView(base);
  const stage = rendered.type.name === "ReadingKlabFlow" ? rendered.type(rendered.props) : rendered;
  assert.equal(stage.type, CafeConversation, "textId 10 dari rak membuka panggung dua tokoh");
  assert.equal(typeof stage.props.onBack, "function");
  assert.equal(typeof stage.props.onStartTask, "function");
  const collectionView = view.RouteView({ ...base, route: { name: "notes", noteId: "collection" } });
  assert.equal(collectionView.type, AssetCollectionPage, "Koleksi aset terjangkau lewat rute");
  const index = load("src/app/CoverIndex.tsx", {
    "./coverResolver": covers, "react/jsx-runtime": { jsx, jsxs: jsx },
  });
  const tree = index.default();
  assert.equal(tree.props["data-testid"], "cover-index");
  assert.equal(tree.props["data-count"], 67);
  assert.equal(tree.props.children.length, 67);

  console.log("INTERAKSI-1a: 67 sampul konsisten, label bersih, dialog textId 10, koleksi, indeks mesin, suara default mati.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
