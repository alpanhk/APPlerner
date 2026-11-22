// Adapter presentasi: data nyata -> view model 4a. Tidak ada angka/status fiktif.
import getDb from "../stores/db";
import { UNITS_ALL, type Unit } from "../lessons/units";
import { allReadings } from "../klab/learning/logic";
import type {
  AgendaCardData, QuickLinkData, UnitItemData, BookItemData, PracticeLinkData,
  StatsSummary, NoteItemData, PreferencesView,
} from "../klab/pages/viewModels";
import type { Note, Preferences } from "../klab/contracts";
import type { Route } from "../klab/routes";
import type { ContinueTarget } from "./sessionRegistry";
import { coverSrc } from "./mediaResolver";

export type ProgressModel = { title: string; done: number; total: number; units: UnitItemData[] };

// A1 Unit 4 Pelajaran 2 adalah pintu koreksi yang dijanjikan mandat Putaran 2.
// Tetap ditawarkan walau draft teratas milik unit lain.
export const CORRECTION_ROUTE: Route = {
  name: "lesson", unitNo: 4, lessonNo: 2, sessionId: "klab-u4l2",
};
// Satu CTA Hari Ini. Tanpa draft, membuka pembuka A1 U4 L2 yang sudah diuji;
// dengan draft, CTA memakai posisi nyata dari lesson_drafts/lesson_progress.
const CAFE_AGENDA: AgendaCardData = {
  eyebrow: "A1 · Pelajaran 2",
  title: "Memesan minuman di kafe",
  subtitle: "Dengarkan percakapan singkat dan coba pesan minuman dalam bahasa Jerman.",
  actionLabel: "Mulai pelajaran",
  meta: "Lanjutkan belajar",
};

function activeLesson(targets: ContinueTarget[]): ContinueTarget | undefined {
  return targets.find((target) => target.route.name === "lesson");
}

export function agendaFromTargets(targets: ContinueTarget[]): AgendaCardData {
  const target = activeLesson(targets);
  if (!target) return CAFE_AGENDA;
  const route = target.route;
  if (route.name !== "lesson") return CAFE_AGENDA;
  const unit = UNITS_ALL.find((entry) => entry.unit === route.unitNo);
  const cafe = route.unitNo === 4 && route.lessonNo === 2;
  return {
    eyebrow: unit ? `${levelOf(unit)} · Pelajaran ${route.lessonNo}` : "A1",
    title: cafe ? CAFE_AGENDA.title
      : unit?.lessons.find((lesson) => lesson.no === route.lessonNo)?.title ?? target.label,
    subtitle: target.detail,
    actionLabel: "Lanjutkan",
    meta: "Lanjutkan belajar",
  };
}

export function agendaRoute(targets: ContinueTarget[]): Route {
  const target = activeLesson(targets);
  return target ? target.route : CORRECTION_ROUTE;
}

export function todayQuickLinks(): QuickLinkData[] {
  // U-17: tautan inti HARUS sama pada semua varian Hari Ini ( ada agenda atau
  // tidak ), sehingga tombol seperti "Mulai D1" tidak pernah hilang.
  return [
    { id: "drills", label: "Mulai D1 (Drill)", icon: "play", meta: "Artikel der/die/das" },
    { id: "srs", label: "Ulangi kosakata (SRS)", icon: "book", meta: "Menunggu antrean" },
    { id: "reading", label: "Baca & dengarkan", icon: "book", meta: "Rak Im Café" },
    // ROMBAK UI/UX: pintu masuk cerita bergambar, label awam tanpa jargon.
    { id: "story", label: "Cerita · Novel Visual", icon: "book", meta: "Alur cerita bergambar" },
  ];
}

function levelOf(unit: Unit): string {
  return unit.unit >= 301 ? "B2" : unit.unit >= 201 ? "B1" : unit.unit >= 101 ? "A2" : "A1";
}

async function loadDoneUnits(): Promise<Set<number>> {
  try {
    const db = await getDb();
    const rows = await db.select<{ unit_no: number }[]>(
      "SELECT DISTINCT unit_no FROM lesson_progress WHERE state = 'done'",
    );
    return new Set(rows.map((row) => row.unit_no));
  } catch { return new Set(); }
}

function toUnitItems(done: Set<number>): UnitItemData[] {
  return UNITS_ALL.map((unit) => ({
    unitNo: unit.unit,
    title: unit.title,
    meta: levelOf(unit),
    status: done.has(unit.unit) ? "done" : "available",
  }));
}

export async function loadProgressModel(): Promise<ProgressModel> {
  const done = await loadDoneUnits();
  const units = toUnitItems(done);
  return {
    title: "Buku belajarku",
    done: units.filter((unit) => unit.status === "done").length,
    total: units.length,
    units,
  };
}

// 42 unit dari UNITS_ALL (A1 1-12, A2 101-110, B1 201-210, B2 301-310).
export async function loadExploreUnits(): Promise<UnitItemData[]> {
  return toUnitItems(await loadDoneUnits());
}

// 67 teks bacaan A1-B2 dari 2a logic; Im Café menjadi unggulan pertama agar
// alur rak -> cuplikan -> baca/dengar tetap instan.
export function exploreBooks(): BookItemData[] {
  const readings = allReadings();
  const featured = readings.find((reading) => /im café/i.test(reading.title));
  const ordered = featured
    ? [featured, ...readings.filter((reading) => reading.textId !== featured.textId)]
    : readings;
  return ordered.map((reading) => ({
    id: String(reading.textId),
    title: reading.title,
    meta: `${reading.level} · Bacaan`,
    label: `${reading.level} · ${reading.tags || "Bacaan"}`,
    lead: reading.sentences[0]?.de,
    // Satu resolver media untuk rak: sampul sama dengan cuplikan/Stage/Koleksi.
    image: coverSrc(reading.textId),
  }));
}

// Kosakata nyata dari SQLite: entries (kata + arti) dan jatuh tempo SRS.
export async function loadVocabulary(): Promise<Array<{ word: string; translation: string; due?: number }>> {
  const db = await getDb();
  const rows = await db.select<{ de: string; meaning_id: string; article: string | null; due: number }[]>(
    "SELECT e.de,e.meaning_id,e.article," +
      " SUM(CASE WHEN s.due IS NOT NULL AND s.due <= $1 THEN 1 ELSE 0 END) AS due" +
      " FROM entries e LEFT JOIN cards c ON c.entry_id = e.id" +
      " LEFT JOIN srs_state s ON s.card_id = c.id" +
      " WHERE e.de IS NOT NULL AND e.de <> '' GROUP BY e.id ORDER BY e.de",
    [new Date().toISOString()],
  );
  return rows.map((row) => ({
    word: row.article ? `${row.article} ${row.de}` : row.de,
    translation: row.meaning_id,
    due: Number(row.due) || 0,
  }));
}

export function explorePracticeLinks(): PracticeLinkData[] {
  return [
    { id: "listening", label: "Mendengar" },
    { id: "writing", label: "Menulis" },
    { id: "conversation", label: "Percakapan bercabang" },
    { id: "drills", label: "Drill D1–D10" },
    { id: "exam", label: "Uji Tiruan A1" },
    { id: "collection", label: "Koleksi aset", meta: "Pratinjau media" },
    { id: "story", label: "Cerita · Novel Visual", meta: "Alur cerita bergambar" },
  ];
}

export function notesToView(notes: Note[]): NoteItemData[] {
  return notes.map((note) => ({
    id: note.id,
    title: note.title,
    body: note.body,
    updatedAt: note.updatedAt,
    color: note.color ?? null,
    sourceLabel: note.anchor ? "Bagian sumber tersimpan" : "Catatan bebas",
    orphaned: note.anchor === null && /berubah/i.test(note.title),
  }));
}

export function preferencesToView(preferences: Preferences): PreferencesView {
  const { version: _version, ...view } = preferences;
  return view;
}

export async function loadStatsSummary(): Promise<StatsSummary> {
  try {
    const db = await getDb();
    const cards = await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM cards");
    const lessons = await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM lesson_progress WHERE state = 'done'");
    return {
      cardsReviewed: cards[0]?.n,
      lessonsCompleted: lessons[0]?.n,
      note: "Angka di atas adalah data tersimpan di perangkat, bukan penilaian kemampuan.",
    };
  } catch { return { note: "Statistik belum dapat dibaca dari perangkat." }; }
}
