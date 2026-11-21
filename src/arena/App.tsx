import {ChapterSixIntro} from './components/ChapterSixIntro';
import {ChapterFiveStart} from './components/ChapterFiveStart';
import {ChapterFourStart} from './components/ChapterFourStart';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Attempt, CharId, ChoiceOption, InputNode, Progress, Settings } from "./types";
import { AudioController, type SpeechState } from "./audio/AudioController";
import { checkpointTitle, continueDestination } from "./storage/storyCheckpoint";
import { createProfile, initProfiles, profileKey, selectProfile } from "./storage/profiles";
import { DEFAULT_PLAYER, localStore } from "./storage/progress";
import { PROLOG_START } from "./data/story/prolog";
import { detectIntents, fillTemplate, resolveInputHandler } from "./engine/matchers";
import { INITIAL_STAGE, newGame, nodeOf, transition, type Effect, type Game } from "./engine/story";
import { StationMission } from "./components/StationMission";
import { Stage } from "./components/Stage";
import { AnswerInput, ChoiceList, DialogPanel, NextButton } from "./components/DialogPanel";
import { CharacterCreator, TitleScreen } from "./components/TitleScreen";
import { HistoryPanel, Journal, Library, Modal, SettingsPanel } from "./components/Panels";
import { ResultScreen } from "./components/ResultScreen";

import StoryPage, { beginStoryForPlayer } from "../klab/StoryPage";
import { ChapterThreeStart } from "./components/ChapterThreeStart";
import { ChapterTwoKiosk } from "./components/ChapterTwoKiosk";
import { ChapterOne } from "./components/ChapterOne";
import type { Route } from "../klab/routes";
import "./arena.css";

type Screen = "title" | "create" | "story" | "chapters" | "chapter-one" | "kiosk" | "chapter-three" | "chapter-four" | "chapter-five" | "chapter-six" | "station";
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

export default function Arena({ onDesktop }: { onDesktop: (route?: Route) => void }) {
  const [settings, setSettings] = useState<Settings>(() => localStore.loadSettings());
  const audioRef = useRef<AudioController | null>(null);
  if (!audioRef.current) audioRef.current = new AudioController(settings);
  const audio = audioRef.current;
  const pendingSpeech = useRef<number | undefined>(undefined);
  const leave = () => {
    window.clearTimeout(pendingSpeech.current);
    audio.stopAll();
  };
  useEffect(() => () => {
    window.clearTimeout(pendingSpeech.current);
    audio.stopAll();
  }, [audio]);

  const [screen, setScreen] = useState<Screen>("title");
  const [storyChapter, setStoryChapter] = useState<number | undefined>(undefined);
  const [registry, setRegistry] = useState(() => initProfiles());
  const [saved, setSaved] = useState<Progress | null>(() => localStore.loadProgress());
  const [game, setGame] = useState<Game | null>(null);
  const [panel, setPanel] = useState<PanelId>(null);
  const [libraryTextId, setLibraryTextId] = useState<number | undefined>();
  const lastFocus = useRef<HTMLElement | null>(null);

  // UI percakapan
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [speakingChar, setSpeakingChar] = useState<CharId | null>(null);
  const [speakingKey, setSpeakingKey] = useState<string | null>(null);
  const [speech, setSpeech] = useState<SpeechState>({ speaking: false, token: 0, status: "idle" });
  const [mouthOpen, setMouthOpen] = useState(false);

  // ----- Pengaturan -----
  useEffect(() => {
    audio.updateSettings(settings);
    localStore.saveSettings(settings);
  }, [settings, audio]);

  // ----- Status tuturan → animasi mulut -----
  useEffect(() => audio.subscribe(setSpeech), [audio]);
  const isSpeaking = speech.speaking && settings.soundOn;
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(false);
      setSpeakingKey(null);
      return;
    }
    if (settings.reducedMotion) return;
    const t = setInterval(() => setMouthOpen((v) => !v), 140);
    return () => {
      clearInterval(t);
      setMouthOpen(false);
    };
  }, [isSpeaking, settings.reducedMotion]);

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

  // ----- Simpan otomatis -----
  useEffect(() => {
    if (game && screen === "story") {
      const p = toProgress(game);
      localStore.saveProgress(p);
      setSaved(p);
    }
  }, [game, screen]);

  // ----- Suasana mengikuti panggung -----
  useEffect(() => {
    if (screen !== "story" || !game) {
      audio.setAmbience("none");
      return;
    }
    audio.setAmbience(game.stage.ambience);
  }, [screen, game?.stage.ambience, audio, game]);

  const runEffects = useCallback(
    (effects: Effect[]) => {
      window.clearTimeout(pendingSpeech.current);
      audio.stopSpeech();
      for (const e of effects) {
        if (e.type === "sfx") audio.playSfx(e.id);
      }
      const sp = effects.find((e): e is Extract<Effect, { type: "speak" }> => e.type === "speak");
      if (sp) {
        // beri jeda kecil bila ada efek suara mendahului
        const delay = effects.some((e) => e.type === "sfx") ? 350 : 60;
        pendingSpeech.current = window.setTimeout(() => speakLine(sp.text, sp.key, sp.asset, sp.char), delay);
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
      const g = base ?? gameRef.current;
      if (!g || g.nodeId === targetId) return;
      const { g: ng, effects } = transition(g, targetId, extra);
      gameRef.current = ng;
      setGame(ng);
      setDraft("");
      setFeedback("");
      setShowTranslation(false);
      runEffects(effects);
    },
    [runEffects],
  );

  // ----- Navigasi layar -----
  const startNew = () => {
    audio.unlock();
    audio.startMusic();
    setScreen("create");
  };
  const onCharacterDone = (p: typeof DEFAULT_PLAYER) => {
    try { setRegistry(createProfile(p.name, p.portrait)); } catch { window.alert("Profil baru tidak dapat disimpan; profil lama tidak diubah."); return; }
    const g = newGame(p, PROLOG_START);
    setScreen("story");
    // masuk ke node awal
    const { g: ng, effects } = transition(g, PROLOG_START);
    gameRef.current = ng;
    setGame(ng);
    runEffects(effects);
  };
  const continueSaved = () => {
    if (!saved) return;
    const destination = continueDestination(saved);
    if (destination !== "story") {
      setGame(fromProgress(saved));
      beginStoryForPlayer(saved.player.portrait, saved.player.name);
      setScreen(destination);
      return;
    }
    audio.unlock();
    audio.startMusic();
    setGame(fromProgress(saved));
    setScreen("story");
  };
  const backToTitle = () => {
    leave();
    setPanel(null);
    setScreen("title");
  };

  const openPanel = (p: PanelId, textId?: number) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    window.clearTimeout(pendingSpeech.current);
    audio.stopSpeech();
    audio.unlock();
    setLibraryTextId(textId);
    setPanel(p);
  };
  const closePanel = useCallback(() => {
    audio.stopSpeech();
    setPanel(null);
    // Kembalikan fokus: ke kolom jawaban bila sedang giliran pemain, selain itu ke elemen sebelumnya
    setTimeout(() => {
      const inp = document.querySelector<HTMLInputElement>("[data-answer-input]");
      if (inp) inp.focus({ preventScroll: true });
      else lastFocus.current?.focus?.();
    }, 0);
  }, [audio]);

  // ----- Node saat ini -----
  const node = game ? nodeOf(game.nodeId) : null;
  // Jika baris saat ini langsung diikuti giliran pemain, tampilkan kolom jawaban tanpa klik "Lanjut" tambahan
  const inputNode: InputNode | null =
    node?.kind === "input" ? node : node?.kind === "line" && nodeOf(node.next).kind === "input" ? (nodeOf(node.next) as InputNode) : null;
  const draftKey = inputNode ? profileKey(`lernen.prolog.draft.${inputNode.id}`) : null;
  useEffect(() => { setDraft(draftKey ? localStorage.getItem(draftKey) ?? "" : ""); }, [draftKey]);
  const name = game?.player.name ?? "";
  const lastLine = useMemo(() => {
    if (!game) return null;
    for (let i = game.history.length - 1; i >= 0; i--) if (!game.history[i].isPlayer) return game.history[i];
    return null;
  }, [game]);

  // ----- Jawaban pemain -----
  const submitAnswer = (n: InputNode) => {
    if (!game || gameRef.current !== game) return;
    const intents = detectIntents(draft, name);
    if (intents.includes("empty")) {
      setFeedback("Ketik atau susun jawabanmu dulu, lalu tekan Kirim.");
      return;
    }
    const ctx = { flags: game.flags, name, hintCounts: game.hintCounts };
    if (n.validate && !n.validate(draft, ctx)) {
      setFeedback(fillTemplate(n.invalidHint ?? "Jawaban belum memenuhi tugas. Coba lagi.", name));
      return;
    }
    const h = resolveInputHandler(n, intents, ctx);
    if (!h) {
      setFeedback(fillTemplate(n.unknownHint ?? "Belum dipahami. Coba lagi atau buka petunjuk.", name));
      return;
    }
    const hintsUsed = game.hintCounts[n.where] ?? 0;
    const flags = { ...(h.setFlags ?? {}) };
    if (intents.includes("nein")) flags.saidNein = true;
    const newAttempts: Attempt[] = [];
    if (h.record) newAttempts.push({
      objective: h.record.objective,
      where: n.where,
      text: draft.trim(),
      hintsUsed,
      full: h.record.full,
      at: Date.now(),
      skill: h.record.skill,
      mode: h.record.mode,
      support: hintsUsed > 0 ? "hint" : (game.flags.miaHelpUsed ? "example" : h.record.support ?? "none"),
      reviewStatus: h.record.reviewStatus ?? "auto",
      stimulusId: h.record.stimulusId,
    });
    // Sapaan yang menyertai jawaban (mis. "Hallo! Ich heiße …") juga menjadi bukti tujuan "menyapa"
    if (intents.includes("greet") && h.record?.objective !== "greet") newAttempts.push({ objective: "greet", where: n.where, text: draft.trim(), hintsUsed, full: true, at: Date.now() });
    if (draftKey) localStorage.removeItem(draftKey);
    const base: Game = newAttempts.length ? { ...game, attempts: [...game.attempts, ...newAttempts] } : game;
    go(h.next, { setFlags: flags, playerLine: draft.trim() }, base);
  };
  const revealHint = (n: InputNode) => {
    setGame((g) => {
      if (!g) return g;
      const lvl = g.hintLevels[n.id] ?? 0;
      if (lvl >= n.hints.length) return g;
      return { ...g, hintLevels: { ...g.hintLevels, [n.id]: lvl + 1 }, hintCounts: { ...g.hintCounts, [n.where]: (g.hintCounts[n.where] ?? 0) + 1 } };
    });
  };

  const audioStatusText = (() => {
    if (!settings.soundOn) return "Suara mati — seluruh cerita tetap bisa dibaca.";
    switch (speech.status) {
      case "no-voice":
        return "Suara Jerman (de-DE) tidak tersedia di browser ini; teks tetap lengkap.";
      case "tts":
        return "Diputar dengan suara browser de-DE.";
      case "clip":
        return "Klip lokal sesuai ujaran.";
      default:
        return "";
    }
  })();

  const textSizeClass = settings.textSize === "besar" ? "ts-besar" : settings.textSize === "sangat-besar" ? "ts-sangat-besar" : "";

  // ======================= RENDER =======================
  return (
    <div className={`arena-root relative h-dvh w-full overflow-hidden bg-[#1f2740] font-sans ${textSizeClass}`}>
      {screen === "title" && (
        <TitleScreen checkpoint={checkpointTitle(continueDestination(saved))} profiles={registry.profiles} activeId={registry.active} onSelectProfile={(id) => { try { setRegistry(selectProfile(id)); setSaved(localStore.loadProgress()); setGame(null); } catch { window.alert("Profil tidak dapat dibuka; data tidak diubah."); } }} hasSave={!!saved} saveName={saved?.player.name} onStart={startNew} onContinue={continueSaved} onSettings={() => openPanel("settings")} onLibrary={() => openPanel("library")} onLearning={() => { leave(); onDesktop(); }} onPractice={() => { leave(); setScreen("station"); }} />
      )}
      {screen === "create" && <CharacterCreator initial={{ ...DEFAULT_PLAYER, ...(saved?.player ?? {}), name: "" }} onDone={onCharacterDone} onBack={() => { leave(); setScreen("title"); }} onStop={() => audio.stopSpeech()} onPractice={() => { leave(); setScreen("station"); }} onHear={(portrait) => { audio.unlock(); void audio.speak("Hallo!", "avatar-hallo:" + portrait); }} />}

      {screen === "station" && <StationMission soundOn={settings.soundOn} onBack={backToTitle} />}

      {screen === "chapter-one" && game && <ChapterOne player={game.player} soundOn={settings.soundOn} reducedMotion={settings.reducedMotion} onBack={backToTitle} onLegacy={() => { setStoryChapter(2); setScreen("chapters"); }} onNext={() => { localStorage.setItem(profileKey("lernen.chapter02.active"), "1"); setScreen("kiosk"); }} />}

      {screen === "kiosk" && game && <ChapterTwoKiosk player={game.player} reducedMotion={settings.reducedMotion} onBack={backToTitle} onJournal={() => { localStorage.removeItem(profileKey("lernen.chapter02.active")); setScreen("chapter-one"); }} onLegacy={() => { setStoryChapter(2); setScreen("chapters"); }} onNext={() => { localStorage.setItem(profileKey("lernen.chapter03.active"), "1"); setScreen("chapter-three"); }} />}

      {screen === "chapter-three" && game && <ChapterThreeStart player={game.player} reducedMotion={settings.reducedMotion} onBack={backToTitle} onJournal={() => {localStorage.removeItem(profileKey("lernen.chapter03.active")); setScreen("kiosk");}} onLegacy={() => {setStoryChapter(3);setScreen("chapters");}} onNextChapter={() => {try{localStorage.setItem(profileKey("lernen.chapter04.active"),"1");setScreen("chapter-four");}catch{window.alert("Progres Bab 04 tidak dapat disimpan.");}}} />}
      {screen === "chapter-four" && game && <ChapterFourStart player={game.player} reducedMotion={settings.reducedMotion} soundOn={settings.soundOn} dialogVolume={settings.volDialog} onBack={backToTitle} onPrevious={() => {localStorage.removeItem(profileKey("lernen.chapter04.active"));setScreen("chapter-three");}} onNextChapter={() => {try{localStorage.setItem(profileKey("lernen.chapter05.active"),"1");setScreen("chapter-five");}catch{window.alert("Progres Bab 05 tidak dapat disimpan.");}}} />}
      {screen === "chapter-five" && game && <ChapterFiveStart player={game.player} reducedMotion={settings.reducedMotion} onBack={backToTitle} onPrevious={() => {localStorage.removeItem(profileKey("lernen.chapter05.active"));setScreen("chapter-four");}} onNextChapter={() => {try{localStorage.setItem(profileKey("lernen.chapter06.active"),"1");setScreen("chapter-six");}catch{window.alert("Progres Bab 06 tidak dapat disimpan.");}}} />}
      {screen === "chapter-six" && game && <ChapterSixIntro player={game.player} reducedMotion={settings.reducedMotion} onBack={backToTitle} onPrevious={() => {localStorage.removeItem(profileKey("lernen.chapter06.active"));setScreen("chapter-five");}} />}

      {screen === "chapters" && <main className="h-full overflow-y-auto bg-[#1f2740] text-[#f7efdd]">
        <header className="mx-auto flex max-w-4xl flex-wrap gap-2 p-3">
          <button className="btn-top" onClick={backToTitle}>Judul</button>
          <button className="btn-top" onClick={() => openPanel("journal")}>Jurnal prolog</button>
          <button className="btn-top" onClick={() => openPanel("library")}>Perpustakaan</button>
          <button className="btn-top" onClick={() => openPanel("settings")}>Pengaturan</button>
          <button className="btn-top" onClick={() => setStoryChapter(11)} aria-label="Buka Peron berubah, Bab 11">Peron berubah</button>
        </header>
        <StoryPage key={storyChapter ?? "auto"} initialChapter={storyChapter} paused={panel !== null} />
      </main>}

      {screen === "story" && game && node && (
        <>
          <Stage stage={game.stage} player={game.player} speakingChar={isSpeaking ? speakingChar : null} mouthOpen={mouthOpen} reducedMotion={settings.reducedMotion} dim={node.kind === "end"} />

          {/* Bilah atas */}
          <header className="absolute inset-x-0 top-0 z-10 flex items-center gap-1 p-2">
            <span className="mr-auto rounded bg-[#1b2033]/60 px-2 py-1 text-xs font-semibold text-[#f7efdd]">A1 · Unit 1 · Prolog „Surat untuk Siapa?“ · {game.player.name}</span>
            <button type="button" onClick={() => openPanel("journal")} className="btn-top">
              Jurnal
            </button>
            <button type="button" onClick={() => openPanel("history")} className="btn-top">
              Riwayat
            </button>
            <button type="button" onClick={() => openPanel("library")} className="btn-top">
              Perpustakaan
            </button>
            <button type="button" onClick={() => openPanel("settings")} className="btn-top">
              Pengaturan
            </button>
            <button type="button" onClick={backToTitle} className="btn-top" aria-label="Kembali ke layar judul (progres tersimpan)">
              Judul
            </button>
          </header>

          {node.kind !== "end" && (
            <DialogPanel
              speaker={node.kind === "line" ? node.speaker : node.kind === "input" ? node.speaker : (lastLine?.speaker ?? "narator")}
              playerName={name}
              text={node.kind === "line" ? fillTemplate(node.text, name) : (lastLine?.text ?? "")}
              lang={node.kind === "line" ? node.lang : (lastLine?.lang ?? "id")}
              translation={node.kind === "line" ? (node.translation ? fillTemplate(node.translation, name) : undefined) : lastLine?.translation}
              showTranslation={showTranslation}
              onToggleTranslation={() => setShowTranslation((v) => !v)}
              canListen={node.kind === "line" ? node.lang === "de" || !!node.audio : lastLine?.lang === "de" || !!lastLine?.audio}
              onListen={() => {
                const t = node.kind === "line" ? fillTemplate(node.text, name) : (lastLine?.text ?? "");
                const asset = node.kind === "line" ? node.audio : lastLine?.audio;
                const sp = node.kind === "line" ? node.speaker : (lastLine?.speaker ?? "narator");
                speakLine(t, `replay#${game.nodeId}`, asset, sp === "narator" || sp === "player" ? null : (sp as CharId));
              }}
              isSpeaking={isSpeaking && !!speakingKey && (speakingKey.startsWith(`${game.nodeId}#`) || speakingKey === `replay#${game.nodeId}`)}
              audioStatus={audioStatusText}
            >
              {node.kind === "line" && !inputNode && <NextButton onClick={() => go(node.next)} />}
              {node.kind === "choice" && (
                <ChoiceList
                  prompt={node.prompt}
                  options={node.options.filter((o) => !o.hideIf?.(game.flags)).map((o) => ({ ...o, label: fillTemplate(o.label, name) }))}
                  onPick={(o: ChoiceOption) => {
                    if (o.sfx) audio.playSfx(o.sfx);
                    go(o.next, { setFlags: o.setFlags, resetHints: o.resetHints });
                  }}
                />
              )}
              {inputNode && (
                <>
                {game.stage.chars.some((c) => c.id === "player") && <button type="button" className="btn-ghost mb-2" onClick={() => speakLine("Hallo!", `avatar-${game.nodeId}`, `avatar-hallo:${game.player.portrait ?? "player-01"}`, "player")}>Dengar sapaan tokohmu: Hallo!</button>}
                <AnswerInput
                  prompt={fillTemplate(inputNode.prompt, name)}
                  value={draft}
                  onChange={(v) => {
                    setDraft(v);
                    if (draftKey) localStorage.setItem(draftKey, v);
                    if (feedback) setFeedback("");
                  }}
                  onSubmit={() => submitAnswer(inputNode)}
                  chips={inputNode.chips.map((c) => fillTemplate(c, name))}
                  hints={inputNode.hints.map((h) => fillTemplate(h, name))}
                  hintLevel={game.hintLevels[inputNode.id] ?? 0}
                  onHint={() => revealHint(inputNode)}
                  feedback={feedback}
                  skip={inputNode.skip ? { label: inputNode.skip.label, onSkip: () => go(inputNode.skip!.next) } : undefined}
                />
                </>
              )}
            </DialogPanel>
          )}

          {node.kind === "end" && (
            <ResultScreen
              attempts={game.attempts}
              flags={game.flags}
              name={name}
              onBackToStreet={() => go("d_hub")}
              onRetryIntro={() => go("d_post_q", { resetHints: "pos" })}
              onSaveAndFinish={() => {
                localStore.saveProgress(toProgress(game));
                backToTitle();
              }}
              onOpenReading={(id) => openPanel("library", id)}
              onOpenChapter={game.flags.letterOpened ? () => {
                const progress = toProgress(game);
                localStore.saveProgress(progress);
                setSaved(progress);
                beginStoryForPlayer(game.player.portrait, game.player.name);
                leave();
                setScreen("chapter-one");
              } : undefined}
            />
          )}
        </>
      )}

      {/* Panel-panel */}
      {panel === "journal" && game && (
        <Modal title="Jurnal Belajar" onClose={closePanel} wide>
          <Journal attempts={game.attempts} flags={game.flags} name={name} onOpenReading={(id) => openPanel("library", id)} />
        </Modal>
      )}
      {panel === "history" && game && (
        <Modal title="Riwayat percakapan" onClose={closePanel}>
          <HistoryPanel items={game.history} playerName={name} speak={(t, k, a) => speakLine(t, k, a, null)} speakingKey={isSpeaking ? speakingKey : null} />
        </Modal>
      )}
      {panel === "library" && (
        <Modal title="Perpustakaan" onClose={closePanel} wide>
          <button className="btn-secondary mb-3" onClick={() => {
            leave();
            onDesktop(libraryTextId ? { name: "reader", textId: libraryTextId } : { name: "explore", section: "reading" });
          }}>Buka koleksi dan kurikulum desktop</button>
          <Library initialTextId={libraryTextId} speak={(t, k, a) => speakLine(t, k, a, null)} stopSpeech={() => audio.stopSpeech()} speakingKey={isSpeaking ? speakingKey : null} />
        </Modal>
      )}
      {panel === "settings" && (
        <Modal title="Pengaturan" onClose={closePanel}>
          <button className="btn-secondary mb-3" onClick={() => { leave(); onDesktop({ name: "profile", section: "settings" }); }}>Pengaturan aplikasi</button>
          <SettingsPanel s={settings} onChange={setSettings} audioStatus={audioStatusText || "Suara dimulai setelah interaksi pertama. Klip lokal dipakai bila tersedia. Ujaran dinamis bergantung pada suara Jerman perangkat."} />
        </Modal>
      )}
    </div>
  );
}
