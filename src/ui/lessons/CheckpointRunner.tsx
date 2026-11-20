// Checkpoint unit (F3): 15 item campuran, lulus ≥70% → unit berikutnya terbuka.
// Unit yang punya kisi-kisi tujuan memakai 3 soal baru per tujuan, laporan per
// tujuan, dan remedial dari soal bank yang belum dipakai.
import { useEffect, useRef, useState } from "react";
import type { DrillItem } from "../../drills/items";
import { buildDrillSession } from "../../drills/items";
import type { Unit } from "../../lessons/units";
import { CHECKPOINT_LESSON_NO } from "../../lessons/units";
import getDb, { nowIso } from "../../stores/db";
import MiniDrill from "./MiniDrill";
import { lessonExamples } from "../../lessons/practice";
import {
  A1_OBJECTIVES_NOTE,
  A1_OBJECTIVES_REVIEWED,
  buildObjectiveCheckpoint,
  buildRemedialItems,
  objectiveCheckpointAvailable,
  objectivesOfUnit,
  evaluateObjectiveResult,
  type A1Objective,
  type ObjectiveCheckpointPlan,
  type ObjectivePolicy,
} from "../../lessons/objectives";
import { gradeCheckpoint, type CheckpointGrade } from "../../lessons/checkpointResult";
import { saveCheckpointResult } from "../../lessons/checkpointStore";
import { deleteDraft, loadDraftRaw, quarantineDraftChecked } from "../../lessons/persistence";
import { deleteSession, loadSessionChecked, writeSession } from "../../lessons/sessionRepository";
import { canUseAttemptDraft, chooseDraftIndex, reconcileDraft } from "../../lessons/checkpointReconcile";
import { decideAttemptRecovery, decideSessionRecovery } from "../../lessons/checkpointRecovery";
import type { DrillDraft } from "../../lessons/drillDraft";
import {
  parseCheckpointSessionValue,
  parseStoredAttemptDraft,
  type CheckpointSessionData,
} from "../../lessons/checkpointPayload";

type Props = {
  unit: Unit;
  onExit: () => void;
  onProgress: () => void;
  onReviewObjective?: (objective: A1Objective) => void;
};

type LoadedPlan = {
  items: DrillItem[];
  objectives: A1Objective[];
  policy?: ObjectivePolicy;
  pool: DrillItem[];
  objectiveMode: boolean;
  bankBlocked?: boolean;
};

const sessionKey = (unitNo: number) => `checkpoint_session:${unitNo}`;
const attemptDraftKey = (unitNo: number) => `checkpoint_attempt:${unitNo}`;

async function committedAnswers(sessionId: string): Promise<Map<string, boolean>> {  const db = await getDb();
  const rows = await db.select<{ item_key: string; correct: number }[]>(
    "SELECT item_key, correct FROM attempts WHERE session_id = $1 AND item_key IS NOT NULL ORDER BY id",
    [sessionId],
  );
  const map = new Map<string, boolean>();
  for (const row of rows) if (!map.has(row.item_key)) map.set(row.item_key, row.correct === 1);
  return map;
}

// Attempt adalah ledger otoritatif. Draft sesi hanya boleh menjadi cermin;
// jawaban yang belum committed di draft dianggap belum dijawab.

async function buildLegacyItems(unit: Unit): Promise<DrillItem[]> {
  const cp = unit.checkpoint;
  if (!cp) return [];
  const examples = unit.lessons.flatMap((lesson) => lessonExamples(lesson));
  if (unit.unit >= 201) return examples.slice(0, cp.count);
  const vocabulary = [...new Set(unit.lessons.flatMap((lesson) => lesson.vocab))];
  const codes = cp.codes.filter((code) => ["D1", "D2", "D3"].includes(code));
  const grammar = await Promise.all(codes.map((code) => buildDrillSession(code, cp.count, vocabulary, true)));
  const groups = [examples, ...grammar];
  const items: DrillItem[] = [];
  for (let index = 0; items.length < cp.count && groups.some((group) => index < group.length); index++) {
    for (const group of groups) if (group[index] && items.length < cp.count) items.push(group[index]);
  }
  return items.slice(0, cp.count);
}

async function buildCheckpointPlan(unit: Unit, excludeKeys: ReadonlySet<string>): Promise<LoadedPlan> {
  const objectives = objectivesOfUnit(unit.unit);
  if (objectives.length > 0 && !objectiveCheckpointAvailable(unit.unit)) {
    // Bank kurang bukan alasan memakai contoh lama: tujuan yang belum siap
    // tidak boleh menghasilkan bukti penguasaan.
    return { items: [], objectives, pool: [], objectiveMode: true, bankBlocked: true };
  }
  const objectivePlan: ObjectiveCheckpointPlan | null = buildObjectiveCheckpoint(unit.unit, excludeKeys);
  if (objectivePlan) {
    return {
      items: objectivePlan.items,
      objectives: objectivePlan.objectives,
      policy: objectivePlan.policy,
      pool: objectivePlan.pool,
      objectiveMode: true,
    };
  }
  return {
    items: await buildLegacyItems(unit),
    objectives: [],
    pool: [],
    objectiveMode: false,
  };
}

function newSessionId(): string {
  const c = globalThis.crypto;
  try {
    if (c && "randomUUID" in c) return c.randomUUID();
  } catch { /* WebView bisa menolak randomUUID di konteks non-secure */ }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function CheckpointRunner({ unit, onExit, onProgress, onReviewObjective }: Props) {
  const [plan, setPlan] = useState<LoadedPlan | null>(null);
  const [result, setResult] = useState<CheckpointGrade | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState("");
  const [storageBlocked, setStorageBlocked] = useState("");
  const [loadEpoch, setLoadEpoch] = useState(0);
  const reloadUnitRef = useRef<Unit | null>(null);
  const reloadCountRef = useRef(0);
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);
  const [remedial, setRemedial] = useState<DrillItem[] | null>(null);
  const [remedialDone, setRemedialDone] = useState<{ correct: number; total: number } | null>(null);
  const [remedialDraft, setRemedialDraft] = useState<DrillDraft | null>(null);
  const [remedialSessionId, setRemedialSessionId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => newSessionId());
  const [draft, setDraft] = useState<DrillDraft | null>(null);
  const resultsRef = useRef<{ item: DrillItem; correct: boolean }[]>([]);
  const savingRef = useRef(false);
  const planRef = useRef<LoadedPlan | null>(null);
  const sessionIdRef = useRef(sessionId);
  const revisionRef = useRef(0);
  const savedRef = useRef(false);
  const resultRef = useRef<CheckpointGrade | null>(null);
  const snapshotRef = useRef<CheckpointSessionData | null>(null);
  const persistChain = useRef<Promise<void>>(Promise.resolve());

  const persistSnapshot = (snapshot: CheckpointSessionData): Promise<void> => {
    const key = sessionKey(unit.unit);
    const sid = sessionIdRef.current;
    persistChain.current = persistChain.current.catch(() => {}).then(async () => {
      // Baca revisi saat giliran tiba, bukan saat tombol diklik.
      const expected = revisionRef.current;
      const res = await writeSession(key, sid, expected, snapshot);
      if (res.ok) {
        revisionRef.current = res.envelope.revision;
      } else {
        setError(`Progres checkpoint belum tersimpan: ${res.error.message}`);
      }
    }).catch((e) => setError(`Progres checkpoint belum tersimpan: ${String(e)}`));
    return persistChain.current;
  };

  useEffect(() => {
    let alive = true;
    if (reloadUnitRef.current !== unit) {
      reloadUnitRef.current = unit;
      reloadCountRef.current = 0;
    }
    setPlan(null);
    setResult(null);
    setSaved(false);
    setError("");
    setRemedial(null);
    setRemedialDone(null);
    setRemedialDraft(null);
    setRemedialSessionId(null);
    setDraft(null);
    setRecoveryNotice("");
    setStorageBlocked("");
    resultsRef.current = [];
    resultRef.current = null;
    savedRef.current = false;
    const sid = newSessionId();
    sessionIdRef.current = sid;
    revisionRef.current = 0;
    setSessionId(sid);
    (async () => {
      const loaded = await buildCheckpointPlan(unit, new Set(excludeKeys));
      if (!alive) return;
      const sessionLoad = await loadSessionChecked<CheckpointSessionData>(
        sessionKey(unit.unit),
        (value) => parseCheckpointSessionValue(value).value,
      );
      if (!alive) return;
      const attemptRaw = await loadDraftRaw(attemptDraftKey(unit.unit));
      const attemptParsed = parseStoredAttemptDraft(attemptRaw);
      let attemptDraft = attemptParsed.value;
      const notices: string[] = [];
      let sessionBlocked = false;
      let reloadRequested = false;
      // Sumber yang berubah saat karantina dibaca ulang dengan batas percobaan,
      // sehingga writer lain tidak menang karena sesi kosong ditimpakan.
      const retryLoad = () => {
        if (reloadCountRef.current < 3) {
          reloadCountRef.current += 1;
          reloadRequested = true;
          if (alive) setLoadEpoch((epoch) => epoch + 1);
        } else {
          notices.push("Sumber checkpoint berubah berulang kali; muat ulang aplikasi sebelum mencoba lagi.");
          sessionBlocked = true;
        }
      };
      let pendingBlockReason: string | null = null;
      const blockStorage = (reason: string | null) => {
        pendingBlockReason = reason ?? pendingBlockReason ??
          "Data checkpoint lama tidak dapat dipertahankan dengan aman.";
        if (alive) setStorageBlocked(pendingBlockReason);
      };
      const preserveSession = async (reason: string): Promise<boolean> => {
        const key = sessionKey(unit.unit);
        const raw = sessionLoad.raw;
        // null = tidak ada payload; string kosong = payload invalid yang harus
        // tetap dipertahankan atau dibersihkan dengan aman.
        const outcome = raw === null ? null : await quarantineDraftChecked(key, raw);
        const decision = decideSessionRecovery(raw, outcome, reason);
        if (decision.notice) notices.push(decision.notice);
        if (decision.action === "reload") {
          retryLoad();
          return false;
        }
        if (decision.action === "block") {
          blockStorage(decision.blockReason);
          return false;
        }
        // quarantineDraftChecked sudah melakukan compare-and-delete hanya pada
        // versi yang dibaca. Tidak ada deleteSession tanpa syarat di sini.
        return true;
      };
      if (sessionLoad.invalid) {
        sessionBlocked = !(await preserveSession("Data sesi checkpoint lama tidak dapat dibaca."));
      }
      if (attemptParsed.invalid) {
        const raw = attemptRaw;
        const outcome = raw === null ? null : await quarantineDraftChecked(attemptDraftKey(unit.unit), raw);
        const decision = decideAttemptRecovery(raw, outcome);
        if (decision.notice) notices.push(decision.notice);
        if (decision.action === "reload") {
          retryLoad();
        } else if (decision.action === "block") {
          if (alive) setRecoveryNotice(notices.join(" "));
          blockStorage(decision.blockReason);
          return;
        }
        attemptDraft = null;
      } else if (attemptParsed.recovered) {
        notices.push("Draft jawaban checkpoint dipulihkan dari format lama.");
      }
      if (reloadRequested) return;
      if (alive && notices.length) setRecoveryNotice(notices.join(" "));
      if (sessionBlocked) {
        blockStorage(null);
        return;
      }
      const envelope = sessionLoad.envelope;
      const stored = envelope?.data ?? null;
      let finalPlan = loaded;
      let restored = false;
      if (stored && stored.unitNo === unit.unit && stored.items.length > 0) {
        const poolKeys = new Set(loaded.pool.map((item) => item.key));
        const valid = !loaded.objectiveMode || stored.items.every((item) => poolKeys.has(item.key));
        if (valid && envelope) {
          finalPlan = { ...loaded, items: stored.items };
          const committed = await committedAnswers(envelope.sessionId);
          const answers = committed.size > 0
            ? stored.items.flatMap((item) => committed.has(item.key)
              ? [{ key: item.key, correct: committed.get(item.key) as boolean }]
              : [])
            : stored.answers;
          const matchedDraft = attemptDraft &&
            canUseAttemptDraft(attemptDraft.sessionId, envelope.sessionId) &&
            attemptDraft.items.length === stored.items.length &&
            attemptDraft.items.every((item, index) => item.key === stored.items[index].key)
            ? attemptDraft
            : null;
          const baseIndex = matchedDraft
            ? chooseDraftIndex(stored.index, matchedDraft.index, stored.items.length)
            : stored.index;
          const baseDraft: DrillDraft = matchedDraft
            ? { ...matchedDraft, items: stored.items, index: baseIndex }
            : {
                items: stored.items,
                index: stored.index,
                correct: stored.correct,
                correctCount: stored.correctCount,
              };
          const draftState = committed.size > 0
            ? reconcileDraft(baseDraft, committed, stored.items)
            : baseDraft;
          const remedialSid = stored.remedialSessionId ?? (stored.remedial ? envelope.sessionId : null);
          const remedialCommitted = remedialSid && remedialSid !== envelope.sessionId
            ? await committedAnswers(remedialSid)
            : committed;
          const remedialDraftState = stored.remedial && stored.remedial.length > 0
            ? reconcileDraft(
                stored.remedialDraft ?? {
                  items: stored.remedial,
                  index: 0,
                  correct: null,
                  correctCount: 0,
                },
                remedialCommitted,
                stored.remedial,
              )
            : stored.remedialDraft ?? null;
          sessionIdRef.current = envelope.sessionId;
          revisionRef.current = envelope.revision;
          setSessionId(envelope.sessionId);
          resultsRef.current = answers.flatMap((answer) => {
            const item = stored.items.find((candidate) => candidate.key === answer.key);
            return item ? [{ item, correct: answer.correct }] : [];
          });
          setDraft(draftState);
          resultRef.current = stored.result;
          savedRef.current = stored.saved;
          snapshotRef.current = {
            unitNo: unit.unit,
            items: stored.items,
            answers,
            index: draftState.index,
            correct: draftState.correct,
            correctCount: draftState.correctCount,
            result: stored.result,
            saved: stored.saved,
            remedial: stored.remedial ?? null,
            remedialDone: stored.remedialDone ?? null,
            remedialDraft: remedialDraftState,
            remedialSessionId: remedialSid,
          };
          setResult(stored.result);
          setSaved(stored.saved);
          setRemedial(stored.remedial ?? null);
          setRemedialDone(stored.remedialDone ?? null);
          setRemedialDraft(remedialDraftState);
          setRemedialSessionId(remedialSid);
          restored = true;
        } else {
          sessionBlocked = !(await preserveSession("Sesi checkpoint lama tidak cocok dengan bank terbaru."));
        }
      } else if (stored) {
        sessionBlocked = !(await preserveSession("Sesi checkpoint lama bukan untuk unit ini."));
      }
      if (reloadRequested) return;
      if (alive && notices.length) setRecoveryNotice(notices.join(" "));
      if (sessionBlocked) {
        blockStorage(null);
        return;
      }
      if (!restored && attemptDraft && attemptDraft.items.length > 0) {
        // Snapshot sesi hilang/terlambat. Hanya pulihkan bila draft atomik
        // membawa sessionId exact; jangan menebak dari item yang kebetulan sama.
        const latest = attemptDraft.sessionId ?? null;
        if (latest) {
          const committed = await committedAnswers(latest);
          const draftState = reconcileDraft(attemptDraft, committed, attemptDraft.items);
          const answers = attemptDraft.items.flatMap((item) => committed.has(item.key)
            ? [{ key: item.key, correct: committed.get(item.key) as boolean }]
            : []);
          finalPlan = { ...loaded, items: attemptDraft.items };
          sessionIdRef.current = latest;
          revisionRef.current = 0;
          setSessionId(latest);
          resultsRef.current = answers.flatMap((answer) => {
            const item = attemptDraft.items.find((candidate) => candidate.key === answer.key);
            return item ? [{ item, correct: answer.correct }] : [];
          });
          setDraft(draftState);
          snapshotRef.current = {
            unitNo: unit.unit,
            items: attemptDraft.items,
            answers,
            index: draftState.index,
            correct: draftState.correct,
            correctCount: draftState.correctCount,
            result: null,
            saved: false,
            remedial: null,
            remedialDone: null,
            remedialDraft: null,
            remedialSessionId: null,
          };
          const res = await writeSession(sessionKey(unit.unit), latest, 0, snapshotRef.current);
          if (res.ok) revisionRef.current = res.envelope.revision;
          restored = true;
        }
      }
      if (alive && notices.length) setRecoveryNotice(notices.join(" "));
      if (!restored) {
        const snapshot: CheckpointSessionData = {
          unitNo: unit.unit,
          items: loaded.items,
          answers: [],
          index: 0,
          correct: null,
          correctCount: 0,
          result: null,
          saved: false,
          remedial: null,
          remedialDone: null,
          remedialDraft: null,
            remedialSessionId: null,
        };
        snapshotRef.current = snapshot;
        const res = await writeSession(sessionKey(unit.unit), sid, 0, snapshot);
        if (!res.ok && alive) setError(`Sesi checkpoint belum tersimpan: ${res.error.message}`);
        if (res.ok) revisionRef.current = res.envelope.revision;
      }
      if (!alive) return;
      snapshotRef.current = snapshotRef.current ?? {
        unitNo: unit.unit,
        items: finalPlan.items,
        answers: [],
        index: 0,
        correct: null,
        correctCount: 0,
        result: null,
        saved: false,
        remedial: null,
        remedialDone: null,
        remedialDraft: null,
            remedialSessionId: null,
      };
      planRef.current = finalPlan;
      setPlan(finalPlan);
    })().catch((e) => {
      console.error(e);
      if (alive) {
        setPlan({ items: [], objectives: [], pool: [], objectiveMode: false });
        setError(String(e));
      }
    });
    return () => {
      alive = false;
    };
  }, [unit, excludeKeys, loadEpoch]);

  const cp = unit.checkpoint;

  // P8: payload lama yang gagal dipertahankan/dibersihkan mengunci interaksi.
  // Tidak ada MiniDrill/soal yang dirender, sehingga jawaban berikutnya tidak
  // bisa menimpa payload lama lewat save_attempt_with_draft.
  if (storageBlocked) {
    return (
      <div className="card mx-auto max-w-2xl px-8 py-8">
        <div role="alert" className="rounded border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-900">
          <p>{storageBlocked}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="btn-gold" onClick={() => location.reload()}>
              Muat ulang
            </button>
            <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={onExit}>
              Kembali ke unit
            </button>
          </div>
        </div>
      </div>
    );
  }

  const recoveryBanner = recoveryNotice ? (
    <div role="status" className="mb-3 rounded border border-gold bg-cream px-4 py-3 text-sm">
      <p>{recoveryNotice}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={() => setRecoveryNotice("")}>
          Tutup
        </button>
        <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={onExit}>
          Kembali ke unit
        </button>
      </div>
    </div>
  ) : null;
  const errorBanner = !result && error ? (
    <div role="alert" className="mb-3 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-900">
      <p>{error}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button className="btn-gold" onClick={() => location.reload()}>
          Muat ulang
        </button>
        <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={onExit}>
          Kembali ke unit
        </button>
      </div>
    </div>
  ) : null;

  const persistResult = async (grade: CheckpointGrade) => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await saveCheckpointResult(unit.unit, CHECKPOINT_LESSON_NO, grade, nowIso());
      savedRef.current = true;
      if (snapshotRef.current) snapshotRef.current.saved = true;
      await persistSnapshot(snapshotRef.current ?? {
        unitNo: unit.unit,
        items: planRef.current?.items ?? [],
        answers: resultsRef.current.map((entry) => ({ key: entry.item.key, correct: entry.correct })),
        index: 0,
        correct: null,
        correctCount: 0,
        result: grade,
        saved: true,
        remedial: null,
        remedialDone: null,
        remedialDraft: null,
            remedialSessionId: null,
      });
      setSaved(true);
      onProgress();
    } catch (e) {
      console.error(e);
      setError(`Hasil checkpoint belum tersimpan. Tekan "Simpan ulang" untuk retry: ${String(e)}`);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDraft = (next: DrillDraft) => {
    setDraft(next);
    const snapshot = snapshotRef.current;
    if (!snapshot) return;
    snapshot.index = next.index;
    snapshot.correct = next.correct;
    snapshot.correctCount = next.correctCount;
    snapshot.answers = resultsRef.current.map((entry) => ({ key: entry.item.key, correct: entry.correct }));
    snapshot.result = resultRef.current;
    snapshot.saved = savedRef.current;
    void persistSnapshot(snapshot);
  };

  const handleDone = () => {
    if (!cp || !plan) return;
    const threshold = plan.policy?.pass ?? cp.pass;
    let grade: CheckpointGrade;
    if (plan.objectiveMode && plan.policy) {
      const raw = gradeCheckpoint(
        plan.items,
        plan.objectives,
        plan.policy,
        resultsRef.current.map((entry) => ({ key: entry.item.key, correct: entry.correct })),
        threshold,
      );
      // Aturan kelulusan tunggal dari Agent 2 (objectives.ts).
      const verdict = evaluateObjectiveResult(
        plan.policy,
        raw.objectiveResults.map((entry) => ({ correct: entry.correct, total: entry.total })),
        raw.correct,
        raw.total,
      );
      grade = { ...raw, score: verdict.score, pass: verdict.pass };
    } else {
      const correct = resultsRef.current.filter((entry) => entry.correct).length;
      const total = plan.items.length;
      const score = total ? Math.round((correct / total) * 100) : 0;
      grade = {
        correct,
        total,
        score,
        pass: total >= 2 && score >= threshold,
        objectiveResults: [],
      };
    }
    // Hasil sesi dipertahankan di layar dan di sesi SQLite walau simpan gagal.
    resultRef.current = grade;
    savedRef.current = false;
    if (snapshotRef.current) {
      snapshotRef.current.result = grade;
      snapshotRef.current.saved = false;
      snapshotRef.current.answers = resultsRef.current.map((entry) => ({ key: entry.item.key, correct: entry.correct }));
      void persistSnapshot(snapshotRef.current);
    }
    setResult(grade);
    void persistResult(grade);
  };

  const startRemedial = async () => {
    if (!plan || !plan.policy || !result) return;
    if (!saved) {
      setError("Simpan hasil checkpoint terlebih dahulu sebelum membuka remedial.");
      return;
    }
    const failedIds = result.objectiveResults.filter((entry) => !entry.pass).map((entry) => entry.objective.id);
    const usedKeys = new Set(plan.items.map((item) => item.key));
    const objectivePlan: ObjectiveCheckpointPlan = {
      unitNo: unit.unit,
      items: plan.items,
      objectives: plan.objectives,
      policy: plan.policy,
      pool: plan.pool,
    };
    const items = buildRemedialItems(objectivePlan, failedIds, usedKeys);
    if (items.length === 0) {
      setError("Tidak ada soal bank yang belum dipakai untuk remedial. Ulangi checkpoint untuk mencoba soal lain.");
      return;
    }
    // Setiap putaran remedial yang benar-benar baru mendapat sesi sendiri.
    // ID disimpan di snapshot sebelum MiniDrill menerima jawaban.
    const remedialId = newSessionId();
    setError("");
    setRemedialDone(null);
    setRemedialDraft(null);
    setRemedialSessionId(remedialId);
    if (snapshotRef.current) {
      snapshotRef.current.remedial = items;
      snapshotRef.current.remedialDone = null;
      snapshotRef.current.remedialDraft = null;
      snapshotRef.current.remedialSessionId = remedialId;
      await persistSnapshot(snapshotRef.current);
      // Jangan menerima jawaban sebelum identitas putaran tersimpan.
      const verified = await loadSessionChecked<CheckpointSessionData>(
        sessionKey(unit.unit),
        (value) => parseCheckpointSessionValue(value).value,
      );
      if (verified.envelope?.data.remedialSessionId !== remedialId) {
        setError("Sesi remedial belum tersimpan; coba lagi sebelum menjawab.");
        return;
      }
    }
    setRemedial(items);
  };

  const handleRemedialDraft = (next: DrillDraft) => {
    setRemedialDraft(next);
    if (snapshotRef.current) {
      snapshotRef.current.remedialDraft = next;
      void persistSnapshot(snapshotRef.current);
    }
  };

  const finishRemedial = (correct: number, total: number) => {
    setRemedialDone({ correct, total });
    if (snapshotRef.current) {
      snapshotRef.current.remedialDone = { correct, total };
      void persistSnapshot(snapshotRef.current);
    }
  };

  const retryCheckpoint = async () => {
    await persistChain.current.catch(() => {});
    await deleteSession(sessionKey(unit.unit));
    await deleteDraft(attemptDraftKey(unit.unit));
    setPlan(null);
    setResult(null);
    setSaved(false);
    setRemedial(null);
    setRemedialDone(null);
    setRemedialDraft(null);
    setRemedialSessionId(null);
    setError("");
    setRecoveryNotice("");
    setDraft(null);
    const sid = newSessionId();
    sessionIdRef.current = sid;
    revisionRef.current = 0;
    resultRef.current = null;
    savedRef.current = false;
    snapshotRef.current = null;
    setSessionId(sid);
    setExcludeKeys(plan?.items.map((item) => item.key) ?? []);
  };

  if (remedial) {
    if (remedialDone) {
      return (
        <div className="card mx-auto max-w-2xl px-8 py-8 text-center">
          <div className="text-[11px] uppercase tracking-wide text-gold-deep">Latihan remedial</div>
          <h2 className="mt-1 font-display text-3xl">Remedial selesai</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {remedialDone.correct} benar dari {remedialDone.total} soal remedial. Ini latihan tambahan, bukan
            perubahan otomatis pada skor checkpoint.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button className="btn-gold" onClick={() => {
              setRemedial(null);
              setRemedialDone(null);
              setRemedialDraft(null);
              setRemedialSessionId(null);
              if (snapshotRef.current) {
                snapshotRef.current.remedial = null;
                snapshotRef.current.remedialDone = null;
                snapshotRef.current.remedialDraft = null;
                snapshotRef.current.remedialSessionId = null;
                void persistSnapshot(snapshotRef.current);
              }
            }}>
              Kembali ke hasil checkpoint
            </button>
            <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={() => void retryCheckpoint()}>
              Ulangi checkpoint
            </button>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <button
            className="text-sm text-ink-soft underline hover:text-ink"
            onClick={() => {
              setRemedial(null);
              setRemedialDone(null);
              setRemedialDraft(null);
              setRemedialSessionId(null);
              if (snapshotRef.current) {
                snapshotRef.current.remedial = null;
                snapshotRef.current.remedialDone = null;
                snapshotRef.current.remedialDraft = null;
                snapshotRef.current.remedialSessionId = null;
                void persistSnapshot(snapshotRef.current);
              }
            }}
          >
            ← Hasil checkpoint
          </button>
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">
            Remedial · {remedial.length} soal dari tujuan yang belum lulus
          </span>
        </div>
        <h2 className="mb-3 font-display text-2xl">Latihan remedial — {unit.title}</h2>
        <MiniDrill
          key={`remedial:${remedial.map((item) => item.key).join("|")}`}
          items={remedial}
          sessionId={remedialSessionId ?? sessionId}
          draftKey={`checkpoint_remedial:${unit.unit}:${remedialSessionId ?? sessionId}`}
          draft={remedialDraft}
          onDraftChange={handleRemedialDraft}
          onDone={finishRemedial}
          doneLabel="Lihat ringkasan remedial"
        />
      </div>
    );
  }

  if (result) {
    const failed = result.objectiveResults.filter((entry) => !entry.pass);
    return (
      <>
      {recoveryBanner}
      <div className="card mx-auto max-w-2xl px-8 py-8 text-center">
        <div className="text-[11px] uppercase tracking-wide text-gold-deep">Checkpoint unit {unit.unit}</div>
        <h2 className="mt-1 font-display text-3xl">{result.pass ? "Bestanden!" : "Noch nicht bestanden"}</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Skor {result.score}% · {result.correct} benar dari {result.total} item · ambang lulus{" "}
          {plan?.policy?.pass ?? cp?.pass ?? 70}%.
          {plan?.policy
            ? ` Setiap tujuan juga harus mencapai minimal ${plan.policy.perObjectiveMin}/${plan.policy.itemsPerObjective} benar.`
            : ""}
        </p>
        {saving ? (
          <p className="mt-2 text-xs text-ink-soft">Menyimpan hasil…</p>
        ) : saved ? (
          <p className="mt-2 text-xs text-emerald-700">Hasil tersimpan.</p>
        ) : null}
        {error ? (
          <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-900">
            <p>{error}</p>
            <button className="btn-gold mt-3" disabled={saving} onClick={() => void persistResult(result)}>
              Simpan ulang
            </button>
          </div>
        ) : null}
        <div className="mx-auto mt-5 h-2 w-full max-w-md overflow-hidden rounded-full bg-line-soft">
          <div
            className={"h-full " + (result.pass ? "bg-emerald-600" : "bg-rose-600")}
            style={{ width: `${result.score}%` }}
          />
        </div>

        {result.objectiveResults.length > 0 ? (
          <div className="mt-6 text-left">
            <h3 className="font-display text-lg">Hasil per tujuan</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-soft">
                    <th className="py-1.5 pr-2">Tujuan</th>
                    <th className="py-1.5 pr-2">Benar</th>
                    <th className="py-1.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.objectiveResults.map((entry) => (
                    <tr key={entry.objective.id} className="border-b border-line-soft align-top">
                      <td className="py-2 pr-2">{entry.objective.title}</td>
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {entry.correct}/{entry.total}
                      </td>
                      <td className={"py-2 " + (entry.pass ? "text-emerald-700" : "text-rose-700")}>
                        {entry.pass ? "Lulus" : "Perlu latihan"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {failed.length > 0 ? (
          <div className="mt-5 rounded border border-rose-200 bg-rose-50 px-4 py-3 text-left text-sm text-rose-900">
            <div className="font-semibold">Yang perlu diulang</div>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              {failed.map((entry) => (
                <li key={entry.objective.id}>
                  <b>{entry.objective.title}:</b> {entry.objective.remedy}
                  {onReviewObjective ? (
                    <button
                      className="ml-2 underline disabled:opacity-40"
                      disabled={!saved || saving}
                      onClick={() => {
                        const snapshot = snapshotRef.current;
                        if (!snapshot) {
                          onReviewObjective(entry.objective);
                          return;
                        }
                        snapshot.result = result;
                        snapshot.saved = saved;
                        void persistSnapshot(snapshot).then(() => onReviewObjective(entry.objective));
                      }}
                    >
                      Pelajari materi
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="mt-4 text-xs text-ink-soft">
          Checkpoint memakai soal baru per tujuan, bukan salinan contoh slide.{" "}
          {A1_OBJECTIVES_REVIEWED ? "Bank soal sudah ditinjau pengajar." : "Bank soal belum ditinjau pengajar."}{" "}
          {plan?.policy ? A1_OBJECTIVES_NOTE : ""} Hasil ini bukan ujian sertifikasi CEFR.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {failed.length > 0 ? (
            <button className="btn-gold" disabled={!saved || saving} onClick={() => void startRemedial()}>
              Latihan remedial
            </button>
          ) : null}
          <button
            className={failed.length > 0 ? "rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" : "btn-gold"}
            disabled={saving}
            onClick={() => void retryCheckpoint()}
          >
            Ulangi checkpoint
          </button>
          <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={onExit}>
            Kembali ke unit
          </button>
        </div>
      </div>
      </>
    );
  }

  if (saving) {
    return (
      <>
        {recoveryBanner}
        {errorBanner}
        <div className="card px-6 py-8 text-center text-sm text-ink-soft">Menyimpan hasil…</div>
      </>
    );
  }

  return (
    <div>
      {recoveryBanner}
      {errorBanner}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button className="text-sm text-ink-soft underline hover:text-ink" onClick={onExit}>
          ← Unit {unit.unit}
        </button>
        <span className="text-[11px] uppercase tracking-wide text-ink-soft">
          Checkpoint · {plan?.items.length ?? cp?.count ?? 15} item · lulus ≥{plan?.policy?.pass ?? cp?.pass ?? 70}%
          {plan?.policy ? ` + ≥${plan.policy.perObjectiveMin}/${plan.policy.itemsPerObjective} per tujuan` : ""}
        </span>
      </div>
      <h2 className="mb-3 font-display text-2xl">Checkpoint — {unit.title}</h2>
      <p className="mb-3 text-sm text-ink-soft">
        {plan?.objectiveMode
          ? `Checkpoint ini memakai ${plan.items.length} soal baru dari ${plan.objectives.length} tujuan unit, bukan salinan contoh. Hasil per tujuan ditampilkan; bank soal belum ditinjau pengajar.`
          : "Checkpoint ini memakai contoh dan kosakata unit. Hasilnya belum mengukur seluruh keterampilan atau tata bahasa tingkat ini."}
      </p>
      {plan === null ? (
        <div className="card px-6 py-8 text-center text-sm text-ink-soft">Menyiapkan checkpoint…</div>
      ) : plan.bankBlocked ? (
        <div className="card px-6 py-8 text-center text-sm text-ink-soft">
          Bank soal unit ini belum siap: jumlah soal per tujuan belum mencukupi. Checkpoint tidak dijalankan
          agar hasil tidak diklaim sebagai penguasaan.
          {error ? <div className="mt-2 text-xs text-rose-700">{error}</div> : null}
        </div>
      ) : plan.items.length === 0 ? (
        <div className="card px-6 py-8 text-center text-sm text-ink-soft">
          Bank item checkpoint belum tersedia.
          {error ? <div className="mt-2 text-xs text-rose-700">{error}</div> : null}
        </div>
      ) : (
        <MiniDrill
          key={`checkpoint:${plan.items.map((item) => item.key).join("|")}`}
          items={plan.items}
          sessionId={sessionId}
          draftKey={attemptDraftKey(unit.unit)}
          draft={draft}
          onDraftChange={handleDraft}
          onItemResult={(item, correct) => {
            resultsRef.current.push({ item, correct });
            if (snapshotRef.current) {
              snapshotRef.current.answers = resultsRef.current.map((entry) => ({ key: entry.item.key, correct: entry.correct }));
            }
          }}
          onDone={handleDone}
          doneLabel="Lihat hasil"
        />
      )}
    </div>
  );
}
