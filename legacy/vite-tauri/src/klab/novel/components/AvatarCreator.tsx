import { useEffect, useRef, useState } from "react";
import type { PlayerCharacterId, PlayerProfile } from "../types";
import { AVATAR_HALLO, CHAR_FRAMES } from "../data/story-media.generated";
import type { AudioController } from "../audio/AudioController";

// ===== Pemilihan avatar produksi (Mandat §4) =====
// Empat potret produksi: jaket indigo, kardigan terakota, mantel zaitun,
// kemeja oker. Tombol "Dengar suara" memutar "Hallo!" milik ID avatar yang
// sedang dipilih; memilih avatar lain menghentikan contoh sebelumnya.
// ID internal player-01..04 disimpan terpisah dari nama bebas pemain.

export const AVATARS: { id: PlayerCharacterId; label: string; note: string }[] = [
  { id: "player-01", label: "Jaket indigo", note: "Suara F1 — hangat dan tenang" },
  { id: "player-02", label: "Kardigan terakota", note: "Suara M1 — jernih dan ramah" },
  { id: "player-03", label: "Mantel zaitun", note: "Suara F3 — lembut dan tegas" },
  { id: "player-04", label: "Kemeja oker", note: "Suara M3 — hangat dan cekatan" },
];

export function AvatarCreator({
  audio,
  savedName,
  onDone,
  onBack,
}: {
  audio: AudioController;
  savedName?: string;
  onDone: (p: PlayerProfile) => void;
  onBack: () => void;
}) {
  const [selected, setSelected] = useState<PlayerCharacterId>("player-01");
  const [name, setName] = useState(savedName ?? "");
  const [err, setErr] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    first.current?.focus();
  }, []);

  const listen = (id: PlayerCharacterId) => {
    // Memilih avatar lain menghentikan contoh suara sebelumnya (U02).
    audio.stopSpeech();
    void audio.speak("Hallo!", `avatar:${id}:hallo`);
  };

  const submit = () => {
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) {
      setErr("Masukkan nama panggilan minimal 2 huruf.");
      nameRef.current?.focus();
      return;
    }
    if (clean.length > 16) {
      setErr("Nama panggilan maksimal 16 huruf.");
      return;
    }
    audio.stopSpeech();
    onDone({
      name: clean,
      characterId: selected,
      // Kolom tampilan lama dipertahankan agar progres lama tetap kompatibel.
      hair: "short", hairColor: "#2f2520", outfit: "#2c3e6b", skin: "#e6b48f",
    });
  };

  const frames = CHAR_FRAMES[selected];

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-[#e9dfc9] p-4">
      <div className="grid w-full max-w-5xl gap-6 rounded-2xl border-2 border-[#2c3e6b]/30 bg-[#f7efdd] p-5 shadow-xl md:grid-cols-[300px_1fr]">
        {/* Satu potret pilihan lebih besar + kolom nama + tombol mulai */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-[280px] rounded-xl bg-gradient-to-b from-[#c9d6e8] to-[#e9dfc9] p-3">
            <img
              src={frames.smile}
              alt=""
              role="img"
              aria-label={`Potret terpilih: ${AVATARS.find((a) => a.id === selected)?.label}`}
              className="w-full drop-shadow-[0_8px_12px_rgba(20,20,40,.25)]"
              data-testid="avatar-preview"
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-[#4b4238]">
            {AVATARS.find((a) => a.id === selected)?.label}
          </p>
          <button type="button" onClick={() => listen(selected)} className="btn-secondary mt-2" data-testid="avatar-listen">
            🔊 Dengar suara „Hallo!“
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); submit(); }}
        >
          <h2 className="text-2xl font-black text-[#2c3e6b]">Siapa kamu di kota ini?</h2>
          <fieldset>
            <legend className="mb-1 text-sm font-semibold text-[#4b4238]">Pilih penampilanmu</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Pilihan avatar">
              {AVATARS.map((a, i) => {
                const active = selected === a.id;
                return (
                  <button
                    key={a.id}
                    ref={i === 0 ? first : undefined}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => { setSelected(a.id); if (err) setErr(""); }}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs font-semibold ${active ? "border-[#b5533c] bg-white" : "border-[#2c3e6b]/25 bg-white/60"} ${active ? "" : "hover:border-[#2c3e6b]/50"}`}
                    data-testid={`avatar-option-${a.id}`}
                  >
                    <img src={CHAR_FRAMES[a.id].neutral} alt="" className="w-full rounded-lg" draggable={false} />
                    <span className="flex items-center gap-1 text-[#2c3e6b]">
                      {a.label}
                      {active && <span aria-hidden="true">✓</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-xs text-[#6b5e4e]">{AVATARS.find((a) => a.id === selected)?.note}</p>
          </fieldset>

          <label className="block">
            <span className="text-sm font-semibold text-[#4b4238]">Nama panggilan</span>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => { setErr(""); setName(e.target.value); }}
              maxLength={20}
              className="mt-1 w-full rounded-lg border-2 border-[#2c3e6b]/40 bg-white px-3 py-2 text-lg focus:border-[#2c3e6b] focus:outline-none focus:ring-2 focus:ring-[#b5533c]/50"
              placeholder="mis. Rina, Dito, Mia…"
              aria-describedby="avatar-name-help"
            />
            <span id="avatar-name-help" className="text-xs text-[#6b5e4e]">
              Nama ini akan dipakai NPC sepanjang cerita; penampilan tetap tercatat sebagai {selected}.
            </span>
          </label>

          {err && (
            <p role="alert" className="rounded border-l-4 border-[#b5533c] bg-[#b5533c]/10 px-3 py-1 text-sm">
              {err}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => { audio.stopSpeech(); onBack(); }} className="btn-secondary">
              ‹ Kembali
            </button>
            <button type="submit" className="btn-primary" data-testid="avatar-start">
              Mulai cerita ▸
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
