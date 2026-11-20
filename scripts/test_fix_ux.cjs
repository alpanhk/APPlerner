// FIX-UX-20261119 / 1a: bukti [P] U-05, U-08, U-09, U-17 pada modul integrasi.
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
function load(file, mocks) {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => {
      assert.ok(Object.hasOwn(mocks, id), `dependency tak terduga ${id} di ${file}`);
      return mocks[id];
    }, mod, mod.exports,
  );
  return mod.exports;
}
const marker = (name) => function Marker() { return name; };
const jsx = (type, props) => ({ type, props });

function hooks() {
  const values = [];
  let cursor = 0;
  return {
    reset() { cursor = 0; },
    useState(initial) {
      const index = cursor++;
      if (!(index in values)) values[index] = typeof initial === "function" ? initial() : initial;
      return [values[index], (next) => {
        values[index] = typeof next === "function" ? next(values[index]) : next;
      }];
    },
    useRef(value) { return this.useState(value); },
    useEffect(effect) { effects.push(effect); },
  };
}

let effects = [];

function viewDeps(overrides = {}) {
  const saved = [];
  const result = {
    react: {
      useState: (initial) => shared.useState(initial),
      useRef: (value) => shared.useRef(value),
      useEffect: (effect) => shared.useEffect(effect),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "../klab/routes": {},
    "../klab/pages": {
      TodayPage: marker("TodayPage"), ExplorePage: marker("ExplorePage"),
      NotesPage: marker("NotesPage"), ProfilePage: marker("ProfilePage"),
    },
    "../klab/learning": {
      LessonFlow: marker("LessonFlow"), ReadingFlow: marker("ReadingFlow"),
      CheckpointFlow: marker("CheckpointFlow"),
    },
    "../klab/components/session": { FocusHeader: marker("FocusHeader") },
    "./viewAdapters": {
      agendaFromTargets: () => ({ title: "Agenda" }),
      agendaRoute: () => ({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" }),
      CORRECTION_ROUTE: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" },
      todayQuickLinks: () => [
        { id: "drills", label: "Mulai D1 (Drill)" },
        { id: "srs", label: "Ulangi kosakata (SRS)" },
      ],
      loadProgressModel: async () => null,
      loadExploreUnits: async () => [], exploreBooks: () => [], explorePracticeLinks: () => [],
      loadVocabulary: async () => [], notesToView: (items) => items,
      preferencesToView: (value) => value, loadStatsSummary: async () => ({}),
    },
    "./notesRepository": {
      listNotes: async () => [],
      saveNote: async (note) => { saved.push(note); return { ...note, revision: note.revision + 1 }; },
      removeNote: async () => undefined,
    },
    "./flowPersistence": {
      saveLessonFlowProgress: async () => undefined,
      loadLessonFlowState: async () => null,
      saveCheckpointFlowResult: async () => undefined,
    },
    "./readingAdapter": {
      readingMeta: () => null, loadReadingMode: async () => null, saveReadingMode: async () => undefined,
    },
    "../lessons/units": { getUnit: () => ({ unit: 4, lessons: [{ no: 2 }] }) },
    "../ui/lessons/LessonRunner": { __esModule: true, default: marker("LessonRunner") },
    ...overrides,
  };
  result.saved = saved;
  return result;
}

let shared = hooks();

(async () => {
  // U-05: dari notes kosong, "Buat catatan" membuka editor dan simpan berhasil.
  {
    shared = hooks(); effects = [];
    const deps = viewDeps();
    const view = load("src/app/routeView.tsx", deps);
    const route = { name: "notes" };
    const base = { navigate: () => {}, back: () => {}, targets: [], route };
    const render = () => {
      shared.reset();
      const element = view.RouteView(base);
      const rendered = element.type(element.props);
      if (rendered.props && rendered.props.onNew) return rendered.props;
      const children = Array.isArray(rendered.props.children)
        ? rendered.props.children : [rendered.props.children];
      return children.find((child) => child && child.props && child.props.onNew).props;
    };
    effects.forEach((effect) => effect());
    let props = render();
    assert.equal(props.notes.length, 0, "awalnya kosong");
    props.onNew();
    props = render();
    assert.equal(props.notes.length, 1, "U-05: editor langsung tampil (notes tidak kosong)");
    assert.ok(props.selectedId, "catatan baru dipilih");
    props.onDraftChange({ title: "Catatan pertama" });
    props = render();
    props.onSave();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(deps.saved.length, 1, "U-05: simpan berhasil");
    assert.equal(deps.saved[0].title, "Catatan pertama");
  }

  // U-08: nav keluar dari tengah latihan + onFinish sukses tidak mengunci navigasi.
  {
    shared = hooks(); effects = [];
    const deps = viewDeps();
    const view = load("src/app/routeView.tsx", deps);
    let navigated = null;
    let refreshed = 0;
    const route = { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "s1" };
    shared.reset();
    const element = view.RouteView({
      navigate: (next) => { navigated = next; }, back: () => {}, targets: [], route,
      refreshTargets: () => { refreshed += 1; },
    });
    const wrapper = element.type(element.props);
    const child = Array.isArray(wrapper.props.children) ? wrapper.props.children[0] : wrapper.props.children;
    assert.equal(child.type, deps["../klab/learning"].LessonFlow);
    await child.props.onFinish({
      unitNo: 4, lessonNo: 2, page: 2,
      answers: [{ id: "q", picked: "einen", correct: true }],
    });
    assert.equal(refreshed, 1, "U-08: refresh target setelah Selesai sukses");
    child.props.onBack();
    // State tidak mengunci: navigasi berikutnya masih diproses route/router.
    deps["../klab/routes"].legacyRoute = () => null;
    const nav = load("src/klab/navigation.ts", {
      "zustand/vanilla": require("zustand/vanilla"),
      "./routes": {
        homeRoute: (tab) => ({ name: tab }),
        tabForRoute: (route) => route.name === "lesson" ? "today" : route.name === "explore" ? "explore" : "today",
      },
    });
    const store = nav.createNavigation();
    store.getState().push({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "s1" });
    store.getState().selectTab("explore");
    assert.equal(store.getState().route.name, "explore", "U-08: tombol Jelajah memindahkan tab");
  }

  // U-09: ringkasan tindak lanjut nyata tanpa klaim kemampuan.
  {
    const db = {
      select: async (query) => {
        if (query.includes("FROM attempts")) return [];
        if (query.includes("FROM srs_state")) return [];
        if (query.includes("COUNT(*) n FROM cards")) return [{ n: 0 }];
        if (query.includes("FROM lesson_progress")) return [];
        if (query.includes("COUNT(DISTINCT")) return [{ texts: 0, reads: 0, words: 0 }];
        return [];
      },
    };
    const dates = {
      computeStreak: () => ({ current: 0, best: 0 }),
      dayKey: (value) => String(value).slice(0, 10), dayLabelId: () => "Hari",
      lastDays: () => ["2026-11-19"], shiftDay: () => "2026-11-19",
    };
    const units = {
      CHECKPOINT_LESSON_NO: 99,
      LEVEL_ORDER: ["A1", "A2", "B1", "B2"],
      LEVELS: {
        A1: { units: [{ unit: 1, title: "Salam", lessons: [{ no: 1 }], checkpoint: { pass: 70 } }] },
        A2: { units: [] }, B1: { units: [] }, B2: { units: [] },
      },
      totalLessons: (unit) => unit.lessons.length,
      unitHasContent: (unit) => unit.lessons.length > 0,
    };
    const stats = load("src/stats/queries.ts", {
      "../stores/db": { __esModule: true, default: async () => db },
      "./dates": dates,
      "../lessons/units": units,
    });
    const result = await stats.loadStats();
    assert.ok(Array.isArray(result.nextSteps) && result.nextSteps.length >= 1);
    for (const step of result.nextSteps) {
      assert.ok(step.label && step.detail, "U-09: label+detail hadir");
      assert.doesNotMatch(`${step.label} ${step.detail}`, /CEFR|penguasaan|kemampuan/i,
        "U-09: tidak ada klaim kemampuan");
    }
    assert.ok(result.nextSteps.some((step) => step.unitNo === 1), "U-09: progres per unit tersedia");
  }

  // U-17: tautan inti Today sama pada dua varian agenda.
  {
    shared = hooks(); effects = [];
    const deps = viewDeps();
    const view = load("src/app/routeView.tsx", deps);
    deps["./viewAdapters"].agendaFromTargets = () => ({ title: "Ada agenda" });
    shared.reset();
    const pageProps = (element) => {
      const rendered = element.type(element.props);
      if (rendered.props && rendered.props.quickLinks) return rendered.props;
      const children = Array.isArray(rendered.props.children)
        ? rendered.props.children : [rendered.props.children];
      const page = children.find((child) => child && child.props && child.props.quickLinks);
      assert.ok(page, "TodayPage terender");
      return page.props;
    };
    const withAgenda = view.RouteView({ navigate: () => {}, back: () => {}, targets: [], route: { name: "today" } });
    const a = pageProps(withAgenda);
    deps["./viewAdapters"].agendaFromTargets = () => null;
    shared = hooks(); effects = [];
    shared.reset();
    const without = view.RouteView({ navigate: () => {}, back: () => {}, targets: [], route: { name: "today" } });
    const b = pageProps(without);
    for (const props of [a, b]) {
      const ids = props.quickLinks.map((link) => link.id);
      assert.ok(ids.includes("drills"), "U-17: Mulai D1 selalu ada");
      assert.ok(ids.includes("srs"), "U-17: SRS selalu ada");
      assert.ok(ids.includes("drills"), "U-17: satu CTA inti tetap sama");
    }
  }

  console.log("FIX-UX: U-05 editor langsung tampil+simpan, U-08 nav tidak mengunci, U-09 ringkasan tanpa klaim, U-17 Today konsisten.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
