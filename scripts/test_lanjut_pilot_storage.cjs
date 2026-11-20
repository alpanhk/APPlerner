// LANJUT-PILOT-01 / 1a: skenario penyimpanan terisolasi (bukan app/GUI).
// A) peserta keluar tengah U4 L2 setelah satu jawaban, buka lagi, selesaikan;
// B) gagal simpan lalu retry tanpa kehilangan/menggandakan jawaban;
// C) peserta baru tanpa progres peserta sebelumnya.
const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const ts = require("typescript");
const { DatabaseSync } = require("node:sqlite");

function transpile(file) {
  return ts.transpileModule(fs.readFileSync(path.resolve(file), "utf8"), {
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
      if (id === "./novelViews") return { TitleView: () => null, CreateView: () => null, StoryView: () => null };
      if (id === "./StoryFlowView") return { __esModule: true, default: () => null };
      if (id === "./mediaResolver") return { coverSrc: () => undefined, allCovers: () => [], resolveMedia: () => null, bgSrc: () => undefined, sceneSrc: () => undefined };
      assert.ok(Object.hasOwn(mocks, id), `Unexpected dependency ${id} in ${file}`);
      return mocks[id];
    },
    mod,
    mod.exports,
  );
  return mod.exports;
}
const marker = (name) => function Marker() { return name; };

function makeStorage() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec(`
    CREATE TABLE lesson_drafts(key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT);
    CREATE TABLE lesson_progress(
      unit_no INTEGER NOT NULL, lesson_no INTEGER NOT NULL, state TEXT,
      score REAL, finished_at TEXT, PRIMARY KEY(unit_no,lesson_no)
    );
  `);
  const flags = { failDraft: false, failProgress: false };
  const bind = (query, params) => {
    const values = [];
    const text = query.replace(/\$(\d+)/g, (_, n) => { values.push(params[+n - 1]); return "?"; });
    return { text, values };
  };
  const db = {
    select(query, params = []) {
      const b = bind(query, params);
      return sqlite.prepare(b.text).all(...b.values);
    },
    execute(query, params = []) {
      if (query.includes("INSERT INTO lesson_drafts") && flags.failDraft) {
        flags.failDraft = false;
        throw new Error("simulasi gagal simpan draft");
      }
      if (query.includes("lesson_progress") && flags.failProgress) {
        flags.failProgress = false;
        throw new Error("simulasi gagal simpan progres");
      }
      const b = bind(query, params);
      return sqlite.prepare(b.text).run(...b.values);
    },
    close: () => sqlite.close(),
  };
  const dbModule = { __esModule: true, default: async () => db, nowIso: () => "2026-11-21T07:00:00Z" };
  const persistence = load("src/lessons/persistence.ts", { "../stores/db": dbModule });
  const deps = {
    "../stores/db": dbModule,
    "../lessons/persistence": persistence,
    "../lessons/checkpointStore": { saveCheckpointResult: async () => ({}) },
    "../lessons/units": { CHECKPOINT_LESSON_NO: 99, getUnit: () => undefined },
    "../srs/cards": { ensureCards: async () => undefined },
    "../lessons/objectives": { objectivesOfUnit: () => [] },
  };
  const freshFlow = () => load("src/app/flowPersistence.ts", deps);
  const draft = (unitNo, lessonNo) => {
    const row = db.select("SELECT payload FROM lesson_drafts WHERE key = $1", [`lernen_lesson_${unitNo}_${lessonNo}`]);
    return row.length ? JSON.parse(row[0].payload) : null;
  };
  const progress = (unitNo, lessonNo) => {
    const rows = db.select("SELECT state,score FROM lesson_progress WHERE unit_no=$1 AND lesson_no=$2", [unitNo, lessonNo]);
    return rows.length ? rows[0] : null;
  };
  return { sqlite, db, flags, freshFlow, draft, progress };
}

const evidence = {
  task: "LANJUT-PILOT-01",
  agent: "1a",
  profile: "data SQLite terisolasi (:memory:), bukan app.lernen.desktop",
  scenarios: {},
};

const ein = { id: "lp-u4-l2-01", picked: "ein", correct: false };
const getrennt = { id: "lp-u4-l2-02", picked: "getrennt", correct: true };
const uniqueIds = (answers) => new Set(answers.map((answer) => answer.id)).size === answers.length;

(async () => {
  // A) Keluar setelah satu jawaban -> buka lagi -> lanjutkan -> selesai.
  {
    const s = makeStorage();
    const flow = s.freshFlow();
    await flow.saveLessonFlowProgress({ unitNo: 4, lessonNo: 2, page: 1, answers: [ein] }, false);
    const before = { draft: s.draft(4, 2), progress: s.progress(4, 2) };
    assert.equal(before.draft.answers.length, 1, "sebelum: satu jawaban tersimpan");
    assert.equal(before.progress, null, "sebelum: belum ada progres final");

    const reopened = s.freshFlow(); // simulasi restart proses/modul
    const mid = await reopened.loadLessonFlowState(4, 2);
    assert.deepEqual(mid.answers, [ein], "jawaban ein terbaca kembali");
    assert.equal(mid.score, null);
    assert.equal(mid.state, null);

    await reopened.saveLessonFlowProgress({ unitNo: 4, lessonNo: 2, page: 2, answers: [ein, getrennt] }, true);
    const after = await s.freshFlow().loadLessonFlowState(4, 2);
    assert.deepEqual(after.answers, [ein, getrennt], "kedua jawaban utuh setelah dilanjutkan");
    assert.equal(uniqueIds(after.answers), true, "tidak ada jawaban ganda");
    assert.equal(after.score, 50, "skor akhir 50");
    assert.equal(after.state, "done");
    evidence.scenarios.exit_mid_lesson = {
      before: { answers: before.draft.answers, score: before.progress?.score ?? null, state: before.progress?.state ?? null },
      after_reopen: { answers: mid.answers, score: mid.score, state: mid.state },
      after_finish: { answers: after.answers, score: after.score, state: after.state, unique_ids: uniqueIds(after.answers) },
    };
    s.sqlite.close();
  }

  // B) Gagal simpan progres saat Selesai -> draft tetap, retry tanpa duplikasi.
  {
    const s = makeStorage();
    const flow = s.freshFlow();
    const payload = { unitNo: 4, lessonNo: 3, page: 2, answers: [ein, getrennt] };
    s.flags.failProgress = true;
    await assert.rejects(() => flow.saveLessonFlowProgress(payload, true), /gagal simpan progres/);
    const draftAfterFailure = s.draft(4, 3).answers;
    const progressAfterFailure = s.progress(4, 3);
    assert.equal(draftAfterFailure.length, 2, "draft tidak hilang saat progres gagal");
    assert.equal(progressAfterFailure, null, "progres tidak ditulis saat gagal");
    await flow.saveLessonFlowProgress(payload, true); // retry
    assert.equal(s.progress(4, 3).state, "done");
    assert.equal(s.progress(4, 3).score, 50);
    const after = await s.freshFlow().loadLessonFlowState(4, 3);
    assert.equal(after.answers.length, 2, "retry tidak menggandakan jawaban");
    assert.equal(uniqueIds(after.answers), true);
    assert.equal(after.score, 50);

    // Varian: gagal saat menulis draft pertama kali.
    s.flags.failDraft = true;
    await assert.rejects(() => flow.saveLessonFlowProgress({
      unitNo: 5, lessonNo: 1, page: 1, answers: [ein],
    }, false), /gagal simpan draft/);
    assert.equal(s.draft(5, 1), null, "draft belum ada setelah gagal");
    await flow.saveLessonFlowProgress({ unitNo: 5, lessonNo: 1, page: 1, answers: [ein] }, false);
    assert.equal(s.draft(5, 1).answers.length, 1);
    evidence.scenarios.failed_save_retry = {
      progress_failure: {
        draft_after_failure: draftAfterFailure,
        progress_after_failure: progressAfterFailure,
        after_retry: { answers: after.answers, score: after.score, unique_ids: uniqueIds(after.answers) },
      },
      draft_failure: {
        draft_after_failure: null,
        draft_after_retry: s.draft(5, 1).answers,
      },
    };
    s.sqlite.close();
  }

  // D) Klik Selesai berulang / retry berulang: idempoten, tanpa duplikasi.
  {
    const s = makeStorage();
    const flow = s.freshFlow();
    const payload = { unitNo: 6, lessonNo: 1, page: 2, answers: [ein, getrennt] };
    await flow.saveLessonFlowProgress(payload, true);
    await flow.saveLessonFlowProgress(payload, true);
    // Klik ulang membawa array lama yang memuat duplikat ein; dedup tetap menang.
    await flow.saveLessonFlowProgress({ ...payload, answers: [ein, getrennt, ein] }, true);
    const final = await s.freshFlow().loadLessonFlowState(6, 1);
    assert.equal(final.answers.length, 2);
    assert.equal(uniqueIds(final.answers), true);
    assert.equal(final.score, 50);
    assert.equal(final.state, "done");
    evidence.scenarios.repeated_finish = {
      clicks: 3,
      answers: final.answers,
      score: final.score,
      state: final.state,
      unique_ids: uniqueIds(final.answers),
    };
    s.sqlite.close();
  }

  // C) Peserta baru: tidak ada progres/jawaban peserta sebelumnya.
  {
    const oldParticipant = makeStorage();
    await oldParticipant.freshFlow().saveLessonFlowProgress({
      unitNo: 4, lessonNo: 2, page: 2, answers: [ein, getrennt],
    }, true);
    assert.equal((await oldParticipant.freshFlow().loadLessonFlowState(4, 2)).score, 50);

    const s = makeStorage(); // akun/profil uji baru, bukan peserta lama
    const fresh = await s.freshFlow().loadLessonFlowState(4, 2);
    assert.equal(fresh, null, "peserta baru membaca null");
    assert.equal(s.draft(4, 2), null);
    assert.equal(s.progress(4, 2), null);

    const jsx = (type, props) => ({ type, props });
    const LessonFlow = marker("LessonFlow");
    const view = load("src/app/routeView.tsx", {
      react: {
        useEffect: () => undefined,
        useRef: (value) => ({ current: value }),
        useState: (initial) => [typeof initial === "function" ? initial() : initial, () => undefined],
      },
      "react/jsx-runtime": { jsx, jsxs: jsx },
      "../klab/routes": {},
      "../klab/pages": {
        TodayPage: marker("TodayPage"), ExplorePage: marker("ExplorePage"),
        NotesPage: marker("NotesPage"), ProfilePage: marker("ProfilePage"),
      },
      "../klab/learning": { LessonFlow, ReadingFlow: marker("ReadingFlow"), CheckpointFlow: marker("CheckpointFlow") },
      "../klab/components/session": { FocusHeader: marker("FocusHeader") },
      "./viewAdapters": {
        agendaFromTargets: () => null,
        agendaRoute: () => ({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2" }),
        CORRECTION_ROUTE: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2" },
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
      "./readingAdapter": {
        readingMeta: () => null,
        loadReadingMode: async () => null,
        saveReadingMode: async () => undefined,
      },
      "../lessons/units": { getUnit: () => ({ unit: 4, lessons: [{ no: 2, title: "Minuman" }] }) },
      "../ui/lessons/LessonRunner": { __esModule: true, default: marker("LessonRunner") },
    });
    const propsOf = (saved) => {
      const element = view.RouteView({
        navigate: () => {}, back: () => {}, targets: [],
        route: { name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "x" },
      });
      const wrapper = element.type({ ...element.props });
      const child = Array.isArray(wrapper.props.children) ? wrapper.props.children[0] : wrapper.props.children;
      return child.props;
    };
    const newProps = propsOf(null);
    assert.ok(!newProps.initialAnswers || newProps.initialAnswers.length === 0, "peserta baru tanpa jawaban");
    assert.equal(newProps.savedScore, null);
    assert.equal(newProps.initialStage, "lesson", "peserta baru mulai dari materi");
    evidence.scenarios.new_participant = {
      old_participant_score: 50,
      load_state: fresh,
      draft: null,
      progress: null,
      lesson_props: {
        initialAnswers: newProps.initialAnswers ?? null,
        savedScore: newProps.savedScore ?? null,
        initialStage: newProps.initialStage,
      },
    };
    s.sqlite.close();
    oldParticipant.sqlite.close();
  }

  evidence.pass = true;
  const outDir = path.resolve("outputs/lanjut-pilot-01");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "agent-1a-storage.json"), JSON.stringify(evidence, null, 2) + "\n", "utf8");
  console.log("LanjutPilotStorage: exit-tengah -> lanjut -> skor 50; gagal simpan -> retry tanpa hilang/ganda; peserta baru bersih.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
