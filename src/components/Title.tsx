"use client";

import { useState } from "react";
import type { Profile } from "@/lib/client";
import { actorUrl, bgUrl } from "@/lib/media";
import { AVATARS } from "@/story/cast";

interface Props {
  known: Profile[];
  busy: boolean;
  error: string | null;
  onCreate: (name: string, avatar: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function Title({ known, busy, error, onCreate, onSelect, onDelete }: Props) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [creating, setCreating] = useState(known.length === 0);
  const valid = name.trim().length >= 2;

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ink px-4 py-10">
      <img src={bgUrl("judul")} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-ink/20 to-ink/80" />

      <div className="anim-rise relative w-full max-w-xl">
        <div className="text-center text-cream drop-shadow-[0_2px_12px_rgba(20,24,36,0.7)]">
          <p className="text-xs font-extrabold uppercase tracking-[0.35em]">Bahasa Jerman · A1</p>
          <h1 className="mt-2 font-display text-7xl font-semibold tracking-tight sm:text-8xl">Lernen</h1>
          <p className="mx-auto mt-3 max-w-md text-lg text-balance">Kamu terbangun di kota asing. Seseorang mengetuk pintu. Satu surat, tiga belas bab, dan setiap bab mengajar dengan cara yang sama.</p>
        </div>

        <div className="mt-8 rounded-3xl border border-line bg-cream p-5 shadow-2xl sm:p-7">
          {known.length > 0 && !creating ? (
            <>
              <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">Lanjutkan perjalanan</h2>
              <ul className="mt-3 space-y-2">
                {known.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onSelect(p.id)}
                      disabled={busy}
                      className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-line bg-white/70 p-2 pr-4 text-left transition hover:border-terra hover:bg-white disabled:opacity-50"
                    >
                      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-paper">
                        <img src={actorUrl("player", p.avatar)} alt="" className="h-[200%] w-full object-cover object-top" />
                      </span>
                      <span className="truncate font-display text-xl font-semibold">{p.name}</span>
                      <span className="ml-auto text-sm font-bold text-terra">Lanjut ▸</span>
                    </button>
                    <button
                      onClick={() => window.confirm(`Hapus profil ${p.name} beserta seluruh progresnya?`) && onDelete(p.id)}
                      className="rounded-full px-3 py-2 text-sm font-bold text-ink-soft hover:text-terra"
                      aria-label={`Hapus profil ${p.name}`}
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
              <button onClick={() => setCreating(true)} className="mt-4 text-sm font-bold text-terra hover:underline">
                + Mulai sebagai orang baru
              </button>
            </>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (valid && !busy) onCreate(name.trim(), avatar);
              }}
            >
              <label htmlFor="nama" className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">
                Siapa nama panggilanmu?
              </label>
              <input
                id="nama"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={20}
                autoComplete="given-name"
                placeholder="mis. Rina"
                className="mt-2 w-full rounded-xl border-2 border-line bg-white px-4 py-3 font-display text-2xl outline-none placeholder:text-ink-soft/50 focus:border-terra"
              />
              <p className="mt-1.5 text-sm text-ink-soft">Tokoh-tokoh di kota ini akan memanggilmu dengan nama ini — dan kamu akan menuliskannya dalam bahasa Jerman.</p>

              <fieldset className="mt-5">
                <legend className="text-sm font-extrabold uppercase tracking-[0.14em] text-ink-soft">Pilih tokohmu</legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {AVATARS.map((a, i) => (
                    <label key={a} className={`cursor-pointer overflow-hidden rounded-2xl border-2 bg-paper transition ${avatar === a ? "border-terra shadow-lg" : "border-transparent opacity-70 hover:opacity-100"}`}>
                      <input type="radio" name="avatar" value={a} checked={avatar === a} onChange={() => setAvatar(a)} className="sr-only" />
                      <img src={actorUrl("player", a)} alt={`Tokoh ${i + 1}`} className="aspect-[3/4] w-full object-cover object-top" />
                    </label>
                  ))}
                </div>
              </fieldset>

              {error && (
                <p role="alert" className="mt-4 rounded-xl bg-terra/10 px-4 py-2.5 text-sm font-semibold text-terra-dark">
                  {error}
                </p>
              )}

              <div className="mt-5 flex items-center gap-3">
                <button type="submit" disabled={!valid || busy} className="rounded-full bg-terra px-7 py-3 font-bold text-cream transition hover:bg-terra-dark disabled:opacity-40">
                  {busy ? "Menyiapkan kamar…" : "Mulai prolog ▸"}
                </button>
                {known.length > 0 && (
                  <button type="button" onClick={() => setCreating(false)} className="text-sm font-bold text-ink-soft hover:text-terra">
                    Batal
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
