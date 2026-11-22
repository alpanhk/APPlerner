// Checkpoint KLAB: 12 unit A1 memakai selector bank tujuan asli (305 soal,
// 60 tujuan); unit A2-B2 memakai fallback deterministik dari materi pelajaran.
// Komponen tidak menyimpan data: runner 1a menerima hasil lewat callback.
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildObjectiveCheckpoint,
} from '../../lessons/objectives';
import { mulberry32 } from '../../lessons/optionOrder';
import {
  buildLevelCheckpoint,
  gradePractice,
  type CheckpointPlan,
  type PracticeItem,
} from './logic';

export type CheckpointResult = {
  unitNo: number;
  level: string;
  source: 'bank' | 'generated' | 'curated';
  score: number;
  pass: boolean;
  perObjective: Array<{ id: string; correct: number; total: number; pass: boolean }>;
  usedKeys: string[];
};

type RouteLike = { name?: string; unitNo?: number; lessonNo?: number; textId?: number };

export type CheckpointFlowProps = {
  unitNo?: number;
  seed?: number;
  excludeKeys?: readonly string[];
  onBack?: () => void;
  onComplete?: (result: CheckpointResult) => void;
  onRetry?: (usedKeys: string[]) => void;
  route?: RouteLike;
  back?: () => void;
  targets?: readonly unknown[];
};

function toBankPlan(unitNo: number, excludeKeys: readonly string[], seed?: number): CheckpointPlan | null {
  const bank = buildObjectiveCheckpoint(
    unitNo,
    new Set(excludeKeys),
    seed === undefined ? undefined : mulberry32(seed),
  );
  if (!bank) return null;
  const convert = (item: (typeof bank.items)[number]): PracticeItem => ({
    id: item.key,
    unit: unitNo,
    lesson: 0,
    objectiveId: item.objectiveId ?? '',
    code: item.code,
    mode: item.mode === 'order' ? 'order' : item.mode === 'type' ? 'type' : 'choice',
    prompt: item.prompt,
    sub: item.sub,
    ...(item.options ? { options: item.options } : {}),
    ...(item.tokens ? { options: [...item.tokens] } : {}),
    answer: item.answer,
    ...(item.altAnswers ? { altAnswers: item.altAnswers } : {}),
    ...(item.wrongFeedback ? { wrongFeedback: item.wrongFeedback } : {}),
    ...(item.hintOnWrong ? { hintOnWrong: item.hintOnWrong } : {}),
    explanation: item.explanation,
    source: 'bank',
  });
  return {
    unitNo,
    level: 'A1',
    items: bank.items.map(convert),
    objectives: bank.objectives.map((objective) => ({ id: objective.id, title: objective.title })),
    policy: {
      pass: bank.policy.pass,
      perObjectiveMin: bank.policy.perObjectiveMin,
      itemsPerObjective: bank.policy.itemsPerObjective,
    },
    pool: bank.pool.map(convert),
    source: 'bank',
  };
}

export function CheckpointFlow({
  unitNo,
  seed,
  excludeKeys = [],
  onBack,
  onComplete,
  onRetry,
  route,
  back,
}: CheckpointFlowProps) {
  const resolvedUnit = unitNo ?? route?.unitNo ?? 4;
  const handleBack = onBack ?? back;
  const plan = useMemo<CheckpointPlan | null>(() => {
    const bank = toBankPlan(resolvedUnit, excludeKeys, seed);
    return bank ?? buildLevelCheckpoint(resolvedUnit);
  }, [resolvedUnit, seed, excludeKeys.join('|')]);
  const [stage, setStage] = useState<'quiz' | 'result' | 'remedial'>('quiz');
  const [queue, setQueue] = useState<PracticeItem[]>(plan?.items ?? []);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<Array<{ key: string; objectiveId: string; correct: boolean }>>([]);
  const feedbackRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    setQueue(plan?.items ?? []);
    setIndex(0);
    setChosen(null);
    setChecked(false);
    setAnswers([]);
    setStage('quiz');
  }, [plan]);

  if (!plan) {
    return (
      <section className="exercise" aria-label="Checkpoint belum siap">
        <h1>Checkpoint belum siap</h1>
        <p>Unit ini tidak ditemukan di kurikulum. Hasil tidak dinilai.</p>
        <button className="button" type="button" onClick={handleBack}>Kembali</button>
      </section>
    );
  }

  const item = queue[index];
  const usedKeys = answers.map((entry) => entry.key);

  function submit() {
    if (!item || !chosen || checked) return;
    const correct = gradePractice(item, chosen).correct;
    const next = [...answers, { key: item.id, objectiveId: item.objectiveId, correct }];
    setAnswers(next);
    setChecked(true);
    window.setTimeout(() => feedbackRef.current?.focus({ preventScroll: true }), 0);
  }

  function advance() {
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      setChosen(null);
      setChecked(false);
      return;
    }
    setStage('result');
  }

  function perObjective() {
    return plan!.objectives.map((group) => {
      const own = answers.filter((entry) => entry.objectiveId === group.id);
      const correct = own.filter((entry) => entry.correct).length;
      return {
        id: group.id,
        correct,
        total: own.length,
        pass: own.length > 0 && correct >= plan!.policy.perObjectiveMin,
      };
    });
  }

  const summaryScore = answers.length > 0 ? Math.round((answers.filter((entry) => entry.correct).length / answers.length) * 100) : 0;
  const overallPass = answers.length >= 2 && summaryScore >= plan.policy.pass;
  const objectivesPass = perObjective().every((entry) => entry.pass);
  const summaryPass = overallPass && objectivesPass;

  function startRemedial() {
    const failed = new Set(perObjective().filter((entry) => !entry.pass).map((entry) => entry.id));
    const remedial = plan!.pool.filter(
      (candidate) => failed.has(candidate.objectiveId) && !usedKeys.includes(candidate.id),
    ).slice(0, Math.max(1, plan!.policy.itemsPerObjective - 1));
    if (remedial.length === 0) return;
    setQueue(remedial);
    setIndex(0);
    setChosen(null);
    setChecked(false);
    setStage('remedial');
  }

  if (stage === 'result') {
    return (
      <section className="exercise" data-state={summaryPass ? 'correct' : 'incorrect'} aria-labelledby="klab-cp-title">
        <div className="focus-header">
          <button className="back-button" type="button" onClick={handleBack}>Kembali</button>
          <div className="breadcrumb">A1-B2 · Unit {resolvedUnit} · Checkpoint</div>
        </div>
        <h1 id="klab-cp-title" tabIndex={-1} ref={feedbackRef}>
          {summaryPass ? 'Checkpoint lulus' : 'Checkpoint belum lulus'}
        </h1>
        <p>
          {summaryScore}% · ambang {plan.policy.pass}% · minimal {plan.policy.perObjectiveMin}/{plan.policy.itemsPerObjective} per tujuan · sumber {plan.source === 'bank' ? 'bank tujuan A1' : plan.source === 'curated' ? 'kurasi A2–B2 (belum ditelaah pengajar)' : 'latihan materi'}
        </p>
        <ul>
          {perObjective().map((entry) => (
            <li key={entry.id}>{entry.id}: {entry.correct}/{entry.total} · {entry.pass ? 'lulus' : 'perlu latihan'}</li>
          ))}
        </ul>
        <div className="actions screen-footer">
          {summaryPass ? (
            <button
              className="button button-primary"
              type="button"
              onClick={() => onComplete?.({
                unitNo: resolvedUnit,
                level: plan.level,
                source: plan.source,
                score: summaryScore,
                pass: summaryPass,
                perObjective: perObjective(),
                usedKeys,
              })}
            >
              Simpan hasil
            </button>
          ) : (
            <button className="button" type="button" onClick={startRemedial}>Buka remedial</button>
          )}
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="exercise" aria-label="Remedial selesai">
        <h1>Remedial selesai</h1>
        <p>Latkapan remedial habis. Ulangi checkpoint untuk hasil baru.</p>
        <button className="button button-primary" type="button" onClick={() => onRetry?.(usedKeys)}>Ulangi checkpoint</button>
      </section>
    );
  }

  const grade = gradePractice(item, chosen ?? '');
  const options = item.options ?? [];

  return (
    <section className="exercise" data-state={checked ? (grade.correct ? 'correct' : 'incorrect') : 'selected'} aria-labelledby="klab-cp-question">
      <div className="focus-header">
        <button className="back-button" type="button" onClick={handleBack}>Keluar checkpoint</button>
        <div className="breadcrumb">{plan.level} · Unit {resolvedUnit} · {stage === 'remedial' ? 'Remedial' : 'Checkpoint'}</div>
        <div className="progress-label">Soal {index + 1} dari {queue.length}</div>
      </div>
      <h1 id="klab-cp-question" ref={feedbackRef}>{item.prompt}</h1>
      <p className="question">{item.sub}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {item.mode === 'choice' ? (
          <div className="choices">
            {options.map((option, position) => (
              <label
                className="choice"
                data-state={!checked ? (option === chosen ? 'selected' : 'unselected') : (option === item.answer ? 'correct' : option === chosen ? 'incorrect' : 'unselected')}
                data-value={option}
                key={`${item.id}-${position}`}
                onClick={() => { if (!checked) setChosen(option); }}
              >
                <input
                  type="radio"
                  name={item.id}
                  value={option}
                  checked={chosen === option}
                  disabled={checked}
                  onChange={() => setChosen(option)}
                />
                <span lang="de">{option}</span>
              </label>
            ))}
          </div>
        ) : null}
        {item.mode === 'order' ? (
          <div className="choices">
            {options.map((token, position) => (
              <button
                className="choice"
                type="button"
                key={`${item.id}-token-${position}`}
                disabled={checked}
                onClick={() => setChosen(`${chosen ?? ''}${chosen ? ' ' : ''}${token}`)}
              >
                <span lang="de">{token}</span>
              </button>
            ))}
            <button className="button-secondary" type="button" disabled={checked} onClick={() => setChosen('')}>Hapus susunan</button>
            <p lang="de" aria-live="polite">{chosen ?? ''}</p>
          </div>
        ) : null}
        {item.mode === 'type' ? (
          <input aria-label="Jawaban ketik" value={chosen ?? ''} readOnly={checked} onChange={(event) => setChosen(event.target.value)} />
        ) : null}
        {checked ? (
          <div className="feedback" data-state={grade.correct ? 'correct' : 'incorrect'}>
            <div className="feedback-body">
              <h2>{grade.correct ? 'Jawabanmu benar' : 'Belum tepat'}</h2>
              <p>{grade.explanation}</p>
            </div>
          </div>
        ) : null}
        <div className="actions screen-footer">
          {!checked ? (
            <button className="button button-primary" type="submit" disabled={!chosen}>Cek jawaban</button>
          ) : (
            <button className="button button-primary" type="button" onClick={advance}>
              {stage === 'remedial' && index + 1 === queue.length ? 'Selesai remedial' : 'Lanjut'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
