// CLONE PERSIS / Task 4 — entry baru: tampilan referensi apa adanya.
// Bootstrap DB async dulu, lalu komponen menerima ProgressStore SINKRON hasil
// createNovelLocalStore. Shell 4 tab / modul lama tetap ada sebagai modul tidur.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, CharId, ChoiceOption, InputNode, Progress, Settings } from "./types";
import { AudioController, type SpeechState } from "./audio/AudioController";
import { createNovelLocalStore, DEFAULT_PLAYER, readNovelSeed, type ProgressStore } from "./storage/progress";
import { PROLOG_START } from "./data/story/prolog";
import { detectIntents, fillTemplate, resolveInputHandler } from "./engine/matchers";
import { INITIAL_STAGE, newGame, nodeOf, transition, type Effect, type Game } from "./engine/story";
import { Stage } from "./components/Stage";
import { AnswerInput, ChoiceList, DialogPanel, NextButton } from "./components/DialogPanel";
import { CharacterCreator, TitleScreen } from "./components/TitleScreen";
import { HistoryPanel, Journal, Library, Modal, SettingsPanel } from "./components/Panels";
import { ResultScreen } from "./components/ResultScreen";
import initDatabase from "../../data/seedLoader";
import { initializeDatabase } from "../../app/bootstrap";
import { maybeAutoBackup } from "../../stores/backup";
import { startStudyClock } from "../../stats/studyClock";
import { friendlyErrorMessage } from "../errorMessage";
import "./index.css";

type Screen = "title" | "create" | "story";
type PanelId = null | "journal" | "library" | "history" | "settings";

const PROGRESS_VERSION = 1;

function toProgress(g: Game): Progress {
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
  };
}

/** Bootstrap async; state awal deterministik sebelum store tersedia. */
export default function App() {
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
  if (!store) return <div className="grid h-dvh place-items-center bg-[#1f2740] text-[#f7efdd]">Menyiapkan cerita…</div>;
  return <NovelShell localStore={store} />;
}

/** Isi App referensi, dengan localStore disuntik (bukan modul global). */
function NovelShell({ localStore }: { localStore: ProgressStore }) {
  const [settings, setSettings] = useState<Settings>(() => localStore.loadSettings());
  const audioRef = useRef<AudioController | null>(null);
  if (!audioRef.current) audioRef.current = new AudioController(settings);
  const audio = audioRef.current;

  const [screen, setScreen] = useState<Screen>("title");
  const [saved, setSaved] = useState<Progress | null>(() => localStore.loadProgress());
  const [game, setGame] = useState<Game | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [libraryTextId, setLibraryTextId] = useState<number | undefined>();
  const lastFocus = useRef<HTMLElement | null>(null);

  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [speakingChar, setSpeakingChar] = useState<CharId | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>({ speaking: false, token: 0, status: "idle" });
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    audio.updateSettings(settings);
    localStore.saveSettings(settings);
  }, [settings, audio, localStore]);

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

  useEffect(() => {
    if (game && screen === "story") {
      const progress = toProgress(game);
      localStore.saveProgress(progress);
      setSaved(progress);
    }
  }, [game, screen, localStore]);

  useEffect(() => {
    if (screen !== "story" || !game) {
      audio.setAmbience("none");
      return;
    }
    audio.setAmbience(game.stage.ambience);
  }, [screen, game?.stage.ambience, audio, game]);

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

  const startNew = () => {
    audio.unlock();
    audio.startMusic();
    setScreen("create");
  };
  const onCharacterDone = (player: typeof DEFAULT_PLAYER) => {
    const initial = newGame(player, PROLOG_START);
    setScreen("story");
    const { g: next, effects } = transition(initial, PROLOG_START);
    gameRef.current = next;
    setGame(next);
    setTimeout(() => runEffects(effects), 50);
  };
  const continueSaved = () => {
    if (!saved) return;
    audio.unlock();
    audio.startMusic();
    setGame(fromProgress(saved));
    setScreen("story");
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

  const submitAnswer = (input: InputNode) => {
    if (!game) return;
    const intents = detectIntents(draft, name);
    if (intents.includes("empty")) {
      setFeedback("Ketik atau susun jawabanmu dulu, lalu tekan Kirim.");
      return;
    }
    const handler = resolveInputHandler(input, intents, { flags: game.flags, name, hintCounts: game.hintCounts });
    if (!handler) {
      setFeedback(fillTemplate(input.unknownHint ?? "Belum dipahami. Coba lagi atau buka petunjuk.", name));
      return;
    }
    const hintsUsed = game.hintCounts[input.where] ?? 0;
    const flags = { ...(handler.setFlags ?? {}) };
    if (intents.includes("nein")) flags.saidNein = true;
    const attempts: Attempt[] = [];
    if (handler.record) attempts.push({
      objective: handler.record.objective, where: input.where, text: draft.trim(),
      hintsUsed, full: handler.record.full, at: Date.now(),
    });
    if (intents.includes("greet") && handler.record?.objective !== "greet") attempts.push({
      objective: "greet", where: input.where, text: draft.trim(), hintsUsed, full: true, at: Date.now(),
    });
    const base: Game = attempts.length ? { ...game, attempts: [...game.attempts, ...attempts] } : game;
    go(handler.next, { setFlags: flags, playerLine: draft.trim() }, base);
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

  const audioStatusText = (() => {
    if (!settings.soundOn) return "Suara mati — seluruh cerita tetap bisa dibaca.";
    switch (speech.status) {
      case "no-voice": return "Suara Jerman (de-DE) tidak tersedia di browser ini; teks tetap lengkap.";
      case "tts": return "Diputar dengan suara browser de-DE.";
      case "clip": return "Klip asli dari repositori.";
      default: return "";
    }
  })();
  const textSizeClass = settings.textSize === "besar" ? "ts-besar"
    : settings.textSize === "sangat-besar" ? "ts-sangat-besar" : "";

  return (
    <div className={`app-root relative h-dvh w-full overflow-hidden bg-[#1f2740] font-sans ${textSizeClass}`}>
      {screen === "title" && (
        <TitleScreen hasSave={!!saved} saveName={saved?.player.name}
          onStart={startNew} onContinue={continueSaved}
          onSettings={() => openPanel("settings")} onLibrary={() => openPanel("library")} />
      )}
      {screen === "create" && (
        <CharacterCreator initial={{ ...DEFAULT_PLAYER, ...(saved?.player ?? {}), name: "" }}
          onDone={onCharacterDone} onBack={() => setScreen("title")} />
      )}
      {screen === "story" && game && node && (
        <>
          <Stage stage={game.stage} player={game.player}
            speakingChar={isSpeaking ? speakingChar : null} mouthOpen={mouthOpen}
            reducedMotion={settings.reducedMotion} dim={node.kind === "end"} />
          <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-1 p-2">
            <span className="mr-auto rounded bg-[#1b2033]/60 px-2 py-1 text-xs font-semibold text-[#f7efdd]">
              A1 · Unit 1 · Prolog „Surat untuk Siapa?“ · {game.player.name}
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
              canListen={(node.kind === "line" ? node.lang : lastLine?.lang) === "de"}
              onListen={() => {
                const text = node.kind === "line" ? fillTemplate(node.text, name) : (lastLine?.text ?? "");
                const asset = node.kind === "line" ? node.audio : lastLine?.audio;
                const speaker = node.kind === "line" ? node.speaker : (lastLine?.speaker ?? "narator");
                speakLine(text, `replay#${game.nodeId}`, asset,
                  speaker === "narator" || speaker === "player" ? null : (speaker as CharId));
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
                  onPick={(option: ChoiceOption) => {
                    if (option.sfx) audio.playSfx(option.sfx);
                    go(option.next, { setFlags: option.setFlags, resetHints: option.resetHints });
                  }} />
              )}
              {inputNode && (
                <AnswerInput prompt={fillTemplate(inputNode.prompt, name)} value={draft}
                  onChange={(value) => { setDraft(value); if (feedback) setFeedback(""); }}
                  onSubmit={() => submitAnswer(inputNode)}
                  chips={inputNode.chips.map((chip) => fillTemplate(chip, name))}
                  hints={inputNode.hints.map((hint) => fillTemplate(hint, name))}
                  hintLevel={game.hintLevels[inputNode.id] ?? 0}
                  onHint={() => revealHint(inputNode)} feedback={feedback}
                  skip={inputNode.skip ? { label: inputNode.skip.label, onSkip: () => go(inputNode.skip!.next) } : undefined} />
              )}
            </DialogPanel>
          )}
          {node.kind === "end" && (
            <ResultScreen attempts={game.attempts} flags={game.flags} name={name}
              onBackToStreet={() => go("d_hub")}
              onRetryIntro={() => go("d_post_q", { resetHints: "pos" })}
              onSaveAndFinish={() => { localStore.saveProgress(toProgress(game)); backToTitle(); }}
              onOpenReading={(id) => openPanel("library", id)} />
          )}
        </>
      )}
      {panel === "journal" && game && (
        <Modal title="Jurnal Belajar" onClose={closePanel} wide>
          <Journal attempts={game.attempts} flags={game.flags} name={name}
            onOpenReading={(id) => openPanel("library", id)} />
        </Modal>
      )}
      {panel === "history" && game && (
        <Modal title="Riwayat percakapan" onClose={closePanel}>
          <HistoryPanel items={game.history} playerName={name}
            speak={(text, key, asset) => speakLine(text, key, asset, null)}
            speakingKey={isSpeaking ? speakingKey : null} />
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
