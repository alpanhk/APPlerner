// KLAB-WINDOWS-20261119 / 1a: uji cutover entry produksi dan 100% aset lama
// tanpa membuka app. Bootstrap, rute/back, data nyata, komponen 2a/4a, dan
// repositories config semuanya dibuktikan pada batas modul.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: false,
    },
  }).outputText;
}
function load(file, mocks = {}) {
  const mod = { exports: {} };
  new Function("require", "module", "exports", transpile(file))(
    (id) => {
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id} in ${file}`);
      return mocks[id];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
function store(initial) {
  const state = { ...initial };
  const listeners = new Set();
  return {
    getState: () => state,
    setState(patch) { Object.assign(state, patch); listeners.forEach((listener) => listener(state)); },
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}
const marker = (name) => function Marker() { return name; };

(async () => {
  // 1) Bootstrap: urutan seed -> integrity -> siap; verdict buruk melempar.
  {
    const calls = [];
    let verdict = "ok";
    const db = { select: async (q) => { assert.match(q, /integrity_check/); return [{ integrity_check: verdict }]; } };
    const bootstrap = load("src/app/bootstrap.ts", {
      "../stores/db": { __esModule: true, default: async () => { calls.push("db"); return db; } },
    });
    const seed = async () => { calls.push("seed"); return "seed siap"; };
    assert.equal(await bootstrap.initializeDatabase(seed), "seed siap");
    assert.deepEqual(calls, ["seed", "db"]);
    verdict = "database disk image is malformed";
    await assert.rejects(() => bootstrap.initializeDatabase(seed), /integritas SQLite/);
  }

  // 2) Navigation: jembatan dua arah + last route config.
  {
    const klabState = { route: { name: "today" } };
    const listeners = new Set();
    const klabApi = {
      getState: () => ({ ...klabState, push: klabApi.push, replace: klabApi.replace, selectTab: klabApi.selectTab }),
      setState(patch) { Object.assign(klabState, patch); listeners.forEach((l) => l(klabApi.getState())); },
      subscribe(l) { listeners.add(l); return () => listeners.delete(l); },
      push(route) { klabApi.setState({ route }); },
      replace(route) { klabApi.setState({ route }); },
      selectTab() {},
    };
    const legacy = store({ page: "hari-ini" });
    const routes = {
      legacyRoute: (page) => ({
        "hari-ini": { name: "today" }, kurikulum: { name: "explore", section: "materials" },
        drill: { name: "drills" }, kosakata: { name: "explore", section: "vocabulary" },
        membaca: { name: "explore", section: "reading" }, latihan: { name: "explore", section: "practice" },
        "uji-a1": { name: "exam" }, statistik: { name: "profile", section: "stats" },
        pengaturan: { name: "profile", section: "settings" },
      })[page] ?? null,
      tabForRoute: () => "today",
    };
    const configRows = [];
    const db = {
      execute: async (q, params) => { configRows.push([q, params]); return {}; },
      select: async () => configRows.length ? [{ value: configRows[configRows.length - 1][1][1] }] : [],
    };
    const nav = load("src/app/navigation.ts", {
      "../klab/navigation": { createNavigation: () => klabApi },
      "../klab/routes": routes,
      "../stores/nav": { useNav: legacy },
      "../stores/db": { __esModule: true, default: async () => db },
    });
    assert.equal(nav.pageForRoute({ name: "explore", section: "vocabulary" }), "kosakata");
    assert.equal(nav.pageForRoute({ name: "profile", section: "settings" }), "pengaturan");
    const detach = nav.installNavBridge();
    legacy.setState({ page: "pengaturan" });
    assert.deepEqual(klabApi.getState().route, { name: "profile", section: "settings" });
    klabApi.push({ name: "drills" });
    assert.equal(legacy.getState().page, "drill");
    await nav.persistLastRoute({ name: "unit", unitNo: 4 });
    assert.deepEqual(await nav.loadLastRoute(), { name: "unit", unitNo: 4 });
    detach();
  }

  // 3) Session registry: kartu lanjut dari draft nyata, payload rusak dilewati.
  {
    const rows = [
      { key: "lernen_lesson_4_2", payload: JSON.stringify({ step: 2, slide: 1, drillScore: null }) },
      { key: "checkpoint_session:4", payload: JSON.stringify({
        version: 1, key: "checkpoint_session:4", sessionId: "s1", revision: 1,
        data: { unitNo: 4, items: [{ key: "a" }, { key: "b" }], index: 1, result: null },
      }) },
      { key: "rusak", payload: "{" },
    ];
    const registry = load("src/app/sessionRegistry.ts", {
      "../stores/db": { __esModule: true, default: async () => ({ select: async () => rows }) },
    });
    const targets = await registry.loadContinueTargets();
    assert.equal(targets.length, 2);
    assert.match(targets[0].detail, /langkah 3\/5/);
    assert.match(targets[1].detail, /Soal 2\/2/);
  }

  // 4) Sumber 100% aset: 42 unit / 96 pelajaran / 67 bacaan di JSON.
  {
    const unitFiles = fs.readdirSync("src/data/lessons").filter((name) => /^units_[a-z0-9]+\.json$/.test(name));
    let units = 0;
    let lessons = 0;
    for (const name of unitFiles) {
      const parsed = JSON.parse(fs.readFileSync(`src/data/lessons/${name}`, "utf8").replace(/^\uFEFF/, ""));
      units += parsed.units.length;
      lessons += parsed.units.reduce((sum, unit) => sum + (unit.lessons?.length ?? 0), 0);
    }
    assert.equal(units, 42, "42 unit dari empat level");
    assert.equal(lessons, 96, "96 pelajaran A1-B2");
    let texts = 0;
    for (const name of ["texts_a1.json", "texts_a1a2_extra.json", "texts_a2.json", "texts_b1.json", "texts_b2.json", "texts_extra.json"]) {
      texts += JSON.parse(fs.readFileSync(`src/data/reading/${name}`, "utf8")).texts.length;
    }
    assert.equal(texts, 67, "67 teks bacaan");
  }

  // 5) View adapters: 42 unit, 67 buku dengan Im Café pertama, vocabulary nyata.
  {
    const readings = Array.from({ length: 67 }, (_, index) => ({
      textId: index + 1, title: index === 10 ? "Im Café" : `Teks ${index + 1}`,
      level: "A1", tags: "Bacaan", sentences: [],
    }));
    const doneRows = [{ unit_no: 4 }, { unit_no: 101 }];
    const entries = [
      { de: "Haus", meaning_id: "rumah", article: "das", due: 1 },
      { de: "Buch", meaning_id: "buku", article: "das", due: 0 },
    ];
    const db = { select: async (q) => q.includes("lesson_progress") ? doneRows : entries };
    const adapters = load("src/app/viewAdapters.ts", {
      "../stores/db": { __esModule: true, default: async () => db },
      "../lessons/units": {
        UNITS_ALL: Array.from({ length: 42 }, (_, i) => ({
          unit: i < 12 ? i + 1 : 100 + (i - 11), title: `Unit ${i + 1}`,
        })),
      },
      "../klab/learning/logic": { allReadings: () => readings },
    });
    const units = await adapters.loadExploreUnits();
    assert.equal(units.length, 42);
    assert.equal(units.filter((unit) => unit.status === "done").length, 2);
    assert.equal(adapters.exploreBooks().length, 67);
    assert.equal(adapters.exploreBooks()[0].title, "Im Café");
    const vocab = await adapters.loadVocabulary();
    assert.equal(vocab.length, 2);
    assert.equal(vocab[0].word, "das Haus");
    assert.equal(vocab[0].due, 1);
    assert.deepEqual(adapters.CORRECTION_ROUTE, {
      name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2",
    });
    const progress = await adapters.loadProgressModel();
    assert.equal(progress.total, 42);
  }

  // 6) Repositori config: catatan dan preferensi nyata.
  {
    const config = new Map();
    const db = {
      select: async (q, params) => config.has(params[0]) ? [{ value: config.get(params[0]) }] : [],
      execute: async (q, params) => { config.set(params[0], params[1]); return {}; },
    };
    const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-19T03:00:00Z" };
    const notes = load("src/app/notesRepository.ts", { "../stores/db": dbModule });
    const prefs = load("src/app/preferencesRepository.ts", { "../stores/db": dbModule });
    const note = await notes.saveNote({
      id: "n1", revision: 0, title: "Judul", body: "Isi", anchor: null, color: null, updatedAt: "",
    }, 0);
    assert.equal(note.revision, 1);
    assert.equal((await notes.listNotes()).length, 1);
    const saved = await prefs.patchPreferences({ theme: "dark", textScale: 1.25 });
    assert.equal(saved.theme, "dark");
    assert.equal((await load("src/app/preferencesRepository.ts", { "../stores/db": dbModule }).loadPreferences()).textScale, 1.25);
    assert.equal(prefs.effectiveTheme(saved, false), "dark");
  }

  // 6b) Pilot: simpan dua jawaban + skor 50, baca ulang setelah "restart", retry gagal simpan.
  {
    const drafts = new Map();
    const progressRows = new Map();
    let failNextSave = false;
    const db = {
      select: async (q, params) => {
        assert.match(q, /lesson_progress/);
        const key = `${params[0]}:${params[1]}`;
        return progressRows.has(key) ? [{ state: "done", score: progressRows.get(key) }] : [];
      },
      execute: async (q, params) => {
        assert.match(q, /lesson_progress/);
        if (failNextSave) { failNextSave = false; throw new Error("simulasi SQLite gagal"); }
        progressRows.set(`${params[0]}:${params[1]}`, params[2]);
        return {};
      },
    };
    const deps = {
      "../stores/db": { __esModule: true, default: async () => db, nowIso: () => "2026-11-21T00:00:00Z" },
      "../lessons/persistence": {
        saveDraft: async (key, value) => { drafts.set(key, JSON.stringify(value)); },
        loadDraftRaw: async (key) => drafts.get(key) ?? null,
      },
      "../lessons/checkpointStore": { saveCheckpointResult: async () => ({}) },
      "../lessons/units": { CHECKPOINT_LESSON_NO: 99, getUnit: () => undefined },
      "../srs/cards": { ensureCards: async () => undefined },
      "../lessons/objectives": { objectivesOfUnit: () => [] },
    };
    const flow = load("src/app/flowPersistence.ts", deps);
    const pilot = {
      unitNo: 4, lessonNo: 2, page: 2,
      answers: [
        { id: "lp-u4-l2-01", picked: "ein", correct: false },
        { id: "lp-u4-l2-02", picked: "getrennt", correct: true },
      ],
    };
    await flow.saveLessonFlowProgress(pilot, true);
    assert.equal(progressRows.get("4:2"), 50, "1 salah + 1 benar = 50");

    // Restart: modul dibuat ulang, hanya SQLite/drafts bertahan.
    const restarted = load("src/app/flowPersistence.ts", deps);
    const restored = await restarted.loadLessonFlowState(4, 2);
    assert.equal(restored.state, "done");
    assert.equal(restored.score, 50);
    assert.equal(restored.answers.length, 2);
    assert.deepEqual(restored.answers.map((answer) => answer.picked), ["ein", "getrennt"]);

    // Dedup: jawaban terakhir per id yang menang.
    const duplicate = {
      unitNo: 4, lessonNo: 3, page: 1,
      answers: [
        { id: "q1", picked: "ein", correct: false },
        { id: "q2", picked: "getrennt", correct: true },
        { id: "q1", picked: "einen", correct: true },
      ],
    };
    assert.equal(flow.dedupeAnswers(duplicate.answers).length, 2);
    await flow.saveLessonFlowProgress(duplicate, false);
    const afterDedup = await restarted.loadLessonFlowState(4, 3);
    assert.deepEqual(afterDedup.answers.map((answer) => answer.picked), ["einen", "getrennt"]);

    // Kegagalan simpan dilempar, retry berhasil untuk unit lain.
    failNextSave = true;
    await assert.rejects(() => flow.saveLessonFlowProgress({ ...pilot, unitNo: 5 }, true), /SQLite gagal/);
    assert.equal(progressRows.has("5:2"), false, "gagal simpan tidak menulis progres");
    await flow.saveLessonFlowProgress({ ...pilot, unitNo: 5 }, true);
    assert.equal(progressRows.get("5:2"), 50, "retry berhasil");
  }

  // 7) RouteView: komponen 2a/4a terpasang, fallback tetap ada.
  {
    const jsx = (type, props) => ({ type, props });
    const flows = {
      LessonFlow: marker("LessonFlow"), CheckpointFlow: marker("CheckpointFlow"),
      ReadingFlow: marker("ReadingFlow"),
    };
    const pages = {
      TodayPage: marker("TodayPage"), ExplorePage: marker("ExplorePage"),
      NotesPage: marker("NotesPage"), ProfilePage: marker("ProfilePage"),
    };
    const legacyPages = { drill: marker("Drill"), pengaturan: marker("Pengaturan"), kurikulum: marker("Kurikulum") };
    let shouldFailSave = false;
    let saveCalls = 0;
    let refreshCalls = 0;
    const flowMock = {
      saveLessonFlowProgress: async () => {
        saveCalls += 1;
        if (shouldFailSave) { shouldFailSave = false; throw new Error("gagal simpan"); }
      },
      loadLessonFlowState: async () => null,
      saveCheckpointFlowResult: async () => undefined,
    };
    const view = load("src/app/routeView.tsx", {
      react: {
        useEffect: () => undefined,
        useRef: (value) => ({ current: value }),
        useState: (initial) => [typeof initial === "function" ? initial() : initial, () => undefined],
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "../klab/routes": {},
      "../klab/pages": pages,
      "../klab/learning": {
        LessonFlow: flows.LessonFlow, ReadingFlow: flows.ReadingFlow, CheckpointFlow: flows.CheckpointFlow,
      },
      "../klab/components/session": { FocusHeader: marker("FocusHeader") },
      "./viewAdapters": {
        agendaFromTargets: () => ({ title: "U4 L2" }), agendaRoute: () => ({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2" }),
        CORRECTION_ROUTE: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2" },
        todayQuickLinks: () => [], loadProgressModel: async () => null,
        loadExploreUnits: async () => [], exploreBooks: () => [{ id: "1", title: "Im Café" }],
        explorePracticeLinks: () => [], loadVocabulary: async () => [],
        notesToView: () => [], preferencesToView: (value) => value, loadStatsSummary: async () => ({}),
      },
      "./notesRepository": { listNotes: async () => [], saveNote: async () => ({}), removeNote: async () => undefined },
      "./flowPersistence": flowMock,
      "./readingAdapter": {
        readingMeta: (id) => id === 7 ? { textId: 7, title: "Teks Ketujuh", level: "A2", lead: "" } : null,
        loadReadingMode: async () => null,
        saveReadingMode: async () => undefined,
      },
      "../lessons/units": { getUnit: () => ({ unit: 4, title: "Makanan", lessons: [{ no: 2, title: "Minuman" }] }) },
      "../ui/lessons/LessonRunner": { __esModule: true, default: marker("LessonRunner") },
    });
    const base = {
      navigate: () => {}, back: () => {}, targets: [], legacyPages,
      refreshTargets: () => { refreshCalls += 1; },
    };
    view.resetViewRegistry();
    const typeOf = (route) => view.RouteView({ ...base, route }).type;
    const mountedFlow = (route) => {
      let element = view.RouteView({ ...base, route });
      // LessonKlabFlow membungkus flow dalam div bersama banner state tersimpan.
      for (let depth = 0; depth < 4; depth += 1) {
        const name = typeof element.type === "string" ? element.type : (element.type.name || "");
        if (/KlabFlow$|ProductionNotes$/.test(name)) {
          element = element.type(element.props);
          continue;
        }
        if (typeof element.type === "string") {
          const children = Array.isArray(element.props.children) ? element.props.children : [element.props.children];
          const next = children.find((child) => child && typeof child === "object" && typeof child.type !== "string");
          if (!next) break;
          element = next;
          continue;
        }
        break;
      }
      return element.type;
    };
    assert.equal(mountedFlow({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" }), flows.LessonFlow);
    assert.equal(mountedFlow({ name: "checkpoint", unitNo: 4, sessionId: "x" }), flows.CheckpointFlow);

    // onFinish harus melempar error ke LessonFlow; retry sukses menyegarkan targets.
    const lessonTree = view.RouteView({ ...base, route: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" } });
    const renderedLesson = lessonTree.type(lessonTree.props);
    const flowChild = Array.isArray(renderedLesson.props.children)
      ? renderedLesson.props.children[0]
      : renderedLesson.props.children;
    const flowProps = flowChild.props;
    assert.equal(typeof flowProps.onFinish, "function");
    assert.ok("initialAnswers" in flowProps && "savedScore" in flowProps, "state tersimpan diteruskan ke LessonFlow");
    shouldFailSave = true;
    await assert.rejects(() => flowProps.onFinish({
      unitNo: 4, lessonNo: 2, page: 2, answers: [{ id: "q", picked: "ein", correct: false }],
    }), /gagal simpan/);
    assert.equal(refreshCalls, 0, "targets tidak disegarkan saat simpan gagal");
    await flowProps.onFinish({
      unitNo: 4, lessonNo: 2, page: 2, answers: [{ id: "q", picked: "ein", correct: false }],
    });
    assert.equal(saveCalls, 2, "retry memanggil simpan lagi");
    assert.equal(refreshCalls, 1, "targets disegarkan setelah retry sukses");
    assert.equal(typeOf({ name: "reader", textId: 7 }).name, "ReadingKlabFlow");
    assert.equal(mountedFlow({ name: "reader", textId: 7 }), flows.ReadingFlow);
    assert.equal(mountedFlow({ name: "notes" }), pages.NotesPage);
    assert.equal(typeOf({ name: "unit", unitNo: 4 }).name, "UnitDetailKlab");
    assert.equal(typeOf({ name: "profile", section: "recovery" }).name, "LegacyTools");
    const fallback = view.RouteView({ ...base, route: { name: "drills" } });
    assert.equal(fallback.type.name, "LegacyFeature");
    assert.equal(fallback.type(fallback.props).type, legacyPages.drill);
    const CustomToday = marker("CustomToday");
    view.registerKlabView("today", CustomToday);
    assert.equal(typeOf({ name: "today" }), CustomToday);
  }

  // 8) App.tsx: bootstrap lama + preferensi/rute persisten tetap hadir.
  {
    const app = fs.readFileSync("src/App.tsx", "utf8");
    for (const needle of [
      "initializeDatabase", "initDatabase", "FatalDatabase", "maybeAutoBackup", "startStudyClock",
      "<Shell", "RouteView", "installNavBridge", "loadLastRoute", "loadPreferences",
      "patchPreferences", "refreshTargets",
    ]) assert.ok(app.includes(needle), `App.tsx kehilangan ${needle}`);
    assert.doesNotMatch(app, /PAGE_COMPONENTS\[page\]/);
    assert.match(fs.readFileSync("src/app/bootstrap.ts", "utf8"), /PRAGMA integrity_check/);
  }

  console.log("KlabCutover: 42 unit/67 bacaan/vokabular nyata, 2a+4a terpasang, preferensi & rute persisten, fallback tanpa rute buntu.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
