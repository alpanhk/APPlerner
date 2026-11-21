import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Attempt, Flags, HistoryItem, Settings } from "../types";
import { COVERS, OBJECTIVES_A1, READINGS, UNITS, type Unit } from "../data";
import { COVER_SRC, MEDIA, UNIT_SCENES } from "../data/media-manifest";
import { PROLOG_META } from "../data/story/prolog";
import { LEVEL_LABEL, buildSummary, demonstratedFullSentence, objectiveLevel } from "../engine/evaluate";
import { SPEAKER_NAMES } from "./Portrait";

// ===== Modal umum =====
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#1b2033]/70 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-full w-full ${wide ? "max-w-5xl" : "max-w-3xl"} flex-col rounded-2xl border-2 border-[#2c3e6b]/40 bg-[#f7efdd] shadow-2xl`}>
        <header className="flex items-center justify-between border-b border-[#2c3e6b]/20 px-5 py-3">
          <h2 className="text-xl font-black text-[#2c3e6b]">{title}</h2>
          <button ref={closeRef} type="button" onClick={onClose} className="btn-secondary" aria-label={`Tutup ${title}`}>
            Tutup ✕
          </button>
        </header>
        <div className="overflow-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ===== Jurnal Belajar =====
const LEVELS = ["A1", "A2", "B1", "B2"] as const;
const COMPANION_READINGS: Record<string, number[]> = { "A1-1": [1], "A1-4": [10] }; // 10 = Im Café

export function Journal({ attempts, flags, name, onOpenReading }: { attempts: Attempt[]; flags: Flags; name: string; onOpenReading: (textId: number) => void }) {
  const [openLevel, setOpenLevel] = useState<string>("A1");
  const greet = objectiveLevel(attempts, "greet");
  const intro = objectiveLevel(attempts, "introduce");
  const done = [greet, intro].filter((l) => l !== "belum").length;
  const summary = buildSummary(attempts, flags, name);
  const unitProgress = (u: Unit) => (u.level === "A1" && u.unit === 1 ? done : 0);
  const levelUnits = (lv: string) => UNITS.filter((u) => u.level === lv);

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-[#2c3e6b]/25 bg-white/70 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#b5533c]">Sedang dipelajari</p>
        <h3 className="text-lg font-black text-[#2c3e6b]">A1 · Unit 1 „Salam & perkenalan diri“ · Prolog „{PROLOG_META.title}“</h3>
        <ul className="mt-3 space-y-2">
          {PROLOG_META.objectives.map((o) => {
            const lv = o.id === "greet" ? greet : intro;
            const n = attempts.filter((a) => a.objective === o.id).length;
            const ref = OBJECTIVES_A1.find((x) => x.id === o.objectiveRef);
            return (
              <li key={o.id} className="flex flex-wrap items-start gap-2 rounded-lg bg-[#f7efdd] p-2">
                <span aria-hidden="true" className="text-lg">
                  {lv === "mandiri" ? "✓" : lv === "petunjuk" ? "◐" : "○"}
                </span>
                <div className="flex-1">
                  <p className="font-semibold">{o.title}</p>
                  <p className="text-xs text-[#6b5e4e]">Tujuan asli: {ref?.title} — {ref?.canDo}</p>
                  <p className="text-sm">
                    <span className="font-bold">{LEVEL_LABEL[lv]}</span>
                    {n > 0 && ` · ${n} percobaan tercatat`}
                    {o.id === "introduce" && n > 0 && !demonstratedFullSentence(attempts, "introduce") && " · kalimat perkenalan lengkap belum didemonstrasikan"}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm">
          <span className="font-bold">Langkah berikutnya:</span> {summary.next}
        </p>
        <p className="mt-2 text-xs text-[#6b5e4e]">
          Bukti dalam prolog ini berupa jawaban tertulis/susunan kata. Ini menunjukkan pemahaman teks dan produksi tulisan sederhana, bukan kemampuan berbicara. Klik „Lanjut“ tidak dihitung sebagai bukti.
        </p>
      </section>

      <section>
        <h3 className="mb-2 font-black text-[#2c3e6b]">Peta kurikulum A1–B2 (42 unit)</h3>
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded bg-[#3f7d7a] px-2 py-0.5 font-semibold text-white">Bisa dimainkan</span>
          <span className="rounded bg-[#2c3e6b] px-2 py-0.5 font-semibold text-white">Materi bisa dibaca</span>
          <span className="rounded border border-[#6b5e4e] px-2 py-0.5 font-semibold text-[#6b5e4e]">Adegan belum diadaptasi</span>
        </div>
        <div className="flex gap-2">
          {LEVELS.map((lv) => {
            const units = levelUnits(lv);
            const started = units.filter((u) => unitProgress(u) > 0).length;
            return (
              <button key={lv} type="button" onClick={() => setOpenLevel(lv)} aria-pressed={openLevel === lv} className={`flex-1 rounded-lg border-2 p-2 text-left ${openLevel === lv ? "border-[#b5533c] bg-white" : "border-[#2c3e6b]/25 bg-white/50"}`}>
                <p className="text-lg font-black text-[#2c3e6b]">{lv}</p>
                <p className="text-xs">{units.length} unit · {started} dimulai</p>
                <div className="mt-1 h-1.5 w-full rounded bg-[#2c3e6b]/15">
                  <div className="h-1.5 rounded bg-[#3f7d7a]" style={{ width: `${(started / units.length) * 100}%` }} />
                </div>
              </button>
            );
          })}
        </div>
        <ul className="mt-3 space-y-2">
          {levelUnits(openLevel).map((u) => {
            const playable = u.level === "A1" && u.unit === 1;
            const scenes = u.level === "A1" ? UNIT_SCENES[u.unit] ?? [] : [];
            const companions = COMPANION_READINGS[`${u.level}-${u.unit}`] ?? [];
            return (
              <li key={`${u.level}-${u.unit}`} className="rounded-lg border border-[#2c3e6b]/20 bg-white/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-[#2c3e6b]">Unit {u.unit}</span>
                  <span className="font-semibold">{u.title}</span>
                  {playable ? (
                    <span className="rounded bg-[#3f7d7a] px-2 py-0.5 text-xs font-semibold text-white">Bisa dimainkan · prolog {done}/2 tujuan</span>
                  ) : (
                    <span className="rounded border border-[#6b5e4e] px-2 py-0.5 text-xs font-semibold text-[#6b5e4e]">Adegan belum diadaptasi</span>
                  )}
                  {u.lessons.length > 0 && <span className="rounded bg-[#2c3e6b] px-2 py-0.5 text-xs font-semibold text-white">{u.lessons.length} pelajaran bisa dibaca</span>}
                </div>
                <ul className="mt-1 text-sm text-[#4b4238]">
                  {u.goals.map((g) => (
                    <li key={g}>• {g}</li>
                  ))}
                </ul>
                {u.lessons.length > 0 && <p className="mt-1 text-xs text-[#6b5e4e]">Pelajaran: {u.lessons.map((l) => `${l.no}. ${l.title}`).join(" · ")}</p>}
                {(scenes.length > 0 || companions.length > 0) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {scenes.map((s) => (
                      <img key={s.src} src={s.src} alt={`Ilustrasi situasi: ${s.title}`} title={s.title} className="h-14 rounded border border-[#2c3e6b]/30" />
                    ))}
                    {companions.map((id) => {
                      const r = READINGS.find((t) => t.textId === id);
                      return r ? (
                        <button key={id} type="button" onClick={() => onOpenReading(id)} className="btn-ghost">
                          Bacaan pendamping: {r.title}
                        </button>
                      ) : null;
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ===== Perpustakaan =====
const LEVEL_COLORS: Record<string, string> = { A1: "#3f7d7a", A2: "#2c3e6b", B1: "#8a6d3b", B2: "#b5533c" };

export function TypoCover({ title, level, className }: { title: string; level: string; className?: string }) {
  return (
    <div className={`flex flex-col justify-between p-2 text-[#f7efdd] ${className ?? ""}`} style={{ background: `linear-gradient(160deg, ${LEVEL_COLORS[level] ?? "#444"} 0%, #1f2740 100%)` }} aria-hidden="true">
      <span className="text-[10px] font-bold tracking-widest">{level}</span>
      <span className="text-sm font-black leading-tight">{title}</span>
    </div>
  );
}

export function Library({ initialTextId, speak, stopSpeech, speakingKey }: { initialTextId?: number; speak: (text: string, key: string, asset?: string) => void; stopSpeech: () => void; speakingKey: string | null }) {
  const [filter, setFilter] = useState<string>("semua");
  const [openId, setOpenId] = useState<number | null>(initialTextId ?? null);
  const [showId, setShowId] = useState(true);
  const list = useMemo(() => READINGS.filter((t) => filter === "semua" || t.level === filter), [filter]);
  const open = READINGS.find((t) => t.textId === openId);
  const coverOf = (id: number) => COVERS.find((c) => c.textId === id);

  if (open) {
    const cover = coverOf(open.textId);
    const src = COVER_SRC[open.textId];
    return (
      <div className="space-y-3">
        <button type="button" onClick={() => { stopSpeech(); setOpenId(null); }} className="btn-secondary">
          ‹ Kembali ke rak
        </button>
        <div className="flex gap-4">
          {src ? <img src={src} alt={`Sampul ${open.title}`} className="h-36 w-28 rounded-lg border border-[#2c3e6b]/30 object-cover" /> : <TypoCover title={open.title} level={open.level} className="h-36 w-28 rounded-lg" />}
          <div>
            <h3 className="text-2xl font-black text-[#2c3e6b]">{open.title}</h3>
            <p className="text-sm text-[#6b5e4e]">{cover?.label ?? open.tags} · textId {open.textId}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" onClick={() => setShowId((v) => !v)} className="btn-ghost" aria-pressed={showId}>
                {showId ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}
              </button>
              {open.textId === 1 && (
                <button type="button" onClick={() => speak("Hallo, ich bin Anna", "clip-anna", "speech:bacaan-anna")} className="btn-ghost">
                  {speakingKey === "clip-anna" ? "■ Berhenti" : "▶ Pratinjau suara (klip asli)"}
                </button>
              )}
            </div>
          </div>
        </div>
        <ol className="space-y-2">
          {open.sentences.map((s, i) => {
            const key = `r${open.textId}-${i}`;
            return (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-white/70 p-2">
                <button type="button" onClick={() => speak(s.de, key)} className="btn-ghost shrink-0" aria-label={`Dengar kalimat ${i + 1}`}>
                  {speakingKey === key ? "■" : "▶"}
                </button>
                <div>
                  <p lang="de" className="dialog-sub font-medium">
                    {s.de}
                  </p>
                  {showId && <p className="text-sm text-[#4b4238]">{s.id}</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">{READINGS.length} bacaan ·</span>
        {["semua", ...LEVELS].map((lv) => (
          <button key={lv} type="button" onClick={() => setFilter(lv)} aria-pressed={filter === lv} className={`chip ${filter === lv ? "!bg-[#2c3e6b] !text-white" : ""}`}>
            {lv}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((t) => {
          const src = COVER_SRC[t.textId];
          return (
            <li key={t.textId}>
              <button type="button" onClick={() => setOpenId(t.textId)} className="group w-full overflow-hidden rounded-lg border-2 border-[#2c3e6b]/25 bg-white text-left focus:outline-none focus:ring-2 focus:ring-[#b5533c]">
                {src ? <img src={src} alt="" className="aspect-[3/4] w-full object-cover" loading="lazy" /> : <TypoCover title={t.title} level={t.level} className="aspect-[3/4] w-full" />}
                <div className="p-2">
                  <p className="text-sm font-bold leading-tight text-[#1f2233] group-hover:text-[#b5533c]">{t.title}</p>
                  <p className="text-[11px] text-[#6b5e4e]">{t.level} · {t.sentences.length} kalimat</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ===== Riwayat =====
export function HistoryPanel({ items, playerName, speak, speakingKey }: { items: HistoryItem[]; playerName: string; speak: (text: string, key: string, asset?: string) => void; speakingKey: string | null }) {
  const [openIdx, setOpenIdx] = useState<Set<number>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ block: "end" }), []);
  if (items.length === 0) return <p>Belum ada percakapan.</p>;
  return (
    <ol className="space-y-2">
      {items.map((h, i) => {
        const nm = h.isPlayer ? playerName : SPEAKER_NAMES[h.speaker] || (h.speaker === "narator" ? "Narasi" : h.speaker);
        const key = `h${i}`;
        return (
          <li key={i} className={`rounded-lg p-2 ${h.isPlayer ? "ml-8 bg-[#b5533c]/10" : "bg-white/70"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#2c3e6b]">{nm}</span>
              {h.lang === "de" && (
                <button type="button" onClick={() => speak(h.text, key, h.audio)} className="btn-ghost" aria-label="Putar ulang">
                  {speakingKey === key ? "■" : "▶"}
                </button>
              )}
              {h.translation && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() =>
                    setOpenIdx((s) => {
                      const n = new Set(s);
                      if (n.has(i)) n.delete(i);
                      else n.add(i);
                      return n;
                    })
                  }
                >
                  Arti
                </button>
              )}
            </div>
            <p lang={h.lang} className="dialog-sub">
              {h.text}
            </p>
            {openIdx.has(i) && h.translation && <p className="text-sm text-[#4b4238]">↳ {h.translation}</p>}
          </li>
        );
      })}
      <div ref={endRef} />
    </ol>
  );
}

// ===== Pengaturan =====
export function SettingsPanel({ s, onChange, audioStatus }: { s: Settings; onChange: (s: Settings) => void; audioStatus: string }) {
  const Slider = ({ k, label }: { k: "volDialog" | "volMusic" | "volAmbience" | "volSfx"; label: string }) => (
    <label className="flex items-center gap-3">
      <span className="w-24 text-sm font-semibold">{label}</span>
      <input type="range" min={0} max={1} step={0.05} value={s[k]} onChange={(e) => onChange({ ...s, [k]: Number(e.target.value) })} className="flex-1 accent-[#b5533c]" aria-label={`Volume ${label}`} />
      <span className="w-10 text-right text-sm">{Math.round(s[k] * 100)}%</span>
    </label>
  );
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1 font-bold text-[#2c3e6b]">Ukuran teks</legend>
        <div className="flex gap-2">
          {(["normal", "besar", "sangat-besar"] as const).map((v) => (
            <button key={v} type="button" onClick={() => onChange({ ...s, textSize: v })} aria-pressed={s.textSize === v} className={`chip ${s.textSize === v ? "!bg-[#2c3e6b] !text-white" : ""}`}>
              {v === "normal" ? "Normal" : v === "besar" ? "Besar" : "Sangat besar"}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="mb-1 font-bold text-[#2c3e6b]">Suara</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.soundOn} onChange={(e) => onChange({ ...s, soundOn: e.target.checked })} className="h-5 w-5 accent-[#b5533c]" />
          <span className="font-semibold">Suara aktif</span>
          <span className="text-xs text-[#6b5e4e]">(mati: karakter tampil statis, seluruh cerita tetap bisa dibaca)</span>
        </label>
        <Slider k="volDialog" label="Dialog" />
        <Slider k="volMusic" label="Musik" />
        <Slider k="volAmbience" label="Suasana" />
        <Slider k="volSfx" label="Efek" />
        <p className="text-xs text-[#6b5e4e]">{audioStatus}</p>
      </fieldset>
      <fieldset>
        <legend className="mb-1 font-bold text-[#2c3e6b]">Gerakan</legend>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={s.reducedMotion} onChange={(e) => onChange({ ...s, reducedMotion: e.target.checked })} className="h-5 w-5 accent-[#b5533c]" />
          <span className="font-semibold">Minim gerakan</span>
          <span className="text-xs text-[#6b5e4e]">(pergantian tempat langsung tanpa fade)</span>
        </label>
      </fieldset>
      <details className="text-xs text-[#6b5e4e]">
        <summary className="cursor-pointer font-semibold">Sumber media yang dipakai</summary>
        <ul className="mt-1 list-disc pl-4">
          {Object.values(MEDIA).map((m) => (
            <li key={m.id}>
              {m.id} — {m.status === "github" ? `asli repo (${m.source})` : m.status === "generated" ? "ilustrasi pengganti" : m.status === "synth" ? "efek sintesis" : "TTS"}
              {m.sentence ? ` · „${m.sentence}“` : ""}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
