// Pemetaan Route -> layar produksi KLAB. 4a menyediakan halaman presentasional,
// 2a alur belajar, 1a adapter data/persistensi. Fallback ke runner lama hanya
// bila data/unit di luar cakupan KLAB.
import { useEffect, useState, type ComponentType, type ReactElement } from "react";
import type { Route } from "../klab/routes";
import { TodayPage, ExplorePage, NotesPage, ProfilePage, AssetCollectionPage } from "../klab/pages";
import type { LoadState, PreferencesView } from "../klab/pages/viewModels";
import { LessonFlow, ReadingFlow, CheckpointFlow, CafeConversation, StoryView, type ReadingFlowProps } from "../klab/learning";
import type { Note, Preferences, SaveState } from "../klab/contracts";
import { getUnit } from "../lessons/units";
import LessonRunner from "../ui/lessons/LessonRunner";
import type { ContinueTarget } from "./sessionRegistry";
import {
  agendaFromTargets, agendaRoute, todayQuickLinks, loadProgressModel,
  loadExploreUnits, exploreBooks, explorePracticeLinks, loadVocabulary,
  notesToView, preferencesToView, loadStatsSummary,
  type ProgressModel,
} from "./viewAdapters";
import { FocusHeader } from "../klab/components/session";
import { listNotes, saveNote, removeNote } from "./notesRepository";
import { loadLessonFlowState, saveLessonFlowProgress, saveCheckpointFlowResult } from "./flowPersistence";
import { loadReadingMode, readingMeta, saveReadingMode } from "./readingAdapter";
// StoryView berasal dari 2a (src/klab/learning), bukan placeholder ./novelViews.
import { TitleView, CreateView } from "./novelViews";
import StoryFlowView from "./StoryFlowView";

export type ViewProps = {
  route: Route;
  navigate: (route: Route) => void;
  back: () => void;
  targets: ContinueTarget[];
  legacyPages?: Record<string, ComponentType>;
  refreshTargets?: () => void;
  preferences?: Preferences;
  onPreferenceChange?: (change: Partial<Omit<Preferences, "version">>) => void;
};

type View = ComponentType<ViewProps>;

const tabViews = new Map<string, View>();
const featureViews = new Map<string, View>();

export function registerKlabView(name: "today" | "explore" | "notes" | "profile", view: View): void {
  tabViews.set(name, view);
}
export function registerFeatureView(name: Route["name"], view: View): void {
  featureViews.set(name, view);
}
export function resetViewRegistry(): void {
  tabViews.clear();
  featureViews.clear();
}

// KONF-01: 1a tetap pemilik pendaftaran. Komponen cerita nyata milik 2a
// (StoryView -> StoryFlow -> pilihan/input/koreksi/ResultScreen) dipasang lewat
// host 1a yang menambah panel + fokus balik. Fallback StoryView lama hanya
// dipakai bila registri sengaja dikosongkan (resetViewRegistry).
function StoryHostView(props: ViewProps): ReactElement {
  return <StoryFlowView {...props} storyView={StoryView} />;
}
registerFeatureView("story", StoryHostView);

const TAB_NAMES = ["today", "explore", "notes", "profile"] as const;

// Handoff masuk dari ExplorePage: mode "Baca"/"Dengarkan" belum ada di Route.
let readingEntry: { mode: "read" | "listen"; textId: number; title: string; dialog?: boolean } | null = null;
// INTERAKSI-LERNEN-01: konteks rak saat masuk cuplikan, dipakai saat kembali.
let shelfReturn: { textId: number; scrollY: number } | null = null;

function reloadTargets(refresh?: () => void): void {
  refresh?.();
}

function ProductionToday(props: ViewProps) {
  const { targets, navigate, refreshTargets } = props;
  const [progress, setProgress] = useState<ProgressModel | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const load = () => {
    setLoadState("loading");
    void loadProgressModel().then((model) => { setProgress(model); setLoadState("ready"); })
      .catch(() => setLoadState("failed"));
  };
  useEffect(load, []);
  const agenda = agendaFromTargets(targets);
  return <TodayPage
    loadState={loadState}
    agenda={agenda}
    quickLinks={todayQuickLinks()}
    progress={progress}
    motivation="Belajar sedikit setiap hari lebih baik daripada sekali saja."
    onOpenAgenda={() => navigate(agendaRoute(targets))}
    onOpenQuickLink={(id) => id === "story"
      ? navigate({ name: "title" })
      : id === "drills"
      ? navigate({ name: "drills", code: "D1" })
      : id === "srs"
        ? navigate({ name: "srs", sessionId: "review" })
        : navigate({ name: "explore", section: "reading" })}
    onOpenUnit={(unitNo) => navigate({ name: "unit", unitNo })}
    onRetry={() => { load(); reloadTargets(refreshTargets); }}
  />;
}

function ProductionExplore({ route, navigate }: ViewProps) {
  const section = route.name === "explore" ? route.section : "materials";
  const books = exploreBooks();
  const [units, setUnits] = useState<Awaited<ReturnType<typeof loadExploreUnits>>>([]);
  const [vocabulary, setVocabulary] = useState<Awaited<ReturnType<typeof loadVocabulary>>>([]);
  useEffect(() => {
    void loadExploreUnits().then(setUnits).catch(() => undefined);
    void loadVocabulary().then(setVocabulary).catch(() => undefined);
  }, []);
  // Pulihkan gulir dan fokus kartu asal setelah kembali dari cuplikan.
  useEffect(() => {
    if (section !== "reading" || !shelfReturn) return;
    const target = shelfReturn;
    shelfReturn = null;
    const frame = requestAnimationFrame(() => {
      const card = document.querySelector<HTMLElement>(`[data-text-id="${target.textId}"]`) ??
        document.querySelector<HTMLElement>(`[data-testid="book-card-${target.textId}"]`);
      if (card) {
        card.scrollIntoView({ block: "center" });
        card.focus({ preventScroll: true });
      } else {
        window.scrollTo({ top: target.scrollY, behavior: "instant" });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [section]);
  return <ExplorePage
    section={section}
    loadState="ready"
    units={units}
    books={books}
    vocabulary={vocabulary}
    practiceLinks={explorePracticeLinks()}
    onSectionChange={(next) => navigate({ name: "explore", section: next })}
    onOpenUnit={(unitNo) => navigate({ name: "unit", unitNo })}
    onOpenBook={(id, mode) => {
      const textId = Number(id);
      const book = books.find((item) => item.id === id);
      const resolved = Number.isFinite(textId) && textId > 0 ? textId : 1;
      shelfReturn = { textId: resolved, scrollY: typeof window === "undefined" ? 0 : window.scrollY };
      readingEntry = {
        mode, textId: resolved,
        title: book?.title ?? readingMeta(resolved)?.title ?? "Bacaan",
        // RAK-DIALOG-01: textId 10 (Im Café) membuka panggung dua tokoh,
        // baik lewat "Mulai percakapan" maupun "Dengarkan".
        dialog: resolved === 10,
      };
      void saveReadingMode(mode);
      navigate({ name: "reader", textId: resolved });
    }}
    onOpenPractice={(id) => id === "story"
      ? navigate({ name: "title" })
      : id === "collection"
      ? navigate({ name: "notes", noteId: "collection" })
      : id === "drills" || id === "exam"
        ? navigate(id === "drills" ? { name: "drills" } : { name: "exam" })
        : navigate({ name: "practice", kind: id as "listening", contentId: id, sessionId: `practice:${id}` })}
    onRetry={() => navigate({ name: "explore", section })}
  />;
}

function LessonKlabFlow({ route, back, refreshTargets }: ViewProps) {
  const unitNo = route.name === "lesson" ? route.unitNo : 0;
  const lessonNo = route.name === "lesson" ? route.lessonNo : 0;
  const [saved, setSaved] = useState<Awaited<ReturnType<typeof loadLessonFlowState>>>(null);
  useEffect(() => {
    let active = true;
    void loadLessonFlowState(unitNo, lessonNo)
      .then((value) => { if (active) setSaved(value); })
      .catch(() => { if (active) setSaved(null); });
    return () => { active = false; };
  }, [unitNo, lessonNo]);

  if (route.name !== "lesson") return <div />;
  const unit = getUnit(unitNo);
  if (!unit || !unit.lessons.some((lesson) => lesson.no === lessonNo)) {
    return <LessonRunnerFallback route={route} back={back} />;
  }
  const state = saved ?? { answers: [], step: 0, score: null, state: null };
  // Ringkasan "Progres tersimpan" (jawaban + skor) dirender LessonFlow 2a dari
  // initialAnswers/savedScore; belum ada banner duplikat di sisi integrasi.
  return <div className="klab-stack">
    <LessonFlow
      unitNo={unitNo}
      lessonNo={lessonNo}
      // Peserta yang keluar setelah satu jawaban kembali ke tahap latihan,
      // bukan ke slide materi; peserta baru tetap mulai dari materi.
      initialPage={Math.min(state.step, Math.max(0, (unit.lessons.find((l) => l.no === lessonNo)?.slides?.length ?? 1) - 1))}
      initialStage={saved?.stage ??
        (state.answers.length > 0 && state.state !== "done" ? "order" : "lesson")}
      initialAnswers={state.answers}
      savedScore={state.score}
      onBack={back}
      onProgress={(progress) => {
        void saveLessonFlowProgress(progress, false).then(() => reloadTargets(refreshTargets)).catch(() => undefined);
      }}
      onFinish={async (progress) => {
        // Jangan telan error: LessonFlow menampilkan alert dan mengizinkan retry.
        await saveLessonFlowProgress(progress, true);
        const fresh = await loadLessonFlowState(progress.unitNo, progress.lessonNo);
        setSaved(fresh);
        reloadTargets(refreshTargets);
      }}
    />
  </div>;
}

function LessonRunnerFallback({ route, back }: { route: Extract<Route, { name: "lesson" }> ; back: () => void }) {
  const unit = getUnit(route.unitNo);
  const lesson = unit?.lessons.find((item) => item.no === route.lessonNo);
  return unit && lesson
    ? <LessonRunner unit={unit} lesson={lesson} onExit={back} onFinished={back} />
    : <section className="klab-panel"><p>Materi tidak tersedia. Kembali ke Kurikulum.</p></section>;
}

// 2a akan menambah initialView/autoPlay; cast menjaga kompatibilitas sebelum
// properti tersebut tersedia tanpa menulis properti fiktif ke komponen lama.
const ReadingFlowWithEntry = ReadingFlow as ComponentType<ReadingFlowProps & {
  initialView?: "shelf" | "preview" | "reader";
  autoPlay?: boolean;
}>;

function ReadingKlabFlow({ route, back, navigate }: ViewProps) {
  const entry = readingEntry;
  readingEntry = null;
  const textId = entry?.textId ?? (route.name === "reader" ? route.textId : 1);
  // Judul dan level diambil dari textId nyata, bukan dari handoff sesi atau
  // nilai tetap "Im Café": rute langsung/setelah restart tetap membuka buku
  // yang diminta.
  const meta = readingMeta(textId);
  const wantsDialog = Boolean(entry?.dialog) || textId === 10;
  const [mode, setMode] = useState<"read" | "listen" | null>(entry?.mode ?? null);
  const leave = () => {
    if (shelfReturn) shelfReturn.scrollY = typeof window === "undefined" ? shelfReturn.scrollY : window.scrollY;
    back();
  };
  useEffect(() => {
    let active = true;
    if (entry) {
      void saveReadingMode(entry.mode);
    } else {
      void loadReadingMode().then((saved) => { if (active) setMode(saved); }).catch(() => undefined);
    }
    return () => { active = false; };
  }, [textId]);
  if (wantsDialog) {
    return <CafeConversation
      onBack={leave}
      autoPlay={mode === "listen"}
      onStartTask={() => navigate({ name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "cafe-task" })}
    />;
  }
  return <ReadingFlowWithEntry
    textId={textId}
    title={entry?.title ?? meta?.title ?? "Bacaan"}
    initialView={entry || meta ? "reader" : "shelf"}
    autoPlay={mode === "listen"}
    onBack={leave}
  />;
}

function CheckpointKlabFlow({ route, back, refreshTargets }: ViewProps) {
  if (route.name !== "checkpoint") return <div />;
  if (!getUnit(route.unitNo)) {
    return <section className="klab-panel"><p>Unit tidak tersedia. Kembali ke Kurikulum.</p></section>;
  }
  return <CheckpointFlow
    unitNo={route.unitNo}
    onBack={back}
    onComplete={(result) => {
      void saveCheckpointFlowResult(result).then(() => reloadTargets(refreshTargets)).catch(() => undefined);
    }}
  />;
}

function ProductionNotes(_props: ViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState({ title: "", body: "" });
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [saveState, setSaveState] = useState<SaveState>("clean");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const load = () => {
    setLoadState("loading");
    void listNotes()
      .then((items) => { setNotes(items); setLoadState("ready"); })
      .catch(() => setLoadState("failed"));
  };
  useEffect(load, []);
  const selected = notes.find((note) => note.id === selectedId);
  const save = async () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    setSaveState("saving");
    try {
      const note: Note = {
        id: selected?.id ?? `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        revision: selected?.revision ?? 0,
        title: draft.title,
        body: draft.body,
        anchor: selected?.anchor ?? null,
        color: selected?.color ?? null,
        updatedAt: new Date().toISOString(),
      };
      const saved = await saveNote(note, note.revision);
      setSelectedId(saved.id);
      setSaveState("saved");
      load();
    } catch { setSaveState("failed"); }
  };
  // U-05: EmptyState 4a muncul bila notes kosong. "Buat catatan" harus langsung
  // menghadirkan editor, jadi kita tambahkan note lokal belum tersimpan ke state
  // (bukan menulis SQLite sebelum pengguna menekan Simpan).
  const newNote = () => {
    const id = `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fresh: Note = {
      id, revision: 0, title: "", body: "", anchor: null, color: null,
      updatedAt: new Date().toISOString(),
    };
    setNotes((current) => [fresh, ...current.filter((note) => note.id !== id)]);
    setSelectedId(id);
    setDraft({ title: "", body: "" });
    setSaveState("clean");
  };
  const select = (id: string) => {
    const note = notes.find((item) => item.id === id);
    setSelectedId(id);
    setDraft(note ? { title: note.title, body: note.body } : { title: "", body: "" });
    setSaveState("clean");
  };
  return <NotesPage
    loadState={loadState}
    notes={notesToView(notes)}
    selectedId={selectedId}
    draft={{ ...draft, saveState }}
    onSelect={select}
    onDraftChange={(change) => { setDraft((value) => ({ ...value, ...change })); setSaveState("dirty"); }}
    onSave={() => { void save(); }}
    onNew={newNote}
    onDelete={selected ? (id) => {
      void removeNote(id, selected.revision).then(() => { newNote(); load(); }).catch(() => setSaveState("failed"));
    } : undefined}
    onRetry={() => { load(); setSaveState("clean"); }}
  />;
}

function ProductionProfile({ route, navigate, preferences, onPreferenceChange }: ViewProps) {
  const section = route.name === "profile" ? route.section : "overview";
  const [stats, setStats] = useState<Awaited<ReturnType<typeof loadStatsSummary>> | undefined>(undefined);
  useEffect(() => { void loadStatsSummary().then(setStats).catch(() => undefined); }, [section]);
  const view: PreferencesView | undefined = preferences ? preferencesToView(preferences) : undefined;
  return <ProfilePage
    section={section}
    loadState="ready"
    preferences={view}
    stats={stats}
    onSectionChange={(next) => navigate({ name: "profile", section: next })}
    onPreferenceChange={(change) => onPreferenceChange?.(change)}
    onOpenRecovery={() => navigate({ name: "profile", section: "settings" })}
    onOpenLegacyTool={(id) => navigate(id === "backup" || id === "restore"
      ? { name: "profile", section: "settings" }
      : { name: "profile", section: "settings" })}
    onRetry={() => navigate({ name: "profile", section })}
  />;
}

function UnitDetailKlab({ route, navigate, back }: ViewProps) {
  if (route.name !== "unit") return <div />;
  const unit = getUnit(route.unitNo);
  if (!unit) return <section className="klab-panel"><p>Unit tidak tersedia. Kembali ke Jelajah.</p></section>;
  return <div className="klab-stack">
    <FocusHeader breadcrumb={<span>Kurikulum · Unit {unit.unit}</span>} onBack={back} />
    <h1 className="klab-heading">{unit.title}</h1>
    <p className="klab-muted">{unit.lessons.length} pelajaran tersedia.</p>
    <section className="klab-panel klab-stack">
      {unit.lessons.map((lesson) => <button
        key={lesson.no}
        className="klab-row"
        onClick={() => navigate({
          name: "lesson", unitNo: unit.unit, lessonNo: lesson.no,
          sessionId: `unit-${unit.unit}-lesson-${lesson.no}`,
        })}
      ><strong>Pelajaran {lesson.no}</strong><span>{lesson.title}</span></button>)}
    </section>
    <button
      className="klab-button"
      onClick={() => navigate({ name: "checkpoint", unitNo: unit.unit, sessionId: `unit-${unit.unit}-checkpoint` })}
    >Checkpoint Unit {unit.unit}</button>
  </div>;
}

function LegacyTools({ back, legacyPages }: ViewProps) {
  const Page = legacyPages?.["pengaturan"];
  return <div className="klab-stack">
    <FocusHeader breadcrumb={<span>Profil · Pemulihan & peralatan lama</span>} onBack={back} />
    {Page ? <Page /> : <section className="klab-panel"><p>Pengaturan lama tidak tersedia.</p></section>}
  </div>;
}

function LegacyFeature({ route, legacyPages }: ViewProps) {
  const renderPage = (page: string) => {
    const Page = legacyPages?.[page];
    return Page ? <Page /> : <section className="klab-panel"><p>Halaman lama tidak tersedia: {page}.</p></section>;
  };
  if (route.name === "unit") return renderPage("kurikulum");
  if (route.name === "srs" || route.name === "today") return renderPage("hari-ini");
  if (route.name === "drills") return renderPage("drill");
  if (route.name === "practice") return renderPage("latihan");
  if (route.name === "exam") return renderPage("uji-a1");
  if (route.name === "profile" && route.section === "stats") return renderPage("statistik");
  if (route.name === "profile" && route.section === "settings") return renderPage("pengaturan");
  if (route.name === "explore" && route.section === "vocabulary") return renderPage("kosakata");
  if (route.name === "explore" && route.section === "reading") return renderPage("membaca");
  if (route.name === "explore" && route.section === "practice") return renderPage("latihan");
  return renderPage("kurikulum");
}

export function RouteView(props: ViewProps): ReactElement {
  const { route } = props;
  const feature = featureViews.get(route.name);
  if (feature) {
    const ViewComponent = feature;
    return <ViewComponent {...props} />;
  }
  // ROMBAK UI/UX: rute baru title/create/story. 4a/2a dapat mengganti view
  // default ini lewat registerFeatureView tanpa menyunting file 1a.
  if (route.name === "title") return <TitleView {...props} />;
  if (route.name === "create") return <CreateView {...props} />;
  if (route.name === "story") return <StoryHostView {...props} />;
  if (route.name === "lesson") return <LessonKlabFlow {...props} />;
  if (route.name === "reader") return <ReadingKlabFlow {...props} />;
  if (route.name === "checkpoint") return <CheckpointKlabFlow {...props} />;
  if (route.name === "unit") return <UnitDetailKlab {...props} />;
  if (route.name === "profile" && (route.section === "recovery" || route.section === "legacy-tools")) {
    return <LegacyTools {...props} />;
  }
  // RAK-DIALOG-02: koleksi aset dijangkau lewat rute notes?noteId=collection,
  // tidak mengubah empat tab dan tidak menyunting file 4a.
  if (route.name === "notes" && route.noteId === "collection") {
    return <AssetCollectionPage onBack={props.back} />;
  }
  if (route.name === "notes") {
    const Registered = tabViews.get("notes");
    return Registered ? <Registered {...props} /> : <ProductionNotes {...props} />;
  }
  if ((TAB_NAMES as readonly string[]).includes(route.name)) {
    const tab = route.name as (typeof TAB_NAMES)[number];
    const registered = tabViews.get(tab);
    if (registered) {
      const ViewComponent = registered;
      return <ViewComponent {...props} />;
    }
    if (tab === "today") return <ProductionToday {...props} />;
    if (tab === "explore") return <ProductionExplore {...props} />;
    if (tab === "profile") return <ProductionProfile {...props} />;
    return <ProductionNotes {...props} />;
  }
  return <LegacyFeature {...props} />;
}
