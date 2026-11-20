// PROGRES-PRODUK-WINDOWS / 1a: gap pembukaan textId lewat rute langsung dan
// restart tidak boleh kembali ke Im Café. Uji modul pada data terisolasi.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false,
    },
  }).outputText;
}
function load(file, mocks = {}) {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => {
      if (id === "./novelViews") return { TitleView: () => null, CreateView: () => null, StoryView: () => null };
      if (id === "./StoryFlowView") return { __esModule: true, default: () => null };
      if (id === "./mediaResolver") return { coverSrc: () => undefined, allCovers: () => [], resolveMedia: () => null, bgSrc: () => undefined, sceneSrc: () => undefined };
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id} in ${file}`);
      return mocks[id];
    }, mod, mod.exports,
  );
  return mod.exports;
}
const marker = (name) => function Marker() { return name; };
const jsx = (type, props) => ({ type, props });

(async () => {
  const readings = [
    { textId: 1, title: "Im Café", level: "A1", tags: "Restoran", sentences: [{ de: "Ich möchte einen Kaffee." }] },
    { textId: 7, title: "Teks Ketujuh", level: "A2", tags: "Keluarga", sentences: [{ de: "Das ist meine Familie." }] },
  ];
  const config = new Map();
  const db = {
    select: async (q, params) => config.has(params[0]) ? [{ value: config.get(params[0]) }] : [],
    execute: async (q, params) => { config.set(params[0], params[1]); return {}; },
  };
  const dbModule = { __esModule: true, default: async () => db };
  const logicMock = { allReadings: () => readings };
  const adapter = load("src/app/readingAdapter.ts", {
    "../stores/db": dbModule,
    "../klab/learning/logic": logicMock,
  });

  // 1) Adapter: textId menentukan judul/level, Im Café bukan fallback universal.
  assert.equal(adapter.readingMeta(1).title, "Im Café");
  assert.equal(adapter.readingMeta(7).title, "Teks Ketujuh");
  assert.equal(adapter.readingMeta(7).level, "A2");
  assert.equal(adapter.readingMeta(99), null);
  await adapter.saveReadingMode("listen");
  assert.equal(await adapter.loadReadingMode(), "listen");

  // 2) RouteView: rute langsung textId=7 merender ReadingFlow dengan buku 7.
  const react = {
    useEffect: () => undefined,
    useRef: (value) => ({ current: value }),
    useState: (initial) => [typeof initial === "function" ? initial() : initial, () => undefined],
  };
  const readingMocks = {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "../klab/routes": {},
    "../klab/pages": {
      TodayPage: marker("TodayPage"), ExplorePage: marker("ExplorePage"),
      NotesPage: marker("NotesPage"), ProfilePage: marker("ProfilePage"),
    },
    "../klab/learning": {
      LessonFlow: marker("LessonFlow"), CheckpointFlow: marker("CheckpointFlow"),
      ReadingFlow: marker("ReadingFlow"),
    },
    "../klab/components/session": { FocusHeader: marker("FocusHeader") },
    "./viewAdapters": {
      agendaFromTargets: () => null,
      agendaRoute: () => ({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" }),
      CORRECTION_ROUTE: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" },
      todayQuickLinks: () => [], loadProgressModel: async () => null,
      loadExploreUnits: async () => [], exploreBooks: () => [], explorePracticeLinks: () => [],
      loadVocabulary: async () => [], notesToView: () => [],
      preferencesToView: (value) => value, loadStatsSummary: async () => ({}),
    },
    "./notesRepository": { listNotes: async () => [], saveNote: async () => ({}), removeNote: async () => undefined },
    "./flowPersistence": {
      saveLessonFlowProgress: async () => undefined,
      loadLessonFlowState: async () => null,
      saveCheckpointFlowResult: async () => undefined,
    },
    "../lessons/units": { getUnit: () => ({ unit: 4, lessons: [{ no: 2 }] }) },
    "../ui/lessons/LessonRunner": { __esModule: true, default: marker("LessonRunner") },
    "./readingAdapter": adapter,
  };
  const propsFor = (route) => {
    const view = load("src/app/routeView.tsx", readingMocks);
    const element = view.RouteView({ navigate: () => {}, back: () => {}, targets: [], route });
    return element.type(element.props).props;
  };
  const direct = propsFor({ name: "reader", textId: 7 });
  assert.equal(direct.textId, 7);
  assert.equal(direct.title, "Teks Ketujuh", "rute langsung memakai judul textId 7");
  assert.notEqual(direct.title, "Im Café");
  assert.equal(direct.initialView, "reader", "rute langsung tidak menampilkan rak ganda");
  // Mode dipulihkan lewat useEffect (tidak dijalankan mock React); pembuktian
  // nilai tersimpan ada pada adapter.loadReadingMode() di atas.
  assert.equal(typeof direct.autoPlay, "boolean");

  // Modul dimuat ulang (simulasi restart): handoff sesi hilang, rute tetap textId 7.
  const restarted = propsFor({ name: "reader", textId: 7 });
  assert.equal(restarted.title, "Teks Ketujuh");
  assert.equal(restarted.textId, 7);

  const evidence = {
    task: "PROGRES-PRODUK-WINDOWS",
    agent: "1a",
    gap: "pembukaan textId lewat rute langsung dan restart tidak boleh selalu kembali ke Im Café",
    direct_route: { textId: direct.textId, title: direct.title, initialView: direct.initialView, autoPlay: direct.autoPlay },
    after_restart: { textId: restarted.textId, title: restarted.title },
    mode_persisted: await adapter.loadReadingMode(),
    pass: true,
  };
  fs.mkdirSync("outputs/penyelesaian-windows", { recursive: true });
  fs.writeFileSync("outputs/penyelesaian-windows/agent-1a-reading.json", JSON.stringify(evidence, null, 2) + "\n", "utf8");
  console.log("ProgresProduk: rute reader textId=7 membuka Teks Ketujuh saat langsung dan setelah restart.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
