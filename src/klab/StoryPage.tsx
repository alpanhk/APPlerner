import { useEffect, useRef, useState, type FormEvent } from "react";
import "./story.css";
import storyData from "./story-data.json";
import { indexedStoryClips } from "./indexed-story-clips";

type Turn = { id: string; actor: string; name: string; text: string; lang: string; translation: string; audio: string | null };
type Goal = {
  id: string; title: string; sceneId: string; task: string; hint: string; result: string;
  intro: Turn[]; dialog: Turn[]; help: Turn[]; answers: Turn[]; retry: Turn[]; success: Turn[]; variation: Turn[];
};
type Character = { name: string; neutral?: string; "talk-small"?: string; "talk-open"?: string };
type Chapter = {
  id: string; title: string; goals: Goal[]; closing?: string; transfer?: string;
  scenes: { id: string; title: string; context: string; image: string | null; props: { id: string; image: string }[] }[];
};
type Story = { chapters: Chapter[]; characters: Record<string, Character> };
type Outcome = "Berbantuan" | "Pilihan tanpa bantuan" | "Jawaban tanpa bantuan" | "Variasi peron benar";
type Cursor = {
  chapter: number; goal: number; player: string;
  name?: string; letterOpened?: boolean; positions?: Record<number, number>; journal?: Record<string, Outcome>;
};
const players = ["player-01", "player-02", "player-03", "player-04"];
const storageKey = "lernen:a1-story:v1";
const url = (file: string) => indexedStoryClips[file] ?? import.meta.env.BASE_URL + "a1-story/" + file;
const normalize = (value: string) => value.toLocaleLowerCase("de").trim().normalize("NFC")
  .replace(/[.,!?„“"]/g, "").replace(/\s+/g, " ");
const decisions: Record<string, { task: string; options: string[]; correct: string }> = {
  "a1-u2-o1": { task: "Pilih harga peti kecil.", options: ["17 Euro", "70 Euro"], correct: "17 Euro" },
  "a1-u4-o3": { task: "Pesan kopi dan sup.", options: ["Ich möchte einen Kaffee und eine Suppe, bitte.", "Ich möchte ein Wasser, bitte."], correct: "Ich möchte einen Kaffee und eine Suppe, bitte." },
  "a1-u11-o4": { task: "Pilih peron menurut pengumuman terbaru.", options: ["Gleis 3", "Gleis 4"], correct: "Gleis 4" },
  "a1-u12-o5": { task: "Pilih pesan yang menegaskan jadwal akhir.", options: ["Wir treffen uns am Samstag um vier Uhr im Café.", "Wir treffen uns am Sonntag um vier Uhr im Café."], correct: "Wir treffen uns am Sonntag um vier Uhr im Café." },
};

function savedCursor(): Cursor {
  const fallback = { chapter: 0, goal: 0, player: "" };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (!saved || !(saved.player === "" || players.includes(saved.player)) || !Number.isInteger(saved.chapter) ||
      saved.chapter < 0 || saved.chapter > 11 || !Number.isInteger(saved.goal) || saved.goal < 0) return fallback;
    return saved;
  } catch { return fallback; }
}

export function beginStoryForPlayer(portrait: string | undefined, name: string) {
  const previous = savedCursor();
  const player = portrait && players.includes(portrait) ? portrait : players[0];
  localStorage.setItem(storageKey, JSON.stringify({ ...previous, player, name, letterOpened: true }));
}

export default function StoryPage({ initialChapter, paused = false }: { initialChapter?: number; paused?: boolean }) {
  const [story] = useState<Story>(() => storyData as Story);
  const [cursor, setCursor] = useState(() => {
    const saved = savedCursor();
    const chapter = initialChapter && initialChapter >= 1 && initialChapter <= 12 ? initialChapter - 1 : saved.chapter;
    return { ...saved, chapter, goal: chapter === saved.chapter ? saved.goal : saved.positions?.[chapter] ?? 0 };
  });
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(cursor));
  }, [cursor]);

  const chapter = story.chapters[cursor.chapter];
  const goal = chapter.goals[cursor.goal];
  function openChapter(index: number) {
    setCursor({ ...cursor, chapter: index, goal: cursor.positions?.[index] ?? 0 });
  }
  function advance(outcome?: Outcome) {
    if (!goal) return;
    const step = cursor.goal + 1;
    setCursor({
      ...cursor, goal: step, positions: { ...cursor.positions, [cursor.chapter]: step },
      journal: outcome ? { ...cursor.journal, [goal.id]: outcome } : cursor.journal,
    });
  }
  return <section className="a1-story">
    <h1 tabIndex={-1}>Cerita A1</h1>
    {!cursor.player ? <>
      <h2>Pilih karakter</h2>
      <label>Nama tokoh <input value={cursor.name ?? ""} maxLength={35} onChange={e => setCursor({ ...cursor, name: e.target.value })} /></label>
      <div className="a1-story-players">{players.map((player, i) => {
        const image = story.characters[player]?.neutral;
        return <button key={player} onClick={() => setCursor({ ...cursor, player })}>
          {image && <img alt="" src={url(image)} />}Karakter {i + 1}
        </button>;
      })}</div>
    </> : cursor.chapter === 0 && !cursor.letterOpened && cursor.goal === 0 ? <div className="a1-story-panel">
      <h2>Surat dari Mia</h2>
      <p>Petugas pos menyerahkan sebuah surat{cursor.name?.trim() ? " untuk " + cursor.name.trim() : ""}.</p>
      <details><summary>Buka surat</summary><p lang="de">Bis morgen!</p><p>Di bawahnya tergambar sebuah cangkir dan tanda tangan Mia.</p>
        <button onClick={() => setCursor({ ...cursor, letterOpened: true })}>Mulai Bab 01</button>
      </details>
    </div> : <>
      <div className="a1-story-tools">
        <label>Bab <select value={cursor.chapter} onChange={e => openChapter(Number(e.target.value))}>
          {story.chapters.map((book, i) => <option key={book.id} value={i}>{i + 1}. {book.title}</option>)}
        </select></label>
        <button onClick={() => setCursor({ ...cursor, player: "" })}>Ganti karakter</button>
      </div>
      <details><summary>Jurnal cerita</summary>
        {chapter.goals.map(item => <p key={item.id}>{item.title} · {cursor.journal?.[item.id] ?? "Belum tercatat"}</p>)}
      </details>
      {goal ? <StoryScene key={goal.id} story={story} chapter={chapter} goal={goal} player={cursor.player} paused={paused}
        next={advance} /> : <div className="a1-story-panel">
        <h2>Akhir bab · {chapter.title}</h2><p>{chapter.closing}</p>
        {chapter.transfer && <details><summary>Pertemuan mandiri</summary><p>{chapter.transfer}</p></details>}
        {cursor.chapter < story.chapters.length - 1 && <button onClick={() => openChapter(cursor.chapter + 1)}>Lanjut ke bab berikutnya</button>}
      </div>}
    </>}
  </section>;
}

function StoryScene({ story, chapter, goal, player, paused, next }: {
  story: Story; chapter: Chapter; goal: Goal; player: string; paused: boolean; next: (outcome?: Outcome) => void;
}) {
  const dialog = [...goal.intro, ...goal.dialog];
  const stepKey = storageKey + ":" + goal.id;
  const [savedStep] = useState<{ turn?: number; feedback?: "correct" | "retry"; assisted?: boolean; transcriptOpened?: boolean }>(() => {
    try { return JSON.parse(localStorage.getItem(stepKey) ?? "{}") ?? {}; }
    catch { return {}; }
  });
  const [turnIndex, setTurnIndex] = useState(savedStep.turn ?? 0);
  const [feedback, setFeedback] = useState(savedStep.feedback);
  const [text, setText] = useState(() => {
    try { return JSON.parse(localStorage.getItem(stepKey) ?? "{}").text ?? ""; } catch { return ""; }
  });
  const [transcriptOpened, setTranscriptOpened] = useState(savedStep.transcriptOpened ?? false);
  const [assisted, setAssisted] = useState(savedStep.assisted ?? false);
  useEffect(() => {
    localStorage.setItem(stepKey, JSON.stringify({ turn: turnIndex, feedback, assisted, text, transcriptOpened }));
  }, [stepKey, turnIndex, feedback, assisted, text, transcriptOpened]);
  const [variation, setVariation] = useState(false);
  const [variationCorrect, setVariationCorrect] = useState<boolean>();
  const [muted, setMuted] = useState(() => localStorage.getItem("lernen:a1-muted") === "1");
  const [reduced, setReduced] = useState(() => localStorage.getItem("lernen:a1-motion") === "1");
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState<Turn>();
  const [audioError, setAudioError] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const action = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (feedback) action.current?.focus(); }, [feedback]);
  const resultTurn = feedback === "correct" ? goal.success[0] : feedback === "retry" ? goal.retry[0] : undefined;
  const turn = variation ? goal.variation[0] : resultTurn ?? dialog[Math.min(turnIndex, dialog.length - 1)];
  const scene = chapter.scenes.find(stage => stage.id === goal.sceneId);
  const decision = decisions[goal.id];
  const examples = goal.answers.filter(answer => answer.actor === player);
  const variants = examples.length ? examples.map(answer => answer.text) : [...goal.task.matchAll(/«([^»{}]+)»/g)].map(match => match[1]);
  const canAnswer = turnIndex >= dialog.length - 1;
  const moveOn = (outcome?: Outcome) => {
    localStorage.removeItem(stepKey);
    next(outcome);
  };

  function stop() {
    audio.current?.pause();
    audio.current = null;
    setPlaying(undefined);
  }
  useEffect(() => () => { audio.current?.pause(); audio.current = null; }, []);
  useEffect(() => { if (paused) stop(); }, [paused]);
  useEffect(() => {
    if (!playing || reduced || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setFrame(value => (value + 1) % 4), 115);
    return () => clearInterval(timer);
  }, [playing, reduced]);

  function play(line: Turn | undefined) {
    stop();
    setAudioError(false);
    if (!line?.audio || muted) return;
    const clip = new Audio(url(line.audio));
    audio.current = clip;
    clip.onplaying = () => {
      if (audio.current !== clip) return;
      setFrame(0);
      setPlaying(line);
    };
    clip.onended = () => { if (audio.current === clip) stop(); };
    const fail = () => {
      if (audio.current !== clip) return;
      stop();
      setAudioError(true);
    };
    clip.onerror = fail;
    void clip.play().catch(fail);
  }

  function answer(value: string) {
    if (variation) {
      setVariationCorrect(value === "Gleis 5");
      return;
    }
    const correct = decision ? value === decision.correct : variants.some(item => normalize(item) === normalize(value));
    if (!correct) setAssisted(true);
    setFeedback(correct ? "correct" : "retry");
    play(correct ? goal.success[0] ?? examples.find(item => normalize(item.text) === normalize(value)) : goal.retry[0]);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    answer(text);
  }
  function avatar(id: string, className: string) {
    const actor = story.characters[id];
    if (!actor?.neutral) return null;
    const pose = playing?.actor === id && !reduced && frame > 0
      ? actor[frame === 2 ? "talk-open" : "talk-small"] : undefined;
    return <img className={className} alt="" src={url(pose || actor.neutral)} />;
  }
  const shown = playing ?? turn;
  const props = scene?.props.filter(prop => {
    if (goal.id === "a1-u4-o3") return prop.id === "menu" || (feedback === "correct" && ["kopi", "sup"].includes(prop.id));
    if (goal.id === "a1-u11-o4" && prop.id === "papan-peron" && (feedback !== "correct" || (variation && variationCorrect === undefined))) return false;
    return true;
  });
  const npc = shown?.actor === "player" ? player : shown?.actor === player ? turn?.actor : shown?.actor;
  return <>
    <h2 tabIndex={-1} data-goal={goal.id}>{goal.title}</h2>
    <figure className="a1-story-stage" aria-label={scene?.title}>
      {scene?.image && <img className="a1-story-background" src={url(scene.image)} alt="" />}
      {avatar(player, "a1-story-player")}
      {npc && npc !== player && avatar(npc, "a1-story-npc")}
      <div className="a1-story-props">{props?.slice(0, 4).map(prop =>
        <img key={prop.id} alt={prop.id.replace(/-/g, " ")} src={url(prop.image)} />)}</div>
    </figure>
    <div className="a1-story-panel">
      {goal.intro.length > 0 && <p>{scene?.context}</p>}
      {shown && <div aria-live="polite">
        <strong>{players.includes(shown.actor) ? "Tokohmu" : shown.name}</strong><p lang={shown.lang}>{goal.id === "a1-u11-o4" && shown.actor === "pengumuman" && (feedback !== "correct" || (variation && variationCorrect === undefined)) ? "[Dengarkan pengumuman.]" : shown.text}</p>
        {goal.id === "a1-u11-o4" && shown.actor === "pengumuman" && (feedback !== "correct" || (variation && variationCorrect === undefined)) && <details onToggle={event => { if (event.currentTarget.open) { setAssisted(true); setTranscriptOpened(true); } }}><summary>Buka transkrip (dicatat sebagai bantuan membaca)</summary><p lang="de">{variation ? shown.text : "Achtung, der Zug fährt heute von Gleis vier ab."}</p></details>}
        {shown.translation && <details onToggle={event => { if (event.currentTarget.open) setAssisted(true); }}><summary>Terjemahan</summary><p>{shown.translation}</p></details>}
      </div>}
      <div className="a1-story-tools">
        <button disabled={!shown?.audio || muted} onClick={() => play(shown)}>{playing ? "Putar ulang" : "Dengarkan"}</button>
        {playing && <button onClick={stop}>Hentikan audio</button>}
        <button aria-pressed={muted} onClick={() => {
          stop(); setMuted(!muted); localStorage.setItem("lernen:a1-muted", muted ? "0" : "1");
        }}>Bisu</button>
        <button aria-pressed={reduced} onClick={() => {
          setFrame(0); setReduced(!reduced); localStorage.setItem("lernen:a1-motion", reduced ? "0" : "1");
        }}>Minim gerak</button>
      </div>
      {shown && !shown.audio && <p role="status">Klip untuk ujaran ini belum tersedia.</p>}
      {audioError && <p role="status">Audio gagal diputar. Coba dengarkan kembali.</p>}
      {!canAnswer && <button onClick={() => { setTurnIndex(turnIndex + 1); play(dialog[turnIndex + 1]); }}>Dialog berikutnya</button>}
      {canAnswer && feedback !== "correct" && <>
        <h3>Giliranmu</h3><p>{decision?.task ?? goal.task}</p>
        {decision ? <div className="a1-story-tools">{decision.options.map(option =>
          <button key={option} onClick={() => answer(option)} lang="de">{option}</button>)}</div>
          : variants.length ? <form onSubmit={submit} className="a1-story-tools">
            <label>Jawaban <input lang="de" value={text} onChange={e => setText(e.target.value)} required /></label>
            <button type="submit">Periksa jawaban</button>
          </form> : <button onClick={() => moveOn()}>Lanjut</button>}
        {feedback === "retry" && <p role="status">{goal.id === "a1-u11-o4" ? "Itu peron lama. Dengarkan kembali pengumuman untuk mencari peron terbaru." : goal.hint || "Dengarkan lagi dan coba jawaban lain."}</p>}
        {feedback === "retry" && <button ref={action} onClick={() => { stop(); setFeedback(undefined); setText(""); if (turnIndex >= 0) play(dialog[turnIndex]); }}>Coba lagi</button>}
        <details onToggle={event => { if (event.currentTarget.open) setAssisted(true); }}>
          <summary>Bantuan</summary><p>{goal.help[0]?.text || (goal.id === "a1-u11-o4" ? "Dengarkan angka setelah Gleis." : goal.hint)}</p>
          {goal.help[0]?.audio && <button disabled={muted} onClick={() => play(goal.help[0])}>Dengarkan tutor</button>}
          {variants[0] && <p lang="de">{variants[0]}</p>}
        </details>
      </>}
      {feedback === "correct" && <>
        {!variation && <p role="status">{goal.result || "Jawaban sesuai."}</p>}
        {!variation && goal.variation.length > 0 && <button onClick={() => { setVariation(true); play(goal.variation[0]); }}>Coba pengumuman baru</button>}
        {variation && <div className="a1-story-tools">
          <strong>Giliranmu · Peron mana yang baru?</strong>
          {["Gleis 4", "Gleis 5"].map(value => <button key={value} onClick={() => answer(value)} lang="de">{value}</button>)}
          {variationCorrect !== undefined && <p role="status">{variationCorrect ? "Peron cocok dengan pengumuman terbaru." : "Dengarkan lagi untuk menemukan peron terbaru."}</p>}
        </div>}
        <button ref={action} onClick={() => moveOn(variationCorrect && !assisted && !transcriptOpened ? "Variasi peron benar" : assisted || transcriptOpened ? "Berbantuan" : decision ? "Pilihan tanpa bantuan" : "Jawaban tanpa bantuan")}>Lanjut</button>
      </>}
    </div>
  </>;
}
