// Alur pelajaran 5 langkah (F3): recap → mini-lesson → thumb drill → kosakata → review.
import { useEffect, useRef, useState } from "react";
import type { Lesson, Unit } from "../../lessons/units";
import { buildDrillSession, DRILL_META, type DrillItem } from "../../drills/items";
import getDb, { nowIso } from "../../stores/db";
import { speak } from "../../srs/tts";
import MiniDrill from "./MiniDrill";
import { lessonPracticeItems } from "../../lessons/practice";
import { parseDrillDraft, type DrillDraft } from "../../lessons/drillDraft";
import { deleteDraft, loadDraftWithLegacy, saveDraft } from "../../lessons/persistence";

function newSessionId(): string {
  const c = globalThis.crypto;
  try {
    if (c && "randomUUID" in c) return c.randomUUID();
  } catch { /* WebView bisa menolak randomUUID di konteks non-secure */ }
  return `lesson_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

type LessonDraft = {
  step: number;
  slide: number;
  drillScore: { correct: number; total: number } | null;
};

type EntryRow = {
  id: number;
  de: string;
  article: string | null;
  plural: string | null;
  meaning_id: string;
  example_de: string | null;
  example_id: string | null;
};

const STEPS = ["Recap", "Mini-lesson", "Drill", "Kosakata", "Review"];

type Props = {
  unit: Unit;
  lesson: Lesson;
  onExit: () => void;
  onFinished: () => void;
};

export default function LessonRunner({ unit, lesson, onExit, onFinished }: Props) {
  const draftKey = `lernen_lesson_${unit.unit}_${lesson.no}`;
  const drillDraftKey = `${draftKey}_drill`;
  const sessionId = useRef(newSessionId()).current;
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState<LessonDraft | null>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      return saved && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= 4 &&
        Number.isInteger(saved.slide) && saved.slide >= 0 && saved.slide < lesson.slides.length ? saved : null;
    } catch { return null; }
  });
  const initialStep = useRef(draft?.step ?? 0);
  const [step, setStep] = useState<number>(draft?.step ?? 0);
  const [slide, setSlide] = useState<number>(draft?.slide ?? 0);
  const [drillDraft, setDrillDraft] = useState<DrillDraft | null>(() => {
    try { return draft?.step === 2 ? parseDrillDraft(localStorage.getItem(drillDraftKey)) : null; }
    catch { return null; }
  });
  const [drillItems, setDrillItems] = useState<DrillItem[] | null>(drillDraft?.items ?? null);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillScore, setDrillScore] = useState<{ correct: number; total: number } | null>(() => {
    const score = draft?.drillScore;
    return score && Number.isInteger(score.correct) && Number.isInteger(score.total) &&
      score.total > 0 && score.correct >= 0 && score.correct <= score.total ? score : null;
  });
  const [vocab, setVocab] = useState<EntryRow[]>([]);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showTheory, setShowTheory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Migrasi draft lama (localStorage) ke SQLite sekali saat pelajaran dibuka.
  useEffect(() => {
    let alive = true;
    (async () => {
      const saved = await loadDraftWithLegacy<LessonDraft>(draftKey, (raw) => {
        try {
          const value = JSON.parse(raw);
          return value && Number.isInteger(value.step) && value.step >= 0 && value.step <= 4 &&
            Number.isInteger(value.slide) && value.slide >= 0 && value.slide < lesson.slides.length
            ? value as LessonDraft : null;
        } catch { return null; }
      });
      const savedDrill = await loadDraftWithLegacy<DrillDraft>(drillDraftKey, (raw) => parseDrillDraft(raw));
      if (!alive) return;
      if (saved) {
        setDraft(saved);
        setStep(saved.step);
        setSlide(saved.slide);
        setDrillScore(saved.drillScore ?? null);
      }
      if (savedDrill && savedDrill.items.length > 0 && (saved?.step ?? initialStep.current) === 2) {
        setDrillDraft(savedDrill);
        setDrillItems(savedDrill.items);
      }
      setHydrated(true);
    })().catch((e) => {
      console.error("draft load:", e);
      if (alive) setHydrated(true);
    });
    return () => { alive = false; };
  }, [draftKey, drillDraftKey, lesson.slides.length]);

  useEffect(() => {
    if (!hydrated) return;
    const value: LessonDraft = { step, slide, drillScore };
    void saveDraft(draftKey, value).catch((e) => setError(String(e)));
    try { localStorage.setItem(draftKey, JSON.stringify(value)); } catch { /* storage bisa diblokir */ }
  }, [draftKey, step, slide, drillScore, hydrated]);

  const saveDrillDraft = (value: DrillDraft) => {
    setDrillDraft(value);
    void saveDraft(drillDraftKey, value).catch((e) => setError(String(e)));
    try { localStorage.setItem(drillDraftKey, JSON.stringify(value)); }
    catch { setError("Progres latihan belum dapat disimpan di perangkat ini."); }
  };

  // Muat item drill saat langkah 3 dibuka.
  useEffect(() => {
    if (step !== 2 || drillItems !== null || drillLoading) return;
    setDrillLoading(true);
    const isVocabularyDrill = unit.unit < 201 && ["D1", "D2", "D3"].includes(lesson.drill.code);
    const practice = isVocabularyDrill
      ? buildDrillSession(lesson.drill.code, lesson.drill.count, lesson.vocab, true).then(
          (items) => items.length >= 2 ? items : lessonPracticeItems(unit.unit, lesson),
        )
      : Promise.resolve(lessonPracticeItems(unit.unit, lesson));
    practice
      .then((items) => {
        if (items.length) saveDrillDraft({ items, index: 0, correct: null, correctCount: 0 });
        setDrillItems(items);
      })
      .catch((e) => {
        console.error(e);
        setDrillItems([]);
      })
      .finally(() => setDrillLoading(false));
  }, [step, drillItems, drillLoading, lesson.drill.code, lesson.drill.count]);

  // Muat entri kosakata unit dari DB.
  useEffect(() => {
    let alive = true;
    async function load() {
      if (lesson.vocab.length === 0) {
        if (alive) setVocab([]);
        return;
      }
      const db = await getDb();
      const ph = lesson.vocab.map((_, i) => `$${i + 1}`).join(",");
      const rows = await db.select<EntryRow[]>(
        "SELECT id, de, article, plural, meaning_id, example_de, example_id FROM entries " +
          `WHERE de IN (${ph}) ORDER BY id`,
        lesson.vocab,
      );
      if (alive) setVocab(rows);
    }
    load().catch(console.error);
    return () => {
      alive = false;
    };
  }, [lesson]);

  const finish = async () => {
    setSaving(true);
    setError("");
    try {
      const db = await getDb();
      const score =
        drillScore && drillScore.total > 0
          ? Math.round((drillScore.correct / drillScore.total) * 100)
          : null;
      await db.execute(
        "INSERT INTO lesson_progress (unit_no, lesson_no, state, score, finished_at) VALUES ($1,$2,'done',$3,$4) " +
          "ON CONFLICT(unit_no, lesson_no) DO UPDATE SET state='done', score=excluded.score, finished_at=excluded.finished_at",
        [unit.unit, lesson.no, score, nowIso()],
      );
      // Pembersihan draft bersifat best-effort; progres sudah tersimpan.
      try {
        await deleteDraft(draftKey);
        await deleteDraft(drillDraftKey);
      } catch (cleanupError) {
        console.error("hapus draft:", cleanupError);
      }
      localStorage.removeItem(draftKey);
      localStorage.removeItem(drillDraftKey);
      onFinished();
    } catch (e) {
      console.error(e);
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  const currentSlide = lesson.slides[slide];
  const isLastSlide = slide + 1 >= lesson.slides.length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <button className="text-sm text-ink-soft underline hover:text-ink" onClick={onExit}>
          ← {unit.title}
        </button>
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">
          Pelajaran {lesson.no} · ±{lesson.minutes} menit
        </span>
      </div>

      <h2 className="font-display text-3xl">{lesson.title}</h2>

      {/* Indikator 5 langkah */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={
              "rounded-full border px-3 py-1 text-[11px] " +
              (i === step
                ? "border-gold bg-gold/10 text-gold-deep"
                : i < step
                  ? "border-line bg-parchment text-ink-soft"
                  : "border-line-soft text-ink-soft/60")
            }
          >
            {i + 1}. {s}
          </span>
        ))}
      </div>

      <div className="mt-4">
        {/* ---- 1. Recap ---- */}
        {step === 0 && (
          <div className="card px-6 py-6 sm:px-8">
            <div className="text-[11px] uppercase tracking-wide text-gold-deep">Langkah 1 · recap</div>
            <h3 className="mt-1 font-display text-2xl">Apa yang sudah kamu lihat</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-soft">
              {lesson.recap.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-gold" onClick={() => setStep(1)}>
                Mulai mini-lesson
              </button>
              <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={() => setStep(1)}>
                Lewati recap
              </button>
            </div>
          </div>
        )}

        {/* ---- 2. Mini-lesson ---- */}
        {step === 1 && currentSlide && (
          <div className="card px-6 py-6 sm:px-8">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-gold-deep">
              <span>Langkah 2 · mini-lesson</span>
              <span className="text-ink-soft">
                Slide {slide + 1} / {lesson.slides.length}
              </span>
            </div>
            <h3 className="mt-1 font-display text-2xl">{currentSlide.title}</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
              {currentSlide.body.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
            {currentSlide.example_de ? (
              <div className="mt-4 rounded border border-line-soft bg-parchment px-4 py-3">
                <div className="font-display text-lg">{currentSlide.example_de}</div>
                {currentSlide.example_id ? (
                  <div className="mt-1 text-sm text-ink-soft">{currentSlide.example_id}</div>
                ) : null}
                <button className="mt-2 text-xs text-gold-deep" onClick={() => speak(currentSlide.example_de ?? "")}>
                  🔊 Dengarkan
                </button>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment disabled:opacity-40"
                disabled={slide === 0}
                onClick={() => setSlide((s) => s - 1)}
              >
                ← Sebelumnya
              </button>
              <button
                className="btn-gold"
                onClick={() => {
                  if (isLastSlide) setStep(2);
                  else setSlide((s) => s + 1);
                }}
              >
                {isLastSlide ? "Lanjut ke drill" : "Slide berikutnya →"}
              </button>
              <button className="ml-auto text-xs text-ink-soft underline hover:text-ink" onClick={() => setStep(2)}>
                Lewati mini-lesson
              </button>
            </div>
          </div>
        )}

        {/* ---- 3. Thumb drill ---- */}
        {step === 2 && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] uppercase tracking-wide text-gold-deep">
                {drillItems?.[0]?.lessonExample
                  ? "Langkah 3 · pemahaman contoh pelajaran"
                  : drillItems?.[0]?.lessonApplication
                    ? "Langkah 3 · latihan penerapan"
                    : `Langkah 3 · drill ${lesson.drill.code}`}
              </span>
              {!drillItems?.[0]?.lessonExample && <button
                className="text-xs text-ink-soft underline hover:text-ink"
                onClick={() => setShowTheory((v) => !v)}
              >
                {showTheory ? "Tutup teori" : "Kartu Teori"}
              </button>}
            </div>
            {showTheory ? (
              <div className="card-soft mb-3 px-5 py-4 text-sm text-ink-soft">
                <div className="font-display text-base text-ink">{DRILL_META[lesson.drill.code].nama}</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {DRILL_META[lesson.drill.code].teori.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {drillLoading || drillItems === null ? (
              <div className="card px-6 py-8 text-center text-sm text-ink-soft">Menyiapkan drill…</div>
            ) : (
              <>
              {drillItems[0]?.lessonExample && <p className="mb-3 text-xs text-ink-soft">Latihan ini memeriksa arti contoh pelajaran; penguasaan tata bahasa masih perlu latihan tambahan.</p>}
              <MiniDrill
                items={drillItems}
                draft={drillDraft}
                sessionId={sessionId}
                draftKey={drillDraftKey}
                onDraftChange={saveDrillDraft}
                onDone={(correct, total) => {
                  void deleteDraft(drillDraftKey);
                  localStorage.removeItem(drillDraftKey);
                  setDrillScore({ correct, total });
                  setStep(3);
                }}
                onSkip={() => {
                  void deleteDraft(drillDraftKey);
                  localStorage.removeItem(drillDraftKey);
                  setDrillScore(null);
                  setStep(3);
                }}
                doneLabel="Lanjut ke kosakata"
              />
              </>
            )}
          </div>
        )}

        {/* ---- 4. Kosakata ---- */}
        {step === 3 && (
          <div className="card px-6 py-6 sm:px-8">
            <div className="text-[11px] uppercase tracking-wide text-gold-deep">Langkah 4 · kosakata baru</div>
            <h3 className="mt-1 font-display text-2xl">Kata inti pelajaran ini</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Klik kartu untuk membuka arti. Kartu SRS tersedia sesuai data dan audio yang ada.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {vocab.map((w) => {
                const open = revealed.has(w.id);
                return (
                  <button
                    key={w.id}
                    onClick={() =>
                      setRevealed((prev) => {
                        const next = new Set(prev);
                        if (next.has(w.id)) next.delete(w.id);
                        else next.add(w.id);
                        return next;
                      })
                    }
                    className="card-soft px-4 py-3 text-left transition-colors hover:border-gold"
                  >
                    <div className="font-display text-lg">
                      {w.article ? <span className="text-gold-deep">{w.article} </span> : null}
                      {w.de}
                    </div>
                    {open ? (
                      <div className="mt-1 text-sm">
                        <div>{w.meaning_id}</div>
                        {w.plural ? <div className="text-[11px] text-ink-soft">Plural: {w.plural}</div> : null}
                        {w.example_de ? (
                          <div className="mt-1 text-[11px] italic text-ink-soft">{w.example_de}</div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="mt-1 text-[11px] text-ink-soft">klik untuk arti</div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button className="btn-gold" onClick={() => setStep(4)}>
                Lanjut ke review
              </button>
              <span className="text-xs text-ink-soft">
                {revealed.size} / {vocab.length} kata dibuka
              </span>
              <button className="ml-auto text-xs text-ink-soft underline hover:text-ink" onClick={() => setStep(4)}>
                Lewati kosakata
              </button>
            </div>
          </div>
        )}

        {/* ---- 5. Review ---- */}
        {step === 4 && (
          <div className="card px-6 py-6 sm:px-8">
            <div className="text-[11px] uppercase tracking-wide text-gold-deep">Langkah 5 · mini-review</div>
            <h3 className="mt-1 font-display text-2xl">Pelajaran hampir selesai</h3>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <div className="rounded border border-line bg-parchment px-4 py-3 text-center">
                <div className="font-display text-2xl text-gold-deep">
                  {drillScore ? `${drillScore.correct}/${drillScore.total}` : "—"}
                </div>
                <div className="text-xs text-ink-soft">thumb drill</div>
              </div>
              <div className="rounded border border-line bg-parchment px-4 py-3 text-center">
                <div className="font-display text-2xl text-gold-deep">
                  {revealed.size}/{vocab.length}
                </div>
                <div className="text-xs text-ink-soft">kata dibuka</div>
              </div>
              <div className="rounded border border-line bg-parchment px-4 py-3 text-center">
                <div className="font-display text-xl text-gold-deep">Sesuai materi</div>
                <div className="text-xs text-ink-soft">jenis kartu SRS tersedia</div>
              </div>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Kata baru otomatis masuk jadwal SRS. Setelah ini, buka <b>Hari Ini</b> untuk review
              kartu yang jatuh tempo, atau lanjut ke pelajaran berikutnya.
            </p>
            {error ? <p className="mt-2 text-xs text-rose-700">{error}</p> : null}
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-gold" disabled={saving} onClick={() => void finish()}>
                {saving ? "Menyimpan…" : "Selesaikan pelajaran"}
              </button>
              <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={onExit}>
                Kembali tanpa menandai selesai
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
