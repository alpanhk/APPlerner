// Mesin cerita Lernen (port referensi visual novel). Tidak memakai localStore:
// progres disimpan lewat adapter ProgressStore milik 1a bila tersedia.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { newGame, transition, nodeOf, type Game, type Effect } from './story/engine';
import { detectIntents, resolveInputHandler } from './story/matchers';
import { buildSummary, demonstratedFullSentence, LEVEL_LABEL, objectiveLevel } from './story/evaluate';
import { PROLOG_START, PROLOG_META } from './story/prolog';
import type { PlayerProfile, StoryNode } from './story/types';
import { soundController, type SoundState } from './soundController';

export type NovelProgress = {
  player: PlayerProfile;
  nodeId: string;
  flags: Record<string, boolean>;
  hintCounts: Record<string, number>;
  attempts: Game['attempts'];
  history: Game['history'];
  updatedAt: number;
};

export type NovelStore = {
  loadProgress: () => Promise<NovelProgress | null>;
  saveProgress: (progress: NovelProgress) => Promise<void>;
  clearProgress?: () => Promise<void>;
};

export type StoryPanel = 'journal' | 'library' | 'history' | 'settings';

export type StoryFlowProps = {
  // Data/persistensi dari 1a (SQLite-backed adapter), bukan localStore.
  store?: NovelStore;
  // Awal opsional: nama pemain dari CharacterCreator / node dari sesi tersimpan.
  initialPlayer?: PlayerProfile;
  initialNodeId?: string;
  // Rute `story` dari 1a; panel dibaca dari route.panel bila prop panel tidak diisi.
  route?: { name?: string; panel?: StoryPanel; textId?: number };
  panel?: StoryPanel;
  mediaSrc?: (assetId: string) => string | undefined;
  // Efek/observasi untuk 1a/4a: tuturan, perpindahan node, pilihan, jawaban, hasil.
  onSpeak?: (effect: Extract<Effect, { type: 'speak' }>) => void;
  onNodeChange?: (nodeId: string, game: Game) => void;
  onChoice?: (label: string, next: string) => void;
  onAnswer?: (text: string, correct: boolean | null) => void;
  onResult?: (summary: ReturnType<typeof buildSummary>, game: Game) => void;
  onBack?: () => void;
  onExit?: () => void;
};

const DEFAULT_PLAYER: PlayerProfile = {
  name: 'Alex', hair: 'short', hairColor: '#3a3027', outfit: '#2c3e6b', skin: '#d9a679',
};

function reducedMotion(): boolean {
  try { return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false; }
  catch { return false; }
}

export function StoryFlow({
  store, initialPlayer, initialNodeId, route, panel, mediaSrc,
  onSpeak, onNodeChange, onChoice, onAnswer, onResult, onBack, onExit,
}: StoryFlowProps) {
  const [stage, setStage] = useState<'title' | 'create' | 'story'>('title');
  const [game, setGame] = useState<Game | null>(null);
  const [saved, setSaved] = useState<NovelProgress | null>(null);
  const [name, setName] = useState(initialPlayer?.name ?? '');
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [sound, setSound] = useState<SoundState>(soundController.get());
  const [motion] = useState(reducedMotion);
  const activePanel: StoryPanel | undefined = panel ?? route?.panel;
  const pending = useRef(false);
  const resultReported = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => soundController.subscribe(setSound), []);
  useEffect(() => {
    let active = true;
    if (!store) { if (active) setSaved(null); return; }
    void store.loadProgress().then((value) => { if (active) setSaved(value); }).catch(() => { if (active) setSaved(null); });
    return () => { active = false; };
  }, [store]);
  useLayoutEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [stage, game?.nodeId]);
  useEffect(() => {
    if (!game && initialNodeId) {
      setGame(newGame(initialPlayer ?? DEFAULT_PLAYER, initialNodeId));
      setStage('story');
    }
  }, [initialNodeId, initialPlayer]);
  useEffect(() => {
    if (game && nodeOf(game.nodeId).kind === 'end' && !resultReported.current) {
      resultReported.current = true;
      onResult?.(buildSummary(game.attempts, game.flags, game.player.name), game);
    }
  }, [game, onResult]);

  // Mode senyap adalah default: teks tetap tampil, tetapi tidak ada klaim
  // "playing" dan tidak ada trek kedua yang dipicu oleh transisi.
  function applyEffects(effects: Effect[]) {
    for (const effect of effects) {
      if (effect.type !== 'speak') continue;
      const enabled = soundController.get().optIn;
      const url = mediaSrc?.(effect.asset ?? '');
      if (!enabled || !url) {
        soundController.setSpeaking(effect.char, effect.key, 'idle');
        continue;
      }
      soundController.setSpeaking(effect.char, effect.key, 'loading');
      onSpeak?.(effect);
    }
  }

  function advance(targetId: string, extra: Parameters<typeof transition>[2] = {}) {
    if (pending.current || !game) return;
    pending.current = true;
    try {
      const next = transition(game, targetId, extra);
      setGame(next.g);
      onNodeChange?.(next.g.nodeId, next.g);
      applyEffects(next.effects);
      setFeedback('');
      setAnswer('');
      if (store) {
        const payload: NovelProgress = {
          player: next.g.player, nodeId: next.g.nodeId, flags: next.g.flags,
          hintCounts: next.g.hintCounts, attempts: next.g.attempts, history: next.g.history,
          updatedAt: Date.now(),
        };
        void store.saveProgress(payload).catch(() => setFeedback('Progres belum tersimpan. Coba lagi.'));
      }
    } finally {
      pending.current = false;
    }
  }

  function start(player: PlayerProfile) {
    const initial = newGame(player, PROLOG_START);
    const first = transition(initial, PROLOG_START);
    setGame(first.g);
    applyEffects(first.effects);
    setStage('story');
    if (store) {
      void store.saveProgress({
        player, nodeId: first.g.nodeId, flags: first.g.flags, hintCounts: first.g.hintCounts,
        attempts: first.g.attempts, history: first.g.history, updatedAt: Date.now(),
      }).catch(() => undefined);
    }
  }

  function resume() {
    if (!saved) return;
    const restored = newGame(saved.player, saved.nodeId);
    restored.flags = saved.flags;
    restored.hintCounts = saved.hintCounts;
    restored.attempts = saved.attempts;
    restored.history = saved.history;
    setGame(restored);
    setStage('story');
    setFeedback('Cerita dilanjutkan dari progres tersimpan.');
  }

  function submitInput(node: Extract<StoryNode, { kind: 'input' }>) {
    if (pending.current) return;
    const intents = detectIntents(answer, game?.player.name ?? '');
    const handler = resolveInputHandler(node, intents, { flags: game?.flags ?? {}, name: game?.player.name ?? '', hintCounts: game?.hintCounts ?? {} });
    if (!handler) {
      setFeedback(node.unknownHint ?? 'Jawaban belum dikenali. Coba kalimat lengkap atau lihat artinya.');
      return;
    }
    const hintsUsed = game?.hintCounts[node.where] ?? 0;
    const record = handler.record ? {
      objective: handler.record.objective,
      where: node.where,
      text: answer.trim(),
      hintsUsed,
      full: handler.record.full,
      at: Date.now(),
    } : undefined;
    // attempts dicatat di transition lewat extra (diteruskan ke engine).
    advance(handler.next, {
      setFlags: handler.setFlags,
      playerLine: answer.trim(),
      ...(record ? { record } : {}),
    } as Parameters<typeof transition>[2]);
    if (record) {
      onAnswer?.(answer.trim(), record.full);
      setFeedback(record.full ? 'Kalimat lengkap tercatat.' : 'Jawaban tercatat.');
    } else {
      onAnswer?.(answer.trim(), null);
    }
  }

  if (stage === 'title') {
    return (
      <section className="novel-title" data-testid="story-title" aria-labelledby="novel-title-heading">
        <h1 id="novel-title-heading" ref={headingRef} tabIndex={-1}>Lernen — Cerita</h1>
        <p>{PROLOG_META.title} · {PROLOG_META.level}</p>
        <div className="actions">
          <button className="button button-primary" type="button" data-testid="story-new" onClick={() => setStage('create')}>
            Mulai cerita baru
          </button>
          <button className="button" type="button" data-testid="story-continue" disabled={!saved} onClick={resume}>
            Lanjutkan cerita
          </button>
          {onBack ? <button className="button" type="button" onClick={() => { onExit?.(); onBack(); }}>Kembali</button> : null}
        </div>
      </section>
    );
  }

  if (stage === 'create') {
    return (
      <section className="novel-create" data-testid="story-create" aria-labelledby="novel-create-heading">
        <h1 id="novel-create-heading" ref={headingRef} tabIndex={-1}>Buat tokoh</h1>
        <label>
          Nama panggilan
          <input value={name} onChange={(event) => setName(event.target.value)} aria-label="Nama panggilan" />
        </label>
        <div className="actions">
          <button className="button button-primary" type="button" data-testid="story-create-start"
            disabled={!name.trim()} onClick={() => start({ ...DEFAULT_PLAYER, name: name.trim() })}>
            Mulai cerita
          </button>
          <button className="button" type="button" onClick={() => setStage('title')}>Kembali</button>
        </div>
      </section>
    );
  }

  if (!game) return <section className="novel-story"><p>Menyiapkan cerita…</p></section>;
  const node = nodeOf(game.nodeId);
  const transitionStyle = motion ? undefined : { transition: 'opacity 200ms ease, transform 200ms ease' };

  if (node.kind === 'end') {
    const summary = buildSummary(game.attempts, game.flags, game.player.name);
    return (
      <section className="novel-result" data-testid="story-result" aria-labelledby="novel-result-heading" style={transitionStyle}>
        <h1 id="novel-result-heading" ref={headingRef} tabIndex={-1}>Hasil perjalanan</h1>
        {summary.lines.map((line, index) => <p key={index}>{line}</p>)}
        {PROLOG_META.objectives.map((objective) => (
          <p key={objective.id} data-testid={`result-${objective.id}`}>
            {objective.title}: {LEVEL_LABEL[objectiveLevel(game.attempts, objective.id)]}
          </p>
        ))}
        <p data-testid="result-full-sentence">
          Kalimat lengkap: {demonstratedFullSentence(game.attempts, 'introduce') ? 'terbukti' : 'belum terbukti'}
        </p>
        <p>{summary.next}</p>
        <button className="button" type="button" onClick={() => { onExit?.(); setStage('title'); }}>Kembali ke judul</button>
      </section>
    );
  }

  return (
    <section className="novel-story" data-testid="story-stage" data-node={node.id} style={transitionStyle}>
      <div className="focus-header">
        <button className="button" type="button" onClick={() => { soundController.setSpeaking(null, '', 'idle'); onExit?.(); setStage('title'); }}>Keluar cerita</button>
        <h1 ref={headingRef} tabIndex={-1}>{PROLOG_META.title}</h1>
        <span data-testid="speaking-state" data-status={sound.speaking.status}>{sound.speaking.status}</span>
      </div>
      {activePanel ? <aside data-testid="story-panel" data-panel={activePanel}>Panel {activePanel}</aside> : null}

      {node.kind === 'line' ? (
        <div className="novel-line">
          <p data-testid="story-speaker">{node.speaker}</p>
          <p lang={node.lang} data-testid="story-line">{node.text}</p>
          {node.translation ? <p data-testid="story-translation">{node.translation}</p> : null}
          <button className="button button-primary" type="button" data-testid="story-next" onClick={() => advance(node.next)}>Lanjut</button>
        </div>
      ) : null}

      {node.kind === 'choice' ? (
        <div className="novel-choice">
          <h2>{node.prompt}</h2>
          {(node.options ?? []).filter((option) => !option.hideIf?.(game.flags)).map((option) => (
            <button className="button" type="button" key={option.label} onClick={() => {
              onChoice?.(option.label, option.next);
              advance(option.next, { setFlags: option.setFlags, resetHints: option.resetHints });
            }}>{option.label}</button>
          ))}
        </div>
      ) : null}

      {node.kind === 'branch' ? (
        <button className="button" type="button" onClick={() => advance(node.pick({ flags: game.flags, name: game.player.name, hintCounts: game.hintCounts }))}>
          Lanjut
        </button>
      ) : null}

      {node.kind === 'input' ? (
        <div className="novel-input">
          <h2>{node.prompt}</h2>
          <input aria-label="Jawaban cerita" value={answer} onChange={(event) => setAnswer(event.target.value)} />
          <div className="actions">
            <button className="button button-primary" type="button" data-testid="story-answer" disabled={!answer.trim() || pending.current}
              onClick={() => submitInput(node)}>Jawab</button>
            <button className="button" type="button" data-testid="story-hint"
              onClick={() => setFeedback(node.hints[game.hintCounts[node.where] ?? 0] ?? node.hints[node.hints.length - 1] ?? '')}>
              Lihat arti
            </button>
            {node.skip ? <button className="button" type="button" onClick={() => advance(node.skip!.next)}>{node.skip.label}</button> : null}
          </div>
          <p role="status" data-testid="story-feedback">{feedback}</p>
        </div>
      ) : null}
    </section>
  );
}
