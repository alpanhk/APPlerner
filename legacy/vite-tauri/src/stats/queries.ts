// Angka layar Statistik (F5) — seluruhnya dihitung dari tabel nyata:
// attempts, srs_state, lesson_progress, reading_log, config. Tidak ada dummy.
import getDb from "../stores/db";
import { computeStreak, dayKey, dayLabelId, lastDays, shiftDay } from "./dates";
import type { DrillCode } from "../drills/items";
import { CHECKPOINT_LESSON_NO, LEVELS, LEVEL_ORDER, totalLessons, unitHasContent, type LevelCode } from "../lessons/units";

type AttemptRow = {
  ts: string;
  kind: string;
  correct: number;
  ms: number | null;
  drill_code: string | null;
  item_key: string | null;
  item_id: number;
};

type StateRow = {
  card_id: number;
  due: string;
  state: string;
  stability: number;
  last_review: string | null;
};

type ProgressRow = { unit_no: number; lesson_no: number; state: string; score: number | null };

export type DayActivity = { date: string; attempts: number; correct: number; minutes: number; active: boolean };
export type ForecastBucket = { date: string; label: string; count: number };
export type WeakItem = { key: string; code: DrillCode; label: string; wrong: number; total: number };
export type LevelMastery = {
  level: LevelCode;
  done: number;
  total: number;
  checkpoints: number;
  unitsWithContent: number;
  totalUnits: number;
};
export type SkillScore = { id: string; label: string; score: number | null; detail: string };
// U-09: tindakan yang bisa diambil pengguna, diturunkan dari data yang ada.
// Tidak berisi penilaian kemampuan/CEFR.
export type NextStep = {
  id: string;
  label: string;
  detail: string;
  unitNo?: number;
  section?: string;
};

export type Stats = {
  today: {
    attempts: number;
    correct: number;
    cards: number;
    drills: number;
    minutes: number;
    goalMin: number;
  };
  week: { attempts: number; correct: number; minutes: number };
  totals: { attempts: number; minutes: number; activeDays: number };
  streak: { current: number; best: number };
  activity: DayActivity[];
  forecast: { buckets: ForecastBucket[]; overdue: number; horizon: number };
  srs: { total: number; newCards: number; learning: number; review: number; mature: number; dueNow: number };
  units: LevelMastery[];
  weak: WeakItem[];
  reading: { texts: number; reads: number; wordsSaved: number };
  skills: SkillScore[];
  nextSteps: NextStep[];
};

const HEATMAP_DAYS = 84;
const FORECAST_DAYS = 7;
const GOAL_DEFAULT = 15;
// F5-GAP-01: perkiraan kesiapan hanya bila ada sampel dan sinyal mastery nyata.
const READY_MIN_ACCURACY_SAMPLES = 5;
const READY_MASTERY_WEIGHT = 0.6;

function pct(correct: number, total: number): number | null {
  return total > 0 ? Math.round((correct / total) * 100) : null;
}

function accuracyOf(
  rows: AttemptRow[],
  pick: (r: AttemptRow) => boolean,
): { correct: number; total: number } {
  let correct = 0;
  let total = 0;
  for (const r of rows) {
    if (!pick(r)) continue;
    total += 1;
    if (r.correct) correct += 1;
  }
  return { correct, total };
}

function weakLabel(key: string, entryDe: string | undefined): string {
  if (entryDe) return entryDe;
  const parts = key.split(":");
  return parts.length > 2 ? parts.slice(2).join(":") : key;
}

export async function loadStats(): Promise<Stats> {
  const db = await getDb();
  const [attempts, states, cards, progress, reads, cfgRows, otherActivity, studyTimes] = await Promise.all([
    db.select<AttemptRow[]>(
      "SELECT ts, kind, correct, ms, drill_code, item_key, item_id FROM attempts",
    ),
    db.select<StateRow[]>(
      "SELECT card_id, due, state, stability, last_review FROM srs_state",
    ),
    db.select<{ n: number }[]>("SELECT COUNT(*) n FROM cards"),
    db.select<ProgressRow[]>(
      "SELECT unit_no, lesson_no, state, score FROM lesson_progress",
    ),
    db.select<{ texts: number; reads: number; words: number }[]>(
      "SELECT COUNT(DISTINCT CASE WHEN words_saved=0 THEN text_id END) texts, COALESCE(SUM(CASE WHEN words_saved=0 THEN 1 ELSE 0 END),0) reads, COALESCE(SUM(words_saved),0) words FROM reading_log",
    ),
    db.select<{ value: string }[]>("SELECT value FROM config WHERE key = 'daily_goal_min'"),
    db.select<{ ts: string }[]>("SELECT ts FROM reading_log WHERE words_saved = 0 UNION ALL SELECT finished_at AS ts FROM lesson_progress WHERE finished_at IS NOT NULL"),
    db.select<{ key: string; value: string }[]>("SELECT key, value FROM config WHERE key LIKE 'study_ms:%'"),
  ]);

  const goalParsed = cfgRows.length ? Number(cfgRows[0].value) : NaN;
  const goalMin = Number.isFinite(goalParsed) && goalParsed > 0 ? goalParsed : GOAL_DEFAULT;

  // ---- Agregasi per hari (heatmap + streak) --------------------------------
  const today = dayKey(new Date());
  const days = lastDays(HEATMAP_DAYS, today);
  const perDay = new Map<string, { attempts: number; correct: number; ms: number }>();
  const activeDays = new Set<string>();
  let totalMs = 0;
  let totalAttempts = 0;

  for (const a of attempts) {
    const key = dayKey(a.ts);
    const bucket = perDay.get(key) ?? { attempts: 0, correct: 0, ms: 0 };
    bucket.attempts += 1;
    bucket.correct += a.correct ? 1 : 0;
    bucket.ms += a.ms ?? 0;
    perDay.set(key, bucket);
    activeDays.add(key);
    totalMs += a.ms ?? 0;
    totalAttempts += 1;
  }
  for (const event of otherActivity) activeDays.add(dayKey(event.ts));
  for (const row of studyTimes) {
    const day = row.key.slice("study_ms:".length);
    const ms = Number(row.value);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(ms) || ms < 0) continue;
    const bucket = perDay.get(day) ?? { attempts: 0, correct: 0, ms: 0 };
    totalMs += ms - bucket.ms;
    bucket.ms = ms;
    perDay.set(day, bucket);
    if (ms > 0) activeDays.add(day);
  }

  const activity: DayActivity[] = days.map((date) => {
    const b = perDay.get(date);
    return {
      date,
      attempts: b?.attempts ?? 0,
      correct: b?.correct ?? 0,
      minutes: Math.round((b?.ms ?? 0) / 60000),
      active: activeDays.has(date),
    };
  });

  const todayAct = activity[activity.length - 1];
  const weekDays = activity.slice(-7);
  const week = weekDays.reduce(
    (acc, d) => ({
      attempts: acc.attempts + d.attempts,
      correct: acc.correct + d.correct,
      minutes: acc.minutes + d.minutes,
    }),
    { attempts: 0, correct: 0, minutes: 0 },
  );

  const { current, best } = computeStreak(activeDays, today);

  // ---- SRS: status kartu & forecast 7 hari ---------------------------------
  const now = Date.now();
  const srs = {
    total: cards[0]?.n ?? 0,
    newCards: 0,
    learning: 0,
    review: 0,
    mature: 0,
    dueNow: 0,
  };
  srs.newCards = Math.max(0, srs.total - states.length);

  const bucketByDay = new Map<string, number>();
  let overdue = 0;
  for (const s of states) {
    if (s.state === "learning" || s.state === "relearning") srs.learning += 1;
    else if (s.state === "review") srs.review += 1;
    if (s.stability >= 21) srs.mature += 1;

    const dueT = new Date(s.due).getTime();
    if (dueT <= now) srs.dueNow += 1;
    const key = dayKey(s.due);
    if (dueT < now && key < today) overdue += 1;
    bucketByDay.set(key, (bucketByDay.get(key) ?? 0) + 1);
  }

  const futureDays = Array.from({ length: FORECAST_DAYS }, (_, i) => shiftDay(today, i));
  const buckets: ForecastBucket[] = futureDays.map((date, i) => ({
    date,
    label: i === 0 ? "Hari ini" : `${dayLabelId(date)} ${date.slice(8)}`,
    count: bucketByDay.get(date) ?? 0,
  }));
  const horizon = buckets.reduce((acc, b) => acc + b.count, 0);

  // ---- Kurikulum: mastery per level ---------------------------------------
  const doneByLesson = new Set(
    progress.filter((p) => p.state === "done").map((p) => `${p.unit_no}:${p.lesson_no}`),
  );
  const checkpointByUnit = new Map<number, ProgressRow>();
  for (const p of progress) {
    if (p.lesson_no === CHECKPOINT_LESSON_NO) checkpointByUnit.set(p.unit_no, p);
  }

  const units: LevelMastery[] = LEVEL_ORDER.map((code) => {
    const levelUnits = LEVELS[code].units;
    const content = levelUnits.filter(unitHasContent);
    const done = content.reduce(
      (acc, u) => acc + u.lessons.filter((l) => doneByLesson.has(`${u.unit}:${l.no}`)).length,
      0,
    );
    const total = content.reduce((acc, u) => acc + totalLessons(u), 0);
    const checkpoints = content.filter((u) => {
      const cp = checkpointByUnit.get(u.unit);
      return !!cp && cp.state === "done" && (cp.score ?? 0) >= (u.checkpoint?.pass ?? 70);
    }).length;
    return {
      level: code,
      done,
      total,
      checkpoints,
      unitsWithContent: content.length,
      totalUnits: levelUnits.length,
    };
  });



  // ---- Kelemahan: item drill yang paling sering salah ---------------------
  const entryRows = await db.select<{ id: number; de: string }[]>("SELECT id, de FROM entries");
  const entryDe = new Map(entryRows.map((e) => [e.id, e.de]));

  const byKey = new Map<string, { wrong: number; total: number; code: DrillCode; itemId: number }>();
  for (const a of attempts) {
    if (!a.drill_code || !a.item_key) continue;
    const key = a.item_key;
    const b = byKey.get(key) ?? {
      wrong: 0,
      total: 0,
      code: a.drill_code as DrillCode,
      itemId: a.item_id,
    };
    b.total += 1;
    if (!a.correct) b.wrong += 1;
    byKey.set(key, b);
  }
  const weak: WeakItem[] = [...byKey.entries()]
    .filter(([, v]) => v.wrong > 0)
    .sort((a, b) => b[1].wrong - a[1].wrong || b[1].wrong / b[1].total - a[1].wrong / a[1].total)
    .slice(0, 5)
    .map(([key, v]) => ({
      key,
      code: v.code,
      label: weakLabel(key, entryDe.get(v.itemId)),
      wrong: v.wrong,
      total: v.total,
    }));

  // ---- Skor kesiapan A1 (perkiraan dari data yang ada) --------------------
  const drillAcc = (codes: DrillCode[]) =>
    accuracyOf(attempts, (a) => a.kind === "drill" && !!a.drill_code && codes.includes(a.drill_code as DrillCode));
  const srsAcc = accuracyOf(attempts, (a) => a.kind === "srs");

  const reading = {
    texts: reads[0]?.texts ?? 0,
    reads: reads[0]?.reads ?? 0,
    wordsSaved: reads[0]?.words ?? 0,
  };

  const hoeren = drillAcc(["D8"]);
  const schreiben = drillAcc(["D2", "D3", "D5", "D7", "D10"]);
  const lesenAcc = srsAcc;

  // Mastery A1 dihitung dari pelajaran selesai dan checkpoint lulus (data nyata).
  const a1 = units.find((unit) => unit.level === "A1");
  const masteryPct = a1 && a1.total > 0 ? Math.round((a1.done / a1.total) * 100) : null;
  const checkpointPct = a1 && a1.unitsWithContent > 0
    ? Math.round((a1.checkpoints / a1.unitsWithContent) * 100)
    : null;
  // 0% karena belum ada progres BUKAN bukti mastery; butuh minimal satu
  // pelajaran selesai atau checkpoint lulus sebelum memberi skor.
  const hasMasteryData = (a1?.done ?? 0) > 0 || (a1?.checkpoints ?? 0) > 0;
  const masterySignal = !hasMasteryData ? null : Math.round(
    (masteryPct ?? 0) * READY_MASTERY_WEIGHT + (checkpointPct ?? 0) * (1 - READY_MASTERY_WEIGHT),
  );
  const masteryContext = `mastery A1 ${masteryPct ?? 0}% (${a1?.done ?? 0}/${a1?.total ?? 0} pelajaran, ${
    a1?.checkpoints ?? 0
  } checkpoint lulus)`;
  const sampleContext = (label: string, sample: { correct: number; total: number }): string =>
    sample.total >= READY_MIN_ACCURACY_SAMPLES
      ? `${label}: ${sample.total} sampel, akurasi ${pct(sample.correct, sample.total)}%`
      : `${label}: ${sample.total} sampel (minimum ${READY_MIN_ACCURACY_SAMPLES} untuk perkiraan)`;

  // F5-GAP-01: skor bukan-null hanya bila sampel cukup DAN ada mastery. Tanpa
  // itu tetap null dengan konteks sampel jujur; tidak ada klaim kemampuan.
  const readinessScore = (sample: { correct: number; total: number }): number | null => {
    const acc = pct(sample.correct, sample.total);
    if (acc === null || sample.total < READY_MIN_ACCURACY_SAMPLES || masterySignal === null) return null;
    return Math.round(masterySignal * READY_MASTERY_WEIGHT + acc * (1 - READY_MASTERY_WEIGHT));
  };
  const disclaimer = "Perkiraan dari data aplikasi, bukan penilaian CEFR.";

  const skills: SkillScore[] = [
    {
      id: "hoeren",
      label: "Hören",
      score: readinessScore(hoeren),
      detail: `${masteryContext}; ${sampleContext("D8 angka/jam", hoeren)}; belum mengukur pemahaman dengar menyeluruh. ${disclaimer}`,
    },
    {
      id: "lesen",
      label: "Lesen",
      score: readinessScore(lesenAcc),
      detail: `${masteryContext}; ${reading.texts} teks dibaca; ${sampleContext("akurasi SRS", lesenAcc)}. ${disclaimer}`,
    },
    {
      id: "schreiben",
      label: "Schreiben",
      score: readinessScore(schreiben),
      detail: `${masteryContext}; ${sampleContext("item bentuk kata/tata bahasa", schreiben)}; belum mengukur tulisan bebas. ${disclaimer}`,
    },
    {
      id: "sprechen",
      label: "Sprechen",
      score: null,
      detail: "Belum ada asesmen bicara atau sampel rekaman yang dinilai; tidak ada klaim kemampuan.",
    },
  ];

  // U-09: ringkasan yang bisa ditindaklanjuti dari data nyata. Ini adalah
  // arah belajar, BUKAN penilaian kemampuan/CEFR.
  const a1Mastery = units.find((unit) => unit.level === "A1");
  const candidates = LEVELS.A1.units.filter(unitHasContent).map((unit) => {
    const done = unit.lessons.filter((lesson) => doneByLesson.has(`${unit.unit}:${lesson.no}`)).length;
    const total = totalLessons(unit);
    return { unitNo: unit.unit, title: unit.title, done, total };
  });
  const unfinished = candidates
    .filter((unit) => unit.done < unit.total)
    .sort((a, b) => a.done / a.total - b.done / b.total)[0];
  const lastActive = [...activity].reverse().find((day) => day.active);
  const nextSteps: NextStep[] = [];
  if (unfinished) {
    nextSteps.push({
      id: "continue-unit",
      label: `Lanjutkan Unit ${unfinished.unitNo}`,
      detail: `${unfinished.title}: ${unfinished.done}/${unfinished.total} pelajaran selesai.`,
      unitNo: unfinished.unitNo,
    });
  }
  if (a1Mastery && a1Mastery.checkpoints < a1Mastery.unitsWithContent) {
    nextSteps.push({
      id: "checkpoint",
      label: "Cek checkpoint unit",
      detail: `${a1Mastery.checkpoints}/${a1Mastery.unitsWithContent} unit A1 punya checkpoint lulus.`,
      section: "materials",
    });
  }
  if (weak[0]) {
    nextSteps.push({
      id: "weak-item",
      label: `Ulangi ${weak[0].label}`,
      detail: `${weak[0].wrong} salah dari ${weak[0].total} jawaban pada item ini.`,
      section: "practice",
    });
  }
  nextSteps.push({
    id: "recent-activity",
    label: lastActive ? `Terakhir aktif ${lastActive.date}` : "Mulai sesi pertama",
    detail: lastActive
      ? `${lastActive.attempts} jawaban dan ${lastActive.minutes} menit tercatat pada tanggal itu.`
      : "Belum ada aktivitas tercatat di perangkat ini.",
    section: "overview",
  });

  return {
    today: {
      attempts: todayAct.attempts,
      correct: todayAct.correct,
      cards: accuracyOf(attempts, (a) => a.kind === "srs" && dayKey(a.ts) === today).total,
      drills: accuracyOf(attempts, (a) => a.kind === "drill" && dayKey(a.ts) === today).total,
      minutes: todayAct.minutes,
      goalMin,
    },
    week,
    totals: {
      attempts: totalAttempts,
      minutes: Math.round(totalMs / 60000),
      activeDays: activeDays.size,
    },
    streak: { current, best },
    activity,
    forecast: { buckets, overdue, horizon },
    srs,
    units,
    weak,
    reading,
    skills,
    nextSteps,
  };
}
