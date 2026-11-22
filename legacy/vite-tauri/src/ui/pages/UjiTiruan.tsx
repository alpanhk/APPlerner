// F8: uji tiruan A1 bergaya Goethe/telc. Hören/Lesen dinilai objektif;
// Schreiben/Sprechen memakai rubrik mandiri. Bukan ujian resmi/sertifikasi.
import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../PageShell";
import mockRaw from "../../data/practice/a1_mock_exam.json";
import listeningRaw from "../../data/practice/a1_listening.json";
import { speak, stopSpeech } from "../../srs/tts";
import getDb, { nowIso } from "../../stores/db";
import { choiceMatches } from "../../srs/answers";
import { makeAttemptSeed, mulberry32, buildOptionOrders } from "../../lessons/optionOrder";
import { usePersistedSession } from "./usePersistedSession";
import {
  beginExamAttempt,
  emptyExam,
  nextDeadline,
  remainingSeconds,
  sessionKeys,
  validateExam,
  type ExamResult,
  type ExamSession,
} from "./latihanState";

type DialogueLine = { speaker: string; de: string };
type DialogueQuestion = { prompt: string; options: string[]; answer: string; explanation: string };
type Dialogue = {
  id: string;
  title: string;
  context: string;
  lines: DialogueLine[];
  questions: DialogueQuestion[];
};
type ListeningFile = { level: string; source: string; items: Dialogue[] };

type ListeningRef = { dialogueId: string; questionIndex: number };
type ReadingItem = {
  text: string;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};
type WritingTask = {
  situation: string;
  mustInclude: string[];
  model: string;
  checklist: string[];
};
type SpeakingPrompt = { prompt: string; model: string; checklist: string[] };
type MockSection = {
  id: string;
  title: string;
  minutes: number;
  kind: "listening" | "reading" | "writing" | "speaking";
  items?: ListeningRef[] | ReadingItem[];
  task?: WritingTask;
  prompts?: SpeakingPrompt[];
};
type MockFile = { level: string; source: string; sections: MockSection[] };

type MockResult = ExamResult;

const MOCK = mockRaw as unknown as MockFile;
const DIALOGUES = (listeningRaw as unknown as ListeningFile).items;
const dialogueById = new Map(DIALOGUES.map((dialogue) => [dialogue.id, dialogue]));

// Susun urutan opsi untuk seluruh soal objektif satu percobaan. Kunci tetap
// pada `answer`; hanya posisi tombol yang berubah.
function buildMockOptionOrders(): Record<string, string[]> {
  const rng = mulberry32(makeAttemptSeed());
  const entries: { key: string; options: string[] }[] = [];
  const listening = MOCK.sections.find((section) => section.kind === "listening");
  const reading = MOCK.sections.find((section) => section.kind === "reading");
  (listening?.items as ListeningRef[] | undefined)?.forEach((ref, index) => {
    const question = dialogueById.get(ref.dialogueId)?.questions[ref.questionIndex];
    if (question) entries.push({ key: `${listening!.id}:${index}`, options: question.options });
  });
  (reading?.items as ReadingItem[] | undefined)?.forEach((item, index) => {
    entries.push({ key: `${reading!.id}:${index}`, options: item.options });
  });
  return buildOptionOrders(entries, rng);
}

const fmtTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

function ChoiceOptions({
  options,
  selected,
  disabled,
  onSelect,
}: {
  options: string[];
  selected: string | undefined;
  disabled: boolean;
  onSelect: (option: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          disabled={disabled}
          onClick={() => onSelect(option)}
          className={
            "rounded border px-3 py-1.5 text-left text-sm disabled:opacity-60 " +
            (option === selected
              ? "border-gold bg-cream font-semibold"
              : "border-line bg-cream/60 hover:border-gold hover:bg-parchment")
          }
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default function UjiTiruan() {
  const examSession = usePersistedSession<ExamSession>({
    key: sessionKeys.exam,
    create: emptyExam,
    validate: validateExam,
  });
  const exam = examSession.data;
  const { started, finished, sectionIndex, answers, writingChecks, speakingChecks, optionOrders, audioFailed, deadlineAt } = exam;

  const [writingDraft, setWritingDraft] = useState("");
  const [playing, setPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<MockResult | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const draftRef = useRef("");
  const draftTimer = useRef<number | null>(null);
  const playToken = useRef(0);

  useEffect(() => {
    return () => {
      playToken.current += 1;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    // Pindah bagian atau menyelesaikan ujian menghentikan dialog bagian lama.
    playToken.current += 1;
    stopSpeech();
    setPlaying(false);
  }, [sectionIndex, finished]);

  const listeningSection = MOCK.sections.find((section) => section.kind === "listening");
  const readingSection = MOCK.sections.find((section) => section.kind === "reading");
  const writingSection = MOCK.sections.find((section) => section.kind === "writing");
  const speakingSection = MOCK.sections.find((section) => section.kind === "speaking");
  const writingTask = writingSection?.task;
  const speakingPrompts = speakingSection?.prompts ?? [];
  const timeLeft = remainingSeconds(deadlineAt, nowMs);
  const timeUp = started && !finished && deadlineAt !== null && timeLeft <= 0;
  const examLoading =
    examSession.status === "loading" || examSession.dataKey !== sessionKeys.exam;
  const sessionNote =
    examSession.status === "failed"
      ? `Sesi ujian belum tersimpan: ${examSession.error}`
      : examSession.status === "saving"
        ? "Menyimpan sesi ujian…"
        : examSession.status === "saved"
          ? "Sesi ujian tersimpan di perangkat ini."
          : examSession.status === "loading"
            ? "Memuat sesi ujian tersimpan…"
            : "";

  useEffect(() => {
    let alive = true;
    getDb()
      .then((db) =>
        db.select<{ value: string }[]>("SELECT value FROM config WHERE key = 'mock_a1_last_result'"),
      )
      .then((rows) => {
        if (!alive || rows.length === 0) return;
        setLastResult(JSON.parse(rows[0].value) as MockResult);
      })
      .catch((error) => console.error("mock result:", error));
    return () => {
      alive = false;
    };
  }, []);

  // Draft lokal disinkronkan saat sesi selesai dimuat, bukan pada setiap save,
  // agar tulisan yang sedang diketik tidak dikembalikan ke versi lama.
  useEffect(() => {
    if (examSession.dataKey !== sessionKeys.exam) return;
    setWritingDraft(exam.writingDraft);
    draftRef.current = exam.writingDraft;
  }, [examSession.dataKey, examSession.loadVersion]);

  useEffect(() => {
    if (!started || finished) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [started, finished]);

  useEffect(() => {
    return () => {
      if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    };
  }, []);

  const listeningScore = useMemo(() => {
    if (!listeningSection?.items) return { correct: 0, total: 0, answered: 0, skipped: 0, audioFailed: 0 };
    let correct = 0;
    let total = 0;
    let answered = 0;
    let audioFailedCount = 0;
    (listeningSection.items as ListeningRef[]).forEach((ref, index) => {
      const question = dialogueById.get(ref.dialogueId)?.questions[ref.questionIndex];
      if (!question) return;
      total += 1;
      if (audioFailed[ref.dialogueId]) audioFailedCount += 1;
      const selected = answers[`${listeningSection.id}:${index}`];
      if (selected !== undefined) answered += 1;
      if (selected !== undefined && choiceMatches(selected, question.answer)) correct += 1;
    });
    return { correct, total, answered, skipped: total - answered, audioFailed: audioFailedCount };
  }, [answers, listeningSection, audioFailed]);

  const readingScore = useMemo(() => {
    if (!readingSection?.items) return { correct: 0, total: 0, answered: 0, skipped: 0 };
    let correct = 0;
    let total = 0;
    let answered = 0;
    (readingSection.items as ReadingItem[]).forEach((item, index) => {
      total += 1;
      const selected = answers[`${readingSection.id}:${index}`];
      if (selected !== undefined) answered += 1;
      if (selected !== undefined && choiceMatches(selected, item.answer)) correct += 1;
    });
    return { correct, total, answered, skipped: total - answered };
  }, [answers, readingSection]);

  const writingChecked = writingTask
    ? writingTask.checklist.filter((_, index) => writingChecks[`${writingSection?.id}:${index}`]).length
    : 0;
  const speakingTotal = speakingPrompts.reduce((sum, prompt) => sum + prompt.checklist.length, 0);
  const speakingChecked = speakingPrompts.reduce(
    (sum, prompt, promptIndex) =>
      sum +
      prompt.checklist.filter((_, index) => speakingChecks[`${speakingSection?.id}:${promptIndex}:${index}`]).length,
    0,
  );

  const startExam = () => {
    const now = Date.now();
    const first = MOCK.sections[0];
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    setNowMs(now);
    setWritingDraft("");
    draftRef.current = "";
    setShowReview(false);
    // replace, bukan delete+write: hasil percobaan selesai terakhir tetap
    // committed jika penulisan state awal baru gagal atau app ditutup.
    examSession.replace({
      ...beginExamAttempt(exam),
      optionOrders: buildMockOptionOrders(),
      deadlineAt: first ? nextDeadline(now, first.minutes) : null,
    });
  };

  const finishExam = () => {
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    const result: MockResult = {
      ts: nowIso(),
      hoeren: listeningScore,
      lesen: readingScore,
      schreiben: { checked: writingChecked, total: writingTask?.checklist.length ?? 0 },
      sprechen: { checked: speakingChecked, total: speakingTotal },
    };
    // Satu payload: finished + hasil akhir. Statistik membaca commit sesi ini,
    // bukan tulisan config terpisah yang bisa gagal setelah sesi tersimpan.
    examSession.update((prev) => ({
      ...prev,
      finished: true,
      writingDraft: draftRef.current,
      result,
      lastResult: result,
    }));
    setLastResult(result);
  };

  const nextSection = () => {
    const nextIndex = sectionIndex + 1;
    if (nextIndex >= MOCK.sections.length) {
      finishExam();
      return;
    }
    const now = Date.now();
    setNowMs(now);
    examSession.update((prev) => ({
      ...prev,
      sectionIndex: nextIndex,
      writingDraft: draftRef.current,
      deadlineAt: nextDeadline(now, MOCK.sections[nextIndex].minutes),
    }));
  };

  const playDialogue = async (dialogue: Dialogue) => {
    if (playing) return;
    const token = ++playToken.current;
    setPlaying(true);
    let failed = false;
    for (const line of dialogue.lines) {
      if (token !== playToken.current) return;
      const source = await speak(line.de);
      if (token !== playToken.current) return;
      if (!source) {
        failed = true;
        break;
      }
    }
    // Audio gagal dicatat terpisah dari jawaban salah; pertanyaan yang tidak
    // terjawab karena audio tidak tersedia tidak boleh dihitung sebagai salah.
    if (token !== playToken.current) return;
    examSession.update((prev) => {
      const next = { ...prev.audioFailed };
      if (failed) next[dialogue.id] = true;
      else delete next[dialogue.id];
      return { ...prev, audioFailed: next };
    });
    setPlaying(false);
  };

  const changeWriting = (value: string) => {
    setWritingDraft(value);
    draftRef.current = value;
    if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      examSession.update((prev) => ({ ...prev, writingDraft: value }));
      draftTimer.current = null;
    }, 250);
  };

  const flushWriting = () => {
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    examSession.update((prev) => ({ ...prev, writingDraft: draftRef.current }));
  };

  if (!started) {
    return (
      <PageShell
        title="Uji Tiruan A1"
        sub="Latihan bergaya Goethe/telc A1: Hören, Lesen, Schreiben, Sprechen. Bukan ujian resmi, bukan sertifikasi, dan bukan jaminan kelulusan."
        meta="F8 · A1"
      >
        <div className="card px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK.sections.map((section) => (
              <div key={section.id} className="rounded border border-line bg-cream px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg">{section.title}</span>
                  <span className="badge">{section.minutes} menit</span>
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  {section.kind === "listening"
                    ? "5 pertanyaan dari dialog; dinilai objektif."
                    : section.kind === "reading"
                      ? "5 teks pendek; dinilai objektif."
                      : section.kind === "writing"
                        ? "Satu tugas menulis; rubrik mandiri, tanpa skor otomatis."
                        : "Tiga prompt bicara; rubrik mandiri, tanpa rekaman/penilaian suara."}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-ink-soft">
            Timer berjalan per bagian. Hören/Lesen punya kunci jawaban; Schreiben/Sprechen hanya daftar
            periksa. Hasil terakhir disimpan dan ditampilkan di Statistik.
          </p>
          {lastResult ? (
            <div className="mt-4 rounded border border-line bg-parchment px-4 py-3 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Hasil terakhir</div>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                <span>Hören {lastResult.hoeren.correct}/{lastResult.hoeren.total}</span>
                <span>Lesen {lastResult.lesen.correct}/{lastResult.lesen.total}</span>
                <span>
                  Schreiben {lastResult.schreiben.checked}/{lastResult.schreiben.total} (mandiri)
                </span>
                <span>
                  Sprechen {lastResult.sprechen.checked}/{lastResult.sprechen.total} (mandiri)
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-[11px] text-ink-soft">Belum ada hasil uji tiruan.</p>
          )}
          <button
            className="btn-gold mt-5"
            disabled={examLoading}
            onClick={startExam}
          >
            {examLoading ? "Memuat sesi…" : "Mulai uji tiruan"}
          </button>
        </div>
      </PageShell>
    );
  }

  if (finished) {
    return (
      <PageShell
        title="Hasil Uji Tiruan A1"
        sub="Hören dan Lesen dinilai dari jawaban; Schreiben dan Sprechen hanya rubrik mandiri. Hasil ini bukan skor resmi Goethe/telc."
        meta="F8 · A1"
      >
        <div className="card px-6 py-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded border border-line bg-cream px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Hören</div>
              <div className="font-display text-3xl text-gold-deep">
                {listeningScore.correct}/{listeningScore.total}
              </div>
              <p className="text-[11px] text-ink-soft">Dinilai objektif dari pertanyaan dialog.</p>
              <p className="mt-1 text-[10px] text-ink-soft">
                terjawab {listeningScore.answered} · salah {listeningScore.answered - listeningScore.correct} · tidak dikerjakan {listeningScore.skipped}
                {listeningScore.audioFailed > 0
                  ? ` · audio gagal ${listeningScore.audioFailed} soal (bukan jawaban salah)`
                  : ""}
              </p>
            </div>
            <div className="rounded border border-line bg-cream px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Lesen</div>
              <div className="font-display text-3xl text-gold-deep">
                {readingScore.correct}/{readingScore.total}
              </div>
              <p className="text-[11px] text-ink-soft">Dinilai objektif dari teks pendek.</p>
              <p className="mt-1 text-[10px] text-ink-soft">
                terjawab {readingScore.answered} · salah {readingScore.answered - readingScore.correct} · tidak dikerjakan {readingScore.skipped}
              </p>
            </div>
            <div className="rounded border border-line bg-cream px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Schreiben</div>
              <div className="font-display text-3xl text-gold-deep">
                {!writingDraft.trim() ? "—" : `${writingChecked}/${writingTask?.checklist.length ?? 0}`}
              </div>
              <p className="text-[11px] text-ink-soft">
                {!writingDraft.trim()
                  ? "Tidak dikerjakan; tidak ada nilai."
                  : "Daftar periksa mandiri; tidak dinilai otomatis."}
              </p>
            </div>
            <div className="rounded border border-line bg-cream px-4 py-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Sprechen</div>
              <div className="font-display text-3xl text-gold-deep">
                {speakingChecked === 0 ? "—" : `${speakingChecked}/${speakingTotal}`}
              </div>
              <p className="text-[11px] text-ink-soft">
                {speakingChecked === 0
                  ? "Rubrik belum diisi; tidak ada penilaian suara."
                  : "Rubrik mandiri; tidak ada rekaman/penilaian suara."}
              </p>
            </div>
          </div>

          {sessionNote ? (
            <p className="mt-2 text-[11px] text-ink-soft" role={examSession.status === "failed" ? "alert" : undefined}>
              {sessionNote}
              {examSession.status === "failed" ? (
                <button className="ml-2 underline hover:text-ink" onClick={examSession.retry}>
                  Coba simpan lagi
                </button>
              ) : null}
            </p>
          ) : null}
          <p className="mt-4 text-xs text-ink-soft">
            Jangan menafsirkan hasil ini sebagai kesiapan ujian atau penguasaan CEFR. Latihan ini hanya
            mengukur jawaban pada set soal yang terbatas.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-gold" onClick={startExam}>
              Ulangi uji tiruan
            </button>
            <button
              className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
              onClick={() => setShowReview((value) => !value)}
            >
              {showReview ? "Sembunyikan pembahasan" : "Tampilkan pembahasan"}
            </button>
          </div>

          {showReview ? (
            <div className="mt-5 space-y-4">
              <div>
                <h3 className="font-display text-xl">Pembahasan Hören</h3>
                <div className="mt-2 space-y-3">
                  {(listeningSection?.items as ListeningRef[] | undefined)?.map((ref, index) => {
                    const dialogue = dialogueById.get(ref.dialogueId);
                    const question = dialogue?.questions[ref.questionIndex];
                    if (!question) return null;
                    const selected = answers[`${listeningSection?.id}:${index}`];
                    return (
                      <div key={`hoeren-review-${index}`} className="rounded border border-line bg-cream px-4 py-3 text-sm">
                        <div className="text-[11px] text-ink-soft">{dialogue?.title}</div>
                        <div className="font-semibold">{question.prompt}</div>
                        <div className="mt-1">
                          {selected === undefined ? "Tidak dikerjakan" : `Jawabanmu: ${selected}`} · Kunci: <b>{question.answer}</b>
                        </div>
                        {audioFailed[ref.dialogueId] ? (
                          <div className="mt-1 text-[11px] text-rose-700">
                            Audio dialog ini gagal diputar; jawaban kosong bukan berarti salah.
                          </div>
                        ) : null}
                        <div className="mt-1 text-[11px] text-ink-soft">{question.explanation}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="font-display text-xl">Pembahasan Lesen</h3>
                <div className="mt-2 space-y-3">
                  {(readingSection?.items as ReadingItem[] | undefined)?.map((item, index) => {
                    const selected = answers[`${readingSection?.id}:${index}`];
                    return (
                      <div key={`lesen-review-${index}`} className="rounded border border-line bg-cream px-4 py-3 text-sm">
                        <div className="font-semibold">{item.prompt}</div>
                        <div className="mt-1">
                          {selected === undefined ? "Tidak dikerjakan" : `Jawabanmu: ${selected}`} · Kunci: <b>{item.answer}</b>
                        </div>
                        <div className="mt-1 text-[11px] text-ink-soft">{item.explanation}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {writingTask ? (
                <div>
                  <h3 className="font-display text-xl">Contoh Schreiben</h3>
                  <div className="mt-2 rounded border border-gold/40 bg-cream px-4 py-3 text-sm">
                    <p>{writingTask.model}</p>
                    <p className="mt-2 text-[11px] text-ink-soft">
                      Bandingkan struktur dan unsur wajib; jangan menyalin mentah-mentah.
                    </p>
                  </div>
                </div>
              ) : null}

              {speakingPrompts.length > 0 ? (
                <div>
                  <h3 className="font-display text-xl">Contoh Sprechen</h3>
                  <div className="mt-2 space-y-2">
                    {speakingPrompts.map((prompt, index) => (
                      <div key={`sprechen-review-${index}`} className="rounded border border-line bg-cream px-4 py-3 text-sm">
                        <div className="font-semibold">{prompt.prompt}</div>
                        <p className="mt-1">{prompt.model}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </PageShell>
    );
  }

  const section = MOCK.sections[sectionIndex];
  if (!section) return null;

  return (
    <PageShell
      title={`Uji Tiruan A1 · ${section.title}`}
      sub="Kerjakan tanpa melihat pembahasan. Timer berjalan per bagian; jawaban dapat diubah sampai bagian berakhir."
      meta="F8 · A1"
    >
      <div className="card px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            Bagian <b>{sectionIndex + 1}</b> dari <b>{MOCK.sections.length}</b> · {section.title}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="badge">Timer {fmtTime(timeLeft)}</span>
            {timeUp ? <span className="text-xs font-semibold text-rose-700">Waktu habis</span> : null}
          </div>
        </div>
        {sessionNote ? (
          <p className="mt-2 text-[11px] text-ink-soft" role={examSession.status === "failed" ? "alert" : undefined}>
            {sessionNote}
            {examSession.status === "failed" ? (
              <button className="ml-2 underline hover:text-ink" onClick={examSession.retry}>
                Coba simpan lagi
              </button>
            ) : null}
          </p>
        ) : null}

        {section.kind === "listening" ? (
          <div className="mt-4 space-y-4">
            {(section.items as ListeningRef[] | undefined)?.map((ref, index) => {
              const dialogue = dialogueById.get(ref.dialogueId);
              const question = dialogue?.questions[ref.questionIndex];
              if (!dialogue || !question) return null;
              const key = `${section.id}:${index}`;
              return (
                <div key={key} className="card-soft px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-display text-lg">
                        {index + 1}. {dialogue.title}
                      </div>
                      <div className="text-[11px] text-ink-soft">{dialogue.context}</div>
                    </div>
                    <button
                      className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment disabled:opacity-50"
                      disabled={playing}
                      onClick={() => void playDialogue(dialogue)}
                    >
                      {playing ? "Memutar…" : "Putar dialog"}
                    </button>
                  </div>
                  <div className="mt-2 text-sm font-semibold">{question.prompt}</div>
                  <ChoiceOptions
                    options={optionOrders[key] ?? question.options}
                    selected={answers[key]}
                    disabled={timeUp || examLoading}
                    onSelect={(option) =>
                      examSession.update((prev) => ({
                        ...prev,
                        answers: { ...prev.answers, [key]: option },
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {section.kind === "reading" ? (
          <div className="mt-4 space-y-4">
            {(section.items as ReadingItem[] | undefined)?.map((item, index) => {
              const key = `${section.id}:${index}`;
              return (
                <div key={key} className="card-soft px-4 py-3">
                  <div className="rounded bg-parchment px-3 py-2 text-sm">{item.text}</div>
                  <div className="mt-2 text-sm font-semibold">
                    {index + 1}. {item.prompt}
                  </div>
                  <ChoiceOptions
                    options={optionOrders[key] ?? item.options}
                    selected={answers[key]}
                    disabled={timeUp || examLoading}
                    onSelect={(option) =>
                      examSession.update((prev) => ({
                        ...prev,
                        answers: { ...prev.answers, [key]: option },
                      }))
                    }
                  />
                </div>
              );
            })}
          </div>
        ) : null}

        {section.kind === "writing" && section.task ? (
          <div className="mt-4">
            <p className="text-sm">{section.task.situation}</p>
            <div className="mt-3 rounded border border-line bg-parchment px-4 py-3 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Unsur wajib</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {section.task.mustInclude.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <label className="mt-3 block text-sm font-semibold" htmlFor="mock-writing">
              Tulisanmu
            </label>
            <textarea
              id="mock-writing"
              value={writingDraft}
              onChange={(event) => changeWriting(event.target.value)}
              onBlur={flushWriting}
              disabled={timeUp || examLoading}
              rows={6}
              className="mt-1 w-full rounded border border-line bg-cream px-3 py-2 font-display text-base outline-none focus:border-gold disabled:opacity-60"
              placeholder="Tulis pesan singkat dalam bahasa Jerman…"
            />
            <div className="mt-1 text-[11px] text-ink-soft">
              {writingDraft.trim() ? writingDraft.trim().split(/\s+/).length : 0} kata
            </div>
            <div className="mt-3 space-y-1.5">
              {section.task.checklist.map((item, index) => {
                const key = `${section.id}:${index}`;
                return (
                  <label key={key} className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(writingChecks[key])}
                      disabled={timeUp || examLoading}
                      onChange={(event) => {
                        const checked = event.target.checked;
                        examSession.update((prev) => ({
                          ...prev,
                          writingDraft: draftRef.current,
                          writingChecks: { ...prev.writingChecks, [key]: checked },
                        }));
                      }}
                      className="mt-1"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-ink-soft">
              Tidak ada penilaian otomatis. Centang hanya setelah membaca ulang tulisanmu.
            </p>
          </div>
        ) : null}

        {section.kind === "speaking" ? (
          <div className="mt-4 space-y-3">
            {section.prompts?.map((prompt, promptIndex) => (
              <div key={`${section.id}-${promptIndex}`} className="card-soft px-4 py-3">
                <div className="font-semibold">
                  {promptIndex + 1}. {prompt.prompt}
                </div>
                <p className="mt-1 text-[11px] text-ink-soft">
                  Ucapkan jawabanmu dengan suara keras. Tidak ada rekaman atau penilaian suara otomatis.
                </p>
                <div className="mt-2 space-y-1">
                  {prompt.checklist.map((item, index) => {
                    const key = `${section.id}:${promptIndex}:${index}`;
                    return (
                      <label key={key} className="flex items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={Boolean(speakingChecks[key])}
                          disabled={timeUp || examLoading}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            examSession.update((prev) => ({
                              ...prev,
                              speakingChecks: { ...prev.speakingChecks, [key]: checked },
                            }));
                          }}
                          className="mt-1"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-ink-soft">
              Rubrik ini hanya untuk refleksi mandiri; bukan penilaian pelafalan atau kelancaran.
            </p>
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-ink-soft">
            {section.kind === "listening" || section.kind === "reading"
              ? "Jawaban benar/salah baru ditampilkan setelah selesai."
              : "Bagian ini memakai rubrik mandiri."}
          </span>
          <button className="btn-gold" onClick={nextSection}>
            {sectionIndex + 1 >= MOCK.sections.length ? "Selesai dan lihat hasil" : "Lanjut ke bagian berikutnya"}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
