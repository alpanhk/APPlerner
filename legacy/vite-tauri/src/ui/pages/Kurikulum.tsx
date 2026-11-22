// Kurikulum (F3): peta 12 unit A1 → detail unit → 5 langkah pelajaran → checkpoint.
import { useCallback, useEffect, useState } from "react";
import PageShell from "../PageShell";
import getDb from "../../stores/db";
import {
  CHECKPOINT_LESSON_NO,
  LEVELS,
  LEVEL_ORDER,
  displayUnitNo,
  getUnit,
  totalLessons,
  unitHasContent,
  type LevelCode,
  type Unit,
} from "../../lessons/units";
import LessonRunner from "../lessons/LessonRunner";
import CheckpointRunner from "../lessons/CheckpointRunner";
import { lessonExamples } from "../../lessons/practice";
import {
  A1_OBJECTIVES_NOTE,
  A1_OBJECTIVES_REVIEWED,
  objectivePolicy,
  objectiveReadiness,
  objectivesOfUnit,
} from "../../lessons/objectives";

type ProgressRow = { unit_no: number; lesson_no: number; state: string; score: number | null };

type View =
  | { kind: "map" }
  | { kind: "unit"; unitNo: number }
  | { kind: "lesson"; unitNo: number; lessonNo: number }
  | { kind: "checkpoint"; unitNo: number };

export default function Kurikulum() {
  const [view, setView] = useState<View>({ kind: "map" });
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [level, setLevel] = useState<LevelCode>("A1");

  const loadProgress = useCallback(async () => {
    const db = await getDb();
    const rows = await db.select<ProgressRow[]>(
      "SELECT unit_no, lesson_no, state, score FROM lesson_progress",
    );
    setProgress(rows);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadProgress().catch(console.error);
  }, [loadProgress]);

  const lessonDone = (unitNo: number, lessonNo: number) =>
    progress.some(
      (r) => r.unit_no === unitNo && r.lesson_no === lessonNo && r.state === "done",
    );

  const checkpointRow = (unitNo: number) =>
    progress.find((r) => r.unit_no === unitNo && r.lesson_no === CHECKPOINT_LESSON_NO);

  const checkpointPassed = (unitNo: number) => {
    const cp = checkpointRow(unitNo);
    const pass = getUnit(unitNo)?.checkpoint?.pass ?? 70;
    return !!cp && cp.state === "done" && (cp.score ?? 0) >= pass;
  };

  const unitUnlocked = (u: Unit) => {
    const units = LEVELS[level].units;
    const idx = units.findIndex((x) => x.unit === u.unit);
    if (idx <= 0) return true;
    return checkpointPassed(units[idx - 1].unit);
  };

  const doneInUnit = (u: Unit) => u.lessons.filter((l) => lessonDone(u.unit, l.no)).length;

  // ---- Runner: pelajaran ----
  if (view.kind === "lesson") {
    const unit = getUnit(view.unitNo);
    const lesson = unit?.lessons.find((l) => l.no === view.lessonNo);
    if (unit && lesson) {
      return (
        <PageShell title="Pelajaran" sub={`Unit ${unit.unit} — ${unit.title}`} meta="M2 · F3">
          <LessonRunner
            unit={unit}
            lesson={lesson}
            onExit={() => setView({ kind: "unit", unitNo: unit.unit })}
            onFinished={() => {
              void loadProgress();
              setView({ kind: "unit", unitNo: unit.unit });
            }}
          />
        </PageShell>
      );
    }
  }

  // ---- Runner: checkpoint ----
  if (view.kind === "checkpoint") {
    const unit = getUnit(view.unitNo);
    if (unit?.checkpoint) {
      return (
        <PageShell title="Checkpoint" sub={`Unit ${unit.unit} — ${unit.title}`} meta="M2 · F3">
          <CheckpointRunner
            unit={unit}
            onExit={() => setView({ kind: "unit", unitNo: unit.unit })}
            onProgress={() => void loadProgress()}
            onReviewObjective={(objective) => {
              const lessonNo = objective.lessonNos[0];
              if (lessonNo) setView({ kind: "lesson", unitNo: unit.unit, lessonNo });
            }}
          />
        </PageShell>
      );
    }
  }

  // ---- Detail unit ----
  if (view.kind === "unit") {
    const unit = getUnit(view.unitNo);
    if (!unit) {
      return (
        <PageShell title="Kurikulum" sub="Unit tidak ditemukan." meta="M2 · F3">
          <button className="btn-gold" onClick={() => setView({ kind: "map" })}>
            ← Kembali ke peta
          </button>
        </PageShell>
      );
    }
    const done = doneInUnit(unit);
    const total = totalLessons(unit);
    const cp = checkpointRow(unit.unit);
    const passed = checkpointPassed(unit.unit);
    const allDone = total > 0 && done === total;
    const objectives = objectivesOfUnit(unit.unit);
    const policy = objectivePolicy(unit.unit);
    const readiness = objectiveReadiness(unit.unit);
    const bankBlocked = policy !== undefined && readiness.status === "insufficient";
    const checkpointCount = policy
      ? objectives.length * policy.itemsPerObjective
      : unit.checkpoint?.count ?? 15;

    return (
      <PageShell
        title={`${level} · Unit ${String(displayUnitNo(unit.unit)).padStart(2, "0")} — ${unit.title}`}
        sub={unit.goals.length > 0 ? unit.goals.join(" · ") : "Konten unit ini menyusul."}
        meta="M2 · F3"
      >
        <button
          className="text-sm text-ink-soft underline hover:text-ink"
          onClick={() => setView({ kind: "map" })}
        >
          ← Peta kurikulum
        </button>

        {!unitHasContent(unit) ? (
          <div className="card mt-4 px-6 py-8 text-sm text-ink-soft">
            Unit {displayUnitNo(unit.unit)} belum memiliki konten. Materi akan disusun dari buku di folder{" "}
            <b>Modul belajar</b> setelah unduhan lengkap — mesin pelajaran sudah siap menerima
            kontennya.
          </div>
        ) : (
          <>
            <div className="card mt-4 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <b>{done}</b> dari <b>{total}</b> pelajaran selesai
                </div>
                <div className="text-xs text-ink-soft">
                  Checkpoint:{" "}
                  {cp
                    ? `${cp.score ?? 0}% ${passed ? "· lulus" : "· belum lulus"}`
                    : "belum dikerjakan"}
                </div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-line-soft">
                <div
                  className="h-full bg-gold transition-all"
                  style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }}
                />
              </div>
            </div>

            {objectives.length > 0 ? (
              <div className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-xl">Tujuan unit</h3>
                  <span className="badge">{objectives.length} tujuan</span>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  {A1_OBJECTIVES_REVIEWED
                    ? "Inventaris tujuan sudah ditinjau pengajar."
                    : "Inventaris tujuan belum ditinjau pengajar; ketepatan bahasa masih perlu diperiksa."}{" "}
                  {A1_OBJECTIVES_NOTE}
                </p>
                <div className="mt-3 grid gap-2">
                  {objectives.map((objective) => (
                    <div key={objective.id} className="card-soft px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="badge">
                          {objective.coverage === "covered" ? "Tercakup" : "Sebagian"}
                        </span>
                        <span className="badge">
                          {objective.review === "reviewed" ? "Ditinjau" : "Belum ditinjau"}
                        </span>
                        <span className="text-[11px] text-ink-soft">
                          Pelajaran {objective.lessonNos.join(", ")}
                        </span>
                      </div>
                      <div className="mt-1 font-display text-base">{objective.title}</div>
                      <div className="mt-0.5 text-sm text-ink-soft">{objective.canDo}</div>
                      <div className="mt-1 text-[11px] text-ink-soft">
                        Prasyarat:{" "}
                        {objective.prerequisites.length > 0
                          ? objective.prerequisites.join(", ")
                          : "tidak ada"}{" "}
                        · Remedial tersedia bila tujuan belum lulus
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <h3 className="mt-6 font-display text-xl">Pelajaran</h3>
            <div className="mt-3 space-y-2">
              {unit.lessons.map((l) => {
                const isDone = lessonDone(unit.unit, l.no);
                return (
                  <div key={l.no} className="card flex flex-wrap items-center gap-4 px-5 py-3">
                    <span className="font-display text-xl text-gold-deep">
                      {String(l.no).padStart(2, "0")}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{l.title}</div>
                      <div className="text-[11px] text-ink-soft">
                        ±{l.minutes} menit · {l.slides.length} slide · drill {l.drill.code} ·{" "}
                        {l.vocab.length} kata
                      </div>
                    </div>
                    <span className={"badge " + (isDone ? "bg-emerald-50 text-emerald-700" : "")}>
                      {isDone ? "Selesai" : "Tersedia"}
                    </span>
                    <button
                      className="btn-gold"
                      onClick={() =>
                        setView({ kind: "lesson", unitNo: unit.unit, lessonNo: l.no })
                      }
                    >
                      {isDone ? "Ulangi" : "Mulai"}
                    </button>
                  </div>
                );
              })}
            </div>

            <h3 className="mt-6 font-display text-xl">Checkpoint unit</h3>
            <div className="card mt-3 flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {policy
                    ? `${checkpointCount} item · ${policy.itemsPerObjective} soal baru per tujuan · lulus ≥${policy.pass}% dan ≥${policy.perObjectiveMin}/${policy.itemsPerObjective} per tujuan`
                    : `${unit.unit < 201 ? "Hingga " : ""}${unit.unit >= 201 ? unit.lessons.flatMap((lesson) => lessonExamples(lesson)).slice(0, unit.checkpoint?.count ?? 15).length : unit.checkpoint?.count ?? 15} item ${unit.unit >= 201 ? "pemahaman contoh" : "campuran"} · lulus ≥${unit.checkpoint?.pass ?? 70}%`}
                </div>
                <div className="mt-0.5 text-[11px] text-ink-soft">
                  {bankBlocked
                    ? `Bank soal belum siap: ${readiness.missing.map((entry) => `${entry.objectiveId} ${entry.have}/${entry.need}`).join(", ")}. Checkpoint tidak dapat dimulai dan tidak menghasilkan bukti penguasaan.`
                    : passed
                      ? "Checkpoint sudah lulus — bisa diulang untuk latihan."
                      : allDone
                        ? policy
                          ? `Semua pelajaran selesai. Checkpoint menilai ${objectives.length} tujuan; hasil per tujuan ditampilkan.`
                          : "Semua pelajaran selesai. Kamu siap mencoba checkpoint."
                        : `Selesaikan dulu semua pelajaran (${done}/${total}).`}
                </div>
              </div>
              <button
                className="btn-gold"
                disabled={!allDone || !unit.checkpoint || bankBlocked}
                onClick={() => setView({ kind: "checkpoint", unitNo: unit.unit })}
              >
                {bankBlocked ? "Bank soal belum siap" : passed ? "Ulangi checkpoint" : "Mulai checkpoint"}
              </button>
            </div>
          </>
        )}
      </PageShell>
    );
  }

  // ---- Peta kurikulum ----
  const levelUnits = LEVELS[level].units;
  const totalLevel = levelUnits.reduce((n, u) => n + totalLessons(u), 0);
  const doneLevel = levelUnits.reduce((n, u) => n + doneInUnit(u), 0);
  const contentUnits = levelUnits.filter(unitHasContent).length;

  return (
    <PageShell
      title="Kurikulum"
      sub="Pelajaran dikelompokkan menurut tingkat A1–B2. Latihan dan checkpoint bukan ujian sertifikasi CEFR."
      meta={loaded ? "data nyata" : "memuat…"}
    >
      <div className="flex flex-wrap gap-2">
        {LEVEL_ORDER.map((code) => {
          const units = LEVELS[code].units;
          const total = units.reduce((n, u) => n + totalLessons(u), 0);
          const done = units.reduce((n, u) => n + doneInUnit(u), 0);
          const active = code === level;
          return (
            <button
              key={code}
              onClick={() => setLevel(code)}
              className={
                "rounded-lg border px-4 py-2 text-left text-sm transition-colors " +
                (active
                  ? "border-gold bg-cream shadow-[inset_0_-2px_0_0_var(--color-gold)]"
                  : "border-line bg-cream/60 hover:border-gold/60")
              }
            >
              <div className="font-display text-lg">{code}</div>
              <div className="text-[10px] text-ink-soft">
                {total > 0 ? `${done}/${total} pelajaran` : "konten menyusul"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="card mt-4 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-display text-2xl">
              {level} · {doneLevel}/{totalLevel} pelajaran
            </div>
            <div className="mt-1 text-xs text-ink-soft">
              {contentUnits > 0
                ? `${contentUnits} unit berisi konten · ${levelUnits.length} unit dalam peta.`
                : "Unit pada level ini belum memiliki konten — kerangkanya sudah siap."}
            </div>
          </div>
          <span className="badge">{levelUnits.length} unit</span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line-soft">
          <div
            className="h-full bg-gold transition-all"
            style={{ width: `${totalLevel ? Math.round((doneLevel / totalLevel) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {levelUnits.map((u) => {
          const hasContent = unitHasContent(u);
          const unlocked = unitUnlocked(u);
          const done = doneInUnit(u);
          const total = totalLessons(u);
          const passed = checkpointPassed(u.unit);
          const clickable = hasContent && unlocked;
          const policy = objectivePolicy(u.unit);
          const objectiveCount = objectivesOfUnit(u.unit).length;
          const readiness = objectiveReadiness(u.unit);
          const badge = !hasContent
            ? "Konten menyusul"
            : !unlocked
              ? "Terkunci"
              : passed
                ? "Selesai"
                : `${done}/${total} pelajaran`;
          return (
            <button
              key={u.unit}
              disabled={!clickable}
              onClick={() => setView({ kind: "unit", unitNo: u.unit })}
              className={
                "card px-4 py-3 text-left transition-colors " +
                (clickable ? "hover:border-gold" : "opacity-60")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-xl text-gold-deep">
                  {String(displayUnitNo(u.unit)).padStart(2, "0")}
                </span>
                <span className="badge">{badge}</span>
              </div>
              <div className="mt-1 text-sm font-semibold">{u.title}</div>
              <div className="mt-2 text-[11px] text-ink-soft">
                {!hasContent
                  ? "Materi menyusul"
                  : !unlocked
                    ? "Lulus checkpoint unit sebelumnya"
                    : policy
                      ? readiness.status === "insufficient"
                        ? `${total} pelajaran · bank soal belum siap (${readiness.missing.length} tujuan kurang)`
                        : `${total} pelajaran · ${objectiveCount} tujuan · checkpoint ${objectiveCount * policy.itemsPerObjective} item`
                      : `${total} pelajaran · checkpoint ${u.unit < 201 ? "hingga " : ""}${u.unit >= 201 ? u.lessons.flatMap((lesson) => lessonExamples(lesson)).slice(0, u.checkpoint?.count ?? 15).length : u.checkpoint?.count ?? 15} item`}
              </div>
              {clickable ? (
                <div className="mt-2 text-[11px] text-gold-deep">
                  {passed ? "Buka unit →" : "Lanjutkan unit →"}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="mt-6 font-display text-sm italic text-ink-soft">
        &ldquo;Übung macht den Meister.&rdquo; — tiap level berdiri sendiri; checkpoint unit
        membuka unit berikutnya.
      </p>
    </PageShell>
  );
}
