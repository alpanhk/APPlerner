import { useEffect, useState } from "react";
import PageShell from "../PageShell";
import { buildDailyQueue, type DailyQueue } from "../../srs/queue";
import { useSrsSession } from "../../srs/session";
import ReviewCard from "../review/ReviewCard";
import { GRADES, GRADE_LABEL } from "../../srs/fsrs";
import { DRILL_META, type DrillCode } from "../../drills/items";
import { useNav } from "../../stores/nav";
import { CHECKPOINT_LESSON_NO, LEVELS, LEVEL_ORDER, displayUnitNo, getUnit, unitHasContent } from "../../lessons/units";
import getDb from "../../stores/db";

type LessonState = {
  level: string;
  unit: number;
  unitTitle: string;
  nextLessonNo: number | null;
  nextLessonTitle: string | null;
  done: number;
  total: number;
  checkpointReady: boolean;
  checkpointPassed: boolean;
};

type DrillPlan = { code: DrillCode; reason: string };

type Agenda = {
  queue: DailyQueue;
  lesson: LessonState | null;
  reading: { texts: number; read: number };
  drill: DrillPlan;
};

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-line bg-cream px-3 py-2 text-center">
      <div className="font-display text-xl text-gold-deep">{value}</div>
      <div className="text-[11px] text-ink-soft">{label}</div>
    </div>
  );
}

// Rekomendasi drill dari data nyata: jenis dengan rasio salah tertinggi
// (minimal 4 jawaban) — bila belum ada data, pakai D1 sebagai pemanasan.
async function planDrill(ttsReady: boolean): Promise<DrillPlan> {
  const db = await getDb();
  const rows = await db.select<{ drill_code: string; total: number; wrong: number }[]>(
    "SELECT drill_code, COUNT(*) total, COALESCE(SUM(CASE WHEN correct = 0 THEN 1 ELSE 0 END),0) wrong " +
      "FROM attempts WHERE drill_code IS NOT NULL GROUP BY drill_code",
  );
  const stats = new Map(rows.map((r) => [r.drill_code, r]));
  const all: DrillCode[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];
  const candidates = all.filter((c) => ttsReady || c !== "D8");

  let bestCode: DrillCode | null = null;
  let bestRate = -1;
  let bestWrong = 0;
  let bestTotal = 0;
  for (const code of candidates) {
    const s = stats.get(code);
    if (!s || s.total < 4) continue;
    const rate = s.wrong / s.total;
    if (rate > bestRate) {
      bestRate = rate;
      bestCode = code;
      bestWrong = s.wrong;
      bestTotal = s.total;
    }
  }
  if (bestCode) return { code: bestCode, reason: `${bestWrong}/${bestTotal} salah — latih lagi` };

  const untried = candidates.find((c) => !stats.has(c));
  if (untried) return { code: untried, reason: "belum pernah dilatih" };
  return { code: "D1", reason: "pemanasan artikel" };
}

async function planLesson(): Promise<LessonState | null> {
  const db = await getDb();
  const rows = await db.select<
    { unit_no: number; lesson_no: number; state: string; score: number | null }[]
  >("SELECT unit_no, lesson_no, state, score FROM lesson_progress");

  const byUnit = new Map<
    number,
    { lesson_no: number; state: string; score: number | null }[]
  >();
  for (const r of rows) {
    const list = byUnit.get(r.unit_no) ?? [];
    list.push(r);
    byUnit.set(r.unit_no, list);
  }

  const checkpointPassed = (unitNo: number): boolean => {
    const unit = getUnit(unitNo);
    const cp = (byUnit.get(unitNo) ?? []).find((r) => r.lesson_no === CHECKPOINT_LESSON_NO);
    const pass = unit?.checkpoint?.pass ?? 70;
    return !!cp && cp.state === "done" && (cp.score ?? 0) >= pass;
  };

  let last: LessonState | null = null;

  for (const code of LEVEL_ORDER) {
    const units = LEVELS[code].units
      .filter((u) => unitHasContent(u))
      .sort((a, b) => a.unit - b.unit);

    for (let i = 0; i < units.length; i += 1) {
      const unit = units[i];
      const unlocked = i === 0 || checkpointPassed(units[i - 1].unit);
      if (!unlocked) break;

      const doneSet = new Set(
        (byUnit.get(unit.unit) ?? []).filter((r) => r.state === "done").map((r) => r.lesson_no),
      );
      const next = unit.lessons.find((l) => !doneSet.has(l.no)) ?? null;
      const cpDone = checkpointPassed(unit.unit);
      const state: LessonState = {
        level: code,
        unit: unit.unit,
        unitTitle: unit.title,
        nextLessonNo: next?.no ?? null,
        nextLessonTitle: next?.title ?? null,
        done: doneSet.size,
        total: unit.lessons.length,
        checkpointReady: !next && !cpDone,
        checkpointPassed: cpDone,
      };

      // Unit ini masih ada pekerjaan (pelajaran atau checkpoint) → rekomendasikan.
      if (next || !cpDone) return state;
      last = state;
    }
  }

  return last;
}

async function loadAgenda(): Promise<Agenda> {
  const queue = await buildDailyQueue();
  const db = await getDb();
  const [lesson, texts, reads, drill] = await Promise.all([
    planLesson(),
    db.select<{ n: number }[]>("SELECT COUNT(*) n FROM texts WHERE level IN ('A1', 'A2')"),
    db.select<{ n: number }[]>(
      "SELECT COUNT(DISTINCT r.text_id) n FROM reading_log r " +
        "JOIN texts t ON t.id = r.text_id WHERE t.level IN ('A1', 'A2') AND r.words_saved = 0",
    ),
    planDrill(queue.ttsReady),
  ]);
  return {
    queue,
    lesson,
    reading: { texts: texts[0]?.n ?? 0, read: reads[0]?.n ?? 0 },
    drill,
  };
}

export default function HariIni() {
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [refresh, setRefresh] = useState(0);
  const phase = useSrsSession((s) => s.phase);
  const start = useSrsSession((s) => s.start);
  const reset = useSrsSession((s) => s.reset);
  const grades = useSrsSession((s) => s.grades);
  const minutes = useSrsSession((s) => s.minutes);
  const index = useSrsSession((s) => s.index);
  const sessionLen = useSrsSession((s) => s.queue.length);

  const setPage = useNav((s) => s.setPage);
  const startDrill = useNav((s) => s.startDrill);

  useEffect(() => {
    loadAgenda()
      .then(setAgenda)
      .catch((e) => console.error(e));
  }, [refresh]);

  const jam = new Date().getHours();
  const salam = jam < 11 ? "Guten Morgen!" : jam < 18 ? "Guten Tag!" : "Guten Abend!";

  // ---- Mode sesi ----
  if (phase !== "idle") {
    if (phase === "done") {
      const total = grades.again + grades.hard + grades.good + grades.easy;
      return (
        <PageShell title="Sesi Selesai" sub="Ringkasan review SRS hari ini — tersimpan di database." meta="M1 · FSRS">
          <div className="card mx-auto max-w-3xl px-10 py-10 text-center">
            <div className="font-display text-4xl">Sehr gut gemacht!</div>
            <p className="mt-2 text-sm text-ink-soft">
              {total > 0
                ? `${total} review selesai dalam ± ${Math.max(1, minutes)} menit.`
                : "Tidak ada kartu di antrian saat ini."}
            </p>
            <div className="mx-auto mt-6 grid max-w-xl grid-cols-4 gap-2">
              {GRADES.map((g) => (
                <div key={g.key} className="rounded border border-line bg-parchment px-2 py-3">
                  <div className="font-display text-2xl text-gold-deep">{grades[g.key]}</div>
                  <div className="text-xs text-ink-soft">{GRADE_LABEL[g.rating]}</div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs text-ink-soft">
              Kartu yang dinilai <b>Lupa</b> dijadwalkan ulang lebih dekat (FSRS) dan muncul lagi
              di sesi yang sama pada review berikutnya.
            </p>
            <button
              className="btn-gold mt-6"
              onClick={() => {
                reset();
                setRefresh((x) => x + 1);
              }}
            >
              Kembali ke Hari Ini
            </button>
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell title="Review SRS" sub="Jawab dari ingatan — FSRS mengatur jarak pengulangan." meta="M1 · FSRS">
        <div className="mx-auto mb-4 max-w-3xl">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${sessionLen ? Math.min(100, Math.round(((index + 1) / sessionLen) * 100)) : 0}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
            <span>
              Kartu {Math.min(index + 1, sessionLen)} dari {sessionLen}
            </span>
            <button onClick={reset} className="underline hover:text-ink">
              Akhiri sesi
            </button>
          </div>
        </div>
        <ReviewCard />
      </PageShell>
    );
  }

  // ---- Mode ringkasan ----
  const q = agenda?.queue;
  const lesson = agenda?.lesson;
  const drill = agenda?.drill;
  const reading = agenda?.reading;
  const reviewMinutes = q ? Math.max(5, Math.round(q.items.length * 0.35)) : 0;

  const uLabel = lesson ? `Unit ${String(displayUnitNo(lesson.unit)).padStart(2, "0")}` : "Unit";
  const lessonLine = () => {
    if (!lesson) return "Belum ada unit berisi konten.";
    if (lesson.nextLessonNo !== null) {
      return `${lesson.level} · ${uLabel} · Pelajaran ${lesson.nextLessonNo} — ${lesson.nextLessonTitle}`;
    }
    if (lesson.checkpointReady) return `${lesson.level} · ${uLabel} — semua pelajaran selesai, checkpoint siap.`;
    if (lesson.checkpointPassed) {
      return `${lesson.level} · ${uLabel} lulus — lanjut ke unit/level berikutnya yang tersedia.`;
    }
    return `${lesson.level} · ${uLabel}: ${lesson.done}/${lesson.total} pelajaran.`;
  };

  return (
    <PageShell
      title="Hari Ini"
      sub="Prioritas belajar hari ini: otomatis disusun dari SRS, drill, kurikulum, dan bacaan."
      meta={q ? "M3 · data nyata" : "memuat…"}
    >
      {/* Hero */}
      <div className="card flex items-center justify-between gap-6 overflow-hidden px-8 py-6">
        <div className="flex-1">
          <h3 className="font-display text-3xl">{salam}</h3>
          <p className="mt-1 max-w-md text-sm text-ink-soft">
            Belajar bahasa Jerman bisa dimulai dari hal kecil: 15–30 menit per hari, lima hari
            seminggu.
          </p>
          <div className="mt-4 grid max-w-md grid-cols-4 gap-2">
            <StatChip label="jatuh tempo" value={q ? q.dueCount : "…"} />
            <StatChip label="kartu baru" value={q ? q.newCount : "…"} />
            <StatChip label="menit hari ini" value={q ? q.minutesToday : "…"} />
            <StatChip label="streak" value={q ? `${q.streak} hari` : "…"} />
          </div>
          <button
            className="btn-gold mt-5"
            disabled={!q || q.items.length === 0}
            onClick={() => void start()}
          >
            {q && q.items.length > 0
              ? `Mulai sesi belajar · ${q.items.length} kartu`
              : q
                ? "Tidak ada kartu di antrian — sampai jumpa besok"
                : "Menyiapkan antrian…"}
          </button>
        </div>
        <div className="hidden select-none sm:block">
          <span className="font-display text-7xl text-gold/40">A1</span>
        </div>
      </div>

      {/* Agenda */}
      <h4 className="mt-8 font-display text-xl">Agenda belajar hari ini</h4>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="card flex gap-4 px-4 py-3">
          <span className="font-display text-lg text-gold">01</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Kosakata SRS</div>
            <div className="mt-0.5 text-xs text-ink-soft">
              {q
                ? `${q.dueCount} jatuh tempo + ${q.newCount} kartu baru tersedia · antrian ${q.items.length} kartu (±${reviewMinutes} menit)`
                : "Menghitung antrian…"}
            </div>
            {q && !q.ttsReady ? (
              <div className="mt-1 text-[11px] text-rose-700">
                Piper belum aktif — kartu dengar hanya tersedia untuk kata yang memiliki klip bawaan.
                Aktifkan atau pasang Piper di Pengaturan untuk mendengar semua kata.
              </div>
            ) : null}
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-line px-2 py-1 text-[11px] hover:border-gold disabled:opacity-40"
                disabled={!q || q.items.length === 0}
                onClick={() => void start()}
              >
                Mulai review
              </button>
              <button
                className="rounded px-2 py-1 text-[11px] text-ink-soft underline hover:text-ink"
                onClick={() => setPage("kosakata")}
              >
                Kelola deck
              </button>
            </div>
          </div>
          <span className="badge self-start">SRS</span>
        </div>

        <div className="card flex gap-4 px-4 py-3">
          <span className="font-display text-lg text-gold">02</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Drill tata bahasa</div>
            <div className="mt-0.5 text-xs text-ink-soft">
              {drill
                ? `${drill.code} — ${DRILL_META[drill.code].nama} · ${drill.reason}`
                : "Menyusun rekomendasi…"}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-line px-2 py-1 text-[11px] hover:border-gold disabled:opacity-40"
                disabled={!drill}
                onClick={() => drill && startDrill(drill.code)}
              >
                Mulai {drill?.code ?? "drill"}
              </button>
              <button
                className="rounded px-2 py-1 text-[11px] text-ink-soft underline hover:text-ink"
                onClick={() => setPage("drill")}
              >
                Semua D1–D10
              </button>
            </div>
          </div>
          <span className="badge self-start">Drill</span>
        </div>

        <div className="card flex gap-4 px-4 py-3">
          <span className="font-display text-lg text-gold">03</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Pelajaran A1</div>
            <div className="mt-0.5 text-xs text-ink-soft">{lessonLine()}</div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-line px-2 py-1 text-[11px] hover:border-gold"
                onClick={() => setPage("kurikulum")}
              >
                {lesson?.checkpointReady ? "Kerjakan checkpoint" : "Lanjut pelajaran"}
              </button>
            </div>
          </div>
          <span className="badge self-start">F3</span>
        </div>

        <div className="card flex gap-4 px-4 py-3">
          <span className="font-display text-lg text-gold">04</span>
          <div className="flex-1">
            <div className="text-sm font-semibold">Membaca</div>
            <div className="mt-0.5 text-xs text-ink-soft">
              {reading
                ? `${reading.texts - reading.read} teks belum dibaca dari ${reading.texts} teks A1/A2 · TTS + kamus tap`
                : "Memuat perpustakaan…"}
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="rounded border border-line px-2 py-1 text-[11px] hover:border-gold"
                onClick={() => setPage("membaca")}
              >
                Buka perpustakaan
              </button>
            </div>
          </div>
          <span className="badge self-start">F4</span>
        </div>
      </div>

      <p className="mt-6 font-display text-sm italic text-ink-soft">
        &ldquo;Übung macht den Meister.&rdquo; — angka di atas dihitung langsung dari database.
      </p>
    </PageShell>
  );
}
