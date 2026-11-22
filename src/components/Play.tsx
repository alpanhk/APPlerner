"use client";

import { useEffect, useRef, useState } from "react";
import { actorUrl, bgUrl, canSpeak, playSfx, speak, stopSpeak } from "@/lib/media";
import { CAST, nameOf } from "@/story/cast";
import { noteOf } from "@/story/chapters";
import { advance, answer, choose, hint, nodeOf, skip, startGame, visibleOptions, type Step } from "@/story/engine";
import { fill } from "@/story/match";
import type { Attempt, Chapter, Game, StageChar } from "@/story/types";

interface Props {
  chapter: Chapter;
  name: string;
  avatar: string;
  initial: Game | null;
  notes: string[];
  onSave: (g: Game) => void;
  onAttempt: (a: Attempt) => void;
  onExit: () => void;
  onDone: (g: Game) => void;
}

const BEATS = ["Tiba", "Belajar", "Bertemu", "Menjelajah", "Temuan"];
const EMOTE: Record<string, string> = { question: "?", think: "…" };
const pref = (key: string) => typeof window === "undefined" || localStorage.getItem(key) !== "0";

const btn = "rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-40";
const btnPrimary = `${btn} bg-terra text-cream hover:bg-terra-dark`;
const btnGhost = `${btn} border border-line bg-white/70 text-ink hover:border-terra hover:text-terra`;
const pill = "whitespace-nowrap rounded-full bg-ink/55 px-3 py-1.5 text-xs font-bold text-cream backdrop-blur transition hover:bg-ink/80";

function Actor({ c, avatar, active, dim, mouth }: { c: StageChar; avatar: string; active: boolean; dim: boolean; mouth: boolean }) {
  const flip = c.id !== "player" && CAST[c.id]?.flip;
  const left = c.side === "left";
  return (
    <div
      className={`absolute bottom-[-8%] aspect-[2/3] h-[82%] max-h-[760px] transition-[filter,transform] duration-300 sm:bottom-[-9%] sm:h-[96%] ${left ? "left-[-5%] anim-left sm:left-[7%]" : "right-[-5%] anim-right sm:right-[7%]"} ${
        dim ? "brightness-[0.7] saturate-[0.7]" : ""
      } ${active ? "z-10 scale-[1.03]" : ""}`}
      style={{ transformOrigin: "bottom center" }}
    >
      <div className={`relative h-full w-full ${flip ? "-scale-x-100" : ""}`}>
        <img src={actorUrl(c.id, avatar)} alt="" className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_8px_18px_rgba(20,24,36,0.45)]" />
        <img src={actorUrl(c.id, avatar, true)} alt="" className={`absolute inset-0 h-full w-full object-contain object-bottom ${mouth && active ? "opacity-100" : "opacity-0"}`} />
      </div>
      {c.expr && EMOTE[c.expr] && (
        <span className={`anim-rise absolute top-[4%] grid h-9 w-9 place-items-center rounded-full bg-cream font-display text-xl font-bold text-terra shadow-lg ${left ? "right-[18%]" : "left-[18%]"}`}>
          {EMOTE[c.expr]}
        </span>
      )}
    </div>
  );
}

export default function Play({ chapter, name, avatar, initial, notes, onSave, onAttempt, onExit, onDone }: Props) {
  const [first] = useState<Step>(() => (initial ? { g: initial, effects: [] } : startGame(chapter, name, notes)));
  const [g, setG] = useState<Game>(first.g);
  const [text, setText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const [tw, setTw] = useState({ v: -1, n: 0 }); // teks bertahap, terikat pada adegan (visit)
  const [mouth, setMouth] = useState(false);
  const [panel, setPanel] = useState<"riwayat" | "catatan" | null>(null);
  const [sound, setSound] = useState(() => pref("lernen.sound"));
  const [showTr, setShowTr] = useState(() => pref("lernen.tr"));
  const [prevBg, setPrevBg] = useState(first.g.stage.bg);
  const inputRef = useRef<HTMLInputElement>(null);

  const node = nodeOf(chapter, g.nodeId);
  const lineText = node.kind === "line" ? fill(node.text, name) : "";
  const shown = tw.v === g.visit ? tw.n : 0;
  const typing = shown < lineText.length;
  const options = node.kind === "choice" ? visibleOptions(chapter, g) : [];
  const speaker = node.kind === "line" ? node.speaker : node.kind === "input" ? "player" : null;
  const busy = g.stage.chars.length > 0 || !!g.overlay;

  function run(effects: Step["effects"]) {
    let spoke = false;
    for (const e of effects) {
      if (!sound) continue;
      if (e.type === "sfx") playSfx(e.id);
      else {
        speak(e.text);
        spoke = true;
      }
    }
    if (!spoke) stopSpeak();
  }

  function apply(s: Step) {
    if (s.g.nodeId !== g.nodeId) setText("");
    setFeedback(s.feedback ?? null);
    if (s.feedback) setShake((n) => n + 1);
    setG(s.g);
    if (s.g.visit !== g.visit) run(s.effects);
    if (s.attempt) onAttempt(s.attempt);
    if (s.g !== g) onSave(s.g);
    if (s.g.done) onDone(s.g);
  }

  function next() {
    if (node.kind !== "line") return;
    if (typing) setTw({ v: g.visit, n: lineText.length });
    else apply(advance(chapter, g, name));
  }

  function submit() {
    if (node.kind === "input" && text.trim()) apply(answer(chapter, g, text, name));
  }

  function addChip(raw: string) {
    const chip = fill(raw, name);
    setText((t) => (/^[,.!?]$/.test(chip) ? t.trimEnd() + chip : t + (t && !t.endsWith(" ") ? " " : "") + chip));
    inputRef.current?.focus();
  }

  // Efek adegan pertama + simpan awal
  useEffect(() => {
    run(first.effects);
    if (!initial) onSave(first.g);
    return stopSpeak;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teks muncul bertahap
  useEffect(() => {
    if (!lineText) return;
    const v = g.visit;
    const len = lineText.length;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- efek ketik disengaja
      setTw({ v, n: len });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- efek ketik disengaja
    setTw({ v, n: 0 });
    const t = setInterval(() => setTw((s) => (s.v !== v || s.n >= len ? s : { v, n: s.n + 2 })), 26);
    return () => clearInterval(t);
  }, [g.visit, lineText]);

  useEffect(() => {
    if (!typing) return;
    const t = setInterval(() => setMouth((m) => !m), 170);
    return () => clearInterval(t);
  }, [typing]);

  useEffect(() => {
    const t = setTimeout(() => setPrevBg(g.stage.bg), 650);
    return () => clearTimeout(t);
  }, [g.stage.bg]);

  useEffect(() => {
    if (node.kind === "input") inputRef.current?.focus();
  }, [node.kind, g.nodeId]);

  // Papan ketik: Enter/Spasi = lanjut, angka = pilih
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  // eslint-disable-next-line react-hooks/refs -- pola handler terbaru disengaja
  keyRef.current = (e) => {
    const el = e.target as HTMLElement;
    if (panel || el.tagName === "INPUT" || el.tagName === "BUTTON") return;
    if (node.kind === "line" && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      next();
    } else if (node.kind === "choice" && /^[1-9]$/.test(e.key) && options[Number(e.key) - 1]) {
      apply(choose(chapter, g, options[Number(e.key) - 1], name));
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const toggle = (key: string, value: boolean, set: (v: boolean) => void) => {
    localStorage.setItem(key, value ? "1" : "0");
    set(value);
    if (!value && key === "lernen.sound") stopSpeak();
  };

  const hintLevel = node.kind === "input" ? (g.hintLevels[node.id] ?? 0) : 0;
  const context = node.kind === "input" ? [...g.history].reverse().find((h) => h.speaker !== "player") : undefined;
  const who = node.kind === "line" && node.speaker !== "narator" ? CAST[node.speaker] : null;

  return (
    <div className="flex h-dvh flex-col bg-ink">
      {/* ---------- Panggung ---------- */}
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bgUrl(prevBg)})` }} />
        <img
          key={g.stage.bg}
          src={bgUrl(g.stage.bg)}
          alt=""
          className={`anim-fade absolute inset-0 h-full w-full object-cover transition-[filter,transform] duration-500 ${busy ? "scale-105 blur-[3px] brightness-[0.85]" : ""}`}
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/60 to-transparent" />

        <div className="absolute inset-0 mx-auto max-w-5xl">
          {g.stage.chars.map((c) => (
            <Actor key={`${c.side}-${c.id}`} c={c} avatar={avatar} active={speaker === c.id} dim={!!speaker && speaker !== "narator" && speaker !== c.id} mouth={mouth && typing} />
          ))}
        </div>

        {g.overlay && (
          <div className="absolute inset-0 z-20 grid place-items-center bg-ink/40 p-6">
            <div key={g.overlay.text + g.overlay.kind} className={`prop prop-${g.overlay.kind} anim-paper`} lang="de">
              {fill(g.overlay.text, name)}
              {g.overlay.sub && <span className="prop-sub">{fill(g.overlay.sub, name)}</span>}
            </div>
          </div>
        )}

        {/* Bilah atas */}
        <div className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-ink/75 to-transparent px-3 pb-8 pt-3 sm:px-5">
          <div className="mx-auto flex max-w-5xl items-start justify-between gap-3">
            <button onClick={onExit} className={pill} aria-label="Kembali ke peta perjalanan">
              ← Peta
            </button>
            <div className="min-w-0 text-center text-cream">
              <p className="truncate text-xs font-bold uppercase tracking-[0.18em] opacity-80">{chapter.no === 0 ? "Prolog" : `Bab ${chapter.no}`}</p>
              <p className="truncate font-display text-lg font-semibold leading-tight">{chapter.title}</p>
              <ol className="mt-2 flex items-center justify-center gap-1.5" aria-label={`Langkah ${node.beat} dari 5: ${BEATS[node.beat - 1]}`}>
                {BEATS.map((b, i) => {
                  const on = i + 1 === node.beat;
                  return (
                    <li key={b} className={`whitespace-nowrap rounded-full text-[11px] font-bold transition-all ${on ? "bg-mustard px-2.5 py-0.5 text-ink" : `h-1.5 w-3 sm:w-5 ${i + 1 < node.beat ? "bg-cream/80" : "bg-cream/30"}`}`}>
                      {on ? `${i + 1} · ${b}` : ""}
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row">
              {canSpeak() && (
                <button onClick={() => toggle("lernen.sound", !sound, setSound)} className={pill} aria-pressed={sound}>
                  Suara {sound ? "nyala" : "mati"}
                </button>
              )}
              <button onClick={() => setPanel("catatan")} className={pill}>
                Catatan
              </button>
              <button onClick={() => setPanel("riwayat")} className={`${pill} hidden sm:block`}>
                Riwayat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Panel dialog ---------- */}
      <div className="scroll-thin relative z-30 max-h-[62dvh] shrink-0 overflow-y-auto border-t-4 border-terra bg-cream">
        <div className="mx-auto min-h-[12.5rem] max-w-3xl px-4 py-4 sm:px-6 sm:py-5">
          {node.kind === "line" && (
            <div onClick={next} className="block w-full cursor-pointer text-left">
              <div className="flex items-center gap-2">
                {who ? (
                  <>
                    <span className="rounded-md bg-terra px-2.5 py-1 text-sm font-extrabold text-cream">{who.name}</span>
                    <span className="text-xs text-ink-soft">{who.role}</span>
                  </>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">{node.lang === "de" ? "Tertulis" : "Narasi"}</span>
                )}
                {node.lang === "de" && <span className="ml-auto rounded border border-olive px-1.5 text-[11px] font-extrabold text-olive">DE</span>}
              </div>
              <p
                lang={node.lang}
                aria-live="polite"
                className={`mt-2.5 text-pretty ${node.lang === "de" ? "font-display text-2xl font-semibold leading-snug sm:text-[1.75rem]" : `text-lg leading-relaxed ${who ? "" : "italic text-ink-soft"}`}`}
              >
                {lineText.slice(0, shown)}
                <span className="sr-only">{lineText.slice(shown)}</span>
              </p>
              {node.tr && showTr && !typing && <p className="anim-rise mt-2 text-base leading-relaxed text-ink-soft">{fill(node.tr, name)}</p>}
              <div className="mt-3 flex items-center gap-2">
                {node.lang === "de" && canSpeak() && (
                  <button onClick={(e) => (e.stopPropagation(), speak(lineText))} className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink-soft hover:border-terra hover:text-terra">
                    Dengar lagi
                  </button>
                )}
                {node.tr && (
                  <button onClick={(e) => (e.stopPropagation(), toggle("lernen.tr", !showTr, setShowTr))} className="rounded-full border border-line px-3 py-1 text-xs font-bold text-ink-soft hover:border-terra hover:text-terra">
                    {showTr ? "Sembunyikan arti" : "Lihat arti"}
                  </button>
                )}
                <button onClick={(e) => (e.stopPropagation(), next())} className={`ml-auto rounded-full px-3 py-1 text-sm font-bold text-terra hover:bg-terra/10 ${typing ? "" : "anim-nudge"}`}>
                  {typing ? "Lewati ▸" : "Lanjut ▸"}
                </button>
              </div>
            </div>
          )}

          {node.kind === "choice" && (
            <div className="anim-rise">
              {node.prompt && <p className="mb-3 text-lg font-semibold">{node.prompt}</p>}
              <div className="grid gap-2">
                {options.map((o, i) => (
                  <button
                    key={o.label}
                    onClick={() => apply(choose(chapter, g, o, name))}
                    className="flex items-center gap-3 rounded-xl border border-line bg-white/70 px-4 py-3 text-left font-semibold transition hover:border-terra hover:bg-white"
                  >
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper text-xs font-extrabold text-ink-soft">{i + 1}</span>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {node.kind === "input" && (
            <div className="anim-rise">
              {context && (
                <p className="mb-2 border-l-4 border-line pl-3 text-sm text-ink-soft">
                  {context.speaker !== "narator" && <b className="text-ink">{nameOf(context.speaker, name)}: </b>}
                  <span lang={context.lang}>{context.text}</span>
                  {context.tr && showTr && <span className="block text-xs">{context.tr}</span>}
                </p>
              )}
              <label htmlFor="jawab" className="block text-base font-bold">
                {node.prompt}
                {node.guided && <span className="ml-2 rounded bg-paper px-1.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">latihan</span>}
              </label>
              <form
                key={shake}
                onSubmit={(e) => (e.preventDefault(), submit())}
                className={`mt-2 flex gap-2 ${feedback ? "anim-shake" : ""}`}
              >
                <input
                  id="jawab"
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  lang="de"
                  autoComplete="off"
                  autoCapitalize="sentences"
                  spellCheck={false}
                  maxLength={160}
                  placeholder="Ketik dalam bahasa Jerman, atau susun dari kepingan kata…"
                  className="min-w-0 flex-1 rounded-xl border-2 border-line bg-white px-4 py-2.5 font-display text-xl outline-none placeholder:font-sans placeholder:text-sm placeholder:text-ink-soft/70 focus:border-terra"
                />
                <button type="submit" disabled={!text.trim()} className={btnPrimary}>
                  Kirim
                </button>
              </form>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {node.chips.map((c, i) => (
                  <button key={`${c}-${i}`} onClick={() => addChip(c)} lang="de" className="rounded-lg border border-line bg-white px-2.5 py-1 font-display text-base font-semibold hover:border-terra hover:text-terra">
                    {fill(c, name)}
                  </button>
                ))}
                {["ä", "ö", "ü", "ß"].map((c) => (
                  <button key={c} onClick={() => (setText((t) => t + c), inputRef.current?.focus())} aria-label={`Sisipkan huruf ${c}`} className="rounded-lg border border-dashed border-line px-2.5 py-1 text-base text-ink-soft hover:border-terra hover:text-terra">
                    {c}
                  </button>
                ))}
                {text && (
                  <button onClick={() => (setText(""), inputRef.current?.focus())} className="rounded-lg px-2.5 py-1 text-sm font-bold text-ink-soft hover:text-terra">
                    Hapus
                  </button>
                )}
              </div>
              <div aria-live="polite">
                {feedback && <p className="mt-3 rounded-xl bg-terra/10 px-4 py-2.5 text-sm font-semibold text-terra-dark">{feedback}</p>}
                {hintLevel > 0 && (
                  <ol className="mt-3 space-y-1.5">
                    {node.hints.slice(0, hintLevel).map((h, i) => (
                      <li key={h} className="anim-rise flex gap-2 rounded-xl bg-mustard/15 px-4 py-2 text-sm">
                        <span className="font-extrabold text-mustard">{i + 1}</span>
                        {fill(h, name)}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const g2 = hint(chapter, g);
                    setG(g2);
                    onSave(g2);
                  }}
                  disabled={hintLevel >= node.hints.length}
                  className={btnGhost}
                >
                  Petunjuk {hintLevel}/{node.hints.length}
                </button>
                {node.skip && (
                  <button onClick={() => apply(skip(chapter, g, name))} className={btnGhost}>
                    {node.skip.label}
                  </button>
                )}
                {!node.guided && hintLevel === 0 && <span className="text-xs text-ink-soft">Tanpa petunjuk = bukti mandiri.</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Laci: catatan & riwayat ---------- */}
      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={() => setPanel(null)}>
          <aside className="anim-right scroll-thin flex h-full w-[min(92vw,26rem)] flex-col overflow-y-auto bg-cream p-5 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={panel === "catatan" ? "Buku catatan" : "Riwayat percakapan"}>
            <div className="flex items-center gap-2">
              {(["catatan", "riwayat"] as const).map((p) => (
                <button key={p} onClick={() => setPanel(p)} className={`rounded-full px-4 py-1.5 text-sm font-bold ${panel === p ? "bg-ink text-cream" : "text-ink-soft hover:text-ink"}`}>
                  {p === "catatan" ? "Buku catatan" : "Riwayat"}
                </button>
              ))}
              <button onClick={() => setPanel(null)} className="ml-auto rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:text-terra" aria-label="Tutup">
                Tutup ✕
              </button>
            </div>
            {panel === "catatan" ? (
              <ul className="mt-4 space-y-2">
                {g.notes.length === 0 && <li className="text-sm text-ink-soft">Kalimat yang dimodelkan Frau Lehmann akan terkumpul di sini.</li>}
                {g.notes.map((id) => {
                  const note = noteOf(id);
                  if (!note) return null;
                  const t = fill(note.text, name);
                  return (
                    <li key={id} className="rounded-xl border border-line bg-white/70 p-3">
                      <button onClick={() => speak(t)} lang="de" className="text-left font-display text-lg font-semibold hover:text-terra">
                        {t}
                      </button>
                      <p className="text-sm text-ink-soft">{fill(note.tr, name)}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="mt-4 space-y-3">
                {g.history.map((h, i) => (
                  <li key={i} className={h.speaker === "player" ? "ml-8 rounded-xl bg-terra/10 p-3" : ""}>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">{h.speaker === "narator" ? "Narasi" : nameOf(h.speaker, name)}</p>
                    <p lang={h.lang} className={h.lang === "de" ? "font-display text-lg font-semibold" : "text-sm"}>
                      {h.text}
                    </p>
                    {h.tr && <p className="text-sm text-ink-soft">{h.tr}</p>}
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
