// P4: latihan mendengar (dialog pendek + pertanyaan pemahaman) dan menulis
// terpandu (contoh + daftar periksa, tanpa penilaian otomatis).
import { useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../PageShell";
import listeningRaw from "../../data/practice/a1_listening.json";
import writingRaw from "../../data/practice/a1_writing.json";
import conversationRaw from "../../data/practice/a1_conversation.json";
import { speak, stopSpeech } from "../../srs/tts";
import { choiceMatches } from "../../srs/answers";
import { makeAttemptSeed, mulberry32, buildOptionOrders } from "../../lessons/optionOrder";
import { usePersistedSession } from "./usePersistedSession";
import {
  emptyListening,
  emptyTalk,
  emptyWriting,
  replayConversation,
  restoredWritingDraft,
  sessionKeys,
  validateListening,
  validateTalk,
  validateWriting,
  type ListeningSession,
  type TalkSession,
  type WritingSession,
} from "./latihanState";

type ListeningLine = { speaker: string; de: string };
type ListeningQuestion = {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};
type ListeningItem = {
  id: string;
  title: string;
  context: string;
  lines: ListeningLine[];
  questions: ListeningQuestion[];
};
type ListeningFile = { level: string; source: string; items: ListeningItem[] };

type WritingTask = {
  id: string;
  title: string;
  situation: string;
  mustInclude: string[];
  model: string;
  checklist: string[];
};
type WritingFile = { level: string; source: string; tasks: WritingTask[] };

type ConversationOption = { text: string; next: string; feedback: string };
type ConversationNode = {
  speaker: string;
  de: string;
  id: string;
  options?: ConversationOption[];
  end?: boolean;
  summary?: string;
};
type ConversationScenario = {
  id: string;
  title: string;
  context: string;
  start: string;
  nodes: Record<string, ConversationNode>;
};
type ConversationFile = { level: string; source: string; scenarios: ConversationScenario[] };

const LISTENING = listeningRaw as unknown as ListeningFile;
const WRITING = writingRaw as unknown as WritingFile;
const CONVERSATION = conversationRaw as unknown as ConversationFile;

const draftKey = (id: string) => `lernen_writing_${id}`;

// Draft lama localStorage dimigrasikan sekali ke sesi SQLite saat dibuka.
function legacyDraft(id: string): string {
  try {
    return localStorage.getItem(draftKey(id)) ?? "";
  } catch {
    return "";
  }
}

// Urutan opsi pertanyaan pemahaman untuk satu dialog. Dibangun sekali per
// percobaan dan disimpan di state; kunci jawaban tidak berubah.
function buildListeningOrders(item: ListeningItem): Record<string, string[]> {
  const rng = mulberry32(makeAttemptSeed());
  return buildOptionOrders(
    item.questions.map((question, index) => ({ key: `${item.id}:${index}`, options: question.options })),
    rng,
  );
}

export default function Latihan() {
  const [tab, setTab] = useState<"hoeren" | "schreiben" | "percakapan">("hoeren");
  const [listenId, setListenId] = useState(LISTENING.items[0]?.id ?? "");
  const [showTranscript, setShowTranscript] = useState(false);
  const [playing, setPlaying] = useState<"all" | number | null>(null);

  const [writeId, setWriteId] = useState(WRITING.tasks[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [showModel, setShowModel] = useState(false);

  const [talkId, setTalkId] = useState(CONVERSATION.scenarios[0]?.id ?? "");

  const listenItem = LISTENING.items.find((item) => item.id === listenId) ?? LISTENING.items[0];
  const writeTask = WRITING.tasks.find((task) => task.id === writeId) ?? WRITING.tasks[0];
  const talkScenario =
    CONVERSATION.scenarios.find((scenario) => scenario.id === talkId) ?? CONVERSATION.scenarios[0];

  // Persistensi nyata: satu sesi per dialog/tugas/skenario. Revision dan
  // konflik ditangani sessionRepository Agent 1, bukan localStorage kedua.
  const listenSession = usePersistedSession<ListeningSession>({
    key: sessionKeys.listening(listenId),
    create: () => ({
      ...emptyListening(),
      orders: listenItem ? buildListeningOrders(listenItem) : {},
    }),
    validate: validateListening,
  });
  const writeSession = usePersistedSession<WritingSession>({
    key: sessionKeys.writing(writeId),
    create: () => ({
      ...emptyWriting(),
      draft: writeTask ? legacyDraft(writeTask.id) : "",
    }),
    validate: validateWriting,
  });
  const talkSession = usePersistedSession<TalkSession>({
    key: sessionKeys.talk(talkId),
    create: emptyTalk,
    validate: validateTalk,
  });

  const talkReplay = useMemo(
    () =>
      talkScenario
        ? replayConversation(talkScenario, talkSession.data.choices)
        : { nodeId: "", log: [], valid: false },
    [talkScenario, talkSession.data.choices],
  );
  const talkNode = talkScenario ? talkScenario.nodes[talkReplay.nodeId] : undefined;
  const talkLog = talkReplay.log;

  const draftTimer = useRef<number | null>(null);
  const draftRef = useRef("");
  const playToken = useRef(0);
  const migratedWrite = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Keluar halaman: batalkan loop dan hentikan klip yang sedang berbunyi.
    return () => {
      playToken.current += 1;
      stopSpeech();
    };
  }, []);

  useEffect(() => {
    setShowTranscript(false);
    setPlaying(null);
    // Ganti dialog juga membatalkan antrean audio dialog sebelumnya.
    playToken.current += 1;
    stopSpeech();
  }, [listenId]);

  useEffect(() => {
    // Pindah tab menghentikan audio yang masih berjalan di tab lama.
    playToken.current += 1;
    stopSpeech();
    setPlaying(null);
  }, [tab]);

  useEffect(() => {
    const restored = restoredWritingDraft(writeSession.dataKey, writeId, writeSession.data);
    if (restored === null) return;
    setDraft(restored);
    draftRef.current = restored;
  }, [writeId, writeSession.dataKey, writeSession.loadVersion]);

  useEffect(() => {
    setShowModel(false);
  }, [writeId]);

  useEffect(() => {
    if (writeTask && writeSession.status === "saved") {
      try {
        const legacy = localStorage.getItem(draftKey(writeTask.id));
        if (legacy && (writeSession.data.draft === legacy || writeSession.data.draft.trim())) {
          localStorage.removeItem(draftKey(writeTask.id));
        }
      } catch {
        /* storage bisa diblokir */
      }
    }
  }, [writeTask, writeSession.status, writeSession.data.draft]);

  // Draft legacy yang belum pernah masuk SQLite dipindahkan sekali setelah
  // sesi selesai dimuat. Salinan legacy tidak dihapus sebelum commit sukses.
  useEffect(() => {
    if (!writeTask || writeSession.status === "loading") return;
    if (writeSession.dataKey !== sessionKeys.writing(writeId)) return;
    if (migratedWrite.current.has(writeTask.id)) return;
    migratedWrite.current.add(writeTask.id);
    if (writeSession.data.draft !== "") return;
    const legacy = legacyDraft(writeTask.id);
    if (!legacy) return;
    setDraft(legacy);
    draftRef.current = legacy;
    writeSession.update((prev) => ({ ...prev, draft: legacy }));
  }, [writeTask, writeId, writeSession.dataKey, writeSession.loadVersion, writeSession.status]);

  useEffect(() => {
    return () => {
      if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    };
  }, []);

  const answeredCount = useMemo(() => {
    if (!listenItem) return 0;
    return listenItem.questions.filter(
      (_, index) => listenSession.data.answers[`${listenItem.id}:${index}`] !== undefined,
    ).length;
  }, [listenItem, listenSession.data.answers]);

  const correctCount = useMemo(() => {
    if (!listenItem) return 0;
    return listenItem.questions.filter((question, index) => {
      const selected = listenSession.data.answers[`${listenItem.id}:${index}`];
      return selected !== undefined && choiceMatches(selected, question.answer);
    }).length;
  }, [listenItem, listenSession.data.answers]);

  const playAll = async () => {
    if (!listenItem || playing !== null) return;
    const token = ++playToken.current;
    setPlaying("all");
    listenSession.update((prev) => ({ ...prev, audioFailed: false }));
    for (const line of listenItem.lines) {
      if (token !== playToken.current) return;
      const source = await speak(line.de);
      if (token !== playToken.current) return;
      if (!source) {
        // Audio gagal bukan jawaban salah: catat terpisah dan biarkan
        // transkrip menjadi jalur lanjut.
        listenSession.update((prev) => ({ ...prev, audioFailed: true }));
        break;
      }
    }
    if (token === playToken.current) setPlaying(null);
  };

  const playLine = (index: number, line: ListeningLine) => {
    if (playing !== null) return;
    const token = ++playToken.current;
    stopSpeech();
    setPlaying(index);
    void speak(line.de)
      .then((source) => {
        if (token !== playToken.current) return;
        if (!source) listenSession.update((prev) => ({ ...prev, audioFailed: true }));
      })
      .finally(() => {
        if (token === playToken.current) setPlaying(null);
      });
  };

  const answerQuestion = (index: number, option: string) => {
    if (!listenItem || listenLoading) return;
    const key = `${listenItem.id}:${index}`;
    if (listenSession.data.answers[key] !== undefined) return;
    listenSession.update((prev) => ({
      ...prev,
      answers: { ...prev.answers, [key]: option },
    }));
  };

  const resetListening = () => {
    if (!listenItem) return;
    // Percobaan baru: jawaban kosong dan urutan opsi baru, kunci tetap sama.
    listenSession.replace({
      ...emptyListening(),
      orders: buildListeningOrders(listenItem),
    });
  };

  const chooseTalkOption = (option: ConversationOption) => {
    if (!talkScenario || !talkNode || talkNode.end || talkLoading) return;
    const choiceIndex = (talkNode.options ?? []).findIndex(
      (entry) => entry.text === option.text && entry.next === option.next,
    );
    if (choiceIndex < 0) return;
    talkSession.update((prev) => ({ ...prev, choices: [...prev.choices, choiceIndex] }));
  };

  const resetTalk = () => {
    talkSession.replace(emptyTalk());
  };

  const updateDraft = (value: string) => {
    if (writeLoading) return;
    setDraft(value);
    draftRef.current = value;
    if (draftTimer.current !== null) window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      writeSession.update((prev) => ({ ...prev, draft: value }));
      draftTimer.current = null;
    }, 250);
  };

  const flushDraft = () => {
    if (writeLoading) return;
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    // Blur tanpa edit tidak boleh menulis ulang nilai lama/ kosong.
    if (draftRef.current === writeSession.data.draft) return;
    writeSession.update((prev) => ({ ...prev, draft: draftRef.current }));
  };

  const clearDraft = () => {
    if (!writeTask) return;
    if (draftTimer.current !== null) {
      window.clearTimeout(draftTimer.current);
      draftTimer.current = null;
    }
    draftRef.current = "";
    setDraft("");
    // Salinan legacy baru dihapus setelah sesi SQLite sukses (efek "saved").
    writeSession.replace(emptyWriting());
  };

  const selectWriteTask = (id: string) => {
    if (id === writeId) return;
    flushDraft();
    setWriteId(id);
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;
  const checkedCount = writeTask
    ? writeTask.checklist.filter((_, i) => writeSession.data.checks[`${writeTask.id}:${i}`]).length
    : 0;
  const listenLoading = listenSession.status === "loading" || listenSession.dataKey !== sessionKeys.listening(listenId);
  const writeLoading = writeSession.status === "loading" || writeSession.dataKey !== sessionKeys.writing(writeId);
  const talkLoading = talkSession.status === "loading" || talkSession.dataKey !== sessionKeys.talk(talkId);
  const activeStatus =
    tab === "hoeren" ? listenSession.status : tab === "schreiben" ? writeSession.status : talkSession.status;
  const activeError =
    tab === "hoeren" ? listenSession.error : tab === "schreiben" ? writeSession.error : talkSession.error;
  const activeRetry =
    tab === "hoeren" ? listenSession.retry : tab === "schreiben" ? writeSession.retry : talkSession.retry;

  return (
    <PageShell
      title="Latihan Mendengar, Menulis & Percakapan"
      sub="Dialog pendek A1 dengan transkrip dan pertanyaan pemahaman, tugas menulis terpandu, dan simulasi percakapan bercabang. Bukan ujian sertifikasi; tulisan bebas dan ucapan tidak dinilai otomatis."
      meta="P4–P5 · A1"
    >
      <div className="flex gap-2">
        <button
          className={tab === "hoeren" ? "btn-gold" : "rounded border border-line px-4 py-2 text-sm hover:bg-parchment"}
          onClick={() => setTab("hoeren")}
        >
          Mendengar
        </button>
        <button
          className={tab === "schreiben" ? "btn-gold" : "rounded border border-line px-4 py-2 text-sm hover:bg-parchment"}
          onClick={() => setTab("schreiben")}
        >
          Menulis
        </button>
        <button
          className={tab === "percakapan" ? "btn-gold" : "rounded border border-line px-4 py-2 text-sm hover:bg-parchment"}
          onClick={() => setTab("percakapan")}
        >
          Percakapan
        </button>
      </div>
      <p className="mt-2 text-[11px] text-ink-soft" role={activeStatus === "failed" ? "alert" : undefined}>
        {activeStatus === "loading"
          ? "Memuat sesi tersimpan…"
          : activeStatus === "saving"
            ? "Menyimpan sesi…"
            : activeStatus === "failed"
              ? `Sesi belum tersimpan: ${activeError}`
              : activeStatus === "saved"
                ? "Sesi tersimpan di perangkat ini."
                : "Sesi siap disimpan otomatis."}
        {activeStatus === "failed" ? (
          <button className="ml-2 underline hover:text-ink" onClick={activeRetry}>
            Coba simpan lagi
          </button>
        ) : null}
      </p>

      {tab === "hoeren" && listenItem ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[15rem_1fr]">
          <div className="space-y-2">
            {LISTENING.items.map((item) => (
              <button
                key={item.id}
                onClick={() => setListenId(item.id)}
                className={
                  "w-full rounded border px-3 py-2 text-left text-sm transition-colors " +
                  (item.id === listenItem.id
                    ? "border-gold bg-cream font-semibold"
                    : "border-line bg-cream/60 hover:bg-parchment")
                }
              >
                <div className="font-display text-base">{item.title}</div>
                <div className="text-[11px] text-ink-soft">{item.context}</div>
              </button>
            ))}
            <p className="pt-2 text-[11px] text-ink-soft">
              Audio memakai Piper atau klip bawaan. Transkrip selalu dapat dibuka.
            </p>
          </div>

          <div className="card px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gold-deep">Dialog</div>
                <h3 className="font-display text-2xl">{listenItem.title}</h3>
                <p className="text-xs text-ink-soft">{listenItem.context}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="btn-gold" disabled={playing !== null} onClick={() => void playAll()}>
                  {playing === "all" ? "Memutar…" : "Putar dialog"}
                </button>
                <button
                  className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
                  onClick={() => setShowTranscript((value) => !value)}
                >
                  {showTranscript ? "Sembunyikan transkrip" : "Tampilkan transkrip"}
                </button>
              </div>
            </div>

            {showTranscript ? (
              <div className="mt-4 space-y-2">
                {listenItem.lines.map((line, index) => (
                  <div key={`${line.speaker}-${index}`} className="flex items-start gap-2 rounded bg-parchment px-3 py-2">
                    <button
                      className="mt-0.5 rounded border border-line bg-cream px-2 py-0.5 text-xs hover:border-gold disabled:opacity-50"
                      disabled={playing !== null}
                      onClick={() => playLine(index, line)}
                      aria-label={`Putar baris ${index + 1}`}
                    >
                      {playing === index ? "…" : "🔊"}
                    </button>
                    <div className="text-sm">
                      <b className="text-gold-deep">{line.speaker}:</b> {line.de}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded border border-dashed border-line px-4 py-6 text-center text-sm text-ink-soft">
                Dengarkan dialog terlebih dahulu, lalu buka transkrip untuk memeriksa.
              </div>
            )}

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-lg">Pertanyaan pemahaman</h4>
                <span className="text-[11px] text-ink-soft">
                  {correctCount} benar · {answeredCount - correctCount} salah ·{" "}
                  {listenItem.questions.length - answeredCount} tidak dikerjakan
                </span>
              </div>
              <div className="mt-2 space-y-4">
                {listenItem.questions.map((question, questionIndex) => {
                  const key = `${listenItem.id}:${questionIndex}`;
                  const selected = listenSession.data.answers[key];
                  const answered = selected !== undefined;
                  const options = listenSession.data.orders[key] ?? question.options;
                  return (
                    <div key={key} className="card-soft px-4 py-3">
                      <div className="text-sm font-semibold">
                        {questionIndex + 1}. {question.prompt}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {options.map((option) => {
                          const isAnswer = option === question.answer;
                          const isSelected = option === selected;
                          const tone = !answered
                            ? "border-line bg-cream hover:border-gold hover:bg-parchment"
                            : isAnswer
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                              : isSelected
                                ? "border-rose-400 bg-rose-50 text-rose-900"
                                : "border-line bg-cream/60 text-ink-soft";
                          return (
                            <button
                              key={option}
                              disabled={answered || listenLoading}
                              onClick={() => answerQuestion(questionIndex, option)}
                              className={`rounded border px-3 py-1.5 text-left text-sm ${tone}`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {answered ? (
                        <p className="mt-2 text-xs text-ink-soft">
                          {choiceMatches(selected, question.answer) ? "Richtig. " : "Noch nicht. "}
                          {question.explanation}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
                  onClick={resetListening}
                >
                  Ulangi dialog ini
                </button>
              </div>
              {listenSession.data.audioFailed ? (
                <p role="status" className="mt-2 text-xs text-rose-700">
                  Audio gagal diputar di perangkat ini. Ini bukan jawaban salah: buka transkrip dan
                  lanjutkan, atau periksa Pengaturan audio. Pertanyaan yang belum dijawab dilaporkan
                  terpisah.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "schreiben" && writeTask ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[15rem_1fr]">
          <div className="space-y-2">
            {WRITING.tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => selectWriteTask(task.id)}
                className={
                  "w-full rounded border px-3 py-2 text-left text-sm transition-colors " +
                  (task.id === writeTask.id
                    ? "border-gold bg-cream font-semibold"
                    : "border-line bg-cream/60 hover:bg-parchment")
                }
              >
                <div className="font-display text-base">{task.title}</div>
              </button>
            ))}
            <p className="pt-2 text-[11px] text-ink-soft">
              Draft disimpan lokal di perangkat ini. Tulisan bebas tidak diberi skor otomatis.
            </p>
          </div>

          <div className="card px-5 py-5">
            <div className="text-[11px] uppercase tracking-wide text-gold-deep">Tugas menulis</div>
            <h3 className="font-display text-2xl">{writeTask.title}</h3>
            <p className="mt-1 text-sm text-ink-soft">{writeTask.situation}</p>

            <div className="mt-4 rounded border border-line bg-parchment px-4 py-3 text-sm">
              <div className="text-[11px] uppercase tracking-wide text-ink-soft">Unsur wajib</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {writeTask.mustInclude.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <label className="mt-4 block text-sm font-semibold" htmlFor="writing-draft">
              Tulisanmu
            </label>
            <textarea
              id="writing-draft"
              value={draft}
              onChange={(event) => updateDraft(event.target.value)}
              onBlur={flushDraft}
              rows={6}
              disabled={writeLoading}
              className="mt-1 w-full rounded border border-line bg-cream px-3 py-2 font-display text-base outline-none focus:border-gold"
              placeholder="Tulis pesan singkat dalam bahasa Jerman…"
            />
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-soft">
              <span>{wordCount} kata</span>
              <button className="underline hover:text-ink" disabled={writeLoading} onClick={clearDraft}>
                Bersihkan draft
              </button>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-lg">Daftar periksa mandiri</h4>
                <span className="text-[11px] text-ink-soft">
                  {!draft.trim()
                    ? "tugas belum dikerjakan"
                    : checkedCount === 0
                      ? "draft ada, rubrik belum diisi"
                      : `${checkedCount}/${writeTask.checklist.length} tercentang`}
                </span>
              </div>
              <div className="mt-2 space-y-1.5">
                {writeTask.checklist.map((item, index) => {
                  const key = `${writeTask.id}:${index}`;
                  return (
                    <label key={key} className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(writeSession.data.checks[key])}
                        disabled={writeLoading}
                        onChange={(event) => {
                          const checked = event.target.checked;
                          writeSession.update((prev) => ({
                            ...prev,
                            checks: { ...prev.checks, [key]: checked },
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

            <div className="mt-4">
              <button
                className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
                onClick={() => setShowModel((value) => !value)}
              >
                {showModel ? "Sembunyikan contoh jawaban" : "Tampilkan contoh jawaban"}
              </button>
              {showModel ? (
                <div className="mt-2 rounded border border-gold/40 bg-cream px-4 py-3 text-sm">
                  <div className="text-[11px] uppercase tracking-wide text-gold-deep">Contoh jawaban</div>
                  <p className="mt-1">{writeTask.model}</p>
                  <p className="mt-2 text-[11px] text-ink-soft">
                    Bandingkan struktur dan unsur wajibnya; jangan menyalin mentah-mentah.
                  </p>
                </div>
              ) : null}
            </div>

            <p className="mt-4 text-[11px] text-ink-soft">
              Penilaian mandiri: centang daftar periksa setelah membaca ulang tulisanmu. Aplikasi tidak
              memberi nilai otomatis dan tidak mengklaim koreksi bahasa.
            </p>
          </div>
        </div>
      ) : null}

      {tab === "percakapan" && talkScenario && talkNode ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[15rem_1fr]">
          <div className="space-y-2">
            {CONVERSATION.scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setTalkId(scenario.id)}
                className={
                  "w-full rounded border px-3 py-2 text-left text-sm transition-colors " +
                  (scenario.id === talkScenario.id
                    ? "border-gold bg-cream font-semibold"
                    : "border-line bg-cream/60 hover:bg-parchment")
                }
              >
                <div className="font-display text-base">{scenario.title}</div>
                <div className="text-[11px] text-ink-soft">{scenario.context}</div>
              </button>
            ))}
            <p className="pt-2 text-[11px] text-ink-soft">
              Simulasi teks bercabang. Ucapkan jawabanmu dengan suara keras sebelum memilih; tidak ada
              perekaman atau penilaian ucapan otomatis.
            </p>
          </div>

          <div className="card px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-gold-deep">Percakapan</div>
                <h3 className="font-display text-2xl">{talkScenario.title}</h3>
                <p className="text-xs text-ink-soft">{talkScenario.context}</p>
              </div>
              <button className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment" onClick={resetTalk}>
                Ulangi skenario
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {talkLog.map((entry, index) => {
                if (entry.kind === "user") {
                  return (
                    <div
                      key={`user-${index}`}
                      className="ml-auto max-w-[85%] rounded border border-gold/40 bg-cream px-3 py-2 text-right text-sm"
                    >
                      <span className="text-[11px] uppercase tracking-wide text-gold-deep">Kamu</span>
                      <div>{entry.text}</div>
                    </div>
                  );
                }
                if (entry.kind === "feedback") {
                  return (
                    <p key={`feedback-${index}`} className="text-[11px] text-gold-deep">
                      Catatan: {entry.text}
                    </p>
                  );
                }
                return (
                  <div key={`speaker-${index}`} className="rounded border border-line bg-parchment px-3 py-2 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] uppercase tracking-wide text-ink-soft">{entry.node.speaker}</div>
                        <div className="font-display text-base">{entry.node.de}</div>
                        <div className="text-[11px] text-ink-soft">{entry.node.id}</div>
                      </div>
                      <button
                        className="rounded border border-line bg-cream px-2 py-0.5 text-xs hover:border-gold"
                        onClick={() => void speak(entry.node.de)}
                        aria-label={`Dengar ${entry.node.speaker}`}
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {!talkReplay.valid ? (
              <p role="alert" className="mt-2 text-xs text-rose-700">
                Riwayat percakapan tersimpan tidak cocok dengan konten saat ini. Ulangi skenario untuk
                memulai jalur baru; riwayat lama tidak dihapus sampai Anda mengulang.
              </p>
            ) : null}

            {!talkNode.end ? (
              <div className="mt-4">
                <div className="text-[11px] uppercase tracking-wide text-ink-soft">Pilih jawabanmu</div>
                <div className="mt-2 space-y-2">
                  {talkNode.options?.map((option) => (
                    <button
                      key={option.text}
                      disabled={talkLoading}
                      onClick={() => chooseTalkOption(option)}
                      className="w-full rounded border border-line bg-cream px-3 py-2 text-left text-sm hover:border-gold hover:bg-parchment"
                    >
                      {option.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <div className="font-semibold">Skenario selesai.</div>
                {talkNode.summary ? <p className="mt-1">{talkNode.summary}</p> : null}
                <button className="btn-gold mt-3" onClick={resetTalk}>
                  Ulangi skenario
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
