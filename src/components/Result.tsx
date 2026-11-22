"use client";

import { bgUrl, speak } from "@/lib/media";
import { nameOf } from "@/story/cast";
import { noteOf } from "@/story/chapters";
import { bestEvidence, describeEvidence, LEVEL_LABEL, levelOf, type Level } from "@/story/evaluate";
import { fill } from "@/story/match";
import type { Attempt, Chapter } from "@/story/types";

interface Props {
  chapter: Chapter;
  nextChapter: Chapter | null;
  name: string;
  attempts: Attempt[];
  notes: string[];
  onNext: () => void;
  onMap: () => void;
  onReplay: () => void;
}

export const LEVEL_STYLE: Record<Level, string> = {
  belum: "bg-line text-ink-soft",
  berlatih: "bg-mustard text-ink",
  mandiri: "bg-olive text-cream",
};

export default function Result({ chapter, nextChapter, name, attempts, notes, onNext, onMap, onReplay }: Props) {
  const levels = chapter.objectives.map((o) => levelOf(attempts, o.id));
  const allIndependent = levels.every((l) => l === "mandiri");
  const phrases = notes.map(noteOf).filter((x): x is NonNullable<ReturnType<typeof noteOf>> => !!x && x.chapter.id === chapter.id);

  return (
    <main className="min-h-dvh bg-paper">
      <div className="relative h-44 overflow-hidden sm:h-56">
        <img src={bgUrl(chapter.cover)} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-paper/30 to-ink/40" />
      </div>
      <div className="anim-rise mx-auto -mt-16 max-w-3xl px-5 pb-16">
        <div className="relative rounded-3xl border border-line bg-cream p-6 shadow-xl sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-terra">{chapter.no === 0 ? "Prolog" : `Bab ${chapter.no}`} selesai</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-balance sm:text-4xl">{chapter.title}</h1>
          <p className="mt-2 text-ink-soft">
            {allIndependent
              ? `Luar biasa, ${name}. Semua tujuan bab ini kamu buktikan sendiri, tanpa petunjuk.`
              : `Bagus, ${name}. Yang dinilai di sini bukan klik „Lanjut“, melainkan kalimat yang kamu tulis sendiri.`}
          </p>

          <h2 className="mt-7 text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">Yang kamu buktikan</h2>
          <ul className="mt-3 space-y-3">
            {chapter.objectives.map((o, i) => {
              const ev = bestEvidence(attempts, o.id);
              return (
                <li key={o.id} className="rounded-2xl border border-line bg-white/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{o.title}</h3>
                    <span className={`ml-auto rounded-full px-3 py-0.5 text-xs font-extrabold ${LEVEL_STYLE[levels[i]]}`}>{LEVEL_LABEL[levels[i]]}</span>
                  </div>
                  {ev ? (
                    <>
                      <p lang="de" className="mt-2 font-display text-xl font-semibold text-terra-dark">
                        „{ev.text}“
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">{describeEvidence(ev, nameOf(ev.who))}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-ink-soft">Kamu membaca ceritanya, tetapi belum menjawab sendiri untuk tujuan ini.</p>
                  )}
                  {levels[i] === "berlatih" && <p className="mt-2 text-sm font-semibold text-ink">Ulangi misi di bab ini tanpa membuka petunjuk untuk meraih „Mandiri“.</p>}
                </li>
              );
            })}
          </ul>

          {phrases.length > 0 && (
            <>
              <h2 className="mt-7 text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">Masuk buku catatan · {phrases.length} kalimat</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {phrases.map((p) => (
                  <li key={p.text}>
                    <button onClick={() => speak(fill(p.text, name))} lang="de" title={fill(p.tr, name)} className="rounded-full border border-line bg-white/70 px-3 py-1.5 font-display font-semibold hover:border-terra hover:text-terra">
                      {fill(p.text, name)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-7 rounded-2xl bg-ink p-4 text-cream">
            <span className="block text-xs font-extrabold uppercase tracking-[0.14em] text-mustard">Berikutnya</span>
            {chapter.next}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {nextChapter && (
              <button onClick={onNext} className="rounded-full bg-terra px-6 py-3 font-bold text-cream transition hover:bg-terra-dark">
                Lanjut ke Bab {nextChapter.no}: {nextChapter.title} ▸
              </button>
            )}
            <button onClick={onMap} className="rounded-full border border-line bg-white/70 px-6 py-3 font-bold transition hover:border-terra hover:text-terra">
              Peta perjalanan
            </button>
            <button onClick={onReplay} className="rounded-full px-6 py-3 font-bold text-ink-soft transition hover:text-terra">
              Ulangi bab ini
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
