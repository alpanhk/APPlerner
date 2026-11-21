import { useEffect, useRef, useState } from "react";
import type { PlayerProfile } from "../types";
import { bgSrc } from "../data/media-manifest";
import { arenaPortrait, playerIds } from "../portraits";

// ===== Layar judul =====
export function TitleScreen({
  hasSave,
  saveName,
  onStart,
  onContinue,
  onSettings,
  onLibrary,
  onLearning,
  onPractice,
}: {
  hasSave: boolean;
  saveName?: string;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onLibrary: () => void;
  onLearning: () => void;
  onPractice: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const first = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    first.current?.focus();
  }, []);
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#1f2740]">
      <img src={bgSrc("judul")} alt="" onLoad={() => setLoaded(true)} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1b2033]/20 via-transparent to-[#1b2033]/80" />
      {!loaded && (
        <p className="absolute left-4 top-4 rounded bg-black/40 px-2 py-1 text-xs text-white" role="status">
          Memuat ilustrasi…
        </p>
      )}
      <div className="relative flex h-full flex-col items-center justify-end gap-4 px-6 pb-10 sm:justify-center sm:pb-0">
        <div className="text-center drop-shadow-[0_2px_8px_rgba(0,0,0,.6)]">
          <p className="text-sm font-semibold uppercase tracking-[.3em] text-[#f7efdd]/90">Visual novel bahasa Jerman</p>
          <h1 className="mt-1 text-6xl font-black tracking-tight text-[#f7efdd] sm:text-7xl">Lernen</h1>
          <p className="mt-2 text-lg text-[#f7efdd]/95">
            Prolog: <span className="font-semibold italic">Surat untuk Siapa?</span>
          </p>
        </div>
        <nav className="mt-4 flex w-full max-w-sm flex-col gap-2" aria-label="Menu utama">
          {hasSave && (
            <button ref={first} type="button" onClick={onContinue} className="btn-primary w-full justify-center text-lg">
              Lanjutkan{saveName ? ` sebagai ${saveName}` : ""}
            </button>
          )}
          <button ref={hasSave ? undefined : first} type="button" onClick={onStart} className={`${hasSave ? "btn-secondary" : "btn-primary"} w-full justify-center text-lg`}>
            Mulai cerita{hasSave ? " baru" : ""}
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onLibrary} className="btn-secondary flex-1 justify-center">
              Perpustakaan
            </button>
            <button type="button" onClick={onSettings} className="btn-secondary flex-1 justify-center">
              Pengaturan
            </button>
          </div>
          <button type="button" onClick={onPractice} className="btn-secondary justify-center">Latih keterampilan · Peron berubah</button>
          <button type="button" onClick={onLearning} className="btn-secondary justify-center">Ruang belajar A1–B2</button>
        </nav>
        <p className="mt-2 text-xs text-[#f7efdd]/70">Untuk penutur bahasa Indonesia</p>
      </div>
    </div>
  );
}

// ===== Pemilihan karakter =====
export function CharacterCreator({
  initial,
  onDone,
  onBack,
  onPractice,
  onHear,
  onStop,
}: {
  initial: PlayerProfile;
  onDone: (p: PlayerProfile) => void;
  onBack: () => void;
  onPractice: () => void;
  onHear: (portrait: string) => void;
  onStop: () => void;
}) {
  const [p, setP] = useState<PlayerProfile>({ ...initial, portrait: initial.portrait ?? playerIds[0] });
  const nameRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => nameRef.current?.focus(), []);

  const submit = () => {
    const name = p.name.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      setErr("Masukkan nama panggilan minimal 2 huruf.");
      nameRef.current?.focus();
      return;
    }
    if (name.length > 16) {
      setErr("Nama panggilan maksimal 16 huruf.");
      return;
    }
    onDone({ ...p, name });
  };

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-[#e9dfc9] p-4">
      <div className="grid w-full max-w-4xl gap-6 rounded-2xl border-2 border-[#2c3e6b]/30 bg-[#f7efdd] p-5 shadow-xl md:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[260px] rounded-xl bg-gradient-to-b from-[#c9d6e8] to-[#e9dfc9] p-2">
            <img src={arenaPortrait(p.portrait ?? playerIds[0])} alt="Pratinjau karaktermu" className="mx-auto h-56 object-contain" />
          </div>
          <p className="mt-2 text-sm text-[#4b4238]">Pratinjau: {p.name.trim() || "—"}</p>
          <button
            type="button"
            className="btn-ghost mt-2"
            aria-label="Dengar suara avatar terpilih"
            onClick={() => onHear(p.portrait ?? playerIds[0])}
          >
            Dengar suara
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <h2 className="text-2xl font-black text-[#2c3e6b]">Siapa kamu di kota ini?</h2>
          <label className="block">
            <span className="text-sm font-semibold text-[#4b4238]">Nama panggilan</span>
            <input
              ref={nameRef}
              value={p.name}
              onChange={(e) => {
                setErr("");
                setP({ ...p, name: e.target.value });
              }}
              maxLength={20}
              className="mt-1 w-full rounded-lg border-2 border-[#2c3e6b]/40 bg-white px-3 py-2 text-lg focus:border-[#2c3e6b] focus:outline-none focus:ring-2 focus:ring-[#b5533c]/50"
              placeholder="mis. Rina, Dito, Mia…"
              aria-describedby="name-help"
            />
            <span id="name-help" className="text-xs text-[#6b5e4e]">
              Nama ini akan dipakai NPC sepanjang cerita.
            </span>
          </label>
          {err && (
            <p role="alert" className="rounded border-l-4 border-[#b5533c] bg-[#b5533c]/10 px-3 py-1 text-sm">
              {err}
            </p>
          )}
          <fieldset>
            <legend className="mb-2 font-semibold">Pilih karakter</legend>
            <div className="grid grid-cols-4 gap-2">
              {playerIds.map((id, index) => <label key={id} className="rounded-lg border border-[#2c3e6b]/40 p-2 text-center">
                <img src={arenaPortrait(id)} alt="" className="mx-auto h-20 object-contain" />
                <input type="radio" name="portrait" checked={p.portrait === id} onChange={() => { onStop(); setP({ ...p, portrait: id }); }} />
                <span className="ml-1">{index + 1}</span>
              </label>)}
            </div>
          </fieldset>
          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <button type="button" onClick={onBack} className="btn-secondary">
              ‹ Kembali
            </button>
            <button type="button" onClick={onPractice} className="btn-secondary" aria-label="Latih keterampilan, termasuk Peron berubah">
              Latih keterampilan
            </button>
            <button type="submit" className="btn-primary">
              Mulai prolog ▸
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
