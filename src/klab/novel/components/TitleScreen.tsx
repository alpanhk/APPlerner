import { useEffect, useRef, useState } from "react";
import type { HairStyle, PlayerProfile } from "../types";
import { bgSrc } from "../data/media-manifest";
import { Portrait, playerLook } from "./Portrait";

// ===== Layar judul =====
export function TitleScreen({
  hasSave,
  saveName,
  onStart,
  onContinue,
  onSettings,
  onLibrary,
}: {
  hasSave: boolean;
  saveName?: string;
  onStart: () => void;
  onContinue: () => void;
  onSettings: () => void;
  onLibrary: () => void;
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
        </nav>
        <p className="mt-2 text-xs text-[#f7efdd]/70">Untuk penutur bahasa Indonesia · A1 Unit 1 „Salam & perkenalan diri“</p>
      </div>
    </div>
  );
}

// ===== Pemilihan karakter =====
export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "short", label: "Pendek" },
  { id: "bob", label: "Sebahu" },
  { id: "long", label: "Panjang" },
  { id: "curly", label: "Ikal" },
];
export const HAIR_COLORS = [
  { id: "#2f2520", label: "Hitam" },
  { id: "#5a3a28", label: "Cokelat" },
  { id: "#8a4b2a", label: "Kemerahan" },
  { id: "#d8a85a", label: "Pirang" },
];
export const OUTFITS = [
  { id: "#2c3e6b", label: "Biru tua" },
  { id: "#b5533c", label: "Merah bata" },
  { id: "#3f7d7a", label: "Hijau laut" },
  { id: "#8a6d3b", label: "Kuning tanah" },
];
export const SKINS = [
  { id: "#f1d2b8", label: "Terang" },
  { id: "#e6b48f", label: "Sawo" },
  { id: "#c48a5a", label: "Cokelat" },
  { id: "#8d5a3a", label: "Gelap" },
];

export function CharacterCreator({
  initial,
  onDone,
  onBack,
}: {
  initial: PlayerProfile;
  onDone: (p: PlayerProfile) => void;
  onBack: () => void;
}) {
  const [p, setP] = useState<PlayerProfile>(initial);
  const nameRef = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    nameRef.current?.focus();
  }, []);

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

  const Swatch = ({ list, value, onPick, label }: { list: { id: string; label: string }[]; value: string; onPick: (v: string) => void; label: string }) => (
    <fieldset>
      <legend className="mb-1 text-sm font-semibold text-[#4b4238]">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {list.map((o) => (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={value === o.id}
            onClick={() => onPick(o.id)}
            className={`flex items-center gap-2 rounded-lg border-2 px-2 py-1 text-sm ${value === o.id ? "border-[#b5533c] bg-white font-bold" : "border-[#2c3e6b]/25 bg-white/60"}`}
          >
            {/^#/.test(o.id) && <span className="inline-block h-4 w-4 rounded-full border border-black/30" style={{ background: o.id }} />}
            {o.label}
            {value === o.id && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </fieldset>
  );

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-[#e9dfc9] p-4">
      <div className="grid w-full max-w-4xl gap-6 rounded-2xl border-2 border-[#2c3e6b]/30 bg-[#f7efdd] p-5 shadow-xl md:grid-cols-[280px_1fr]">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[260px] rounded-xl bg-gradient-to-b from-[#c9d6e8] to-[#e9dfc9] p-2">
            <Portrait look={playerLook({ ...p, name: p.name || "Kamu" })} expr="smile" mouthOpen={false} className="w-full" title="Pratinjau karaktermu" />
          </div>
          <p className="mt-2 text-sm text-[#4b4238]">Pratinjau: {p.name.trim() || "—"}</p>
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
          <Swatch label="Gaya rambut" list={HAIR_STYLES} value={p.hair} onPick={(v) => setP({ ...p, hair: v as HairStyle })} />
          <Swatch label="Warna rambut" list={HAIR_COLORS} value={p.hairColor} onPick={(v) => setP({ ...p, hairColor: v })} />
          <Swatch label="Warna kulit" list={SKINS} value={p.skin} onPick={(v) => setP({ ...p, skin: v })} />
          <Swatch label="Warna pakaian" list={OUTFITS} value={p.outfit} onPick={(v) => setP({ ...p, outfit: v })} />
          <div className="flex justify-between pt-2">
            <button type="button" onClick={onBack} className="btn-secondary">
              ‹ Kembali
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
