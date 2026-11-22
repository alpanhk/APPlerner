"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProfileData, ProgressRow } from "@/lib/client";
import { actorUrl, bgUrl, speak } from "@/lib/media";
import { CHAPTERS, noteOf } from "@/story/chapters";
import { LEVEL_LABEL, levelOf } from "@/story/evaluate";
import { fill } from "@/story/match";
import { LEVEL_STYLE } from "./Result";

interface Props {
  data: ProfileData;
  onPlay: (chapterId: string, fresh: boolean) => void;
  onLogout: () => void;
}

const STEPS = [
  ["Tiba", "Amati adegan dan benda berbahasa Jerman."],
  ["Belajar", "Frau Lehmann memodelkan, lalu kalian berlatih."],
  ["Bertemu", "Pakai kalimat itu kepada orang sungguhan."],
  ["Menjelajah", "Ulangan bab lama + satu misi berkelok."],
  ["Temuan", "Sebuah benda menarikmu ke bab berikutnya."],
];

export default function Journey({ data, onPlay, onLogout }: Props) {
  const [notebook, setNotebook] = useState(false);
  const { profile, attempts } = data;
  const rows: Record<string, ProgressRow | undefined> = Object.fromEntries(data.progress.map((r) => [r.chapterId, r]));
  const done = (i: number) => rows[CHAPTERS[i].id]?.status === "selesai";
  const unlocked = (i: number) => i === 0 || done(i - 1);
  const resumable = (i: number) => !!rows[CHAPTERS[i].id]?.state;

  const firstOpen = CHAPTERS.findIndex((_, i) => !done(i));
  const current = firstOpen === -1 ? CHAPTERS.length - 1 : firstOpen;
  const hero = CHAPTERS[current];
  const allDone = firstOpen === -1;

  const objectives = CHAPTERS.flatMap((c) => c.objectives);
  const independent = objectives.filter((o) => levelOf(attempts, o.id) === "mandiri").length;
  const noteIds = CHAPTERS.flatMap((c) => rows[c.id]?.notes ?? []);
  const doneCount = CHAPTERS.filter((_, i) => done(i)).length;

  return (
    <main className="min-h-dvh bg-paper pb-20">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-5">
        <span className="font-display text-3xl font-semibold tracking-tight">Lernen</span>
        <span className="hidden rounded-full border border-line px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-soft sm:block">Jerman A1</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setNotebook(true)} className="rounded-full border border-line bg-cream px-4 py-2 text-sm font-bold transition hover:border-terra hover:text-terra">
            Buku catatan · {noteIds.length}
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 rounded-full border border-line bg-cream py-1 pl-1 pr-4 text-sm font-bold transition hover:border-terra hover:text-terra" title="Ganti profil">
            <span className="h-8 w-8 overflow-hidden rounded-full bg-paper">
              <img src={actorUrl("player", profile.avatar)} alt="" className="h-[200%] w-full object-cover object-top" />
            </span>
            <span className="max-w-[8rem] truncate">{profile.name}</span>
          </button>
        </div>
      </header>

      {/* Bab yang sedang berjalan */}
      <section className="mx-auto max-w-6xl px-5">
        <div className="anim-rise relative overflow-hidden rounded-3xl bg-ink text-cream shadow-xl">
          <img src={bgUrl(hero.cover)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
          <div className="relative max-w-2xl p-6 sm:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-mustard">
              {allDone ? "Perjalanan A1 tamat" : `${hero.no === 0 ? "Prolog" : `Bab ${hero.no}`} · ${hero.place}`}
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-balance sm:text-5xl">{allDone ? `Dulu surat itu untukmu, ${profile.name}.` : hero.title}</h1>
            <p className="mt-3 text-lg text-cream/85">{allDone ? "Sekarang surat itu darimu. Ulangi misi mana pun tanpa petunjuk untuk melengkapi bukti mandirimu." : hero.tagline}</p>
            {!allDone && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={() => onPlay(hero.id, !resumable(current))} className="rounded-full bg-terra px-7 py-3 font-bold transition hover:bg-terra-dark">
                  {resumable(current) ? "Lanjutkan cerita ▸" : current === 0 ? "Mulai prolog ▸" : "Mulai bab ini ▸"}
                </button>
                {resumable(current) && (
                  <button onClick={() => onPlay(hero.id, true)} className="rounded-full border border-cream/40 px-6 py-3 font-bold transition hover:bg-cream/10">
                    Ulang dari awal
                  </button>
                )}
              </div>
            )}
            <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {[
                [`${doneCount}/${CHAPTERS.length}`, "bab selesai"],
                [`${independent}/${objectives.length}`, "tujuan mandiri"],
                [`${noteIds.length}`, "kalimat dicatat"],
              ].map(([v, l]) => (
                <div key={l} className="flex items-baseline gap-2">
                  <dt className="order-2 text-cream/75">{l}</dt>
                  <dd className="font-display text-2xl font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Pola yang sama di setiap bab */}
      <section className="mx-auto mt-8 max-w-6xl px-5">
        <div className="rounded-3xl border border-line bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl font-semibold">Setiap bab berjalan dengan lima langkah yang sama</h2>
            <Link href="/pola" className="text-sm font-bold text-terra hover:underline">
              Lihat audit konsistensi →
            </Link>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-5">
            {STEPS.map(([name, text], i) => (
              <li key={name} className="flex gap-3 sm:block">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink font-display font-semibold text-cream">{i + 1}</span>
                <div>
                  <h3 className="font-bold sm:mt-2">{name}</h3>
                  <p className="text-sm leading-snug text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Peta perjalanan */}
      <section className="mx-auto mt-10 max-w-6xl px-5">
        <h2 className="font-display text-3xl font-semibold">Peta perjalanan</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CHAPTERS.map((c, i) => {
            const open = unlocked(i);
            return (
              <li key={c.id} className={`flex flex-col overflow-hidden rounded-3xl border bg-cream transition ${i === current && !allDone ? "border-terra shadow-lg" : "border-line"} ${open ? "" : "opacity-60"}`}>
                <div className="relative aspect-[16/8] overflow-hidden bg-ink">
                  <img src={bgUrl(c.cover)} alt="" loading="lazy" className={`h-full w-full object-cover ${open ? "" : "grayscale"}`} />
                  <span className="absolute left-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-cream backdrop-blur">
                    {c.no === 0 ? "Prolog" : `Bab ${c.no}`}
                  </span>
                  {done(i) && <span className="absolute right-3 top-3 rounded-full bg-olive px-3 py-1 text-xs font-extrabold text-cream">Selesai ✓</span>}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-xl font-semibold">{c.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{c.place}</p>
                  <ul className="mt-3 space-y-1.5">
                    {c.objectives.map((o) => {
                      const lv = levelOf(attempts, o.id);
                      return (
                        <li key={o.id} className="flex items-start gap-2 text-sm">
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${LEVEL_STYLE[lv]}`} title={LEVEL_LABEL[lv]} />
                          <span>
                            {o.title}
                            <span lang="de" className="block font-display text-ink-soft">
                              {o.phrase}
                            </span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    {!open ? (
                      <p className="text-sm font-semibold text-ink-soft">Terkunci — selesaikan {i === 1 ? "Prolog" : `Bab ${i - 1}`} dulu.</p>
                    ) : (
                      <>
                        <button onClick={() => onPlay(c.id, !resumable(i))} className="rounded-full bg-ink px-5 py-2 text-sm font-bold text-cream transition hover:bg-terra">
                          {resumable(i) ? "Lanjutkan" : done(i) ? "Main lagi" : "Mulai"}
                        </button>
                        {resumable(i) && (
                          <button onClick={() => onPlay(c.id, true)} className="rounded-full px-4 py-2 text-sm font-bold text-ink-soft hover:text-terra">
                            Dari awal
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-soft">
          {(["belum", "berlatih", "mandiri"] as const).map((lv) => (
            <span key={lv} className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${LEVEL_STYLE[lv]}`} />
              {LEVEL_LABEL[lv]}
            </span>
          ))}
          <span>„Mandiri“ = kalimat utuh kepada tokoh, tanpa petunjuk.</span>
        </p>
      </section>

      {notebook && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink/50" onClick={() => setNotebook(false)}>
          <aside className="anim-right scroll-thin h-full w-[min(94vw,30rem)] overflow-y-auto bg-cream p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Buku catatan">
            <div className="flex items-center">
              <h2 className="font-display text-3xl font-semibold">Buku catatan</h2>
              <button onClick={() => setNotebook(false)} className="ml-auto rounded-full px-3 py-1.5 text-sm font-bold text-ink-soft hover:text-terra">
                Tutup ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Semua kalimat yang dimodelkan Frau Lehmann. Ketuk kalimat untuk mendengarnya.</p>
            {noteIds.length === 0 && <p className="mt-6 text-ink-soft">Belum ada catatan. Mulailah dari prolog.</p>}
            {CHAPTERS.filter((c) => rows[c.id]?.notes.length).map((c) => (
              <section key={c.id} className="mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-[0.14em] text-terra">
                  {c.no === 0 ? "Prolog" : `Bab ${c.no}`} · {c.title}
                </h3>
                <ul className="mt-2 space-y-2">
                  {(rows[c.id]?.notes ?? []).map((id) => {
                    const note = noteOf(id);
                    if (!note) return null;
                    const t = fill(note.text, profile.name);
                    return (
                      <li key={id} className="rounded-xl border border-line bg-white/70 p-3">
                        <button onClick={() => speak(t)} lang="de" className="text-left font-display text-lg font-semibold hover:text-terra">
                          {t}
                        </button>
                        <p className="text-sm text-ink-soft">{fill(note.tr, profile.name)}</p>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </aside>
        </div>
      )}
    </main>
  );
}
