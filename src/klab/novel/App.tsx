// CLONE PERSIS / Task 4 â€” entry baru: tampilan referensi apa adanya.
// Bootstrap DB async dulu, lalu komponen menerima ProgressStore SINKRON hasil
// createNovelLocalStore. Shell 4 tab / modul lama tetap ada sebagai modul tidur.
//
// PILOT-AGENT-1 â€” perubahan pada entry referensi (Mandat pilot):
//  Â· Pemilihan 4 avatar produksi + "Dengar suara" per ID (komponen AvatarCreator).
//  Â· Misi "Peron berubah" (Bab 11) + pesan Bab 12: slot progres TERPISAH
//    (novel.mission.v1) â€” memilih latihan tidak menandai Bab 01-10 selesai.
//  Â· Draf jawaban dipulihkan setelah muat ulang; transkrip tugas menyimak
//    dicatat sebagai bantuan baca; giliran lisan memakai rekaman (U07) atau teks.
//  Â· Bukti jurnal memisahkan jalur cerita vs latihan per keterampilan.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Attempt, CharId, ChoiceOption, InputNode, ObjectiveId,
  PlayerProfile, Progress, Settings, SkillId, StoryContext,
} from "./types";
import { AudioController, type SpeechState } from "./audio/AudioController";
import { createNovelLocalStore, DEFAULT_PLAYER, readNovelMissionSeed, readNovelSeed, writeNovelMission, type ProgressStore } from "./storage/progress";
import { PROLOG_START } from "./data/story/prolog";
import { CH11_START, CH11_TRANSFER_START } from "./data/story/bab-11";
import { detectIntents, fillTemplate, resolveInputHandler } from "./engine/matchers";
import { INITIAL_STAGE, newGame, nodeOf, transition, type Effect, type Game } from "./engine/story";
import { Stage } from "./components/Stage";
import { AnswerInput, ChoiceList, DialogPanel, NextButton, type MicState } from "./components/DialogPanel";
import { AvatarCreator } from "./components/AvatarCreator";
import { TitleScreen } from "./components/TitleScreen";
import { HistoryPanel, Journal, Library, MissionResult, Modal, SettingsPanel } from "./components/Panels";
import { ResultScreen } from "./components/ResultScreen";
import { resolveAudio } from "./data/audio-manifest";
import initDatabase from "../../data/seedLoader";
import { initializeDatabase } from "../../app/bootstrap";
import { maybeAutoBackup } from "../../stores/backup";
import { startStudyClock } from "../../stats/studyClock";
import { friendlyErrorMessage } from "../errorMessage";
import "./index.css";

type Screen = "title" | "create" | "story";
type PanelId = null | "journal" | "library" | "history" | "settings";
type GameMode = "cerita" | "latihan";

const PROGRESS_VERSION = 1;

/** Keterampilan per tujuan (pemisahan bukti jurnal, Mandat Â§1.5). */
const SKILL_BY_OBJECTIVE: Partial<Record<ObjectiveId, SkillId>> = {
  "a1-u11-o1": "sprechen",
  "a1-u11-o2": "lesen",
  "a1-u11-o3": "sprechen",
  "a1-u11-o4": "hoeren",
  "a1-u11-o5": "sprechen",
  "a1-u12-o1": "sprechen",
  "a1-u12-o2": "sprechen",
  "a1-u12-o3": "sprechen",
  "a1-u12-o4": "sprechen",
  "a1-u12-o5": "schreiben",
};

function toProgress(g: Game, draft: string, recordings: Progress["recordings"], missionCompleted: boolean): Progress {
  return {
    version: PROGRESS_VERSION,
    player: g.player,
    nodeId: g.nodeId,
    stage: g.stage,
    flags: g.flags,
    hintCounts: g.hintCounts,
    attempts: g.attempts,
    history: g.history,
    prologCompleted: g.prologCompleted,
    updatedAt: Date.now(),
    draft,
    recordings,
    missionCompleted: missionCompleted || undefined,
  };
}
function fromProgress(p: Progress): Game {
  return {
    player: p.player,
    nodeId: p.nodeId,
    stage: p.stage ?? INITIAL_STAGE,
    flags: p.flags ?? {},
    hintCounts: p.hintCounts ?? {},
    hintLevels: {},
    attempts: p.attempts ?? [],
    history: p.history ?? [],
    prologCompleted: !!p.prologCompleted,
    visit: 0,
    mode: "cerita",
  };
}

/** Bootstrap async; state awal deterministik sebelum store tersedia. */
export default function App({ onOpenMaterials }: { onOpenMaterials?: () => void }) {
  const [store, setStore] = useState<ProgressStore | null>(null);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    let alive = true;
    let stopClock: (() => void) | undefined;
    void (async () => {
      await initializeDatabase(initDatabase);
      if (!alive) return;
      stopClock = startStudyClock();
      void maybeAutoBackup().catch((error: unknown) => {
        console.warn("auto backup tertunda:", error);
      });
      const seed = await readNovelSeed();
      if (alive) setStore(createNovelLocalStore(seed));
    })().catch((error: unknown) => {
      console.warn("bootstrap cerita gagal:", error);
      if (alive) setBootError(friendlyErrorMessage(error, "database"));
    });
    return () => { alive = false; stopClock?.(); };
  }, []);

  if (bootError) return <div role="alert" className="m-4 rounded bg-[#1f2740] p-4 text-[#f7efdd]">{bootError}</div>;
  if (!store) return <div className="grid h-dvh place-items-center bg-[#1f2740] text-[#f7efdd]">Menyiapkan ceritaâ€¦</div>;
  return <NovelShell localStore={store} onOpenMaterials={onOpenMaterials} />;
}

/** Isi App referensi, dengan localStore disuntik (bukan modul global). */
function NovelShell({ localStore, onOpenMaterials }: { localStore: ProgressStore; onOpenMaterials?: () => void }) {
  const [settings, setSettings] = useState<Settings>(() => localStore.loadSettings());
  const audioRef = useRef<AudioController | null>(null);
  if (!audioRef.current) audioRef.current = new AudioController(settings);
  const audio = audioRef.current;

  const [screen, setScreen] = useState<Screen>("title");
  const [saved, setSaved] = useState<Progress | null>(() => localStore.loadProgress());
  const [missionSaved, setMissionSaved] = useState<Progress | null>(null);
  const [game, setGame] = useState<Game | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [libraryTextId, setLibraryTextId] = useState<number | undefined>();
  const [pendingMission, setPendingMission] = useState(false);
  const [missionMenu, setMissionMenu] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  // ----- UI percakapan -----
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const transcriptOpenedRef = useRef(false);
  const [speakingChar, setSpeakingChar] = useState<CharId | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>({ speaking: false, token: 0, status: "idle" });
  const [mouthOpen, setMouthOpen] = useState(false);

  // ----- Rekaman lisan (U07) -----
  const [mic, setMic] = useState<{ recording: boolean; hasRecording: boolean; error?: string }>({ recording: false, hasRecording: false });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordUrlRef = useRef<string | null>(null);
  const recordDataRef = useRef<{ mime: string; base64: string } | null>(null);

  // ----- Pengaman klik ganda (U09: satu jawaban = satu peristiwa) -----
  const busyRef = useRef(false);
  const continuingRef = useRef(false);

  // ----- Pengaturan -----
  useEffect(() => {
    audio.updateSettings(settings);
    localStore.saveSettings(settings);
  }, [settings, audio, localStore]);

  // Muat slot misi (novel.mission.v1) sekali saat shell siap.
  useEffect(() => {
    let alive = true;
    void readNovelMissionSeed().then((m) => { if (alive) setMissionSaved(m); }).catch(() => undefined);
    return () => { alive = false; };
  }, []);

  // CP-CLONE-01: jangan pernah mengembalikan nilai non-fungsi ke React sebagai
  // destroy. AudioController.subscribe milik 2a sekarang mengembalikan fungsi,
  // tetapi kita kunci kontraknya di sisi 1a agar unmount panel tidak melempar
  // "l is not a function" di commitHookEffectListUnmount.
  useEffect(() => {
    const off = audio.subscribe(setSpeech);
    return () => { if (typeof off === "function") off(); };
  }, [audio]);
  const isSpeaking = speech.speaking && settings.soundOn;
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      setSpeakingKey(null);
      return;
    }
    const timer = setInterval(() => setMouthOpen((value) => !value), 140);
    return () => { clearInterval(timer); setMouthOpen(false); };
  }, [isSpeaking]);

  const speakLine = useCallback(
    (text: string, key: string, asset?: string, char: CharId | null = null) => {
      if (speakingKey === key && isSpeaking) {
        audio.stopSpeech();
        return;
      }
      setSpeakingChar(char);
      setSpeakingKey(key);
      void audio.speak(text, asset);
    },
    [audio, speakingKey, isSpeaking],
  );

  // ----- Simpan otomatis (cerita vs misi: slot terpisah) -----
  useEffect(() => {
    if (game && screen === "story") {
      const progress = toProgress(game, draft, game.recordings ?? {}, !!missionSaved?.missionCompleted);
      if (game.mode === "latihan") {
        setMissionSaved(progress);
        void writeNovelMission(progress).catch((e) => console.warn("gagal menyimpan misi:", e));
      } else {
        localStore.saveProgress(progress);
        setSaved(progress);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, screen, localStore]);

  // Draf dikirim tersendiri (debounce) agar muat ulang memulihkannya (U09).
  useEffect(() => {
    if (screen !== "story" || !game) return;
    const timer = setTimeout(() => {
      const progress = toProgress(game, draft, game.recordings ?? {}, !!missionSaved?.missionCompleted);
      if (game.mode === "latihan") void writeNovelMission(progress).catch(() => undefined);
      else localStore.saveProgress(progress);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  useEffect(() => {
    if (screen !== "story" || !game) {
      audio.setAmbience("none");
      return;
    }
    audio.setAmbience(game.stage.ambience);
  }, [screen, game?.stage.ambience, audio, game]);

  // Lepaskan pengaman klik ganda setiap node berpindah.
  useEffect(() => {
    busyRef.current = false;
  }, [game?.nodeId]);

  // Reset UI giliran saat node berganti: transkrip tertutup kembali.
  useEffect(() => {
    setShowTranscript(false);
  }, [game?.nodeId]);

  const runEffects = useCallback(
    (effects: Effect[]) => {
      audio.stopSpeech();
      for (const effect of effects) {
        if (effect.type === "sfx") audio.playSfx(effect.id);
      }
      const spoken = effects.find((effect): effect is Extract<Effect, { type: "speak" }> => effect.type === "speak");
      if (spoken) {
        const delay = effects.some((effect) => effect.type === "sfx") ? 350 : 60;
        setTimeout(() => speakLine(spoken.text, spoken.key, spoken.asset, spoken.char), delay);
      } else {
        setSpeakingChar(null);
      }
    },
    [audio, speakLine],
  );

  const gameRef = useRef<Game | null>(null);
  gameRef.current = game;
  const go = useCallback(
    (targetId: string, extra?: Parameters<typeof transition>[2], base?: Game) => {
      const source = base ?? gameRef.current;
      if (!source) return;
      const { g: next, effects } = transition(source, targetId, extra);
      gameRef.current = next;
      setGame(next);
      setDraft("");
      setFeedback("");
      setShowTranslation(false);
      runEffects(effects);
    },
    [runEffects],
  );

  // ----- Alur mulai / lanjut -----
  const startNew = () => {
    audio.unlock();
    audio.startMusic();
    setPendingMission(false);
    setScreen("create");
  };
  const openMissionMenu = () => {
    setMissionMenu(true);
  };
  const beginMission = (fresh: boolean) => {
    audio.unlock();
    audio.startMusic();
    setMissionMenu(false);
    const player = saved?.player ?? { ...DEFAULT_PLAYER, name: "" };
    if (!player.name) {
      // Profil belum ada: pilih avatar dulu, lalu masuk misi (U01 tetap terpenuhi
      // karena penguji memilih misi ini dari jalur pengguna biasa).
      setPendingMission(true);
      setScreen("create");
      return;
    }
    if (!fresh && missionSaved) {
      setGame({ ...fromProgress(missionSaved), mode: "latihan" });
      setDraft(missionSaved.draft ?? "");
    } else {
      const initial = newGame(player, CH11_START);
      const { g: next, effects } = transition(initial, CH11_START);
      gameRef.current = next;
      setGame({ ...next, mode: "latihan" });
      gameRef.current = { ...next, mode: "latihan" };
      setDraft("");
      setTimeout(() => runEffects(effects), 50);
    }
    setScreen("story");
  };

  const onCharacterDone = (player: PlayerProfile) => {
    if (pendingMission) {
      const initial = newGame(player, CH11_START);
      const { g: next, effects } = transition(initial, CH11_START);
      const missionGame = { ...next, mode: "latihan" as GameMode };
      gameRef.current = missionGame;
      setGame(missionGame);
      setPendingMission(false);
      setDraft("");
      setScreen("story");
      setTimeout(() => runEffects(effects), 50);
      return;
    }
    const initial = newGame(player, PROLOG_START);
    setScreen("story");
    const { g: next, effects } = transition(initial, PROLOG_START);
    gameRef.current = next;
    setGame(next);
    setTimeout(() => runEffects(effects), 50);
  };
  const continueSaved = () => {
    if (!saved || continuingRef.current) return; // klik dua kali cepat â†’ satu peristiwa
    continuingRef.current = true;
    audio.unlock();
    audio.startMusic();
    setGame(fromProgress(saved));
    setDraft(saved.draft ?? "");
    setScreen("story");
    setTimeout(() => { continuingRef.current = false; }, 300);
  };
  const backToTitle = () => {
    audio.stopSpeech();
    setPanel(null);
    setScreen("title");
  };

  const openPanel = (next: PanelId, textId?: number) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    audio.unlock();
    setLibraryTextId(textId);
    setPanel(next);
  };
  const closePanel = useCallback(() => {
    audio.stopSpeech();
    setPanel(null);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>("[data-answer-input]");
      if (input) input.focus({ preventScroll: true });
      else lastFocus.current?.focus?.();
    }, 0);
  }, [audio]);

  // ----- Rekaman lisan -----
  const toggleRecord = async () => {
    if (mic.recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        if (recordUrlRef.current) URL.revokeObjectURL(recordUrlRef.current);
        recordUrlRef.current = URL.createObjectURL(blob);
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = String(reader.result ?? "");
          recordDataRef.current = { mime: blob.type, base64: dataUrl.split(",")[1] ?? "" };
          setMic({ recording: false, hasRecording: true });
        };
        reader.readAsDataURL(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      setMic((m) => ({ ...m, recording: true }));
    } catch {
      setMic({ recording: false, hasRecording: false, error: "Izin mikrofon ditolak atau tidak tersedia. Jalur mengetik tetap berjalan." });
    }
  };
  const playRecording = () => {
    if (!recordUrlRef.current) return;
    const a = new Audio(recordUrlRef.current);
    void a.play().catch(() => undefined);
  };
  const deleteRecording = () => {
    if (recordUrlRef.current) URL.revokeObjectURL(recordUrlRef.current);
    recordUrlRef.current = null;
    recordDataRef.current = null;
    setMic({ recording: false, hasRecording: false });
    setGame((current) => {
      if (!current) return current;
      const recordings = { ...(current.recordings ?? {}) };
      const key = `rec:${current.nodeId}`;
      if (recordings[key]) { delete recordings[key]; return { ...current, recordings }; }
      return current;
    });
  };

  // ----- Node saat ini -----
  const node = game ? nodeOf(game.nodeId) : null;
  const inputNode: InputNode | null =
    node?.kind === "input" ? node : node?.kind === "line" && nodeOf(node.next).kind === "input"
      ? (nodeOf(node.next) as InputNode) : null;
  const name = game?.player.name ?? "";
  const lastLine = useMemo(() => {
    if (!game) return null;
    for (let index = game.history.length - 1; index >= 0; index--) {
      if (!game.history[index].isPlayer) return game.history[index];
    }
    return null;
  }, [game]);

  const recordAttempt = useCallback(
    (objective: ObjectiveId, where: string, text: string, hintsUsed: number, full: boolean, extra?: Partial<Attempt>): boolean => {
      if (!gameRef.current) return false;
      const mode = gameRef.current.mode ?? "cerita";
      const attempt: Attempt = {
        objective, where, text, hintsUsed, full, at: Date.now(),
        mode,
        skill: extra?.spoken ? "sprechen" : extra?.spoken === false && extra?.reviewStatus ? "schreiben" : SKILL_BY_OBJECTIVE[objective] ?? "umum",
        ...extra,
      };
      const next = { ...gameRef.current, attempts: [...gameRef.current.attempts, attempt] };
      gameRef.current = next;
      setGame(next);
      return true;
    },
    [],
  );

  const submitAnswer = (input: InputNode, spoken = false) => {
    if (!game || busyRef.current) return;
    const ctx: StoryContext = { flags: game.flags, name, hintCounts: game.hintCounts };
    const answerText = spoken
      ? recordDataRef.current
        ? "ðŸŽ™ (rekaman lisan â€” menunggu telaah)"
        : draft.trim()
      : draft;

    if (!spoken) {
      const intents = detectIntents(draft, name);
      if (intents.includes("empty")) {
        setFeedback("Ketik atau susun jawabanmu dulu, lalu tekan Kirim.");
        return;
      }
    } else if (!recordDataRef.current) {
      setFeedback("Rekam jawabanmu dulu, atau gunakan teks.");
      return;
    }

    const hintsUsed = game.hintCounts[input.where] ?? 0;

    // Giliran lisan: rekaman dikirim apa adanya (tanpa penilai teruji) â€”
    // dicatat menunggu telaah; cerita tetap berjalan (Mandat Â§6.B).
    if (spoken && input.mic) {
      const recordings = { ...(game.recordings ?? {}) };
      recordings[`rec:${input.id}`] = {
        mime: recordDataRef.current.mime,
        data: recordDataRef.current.base64,
        at: Date.now(),
      };
      const before = gameRef.current;
      recordAttempt(input.mic.objective, input.where, answerText, hintsUsed, true, {
        spoken: true, reviewStatus: "menunggu-telaah",
        ...(transcriptOpenedRef.current ? { transcriptUsed: true } : {}),
      });
      const withRecording = { ...(gameRef.current ?? before), recordings };
      gameRef.current = withRecording;
      setGame(withRecording);
      recordDataRef.current = null;
      if (recordUrlRef.current) URL.revokeObjectURL(recordUrlRef.current);
      recordUrlRef.current = null;
      setMic({ recording: false, hasRecording: false });
      transcriptOpenedRef.current = false;
      busyRef.current = true;
      go(input.mic.next, { playerLine: "ðŸŽ™ (rekaman lisan)" }, withRecording);
      return;
    }

    // Penilai khusus node (mis. pesan Bab 12 / tugas stasiun).
    if (input.evaluate) {
      const result = input.evaluate(draft, ctx);
      if (!result) {
        setFeedback(fillTemplate(input.unknownHint ?? "Belum dipahami. Coba lagi atau buka petunjuk.", name));
        return;
      }
      if (result.record) {
        recordAttempt(result.record.objective, input.where, draft.trim(), hintsUsed, result.record.full, {
          ...(result.transcriptUsed || transcriptOpenedRef.current ? { transcriptUsed: true } : {}),
        });
      }
      if (result.feedback && !result.next) {
        setFeedback(fillTemplate(result.feedback, name));
        if (!result.keepDraft) setDraft("");
        return;
      }
      if (!result.next) return;
      transcriptOpenedRef.current = false;
      busyRef.current = true;
      go(result.next, { setFlags: result.setFlags, playerLine: draft.trim() });
      return;
    }

    const intents = detectIntents(draft, name);
    const handler = resolveInputHandler(input, intents, ctx);
    if (!handler) {
      setFeedback(fillTemplate(input.unknownHint ?? "Belum dipahami. Coba lagi atau buka petunjuk.", name));
      return;
    }
    const flags = { ...(handler.setFlags ?? {}) };
    if (intents.includes("nein")) flags.saidNein = true;
    if (handler.record) {
      recordAttempt(handler.record.objective, input.where, draft.trim(), hintsUsed, handler.record.full, {
        ...(transcriptOpenedRef.current ? { transcriptUsed: true } : {}),
      });
    }
    if (intents.includes("greet") && handler.record?.objective !== "greet") {
      recordAttempt("greet", input.where, draft.trim(), hintsUsed, true);
    }
    transcriptOpenedRef.current = false;
    busyRef.current = true;
    go(handler.next, { setFlags: flags, playerLine: draft.trim() });
  };
  const revealHint = (input: InputNode) => {
    setGame((current) => {
      if (!current) return current;
      const level = current.hintLevels[input.id] ?? 0;
      if (level >= input.hints.length) return current;
      return {
        ...current,
        hintLevels: { ...current.hintLevels, [input.id]: level + 1 },
        hintCounts: { ...current.hintCounts, [input.where]: (current.hintCounts[input.where] ?? 0) + 1 },
      };
    });
  };

  const onPickChoice = (option: ChoiceOption) => {
    if (!game || busyRef.current) return;
    busyRef.current = true;
    if (option.record) {
      recordAttempt(option.record.objective, `choice:${game.nodeId}`, option.label, 0, option.record.full, {
        ...(transcriptOpenedRef.current ? { transcriptUsed: true } : {}),
      });
      transcriptOpenedRef.current = false;
    }
    if (option.sfx) audio.playSfx(option.sfx);
    go(option.next, { setFlags: option.setFlags, resetHints: option.resetHints });
  };

  const playModel = (input: InputNode) => {
    if (!input.mic?.modelText || !game) return;
    const asset = input.modelAudio ? resolveAudio(input.modelAudio, game.player.characterId) : undefined;
    void audio.speak(input.mic.modelText, asset);
  };

  const audioStatusText = (() => {
    if (!settings.soundOn) return "Suara mati â€” seluruh cerita tetap bisa dibaca.";
    switch (speech.status) {
      case "no-voice": return "Suara Jerman (de-DE) tidak tersedia di browser ini; teks tetap lengkap.";
      case "tts": return "Diputar dengan suara browser de-DE.";
      case "clip": return "Klip asli dari repositori.";
      default: return "";
    }
  })();
  const textSizeClass = settings.textSize === "besar" ? "ts-besar"
    : settings.textSize === "sangat-besar" ? "ts-sangat-besar" : "";

  const micControls: MicState | undefined = inputNode?.mic
    ? {
        recording: mic.recording,
        hasRecording: mic.hasRecording,
        onToggleRecord: () => { void toggleRecord(); },
        onPlayRecording: playRecording,
        onDeleteRecording: deleteRecording,
        onPlayModel: inputNode.modelAudio ? () => playModel(inputNode) : undefined,
        error: mic.error,
      }
    : undefined;

  const transcriptText = node?.kind === "line" && node.spokenText ? fillTemplate(node.spokenText, name) : undefined;

  const modeLabel = game?.mode === "latihan" ? "Latih keterampilan Â· Peron berubah" : "Prolog â€žSurat untuk Siapa?â€œ";

  return (
    <div className={`app-root relative h-dvh w-full overflow-hidden bg-[#1f2740] font-sans ${textSizeClass}`}>
      {screen === "title" && (
        <TitleScreen hasSave={!!saved} saveName={saved?.player.name}
          onStart={startNew} onContinue={continueSaved}
          onSettings={() => openPanel("settings")} onLibrary={() => openPanel("library")}
          onOpenMaterials={onOpenMaterials} onPractice={openMissionMenu} />
      )}
      {screen === "create" && (
        <AvatarCreator audio={audio} savedName={saved?.player.name}
          onDone={onCharacterDone} onBack={() => { setPendingMission(false); setScreen("title"); }} />
      )}

      {missionMenu && (
        <Modal title="Latih keterampilan" onClose={() => setMissionMenu(false)}>
          <p className="text-sm text-[#4b4238]">
            Misi dapat dipilih langsung dari jalur pengguna biasa. Memilih latihan
            <strong> tidak menandai Bab 01â€“10 selesai</strong>; hasilnya tercatat
            terpisah di jurnal (mode latihan).
          </p>
          <div className="mt-3 space-y-2">
            <button type="button" className="btn-primary w-full justify-center" onClick={() => beginMission(false)} data-testid="mission-peron">
              Peron berubah {missionSaved ? "Â· lanjut dari posisi terakhir" : "Â· mulai misi"}
            </button>
            {missionSaved && (
              <button type="button" className="btn-secondary w-full justify-center" onClick={() => beginMission(true)}>
                Mulai misi dari awal (posisi latihan lama diganti)
              </button>
            )}
          </div>
          <p className="mt-3 text-xs text-[#6b5e4e]">
            Target: baca tiket â†’ dengarkan pengumuman â†’ tanya petugas (rekam atau teks) â†’ tulis pesan untuk Eva.
          </p>
        </Modal>
      )}

      {screen === "story" && game && node && (
        <>
          <Stage stage={game.stage} player={game.player}
            speakingChar={isSpeaking ? speakingChar : null} mouthOpen={mouthOpen}
            reducedMotion={settings.reducedMotion} dim={node.kind === "end"} />

          <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-1 p-2">
            <span className="mr-auto rounded bg-[#1b2033]/60 px-2 py-1 text-xs font-semibold text-[#f7efdd]">
              A1 Â· {modeLabel} Â· {game.player.name}
            </span>
            <button type="button" onClick={() => openPanel("journal")} className="btn-top">Jurnal</button>
            <button type="button" onClick={() => openPanel("history")} className="btn-top">Riwayat</button>
            <button type="button" onClick={() => openPanel("library")} className="btn-top">Perpustakaan</button>
            <button type="button" onClick={() => openPanel("settings")} className="btn-top">Pengaturan</button>
            <button type="button" onClick={backToTitle} className="btn-top"
              aria-label="Kembali ke layar judul (progres tersimpan)">Judul</button>
          </header>
          {node.kind !== "end" && (
            <DialogPanel
              speaker={node.kind === "line" ? node.speaker : node.kind === "input" ? node.speaker : (lastLine?.speaker ?? "narator")}
              playerName={name}
              text={node.kind === "line" ? fillTemplate(node.text, name) : (lastLine?.text ?? "")}
              lang={node.kind === "line" ? node.lang : (lastLine?.lang ?? "id")}
              translation={node.kind === "line"
                ? (node.translation ? fillTemplate(node.translation, name) : undefined) : lastLine?.translation}
              showTranslation={showTranslation}
              onToggleTranslation={() => setShowTranslation((value) => !value)}
              transcript={transcriptText}
              showTranscript={showTranscript}
              onToggleTranscript={transcriptText ? () => {
                setShowTranscript((v) => {
                  if (!v) transcriptOpenedRef.current = true;
                  return !v;
                });
              } : undefined}
              canListen={(node.kind === "line" ? node.lang : lastLine?.lang) === "de"}
              onListen={() => {
                const line = node?.kind === "line" ? node : null;
                const spokenText = line?.spokenText ? fillTemplate(line.spokenText, name) : null;
                const text = line ? fillTemplate(line.text, name) : (lastLine?.text ?? "");
                const asset = line ? resolveAudio(line.audio, game.player.characterId) : lastLine?.audio;
                const speaker = line ? line.speaker : (lastLine?.speaker ?? "narator");
                speakLine(spokenText ?? text, `replay#${game.nodeId}`, asset,
                  speaker === "narator" || speaker === "player" || speaker === "pengumuman" ? null : (speaker as CharId));
              }}
              isSpeaking={isSpeaking && !!speakingKey &&
                (speakingKey.startsWith(`${game.nodeId}#`) || speakingKey === `replay#${game.nodeId}`)}
              audioStatus={audioStatusText}
            >
              {node.kind === "line" && !inputNode && <NextButton onClick={() => go(node.next)} />}
              {node.kind === "choice" && (
                <ChoiceList prompt={node.prompt}
                  options={node.options.filter((option) => !option.hideIf?.(game.flags))
                    .map((option) => ({ ...option, label: fillTemplate(option.label, name) }))}
                  onPick={onPickChoice} />
              )}
              {inputNode && (
                <AnswerInput prompt={fillTemplate(inputNode.prompt, name)} value={draft}
                  onChange={(value) => { setDraft(value); if (feedback) setFeedback(""); }}
                  onSubmit={(spoken) => submitAnswer(inputNode, spoken)}
                  chips={inputNode.chips.map((chip) => fillTemplate(chip, name))}
                  hints={inputNode.hints.map((hint) => fillTemplate(hint, name))}
                  hintLevel={game.hintLevels[inputNode.id] ?? 0}
                  onHint={() => revealHint(inputNode)} feedback={feedback}
                  multiline={inputNode.multiline}
                  mic={micControls}
                  skip={inputNode.skip ? { label: inputNode.skip.label, onSkip: () => go(inputNode.skip!.next) } : undefined} />
              )}
            </DialogPanel>
          )}
          {node.kind === "end" && game.mode === "latihan" && (
            <MissionResult attempts={game.attempts} name={name}
              recordings={game.recordings ?? {}}
              onPlayRecording={(key) => {
                const rec = game.recordings ?? {}[key];
                if (!rec) return;
                const a = new Audio(`data:${rec.mime};base64,${rec.data}`);
                void a.play().catch(() => undefined);
              }}
              onDeleteRecording={(key) => {
                setGame((current) => {
                  if (!current) return current;
                  const recordings = { ...current.recordings ?? {} };
                  delete recordings[key];
                  return { ...current, recordings };
                });
              }}
              onRetryDifferent={() => {
                transcriptOpenedRef.current = false;
                go(CH11_TRANSFER_START, { resetHints: "ch11-transfer-ankunft" });
              }}
              onBackToTitle={() => {
                const progress = toProgress(game, draft, game.recordings ?? {}, game.nodeId === "ch12-end");
                void writeNovelMission({ ...progress, missionCompleted: game.nodeId === "ch12-end" || undefined }).catch(() => undefined);
                setMissionSaved(progress);
                backToTitle();
              }} />
          )}
          {node.kind === "end" && game.mode !== "latihan" && game.nodeId === "e_end" && (
            <ResultScreen attempts={game.attempts} flags={game.flags} name={name}
              onBackToStreet={() => go("d_hub")}
              onRetryIntro={() => go("d_post_q", { resetHints: "pos" })}
              onSaveAndFinish={() => { localStore.saveProgress(toProgress(game, draft, game.recordings ?? {}, false)); backToTitle(); }}
              onOpenReading={(id) => openPanel("library", id)}
              onContinueMission={() => {
                const initial = newGame(game.player, CH11_START);
                const { g: next, effects } = transition(initial, CH11_START);
                const missionGame = { ...next, mode: "latihan" as GameMode };
                gameRef.current = missionGame;
                setGame(missionGame);
                setDraft("");
                setTimeout(() => runEffects(effects), 50);
              }} />
          )}
          {node.kind === "end" && game.mode !== "latihan" && game.nodeId !== "e_end" && (
            <MissionResult attempts={game.attempts} name={name}
              recordings={game.recordings ?? {}}
              onPlayRecording={(key) => {
                const rec = game.recordings ?? {}[key];
                if (!rec) return;
                const a = new Audio(`data:${rec.mime};base64,${rec.data}`);
                void a.play().catch(() => undefined);
              }}
              onDeleteRecording={(key) => {
                setGame((current) => {
                  if (!current) return current;
                  const recordings = { ...current.recordings ?? {} };
                  delete recordings[key];
                  return { ...current, recordings };
                });
              }}
              onRetryDifferent={() => {
                transcriptOpenedRef.current = false;
                go(CH11_TRANSFER_START, { resetHints: "ch11-transfer-ankunft" });
              }}
              onBackToTitle={() => {
                const progress = toProgress(game, draft, game.recordings ?? {}, game.nodeId === "ch12-end");
                localStore.saveProgress(progress);
                setSaved(progress);
                backToTitle();
              }} />
          )}
        </>
      )}
      {panel === "journal" && game && (
        <Modal title="Jurnal Belajar" onClose={closePanel} wide>
          <Journal attempts={game.attempts} flags={game.flags} name={name}
            recordings={game.recordings ?? {}}
            onOpenReading={(id) => openPanel("library", id)} />
        </Modal>
      )}
      {panel === "history" && game && (
        <Modal title="Riwayat percakapan" onClose={closePanel}>
          <HistoryPanel items={game.history} playerName={name}
            speak={(text, key, asset) => speakLine(text, key, asset, null)} speakingKey={isSpeaking ? speakingKey : null} />
        </Modal>
      )}
      {panel === "library" && (
        <Modal title="Perpustakaan" onClose={closePanel} wide>
          <Library initialTextId={libraryTextId}
            speak={(text, key, asset) => speakLine(text, key, asset, null)}
            stopSpeech={() => audio.stopSpeech()} speakingKey={isSpeaking ? speakingKey : null} />
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="Pengaturan" onClose={closePanel}>
          <SettingsPanel s={settings} onChange={setSettings}
            audioStatus={audioStatusText || "Suara dimulai setelah interaksi pertama. Klip asli dipakai bila tersedia; selain itu suara browser de-DE."} />
        </Modal>
      )}
    </div>
  );
}
