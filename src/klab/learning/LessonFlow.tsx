// Alur pelajaran KLAB: materi -> pilihan -> koreksi -> contoh + WAV -> soal
// berikutnya -> Selesai. Data berasal dari units_a1..b2.json dan
// a1_lesson_practice.json / soal turunan deterministik.
// Penilaian dilakukan HANYA setelah jawaban dikirim dan masuk ke `answers`.
import { useEffect, useRef, useState } from 'react';
import cafeArt from './assets/adegan-kafe.webp';
import feedbackMascot from './assets/maskot-feedback.png';
import { useClipPlayer } from './audio';
import { CafeDialog } from './CafeDialog';
import {
  applyLessonAnswer,
  backTarget,
  buildSimilarPractice,
  clipFor,
  correctionClipFor,
  exampleSlideFor as pickExampleSlide,
  exerciseLineView,
  getLesson,
  gradePractice,
  grammarGlossaryFor,
  highlightParts,
  isLessonComplete,
  lessonScore,
  practiceItems,
  reasonLines,
  removeLessonAnswer,
  shouldHydrateFromProps,
  similarItemAvailable,
  summaryAnswers as resolveSummaryAnswers,
  translationLabel,
  type PracticeItem,
} from './logic';

export type LessonProgress = {
  unitNo: number;
  lessonNo: number;
  page: number;
  answers: Array<{ id: string; picked: string; correct: boolean }>;
};

type RouteLike = { name?: string; unitNo?: number; lessonNo?: number; textId?: number };

export type LessonFlowProps = {
  unitNo?: number;
  lessonNo?: number;
  initialPage?: number;
  initialStage?: 'lesson' | 'order' | 'payment';
  initialAnswers?: LessonProgress['answers'];
  savedScore?: number | null;
  onProgress?: (progress: LessonProgress) => void;
  onBack?: () => void;
  onFinish?: (progress: LessonProgress) => void | Promise<void>;
  route?: RouteLike;
  back?: () => void;
  targets?: readonly unknown[];
};

type Stage = 'lesson' | 'order' | 'payment';

function captureScroll(element: HTMLElement | null): Array<[HTMLElement, number]> {
  const positions: Array<[HTMLElement, number]> = [];
  for (let node = element?.parentElement ?? null; node; node = node.parentElement) {
    positions.push([node, node.scrollTop]);
  }
  return positions;
}

function restoreScroll(positions: Array<[HTMLElement, number]>) {
  for (const [node, top] of positions) node.scrollTop = top;
}

function focusTarget(element: HTMLElement | null) {
  if (!element) return;
  element.focus({ preventScroll: true });
  element.scrollIntoView({ block: 'nearest' });
}

export function LessonFlow({
  unitNo,
  lessonNo,
  initialPage = 0,
  initialStage = 'lesson',
  initialAnswers,
  savedScore = null,
  onProgress,
  onBack,
  onFinish,
  route,
  back,
}: LessonFlowProps) {
  const resolvedUnit = unitNo ?? route?.unitNo ?? 4;
  const resolvedLesson = lessonNo ?? route?.lessonNo ?? 2;
  const handleBack = onBack ?? back;
  const lesson = getLesson(resolvedUnit, resolvedLesson);
  const [activeItems, setActiveItems] = useState<PracticeItem[]>(() => practiceItems(resolvedUnit, resolvedLesson));
  const items = activeItems;
  const orderItem = items[0];
  const [exerciseIndex, setExerciseIndex] = useState(1);
  const currentItem: PracticeItem | undefined = items[exerciseIndex];
  const [page, setPage] = useState(initialPage);
  const [stage, setStage] = useState<Stage>(initialStage);
  const [picked, setPicked] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const [cafeOpen, setCafeOpen] = useState(false);
  const [answers, setAnswers] = useState<LessonProgress['answers']>(initialAnswers ?? []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLHeadingElement>(null);
  const exampleButtonRef = useRef<HTMLButtonElement>(null);
  const exampleScroll = useRef<Array<[HTMLElement, number]>>([]);
  const audio = useClipPlayer();

  const progress = (next: Partial<LessonProgress> = {}): LessonProgress => ({
    unitNo: resolvedUnit,
    lessonNo: resolvedLesson,
    page,
    answers,
    ...next,
  });
  const publish = (next: Partial<LessonProgress>) => onProgress?.(progress(next));

  useEffect(() => { focusTarget(headingRef.current); }, [page, stage, exerciseIndex]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showExample) closeExample();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showExample]);
  useEffect(() => {
    if (initialStage !== 'lesson' && !orderItem) setStage('lesson');
  }, [initialStage, orderItem]);
  // 1a mengirim initialAnswers secara async. Hidrasikan hanya sekali, sebelum
  // peserta menyentuh jawaban lokal. Tanpa penjaga ini, "Perbaiki jawaban"
  // menghapus entri salah lalu rehidrasi async mengembalikannya lagi, sehingga
  // radio tetap disabled dan Cek jawaban tidak berfungsi (temuan E2E U11 L1).
  const localAnswersTouched = useRef(false);
  useEffect(() => {
    if (shouldHydrateFromProps(localAnswersTouched.current, answers.length, initialAnswers)) {
      setAnswers(initialAnswers ?? []);
    }
  }, [initialAnswers, answers.length]);

  if (!lesson) {
    return (
      <section className="lesson" aria-label="Materi tidak tersedia">
        <h1>Materi belum tersedia</h1>
        <p>Pelajaran yang diminta tidak ada di kurikulum. Kembali ke Hari Ini.</p>
        <button className="button" type="button" onClick={handleBack}>Kembali</button>
      </section>
    );
  }

  const slide = lesson.slides[Math.min(page, lesson.slides.length - 1)];
  const slideAudio = clipFor(slide.exampleDe);
  const orderSubmitted = orderItem ? answers.find((entry) => entry.id === orderItem.id) : undefined;
  const orderGrade = orderItem && orderSubmitted ? gradePractice(orderItem, orderSubmitted.picked) : null;
  const submitted = currentItem ? answers.find((entry) => entry.id === currentItem.id) : undefined;
  const currentGrade = currentItem && submitted ? gradePractice(currentItem, submitted.picked) : null;
  const cafeOrder = orderItem?.id === 'lp-u4-l2-01';
  // 1a memuat initialAnswers secara async dari SQLite setelah komponen mount.
  // useState hanya membaca props saat render pertama, jadi ringkasan harus
  // memakai jawaban props bila jawaban lokal masih kosong.
  const summaryAnswers = resolveSummaryAnswers(answers, initialAnswers);
  const computedScore = lessonScore(summaryAnswers);
  const displayScore = savedScore ?? computedScore;
  const allAnswered = isLessonComplete(items, answers);

  // Contoh bantuan mengikuti soal aktif, bukan halaman materi terakhir.
  const exampleSlide = pickExampleSlide(lesson, stage === 'order' ? orderItem : currentItem);
  const exampleAudio = clipFor(exampleSlide.exampleDe);
  const correctionClip = orderItem ? correctionClipFor(orderItem.id, orderItem.prompt, orderItem.answer) : null;
  const glossary = grammarGlossaryFor(lesson);
  const highlights = highlightParts(slide.exampleDe, slide.highlight);
  const translationNote = translationLabel(slide);

  function closeExample() {
    audio.stop();
    setShowExample(false);
    exampleButtonRef.current?.focus({ preventScroll: true });
    restoreScroll(exampleScroll.current);
  }

  function storeAnswer(item: PracticeItem, value: string) {
    localAnswersTouched.current = true;
    const next = applyLessonAnswer(answers, item, value);
    setAnswers(next);
    publish({ answers: next });
    window.setTimeout(() => focusTarget(feedbackRef.current), 0);
  }

  function checkOrder() {
    if (!orderItem || !picked || orderSubmitted) return;
    storeAnswer(orderItem, picked);
  }

  function fixOrder() {
    if (!orderItem || !orderSubmitted) return;
    localAnswersTouched.current = true;
    setPicked(orderSubmitted.picked);
    setAnswers((current) => removeLessonAnswer(current, orderItem.id));
    setShowReason(false);
    setShowExample(false);
    audio.stop();
  }

  function trySimilar(item: PracticeItem) {
    const similar = buildSimilarPractice(item, resolvedUnit, resolvedLesson, activeItems.map((entry) => entry.id));
    if (!similar) return;
    const nextIndex = activeItems.length;
    setActiveItems((current) => [...current, similar]);
    setExerciseIndex(nextIndex);
    setPicked(null);
    setTyped('');
    setShowReason(false);
    setStage('payment');
  }

  function checkCurrent() {
    if (!currentItem || !typed.trim() || submitted) return;
    storeAnswer(currentItem, typed.trim());
  }

  function fixCurrent() {
    if (!currentItem || !submitted) return;
    localAnswersTouched.current = true;
    setTyped(submitted.picked);
    setAnswers((current) => removeLessonAnswer(current, currentItem.id));
    audio.stop();
  }

  function backFromExercise() {
    const target = backTarget(exerciseIndex);
    if (target.kind === 'previous') {
      const previous = items[target.index];
      setExerciseIndex(target.index);
      setTyped(answers.find((entry) => entry.id === previous?.id)?.picked ?? '');
      return;
    }
    setStage('order');
  }

  function nextPage() {
    audio.stop();
    if (page < (lesson?.slides.length ?? 0) - 1) {
      setPage(page + 1);
      publish({ page: page + 1 });
    } else if (orderItem) {
      setStage('order');
    } else {
      void finish();
    }
  }

  function jumpToPractice() {
    if (!orderItem) return;
    audio.stop();
    setStage('order');
    publish({ page: (lesson?.slides.length ?? 1) - 1 });
  }

  async function finish() {
    if (saving) return;
    if (!allAnswered) return;
    setSaving(true);
    setSaveError(false);
    try {
      await onFinish?.(progress({ answers }));
      handleBack?.();
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  const finishButton = (
    <div className="actions screen-footer">
      <button className="button button-primary" type="button" disabled={saving || !allAnswered} onClick={() => void finish()}>
        {saving ? 'Menyimpan…' : 'Selesai'}
      </button>
      {saveError ? <p role="alert">Progres belum tersimpan. Tekan Selesai untuk mencoba lagi.</p> : null}
    </div>
  );

  const savedSummary = summaryAnswers.length > 0 ? (
    <div className="lesson-note" data-testid="saved-summary" aria-label="Jawaban tersimpan">
      <strong>{initialAnswers ? 'Progres tersimpan' : 'Progres sesi ini'}: {displayScore}%</strong>
      {' · '}
      {summaryAnswers.map((entry) => `${entry.id}: ${entry.picked} (${entry.correct ? 'benar' : 'salah'})`).join(' · ')}
    </div>
  ) : null;

  if (stage === 'lesson') {
    return (
      <section className="lesson" aria-labelledby="klab-lesson-heading">
        <div className="focus-header">
          <button className="back-button" type="button" onClick={page > 0 ? () => { audio.stop(); setPage(page - 1); } : handleBack}>Kembali</button>
          <div className="breadcrumb">{lesson.level} · Unit {resolvedUnit} · Pelajaran {resolvedLesson}</div>
          <div className="progress-label">Materi {page + 1} dari {lesson.slides.length}</div>
        </div>
        {savedSummary}
        <div className="lesson-grid">
          <div>
            <h1 id="klab-lesson-heading" ref={headingRef}>{slide.title}</h1>
            {slide.body.map((line, index) => {
              const view = exerciseLineView(line);
              if (view.kind === 'pair') {
                return (
                  <p key={`${slide.title}-${index}`} className="lesson-note">
                    <span lang="de">{view.de}</span> — {view.id}
                  </p>
                );
              }
              if (view.kind === 'untranslated') {
                return (
                  <p key={`${slide.title}-${index}`} className="lesson-note">
                    <span lang="de">{view.de}</span>{' '}
                    <span className="translation-hint" data-testid="translation-hint">{view.label}</span>
                  </p>
                );
              }
              return <p key={`${slide.title}-${index}`} className="lesson-note">{view.text}</p>;
            })}
            {glossary.length > 0 ? (
              <div className="lesson-note" data-testid="grammar-glossary" aria-label="Istilah tata bahasa">
                {glossary.map((entry) => (
                  <p key={entry.term}><b>{entry.term}</b>: {entry.definition}</p>
                ))}
              </div>
            ) : null}
            <div className="lesson-example">
              <p lang="de">
                {highlights.map((part, index) =>
                  part.mark ? <mark key={index}>{part.text}</mark> : <span key={index}>{part.text}</span>,
                )}
              </p>
              <p>{slide.exampleId || translationNote}</p>
              <div className="actions">
                <button className="button" type="button" aria-describedby="klab-lesson-audio-status"
                  onClick={() => void audio.play(slideAudio ? [slideAudio] : [], 'Memutar contoh materi…')}>
                  {audio.state === 'playing' ? 'Hentikan audio' : 'Dengarkan'}
                </button>
                {resolvedUnit === 4 && resolvedLesson === 2 ? (
                  <button className="button" type="button" data-testid="cafe-dialog-open"
                    onClick={() => { audio.stop(); setCafeOpen(true); }}>
                    Dengarkan dialog
                  </button>
                ) : null}
              </div>
              <p id="klab-lesson-audio-status" data-state={audio.state} role="status">{audio.message}</p>
            </div>
            <div className="actions screen-footer">
              <button className="button button-primary" type="button" onClick={nextPage}>
                {page === lesson.slides.length - 1 ? (orderItem ? 'Mulai latihan' : 'Selesai') : 'Berikutnya'}
              </button>
              {orderItem && page < lesson.slides.length - 1 ? (
                <button className="button" type="button" onClick={jumpToPractice}>Langsung ke latihan</button>
              ) : null}
              {!orderItem ? <span className="lesson-note">Latihan khusus pelajaran ini belum tersedia.</span> : null}
            </div>
          </div>
          {resolvedUnit === 4 && <figure className="lesson-art">
            <img src={cafeArt} alt="" />
            <figcaption>Im Café · A1 Unit 4</figcaption>
          </figure>}
        </div>
        <CafeDialog
          open={cafeOpen}
          onDismiss={() => setCafeOpen(false)}
          onExit={() => { setCafeOpen(false); handleBack?.(); }}
        />
      </section>
    );
  }

  if (!orderItem) return <section className="lesson"><h1>Latihan tidak tersedia</h1>{finishButton}</section>;

  if (stage === 'order') {
    const choiceStates = (orderItem.options ?? []).map((option) => {
      if (!orderSubmitted) return option === picked ? 'selected' : 'unselected';
      if (option === orderItem.answer) return 'correct';
      if (option === orderSubmitted.picked) return 'incorrect';
      return 'unselected';
    });
    return (
      <section className="exercise" data-state={orderSubmitted ? (orderGrade?.correct ? 'correct' : 'incorrect') : picked ? 'selected' : 'unselected'} aria-labelledby="klab-exercise-heading">
        <div className="focus-header">
          <button className="back-button" type="button" onClick={() => setStage('lesson')}>Kembali ke materi</button>
          <div className="breadcrumb">{lesson.level} · Unit {resolvedUnit} · Pelajaran {resolvedLesson} · Latihan 1</div>
        </div>
        {savedSummary}
        <h1 id="klab-exercise-heading" ref={feedbackRef}>{orderItem.prompt}</h1>
        <p className="question">{orderItem.sub}</p>
        <form className="choices" onSubmit={(event) => { event.preventDefault(); checkOrder(); }}>
          {(orderItem.options ?? []).map((option, index) => (
            <label key={option} className="choice" data-state={choiceStates[index]} data-value={option}
              onClick={() => { if (!orderSubmitted) setPicked(option); }}>
              <input type="radio" name="article-choice" value={option}
                checked={(picked ?? orderSubmitted?.picked) === option}
                disabled={!!orderSubmitted} onChange={() => setPicked(option)} />
              <span lang="de">{option}</span>
              {orderSubmitted && choiceStates[index] !== 'unselected' ? (
                <span className="choice-status">
                  {option === orderItem.answer ? (orderGrade?.correct ? 'Pilihanmu · benar' : 'Jawaban benar') : 'Pilihanmu'}
                </span>
              ) : null}
            </label>
          ))}
          <div className={`feedback ${orderSubmitted ? '' : 'is-hidden'}`} data-state={orderGrade?.correct ? 'correct' : 'incorrect'} hidden={!orderSubmitted}>
            <div className="feedback-body">
              <h2 aria-live="polite">
                <span aria-hidden="true">{orderGrade?.correct ? '✓ ' : '✗ '}</span>
                {orderGrade?.correct ? 'Jawabanmu benar' : 'Belum tepat'}
              </h2>
              <p>{orderGrade?.explanation}</p>
            </div>
            <img className="feedback-art" src={feedbackMascot} alt="" />
          </div>
          <div className="actions" hidden={!!orderSubmitted}>
            <button className="button button-primary" type="submit" disabled={!picked}>Cek jawaban</button>
          </div>
        </form>
        {orderSubmitted ? (
          <div className="actions screen-footer">
            <button className="button" type="button" aria-expanded={showReason} onClick={() => setShowReason((value) => !value)}>
              {cafeOrder ? 'Mengapa einen?' : 'Mengapa jawaban ini?'}
            </button>
            <button className="button" type="button" ref={exampleButtonRef} aria-expanded={showExample}
              aria-describedby="klab-example-audio-status"
              onClick={() => {
                if (showExample) { closeExample(); return; }
                exampleScroll.current = captureScroll(exampleButtonRef.current);
                setShowExample(true);
                window.setTimeout(() => focusTarget(document.getElementById('klab-example-title')), 0);
              }}>
              Lihat contoh dari materi
            </button>
            {!orderGrade?.correct ? (
              <button className="button-secondary" type="button" onClick={fixOrder}>Perbaiki jawaban</button>
            ) : null}
            {items.length > 1 ? (
              <button className="button button-primary" type="button" onClick={() => setStage('payment')}>Lanjut</button>
            ) : finishButton}
            {similarItemAvailable(resolvedUnit, resolvedLesson, orderItem.objectiveId, orderItem.id) ? (
              <button className="button-secondary" type="button" onClick={() => trySimilar(orderItem)}>Coba soal sejenis</button>
            ) : null}
          </div>
        ) : null}
        {showReason ? (
          <div className="explanation" role="region" aria-label="Penjelasan jawaban">
            {reasonLines(orderItem).map((line, index) => <p key={index} lang={index === 0 && cafeOrder ? 'de' : undefined}>{line}</p>)}
            {correctionClip && (
              <button className="button" type="button" data-testid="cafe-correction-audio"
                onClick={() => void audio.play([correctionClip], 'Memutar koreksi…')}>
                Dengarkan koreksi
              </button>
            )}
          </div>
        ) : null}
        {showExample ? (
          <div className="example-panel" id="klab-example-panel" role="dialog" aria-label="Contoh dari materi">
            <h2 id="klab-example-title" tabIndex={-1} lang="de">{exampleSlide.exampleDe}</h2>
            <p>{exampleSlide.exampleId}</p>
            <div className="actions">
              <button className="button" type="button" aria-describedby="klab-example-audio-status"
                onClick={() => void audio.play(exampleAudio ? [exampleAudio] : [], 'Memutar contoh…')}>
                {audio.state === 'playing' ? 'Hentikan audio' : 'Dengarkan'}
              </button>
              <button className="button-secondary" type="button" onClick={closeExample}>Kembali ke soal</button>
            </div>
            <p id="klab-example-audio-status" data-state={audio.state} role="status">{audio.message}</p>
          </div>
        ) : null}
      </section>
    );
  }

  const choiceOptions = currentItem?.mode === 'choice' ? (currentItem.options ?? []) : [];
  return (
    <section className="exercise" data-state={currentGrade?.correct ? 'correct' : currentGrade ? 'incorrect' : 'unselected'} aria-labelledby="klab-payment-heading">
      <div className="focus-header">
        <button className="back-button" type="button" onClick={backFromExercise}>
          {exerciseIndex > 1 ? 'Kembali ke soal sebelumnya' : 'Kembali ke koreksi'}
        </button>
        <div className="breadcrumb">{lesson.level} · Unit {resolvedUnit} · Pelajaran {resolvedLesson} · Latihan {exerciseIndex + 1}</div>
        <div className="progress-label">Soal {exerciseIndex + 1} dari {items.length}</div>
      </div>
      {savedSummary}
      <h1 id="klab-payment-heading" ref={feedbackRef}>{currentItem?.prompt ?? 'Latihan selesai'}</h1>
      <p className="question">{currentItem?.sub}</p>
      {currentItem ? (
        <form onSubmit={(event) => { event.preventDefault(); checkCurrent(); }}>
          {currentItem.mode === 'choice' ? (
            <div className="choices">
              {choiceOptions.map((option) => (
                <label key={option} className="choice" data-state={!submitted ? (option === typed ? 'selected' : 'unselected') : (option === currentItem.answer ? 'correct' : option === submitted.picked ? 'incorrect' : 'unselected')}
                  data-value={option} onClick={() => { if (!submitted) setTyped(option); }}>
                  <input type="radio" name={`ex-${currentItem.id}`} value={option} checked={typed === option}
                    disabled={!!submitted} onChange={() => setTyped(option)} />
                  <span lang="de">{option}</span>
                </label>
              ))}
            </div>
          ) : null}
          {currentItem.mode === 'order' ? (
            <div className="choices">
              {(currentItem.options ?? currentItem.tokens ?? []).map((token, index) => (
                <button className="choice" type="button" key={`${currentItem.id}-token-${index}`} disabled={!!submitted}
                  onClick={() => setTyped(`${typed}${typed ? ' ' : ''}${token}`)}>
                  <span lang="de">{token}</span>
                </button>
              ))}
              <button className="button-secondary" type="button" disabled={!!submitted} onClick={() => setTyped('')}>Hapus susunan</button>
            </div>
          ) : null}
          {currentItem.mode !== 'choice' ? (
            <input aria-label="Jawaban latihan" value={submitted?.picked ?? typed} readOnly={!!submitted} onChange={(event) => setTyped(event.target.value)} />
          ) : null}
          <div className="actions">
            <button className="button button-primary" type="submit" disabled={!typed.trim() || !!submitted}>Cek jawaban</button>
          </div>
          {currentGrade ? (
            <div className="feedback" data-state={currentGrade.correct ? 'correct' : 'incorrect'}>
              <div className="feedback-body">
                <h2 aria-live="polite">
                  <span aria-hidden="true">{currentGrade.correct ? '✓ ' : '✗ '}</span>
                  {currentGrade.correct ? 'Jawabanmu benar' : 'Belum tepat'}
                </h2>
                <p>{currentGrade.explanation}</p>
              </div>
            </div>
          ) : null}
        </form>
      ) : null}
      {submitted ? (
        <div className="actions screen-footer">
          {!currentGrade?.correct ? (
            <button className="button-secondary" type="button" onClick={fixCurrent}>Perbaiki jawaban</button>
          ) : null}
          {currentItem && similarItemAvailable(resolvedUnit, resolvedLesson, currentItem.objectiveId, currentItem.id) ? (
            <button className="button-secondary" type="button" onClick={() => trySimilar(currentItem)}>Coba soal sejenis</button>
          ) : null}
          {exerciseIndex + 1 < items.length ? (
            <button className="button button-primary" type="button" onClick={() => {
              const next = items[exerciseIndex + 1];
              setTyped(answers.find((entry) => entry.id === next?.id)?.picked ?? '');
              setExerciseIndex(exerciseIndex + 1);
            }}>Lanjut</button>
          ) : finishButton}
        </div>
      ) : null}
    </section>
  );
}
