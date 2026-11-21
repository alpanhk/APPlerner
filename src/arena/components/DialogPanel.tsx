import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import type { ChoiceOption, SpeakerId } from "../types";
import { SPEAKER_NAMES } from "./Portrait";

// ===== Panel dialog =====
interface PanelProps {
  speaker: SpeakerId | "player";
  playerName: string;
  text: string;
  lang: "de" | "id";
  translation?: string;
  showTranslation: boolean;
  onToggleTranslation: () => void;
  canListen: boolean;
  onListen: () => void;
  isSpeaking: boolean;
  audioStatus?: string;
  children: ReactNode; // area tindakan utama
}

export function DialogPanel(p: PanelProps) {
  const name = p.speaker === "player" ? p.playerName : SPEAKER_NAMES[p.speaker] ?? p.speaker;
  const isNarr = p.speaker === "narator";
  return (
    <section
      aria-live="polite"
      className="arena-dialog absolute inset-x-0 bottom-0 z-10 mx-auto w-full max-w-6xl max-h-[85%] overflow-y-auto px-2 pb-2 sm:px-4 sm:pb-4"
    >
      <div className="rounded-2xl border-2 border-[#2c3e6b]/40 bg-[#f7efdd]/95 shadow-[0_-6px_30px_rgba(20,25,50,.35)] backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 pt-3 sm:px-6">
          {!isNarr && (
            <span className="rounded-md bg-[#2c3e6b] px-3 py-1 text-sm font-bold tracking-wide text-[#f7efdd] shadow">
              {name}
            </span>
          )}
          {isNarr && <span className="text-xs font-semibold uppercase tracking-widest text-[#6b5e4e]">Narasi</span>}
          {p.lang === "de" && <span className="rounded border border-[#b5533c]/60 px-1.5 text-[11px] font-semibold text-[#b5533c]">DE</span>}
          <span className="ml-auto flex items-center gap-2">
            {p.canListen && (
              <button
                type="button"
                onClick={p.onListen}
                className="btn-ghost"
                aria-label="Dengar lagi kalimat ini"
              >
                {p.isSpeaking ? "■ Berhenti" : "▶ Dengar lagi"}
              </button>
            )}
            {p.translation && (
              <button type="button" onClick={p.onToggleTranslation} className="btn-ghost" aria-pressed={p.showTranslation}>
                {p.showTranslation ? "Sembunyikan arti" : "Arti"}
              </button>
            )}
          </span>
        </div>
        <div className="px-4 pb-2 pt-2 sm:px-6">
          <p className={`dialog-text leading-snug text-[#1f2233] ${isNarr ? "italic" : "font-medium"}`} lang={p.lang}>
            {p.text}
          </p>
          {p.showTranslation && p.translation && (
            <p className="mt-1 border-l-4 border-[#b5533c]/60 pl-3 text-[#4b4238] dialog-sub">{p.translation}</p>
          )}
          {p.audioStatus && <p className="mt-1 text-xs text-[#6b5e4e]">{p.audioStatus}</p>}
        </div>
        <div className="border-t border-[#2c3e6b]/15 px-4 py-3 sm:px-6">{p.children}</div>
      </div>
    </section>
  );
}

// ===== Tombol Lanjut =====
export function NextButton({ onClick, label = "Lanjut ▸" }: { onClick: () => void; label?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="flex justify-end">
      <button ref={ref} type="button" onClick={onClick} className="btn-primary">
        {label}
      </button>
    </div>
  );
}

// ===== Daftar pilihan =====
export function ChoiceList({
  prompt,
  options,
  onPick,
}: {
  prompt?: string;
  options: ChoiceOption[];
  onPick: (o: ChoiceOption) => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div>
      {prompt && <p className="mb-2 text-sm font-semibold text-[#4b4238]">{prompt}</p>}
      <ul className="flex flex-wrap gap-2" role="list">
        {options.map((o, i) => (
          <li key={o.label}>
            <button ref={i === 0 ? first : undefined} type="button" onClick={() => onPick(o)} className="btn-choice">
              <span aria-hidden="true" className="mr-2 text-[#b5533c]">◆</span>
              {o.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ===== Kolom jawaban pemain =====
interface AnswerProps {
  prompt: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  chips: string[];
  hints: string[];
  hintLevel: number;
  onHint: () => void;
  feedback?: string;
  skip?: { label: string; onSkip: () => void };
  busy?: boolean;
}

export function AnswerInput(a: AnswerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [a.prompt]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (a.busy) return;
    a.onSubmit();
  };
  const addChip = (c: string) => {
    const v = a.value;
    const isPunct = /^[.!?,]$/.test(c);
    const next = isPunct ? v.trimEnd() + c : v.length === 0 || /\s$/.test(v) ? v + c : v + " " + c;
    a.onChange(next);
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="rounded bg-[#b5533c] px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-white">Giliranmu</span>
        <p className="text-sm font-semibold text-[#4b4238]">{a.prompt}</p>
      </div>
      <div className="flex flex-wrap gap-1.5" aria-label="Susun jawaban dari kata">
        {a.chips.map((c) => (
          <button key={c} type="button" onClick={() => addChip(c)} className="chip" tabIndex={0}>
            {c}
          </button>
        ))}
        {a.value && (
          <button type="button" onClick={() => a.onChange("")} className="chip chip-muted">
            Hapus
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input
          ref={inputRef}
          data-answer-input
          type="text"
          lang="de"
          autoComplete="off"
          autoCapitalize="sentences"
          spellCheck={false}
          value={a.value}
          onChange={(e) => a.onChange(e.target.value)}
          placeholder="Ketik jawabanmu dalam bahasa Jerman…"
          aria-label="Jawabanmu dalam bahasa Jerman"
          className="dialog-sub min-w-0 flex-1 rounded-lg border-2 border-[#2c3e6b]/40 bg-white px-3 py-2 text-[#1f2233] focus:border-[#2c3e6b] focus:outline-none focus:ring-2 focus:ring-[#b5533c]/50"
        />
        <button type="submit" className="btn-primary" disabled={a.busy}>
          Kirim
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {a.hintLevel < a.hints.length && (
          <button type="button" onClick={a.onHint} className="btn-ghost">
            ? Petunjuk {a.hintLevel > 0 ? `(${a.hintLevel}/${a.hints.length})` : ""}
          </button>
        )}
        {a.skip && (
          <button type="button" onClick={a.skip.onSkip} className="btn-ghost">
            {a.skip.label}
          </button>
        )}
        <span className="text-xs text-[#6b5e4e]">ß boleh ditulis „ss“. Huruf besar/kecil & tanda baca bebas.</span>
      </div>
      {a.hintLevel > 0 && (
        <ul className="space-y-1 rounded-lg bg-[#2c3e6b]/8 p-2 text-sm text-[#2c3e6b]" aria-label="Petunjuk tutor">
          {a.hints.slice(0, a.hintLevel).map((h, i) => (
            <li key={i}>
              <span className="font-bold">Tutor {i + 1}:</span> {h}
            </li>
          ))}
        </ul>
      )}
      {a.feedback && (
        <p role="alert" className="rounded-lg border-l-4 border-[#b5533c] bg-[#b5533c]/10 px-3 py-1.5 text-sm text-[#5a2a22]">
          ✎ {a.feedback}
        </p>
      )}
    </form>
  );
}
