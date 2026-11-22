// ROMBAK UI/UX / UIUX-VISUAL-NOVEL-20261121 / 1a.
// Peta rute title/create/story, grup nav terpisah, resolver media 96 hash,
// adapter SQLite Progress/Game (tanpa reset), fokus & anti-klik-ganda.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const ts = require("typescript");

function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX, resolveJsonModule: true,
    },
  }).outputText;
  const mod = { exports: {} };
  new Function("require", "module", "exports", code)((id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    if (id.endsWith(".json")) return { __esModule: true, default: require(path.resolve(file, "..", id)) };
    if (id.startsWith(".")) {
      const base = path.resolve(path.dirname(path.resolve(file)), id);
      if (fs.existsSync(`${base}.ts`)) return load(`${base}.ts`, mocks);
      if (fs.existsSync(base)) return require(base);
    }
    throw new Error(`dependency tak terduga ${id}`);
  }, mod, mod.exports);
  return mod.exports;
}

const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

(async () => {
  // ---------- 1. Manifest 96 berkas & aset masuk pipeline Tauri ----------
  const manifestFile = "src/data/ref-visual-novel-manifest.json";
  const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
  assert.equal(manifest.files, 96, "manifest 96 berkas");
  assert.equal(manifest.rows.length, 96);
  assert.equal(manifest.aggregate_sha256, "a562f171a09e789036467595bf5eeac90bfcba3e15bf4188fe664d9fd78238de");

  const publicMedia = manifest.rows.filter((r) => /^public\/(klab|media)\//.test(r.path));
  assert.equal(publicMedia.length, 31, "18 sampul + 13 adegan di public/");
  for (const row of publicMedia) {
    const target = path.join("public", row.path.replace(/^public\//, ""));
    assert.ok(fs.existsSync(target), `aset ${row.path} ikut dist/frontendDist`);
    assert.equal(sha(target), row.sha256, `hash ${row.path} sesuai manifest`);
  }
  const bgRows = manifest.rows.filter((r) => /^src\/assets\/bg\/.+\.jpg$/.test(r.path));
  assert.equal(bgRows.length, 5);
  for (const row of bgRows) {
    const target = path.join("public/media/bg", path.basename(row.path));
    assert.ok(fs.existsSync(target), `latar ${row.path} disalin ke public/`);
    assert.equal(sha(target), row.sha256, `hash latar ${row.path}`);
  }
  // 36 hash unik = dedup dari 67 baris media (src/assets vs public/).
  const mediaHashes = new Set(manifest.rows
    .filter((r) => /\.(webp|jpg)$/.test(r.path)).map((r) => r.sha256));
  assert.equal(mediaHashes.size, 36, "dedup hash: 18 cover + 13 scene + 5 bg");

  // ---------- 2. Peta rute & grup nav terpisah ----------
  const routes = load("src/klab/routes.ts");
  assert.deepEqual(routes.TABS.map((t) => t.id), ["today", "explore", "notes", "profile"], "empat tab produksi utuh");
  assert.equal(routes.groupForRoute({ name: "title" }), "story");
  assert.equal(routes.groupForRoute({ name: "create" }), "story");
  assert.equal(routes.groupForRoute({ name: "story", panel: "history" }), "story");
  assert.equal(routes.groupForRoute({ name: "today" }), "today");
  assert.equal(routes.groupForRoute({ name: "explore", section: "reading" }), "explore");
  assert.deepEqual(routes.homeGroupRoute("story"), { name: "title" });
  assert.deepEqual(routes.homeRoute("profile"), { name: "profile", section: "overview" });
  assert.deepEqual(routes.legacyRoute("pengaturan"), { name: "profile", section: "settings" });

  // ---------- 3. Stack cerita tidak mencampur rute produksi ----------
  let state;
  const store = {
    getState: () => state,
    setState(patch) { state = { ...state, ...patch }; },
  };
  const navigation = load("src/klab/navigation.ts", {
    "zustand/vanilla": { createStore: (init) => {
      state = init(set, () => state);
      function set(patch) { state = { ...state, ...patch }; }
      return store;
    } },
  }).createNavigation();
  navigation.getState().push({ name: "title" });
  navigation.getState().push({ name: "create" });
  navigation.getState().push({ name: "story", panel: "journal" });
  assert.equal(navigation.getState().tab, "story");
  assert.deepEqual(navigation.getState().stacks.story.map((r) => r.name), ["title", "create", "story"]);
  assert.deepEqual(navigation.getState().stacks.today, [{ name: "today" }], "stack produksi tidak tersentuh");
  assert.equal(navigation.getState().back(), true);
  assert.equal(navigation.getState().route.name, "create");
  navigation.getState().selectTab("story");
  assert.equal(navigation.getState().route.name, "create");
  navigation.getState().selectTab("today");
  assert.equal(navigation.getState().route.name, "today", "tab produksi masih dapat dipilih");

  // ---------- 4. Satu resolver media ----------
  const coverAdapter = {
    resolveCover: (id) => Number(id) === 10
      ? { title: "Im Café", src: "/klab/sampul/10/cover.webp" }
      : { title: `Judul ${id}`, src: `/klab/sampul/${id}/cover.webp` },
    allCovers: () => Array.from({ length: 67 }, (_, i) => ({ textId: i + 1 })),
  };
  const media = load("src/app/mediaResolver.ts", {
    "../data/ref-visual-novel-manifest.json": { __esModule: true, default: manifest },
    "./coverResolver": coverAdapter,
  });
  assert.equal(media.manifestRows.length, 96);
  assert.equal(media.allMedia().length, 36);
  assert.deepEqual(
    ["cover", "scene", "bg"].map((kind) => media.allMedia().filter((m) => m.kind === kind).length),
    [18, 13, 5],
  );
  assert.equal(media.coverSrc(10), "/klab/sampul/10/cover.webp");
  assert.equal(media.bgSrc("kamar"), "/media/bg/kamar.jpg");
  assert.ok(String(media.sceneSrc(1)).startsWith("/media/scenes/u01-"));
  assert.ok(String(media.sceneSrc(2)).startsWith("/media/scenes/u02-"));
  assert.equal(media.resolveMedia("cover", 10).src, media.coverSrc(10));
  assert.equal(media.resolveMedia("bg", "judul").src, "/media/bg/judul.jpg");

  // ---------- 5. Adapter Progress/Game -> SQLite, tanpa reset ----------
  const config = new Map();
  const db = {
    select: async (_sql, params) => config.has(params[0]) ? [{ value: config.get(params[0]) }] : [],
    execute: async (sql, params) => {
      if (/DELETE/i.test(sql)) config.delete(params[0]);
      else config.set(params[0], params[1]);
    },
  };
  const novel = load("src/app/novelProgress.ts", {
    "../stores/db": { __esModule: true, default: async () => db },
  });
  assert.equal(await novel.novelStore.loadProgress(), null, "awalnya belum ada progres");
  await novel.novelStore.saveProgress({
    version: 1, player: { name: "Anna" }, nodeId: "dialog_7", stage: { bg: "kamar" },
    flags: { greet: true }, hintCounts: {}, attempts: [], history: [], prologCompleted: false,
    updatedAt: 1,
  });
  const restored = await novel.novelStore.loadProgress();
  assert.equal(restored.player.name, "Anna");
  assert.equal(restored.nodeId, "dialog_7", "posisi belajar dipertahankan");
  assert.equal(restored.flags.greet, true);
  assert.ok(config.has("novel.progress.v1"), "load TIDAK menghapus progres");
  assert.equal((await novel.novelStore.loadSettings()).soundOn, false, "suara default mati");
  await novel.novelStore.saveSettings({ soundOn: true, reducedMotion: true });
  assert.equal((await novel.novelStore.loadSettings()).soundOn, true);
  assert.equal((await novel.novelStore.loadSettings()).reducedMotion, true);
  assert.ok(!fs.readFileSync("src/app/novelProgress.ts", "utf8").includes("localStorage"), "SQLite, bukan localStorage");

  // ---------- 5b. StoryFlow 2a lewat adapter SQLite (NOVEL-GAP-01) ----------
  const adapter = load("src/app/storyFlowAdapter.ts", {
    "../klab/learning/story/engine": { nodeOf: () => ({ kind: "line" }) },
    "./novelProgress": novel,
  });
  assert.equal(typeof adapter.storyStore.loadProgress, "function");
  assert.equal(adapter.storyMediaSrc("speech:ich-heisse-alex"), "/audio/tuturan/a1-u01-srs-12-contoh.wav");
  const viaAdapter = await adapter.storyStore.loadProgress();
  assert.equal(viaAdapter.nodeId, "dialog_7", "adapter membaca posisi dari SQLite");
  await adapter.storyStore.saveProgress({
    player: { name: "Rina" }, nodeId: "a_intro", flags: {}, hintCounts: {},
    attempts: [], history: [], updatedAt: 1,
  });
  const afterAdapter = await novel.novelStore.loadProgress();
  assert.equal(afterAdapter.player.name, "Rina", "StoryFlow menulis ke SQLite produksi");
  assert.equal(afterAdapter.nodeId, "a_intro", "node awal valid untuk resume");
  assert.ok(!fs.readFileSync("src/app/storyFlowAdapter.ts", "utf8").includes("localStorage"), "adapter bukan localStore");

  // ---------- 6. Fokus, status nyata, anti klik ganda (kontrak sumber) ----------
  const views = fs.readFileSync("src/app/novelViews.tsx", "utf8");
  for (const token of [
    'data-testid="novel-title"', 'tabIndex={-1}', "panelTrigger", "aria-modal=\"true\"",
    "saving.current", "writing.current", 'role="alert"', 'role="status"',
    "bgSrc(", "sceneSrc(", "allCovers()", "novelStore.loadProgress",
  ]) assert.ok(views.includes(token), `novelViews punya ${token}`);
  const routeView = fs.readFileSync("src/app/routeView.tsx", "utf8");
  for (const token of [
    'route.name === "title"', 'route.name === "create"', 'route.name === "story"',
    "registerFeatureView", 'id === "story"',
  ]) assert.ok(routeView.includes(token), `routeView punya ${token}`);
  const app = fs.readFileSync("src/App.tsx", "utf8");
  assert.ok(app.includes("<MediaIndex />"), "indeks media dipasang aplikasi");
  assert.ok(app.includes("#klab-content h1, #klab-content h2"), "fokus judul baru");
  // KONF-01: rute `story` memakai StoryView nyata milik 2a; 1a pemilik registri.
  assert.ok(routeView.includes('registerFeatureView("story", StoryHostView)'), "1a mendaftarkan host story");
  assert.ok(routeView.includes('StoryView, type ReadingFlowProps') , "routeView mengimpor StoryView dari ../klab/learning");
  assert.ok(routeView.includes("storyView={StoryView}"), "host menerima StoryView 2a");
  const host = fs.readFileSync("src/app/StoryFlowView.tsx", "utf8");
  for (const token of ['from "../klab/learning"', "<Story ", "novel-panel-", "StoryPanels"]) {
    assert.ok(host.includes(token), `host story punya ${token}`);
  }
  const flow = fs.readFileSync("src/klab/learning/StoryFlow.tsx", "utf8");
  assert.ok(flow.includes('data-testid="story-title"'), "StoryFlow menyediakan story-title");
  assert.ok(flow.includes('data-testid="story-result"'), "StoryFlow menyediakan ResultScreen");
  const view2a = fs.readFileSync("src/klab/learning/StoryView.tsx", "utf8");
  assert.ok(view2a.includes("initialNodeId="), "StoryView 2a masuk langsung ke node cerita");
  assert.ok(view2a.includes("novelStore.loadProgress"), "StoryView 2a memakai adapter SQLite 1a");
  const created = fs.readFileSync("src/app/novelViews.tsx", "utf8");
  assert.ok(created.includes("nodeId: PROLOG_START"), "nama baru disimpan di node awal yang valid");
  assert.ok(created.includes('data-testid="story-title"'), "layar Title punya story-title untuk QA");

  // ---------- 7. Render [P] StoryFlow: story-title & story-result nyata ----------
  const jsx = (type, props) => ({ type, props });
  function renderFlow(stage, nodeKind) {
    const game = { nodeId: "a_intro", player: { name: "Rina" }, flags: {}, hintCounts: {},
      attempts: [], history: [], stage: { bg: "kamar" } };
    const states = [stage, stage === "story" ? game : null, null, "Rina", "", "",
      { speaking: { status: "idle" } }, false];
    let cursor = 0;
    return load("src/klab/learning/StoryFlow.tsx", {
      react: {
        useState: () => [states[cursor++], () => undefined],
        useEffect: () => undefined,
        useLayoutEffect: () => undefined,
        useRef: (value) => ({ current: value }),
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "./story/engine": {
        newGame: (player, nodeId) => ({ nodeId, player }),
        transition: (g) => ({ g, effects: [] }),
        nodeOf: () => ({ kind: nodeKind, id: "a_intro", speaker: "tutor", text: "Halo", lang: "de", next: "x" }),
      },
      "./story/matchers": { detectIntents: () => [], resolveInputHandler: () => null },
      "./story/evaluate": {
        buildSummary: () => ({ lines: ["ringkasan"], next: "lanjut" }),
        demonstratedFullSentence: () => false, LEVEL_LABEL: {}, objectiveLevel: () => "belum",
      },
      "./story/prolog": {
        PROLOG_START: "a_intro",
        PROLOG_META: { title: "Surat untuk Siapa?", level: "A1", objectives: [] },
      },
      "./soundController": {
        soundController: { get: () => ({ speaking: { status: "idle" } }), subscribe: () => () => undefined,
          setSpeaking: () => undefined },
      },
    }).StoryFlow({ store: adapter.storyStore, mediaSrc: adapter.storyMediaSrc });
  }
  assert.equal(renderFlow("title", "line").props["data-testid"], "story-title", "StoryFlow merender story-title");
  assert.equal(renderFlow("story", "end").props["data-testid"], "story-result", "StoryFlow merender ResultScreen");

  // ---------- 8. Render [P] StoryView 2a: adapter SQLite + node awal ----------
  const flowMarker = () => null;
  const storyViewMod = (() => {
    const saved = { player: { name: "Rina" }, nodeId: "a_intro", flags: {}, hintCounts: {},
      attempts: [], history: [], updatedAt: 1 };
    const states = [saved, true];
    let cursor = 0;
    return load("src/klab/learning/StoryView.tsx", {
      react: {
        useState: () => [states[cursor++], () => undefined],
        useEffect: () => undefined,
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "../../app/novelProgress": {
        novelStore: {
          loadProgress: async () => saved,
          loadSettings: async () => ({ soundOn: false }),
          saveProgress: async () => undefined,
        },
      },
      "../../app/mediaResolver": { resolveMedia: () => undefined },
      "./story/prolog": { PROLOG_START: "a_intro" },
      "./StoryFlow": { StoryFlow: flowMarker },
      "./soundController": { soundController: { setOptIn: () => undefined } },
    });
  })();
  const renderedFlow = storyViewMod.StoryView({ route: { name: "story", panel: "journal" }, back: () => undefined });
  const inner = renderedFlow.props.children;
  assert.equal(inner.type, flowMarker, "StoryView 2a merender StoryFlow");
  assert.equal(inner.props.initialNodeId, "a_intro", "node awal valid, data dari SQLite");
  assert.equal(inner.props.panel, "journal", "panel diteruskan ke StoryFlow");

  console.log("UIUX-1a: 96 hash, rute story->StoryFlow (story-title/result), 4 tab utuh, resolver tunggal, SQLite adapter, fokus & anti-klik-ganda.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
