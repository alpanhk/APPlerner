import { useEffect, useRef } from "react";
import type { Attempt, Flags } from "../types";
import { LEVEL_LABEL, buildSummary, demonstratedFullSentence, objectiveLevel } from "../engine/evaluate";
import { PROLOG_META } from "../data/story/prolog";

export function ResultScreen({
  attempts,
  flags,
  name,
  onBackToStreet,
  onRetryIntro,
  onSaveAndFinish,
  onOpenReading,
}: {
  attempts: Attempt[];
  flags: Flags;
  name: string;
  onBackToStreet: () => void;
  onRetryIntro: () => void;
  onSaveAndFinish: () => void;
  onOpenReading: (id: number) => void;
}) {
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  const { lines, next } = buildSummary(attempts, flags, name);
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1b2033]/55 p-3">
      <section aria-label="Hasil belajar" className="max-h-full w-full max-w-2xl overflow-auto rounded-2xl border-2 border-[#2c3e6b]/40 bg-[#f7efdd] p-5 shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#b5533c]">Prolog selesai</p>
        <h2 className="text-2xl font-black text-[#2c3e6b]">Hasil belajar — „{PROLOG_META.title}“</h2>
        <ul className="mt-3 space-y-1.5 text-[#1f2233]">
          {lines.map((l, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {PROLOG_META.objectives.map((o) => {
            const lv = objectiveLevel(attempts, o.id);
            return (
              <div key={o.id} className="rounded-lg border border-[#2c3e6b]/25 bg-white/70 p-3">
                <p className="text-sm font-semibold">{o.title}</p>
                <p className="font-black text-[#2c3e6b]">
                  {lv === "mandiri" ? "✓" : lv === "petunjuk" ? "◐" : "○"} {LEVEL_LABEL[lv]}
                </p>
                {o.id === "introduce" && lv !== "belum" && !demonstratedFullSentence(attempts, "introduce") && <p className="text-xs text-[#6b5e4e]">Nama saja dipahami NPC; kalimat lengkap belum didemonstrasikan.</p>}
              </div>
            );
          })}
        </div>
        <p className="mt-4 rounded-lg bg-[#2c3e6b]/8 p-3 text-sm">
          <span className="font-bold text-[#2c3e6b]">Saran berikutnya:</span> {next}
        </p>
        <p className="mt-2 text-xs text-[#6b5e4e]">
          Bacaan pendamping:{" "}
          <button type="button" className="underline" onClick={() => onOpenReading(PROLOG_META.companionReading)}>
            „Hallo, ich bin Anna“
          </button>{" "}
          (A1 · unit 1 · perkenalan).
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onBackToStreet} className="btn-secondary">
            Kembali ke jalan
          </button>
          <button type="button" onClick={onRetryIntro} className="btn-secondary">
            Ulangi perkenalan
          </button>
          <button ref={first} type="button" onClick={onSaveAndFinish} className="btn-primary">
            Simpan & selesai
          </button>
        </div>
      </section>
    </div>
  );
}
