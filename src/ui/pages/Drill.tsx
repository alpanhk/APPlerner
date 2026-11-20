import { useEffect, useRef, useState } from "react";
import PageShell from "../PageShell";
import { DRILL_META, type DrillCode } from "../../drills/items";
import { drillTitle, nextDrillRecommendation, useDrillSession } from "../../drills/session";
import { speak, drillAudioReadyAsync, hasBundledAudio, numberBundleReady } from "../../srs/tts";
import { useNav } from "../../stores/nav";

const ALL_CODES: DrillCode[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"];
const TIMER_SECONDS = 10;

function TheoryPanel({ code, onClose }: { code: DrillCode; onClose: () => void }) {
  const meta = DRILL_META[code];
  return (
    <div className="card mt-3 border-gold/40 px-5 py-4">
      <div className="flex items-center justify-between">
        <h5 className="font-display text-lg">
          Kartu Teori — {code} {meta.nama}
        </h5>
        <button className="text-xs text-ink-soft underline" onClick={onClose}>
          Tutup
        </button>
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
        {meta.teori.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

export default function Drill() {
  const phase = useDrillSession((s) => s.phase);
  const code = useDrillSession((s) => s.code);
  const items = useDrillSession((s) => s.items);
  const index = useDrillSession((s) => s.index);
  const input = useDrillSession((s) => s.input);
  const selected = useDrillSession((s) => s.selected);
  const correct = useDrillSession((s) => s.correct);
  const explanation = useDrillSession((s) => s.explanation);
  const correctCount = useDrillSession((s) => s.correctCount);
  const wrongCount = useDrillSession((s) => s.wrongCount);
  const itemStartedAt = useDrillSession((s) => s.itemStartedAt);
  const totalMs = useDrillSession((s) => s.totalMs);
  const start = useDrillSession((s) => s.start);
  const setInput = useDrillSession((s) => s.setInput);
  const choose = useDrillSession((s) => s.choose);
  const submitTyped = useDrillSession((s) => s.submitTyped);
  const pickToken = useDrillSession((s) => s.pickToken);
  const unpickToken = useDrillSession((s) => s.unpickToken);
  const submitOrder = useDrillSession((s) => s.submitOrder);
  const order = useDrillSession((s) => s.order);
  const timeout = useDrillSession((s) => s.timeout);
  const next = useDrillSession((s) => s.next);
  const reset = useDrillSession((s) => s.reset);

  const [timerOn, setTimerOn] = useState(true);
  const [remaining, setRemaining] = useState(TIMER_SECONDS);
  const [theoryCode, setTheoryCode] = useState<DrillCode | null>(null);
  const [voice, setVoice] = useState(false);
  const [audioState, setAudioState] = useState<"pending" | "ready" | "failed">("pending");
  const [saveError, setSaveError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const timedOut = useRef(false);
  // Status menyimpan berasal dari store (kontrak Agent 1): phase "submitting"
  // menjaga kartu tetap tampil, mencegah aksi ganda, dan kembali ke "question"
  // bila penyimpanan gagal.
  const submitting = phase === "submitting";

  const item = items[index];

  const runOnce = async (action: () => Promise<void>) => {
    if (submitting) return;
    setSaveError("");
    try {
      await action();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : String(error));
    }
  };

  // Kapabilitas audio per item: Piper atau klip bawaan untuk angka/jam ini.
  const itemAudio = item?.say ? hasBundledAudio(item.say) : false;
  const canPlayItem = Boolean(item?.say) && (voice || itemAudio);

  const pendingDrill = useNav((s) => s.pendingDrill);
  const takePendingDrill = useNav((s) => s.takePendingDrill);

  // "Latih kelemahan ini" dari Statistik: tunggu voice atau klip angka bundle
  // tersedia sebelum memulai drill dengar D8.
  useEffect(() => {
    if (!pendingDrill) return;
    if (DRILL_META[pendingDrill].requiresVoice && !voice && !numberBundleReady()) return;
    takePendingDrill();
    void start(pendingDrill);
  }, [pendingDrill, voice, takePendingDrill, start]);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void drillAudioReadyAsync().then((ready) => {
        if (alive) setVoice(ready);
      });
    };
    refresh();
    const t = window.setTimeout(refresh, 1200);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, []);

  // D8: bacakan angka/jam otomatis saat item tampil.
  useEffect(() => {
    let active = true;
    if (phase === "question" && item?.code === "D8" && item.say && canPlayItem) {
      setAudioState("pending");
      void speak(item.say).then((source) => { if (active) setAudioState(source ? "ready" : "failed"); });
    }
    return () => { active = false; };
  }, [phase, index, item?.code, item?.say, canPlayItem]);

  // Timer ringan per item (default 10 dtk, bisa dimatikan).
  useEffect(() => {
    timedOut.current = false;
    setRemaining(TIMER_SECONDS);
    if (phase !== "question" || !timerOn || item?.mode === "order" || item?.code === "D8") return;
    const t = setInterval(() => {
      const left = Math.max(0, TIMER_SECONDS - Math.floor((Date.now() - itemStartedAt) / 1000));
      setRemaining(left);
      if (left <= 0 && !timedOut.current) {
        timedOut.current = true;
        void timeout();
      }
    }, 250);
    return () => clearInterval(t);
  }, [phase, itemStartedAt, timerOn, timeout, item?.mode, item?.code]);

  useEffect(() => {
    if (phase === "question" && item?.mode === "type") inputRef.current?.focus();
  }, [phase, index, item?.mode]);

  // P9: pilihan/input lama hilang saat feedback, sehingga fokus jatuh ke BODY.
  // Kembalikan ke tombol "Lanjut (Enter)" hanya bila tidak ada fokus lain.
  useEffect(() => {
    if (phase === "feedback" && document.activeElement === document.body) {
      nextButtonRef.current?.focus();
    }
  }, [phase]);

  // Keyboard: 1–4 pilihan; Enter lanjut / submit.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing || e.keyCode === 229 ||
        e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest?.("textarea, select")) return;
      if (target?.closest?.("input") && target !== inputRef.current) return;
      if (e.key === "Enter" && target?.closest?.("button, a, [role=button]")) return;
      if (phase === "question" && item?.mode === "choice" && item.options) {
        const options = item.options;
        const n = Number(e.key);
        if (n >= 1 && n <= options.length) {
          e.preventDefault();
          const picked = options[n - 1];
          void runOnce(() => choose(picked));
        }
      }
      if (phase === "question" && item?.mode === "type" && e.key === "Enter") {
        e.preventDefault();
        if (input.trim() && (item.code !== "D8" || audioState === "ready")) void runOnce(submitTyped);
      }
      if (phase === "feedback" && e.key === "Enter") {
        e.preventDefault();
        if (!submitting) next();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, item, choose, submitTyped, next, input, audioState]);

  // ---- Ringkasan sesi ----
  if (phase === "done" && code) {
    const total = correctCount + wrongCount;
    const recommendation = nextDrillRecommendation(code);
    return (
      <PageShell title="Drill Selesai" sub={drillTitle(code)} meta="M2 · hasil tersimpan di attempts">
        <div className="card mx-auto max-w-2xl px-8 py-8 text-center">
          <div className="font-display text-3xl">
            {total === 0
              ? "Belum ada item — bank masih kosong"
              : correctCount >= total * 0.7
                ? "Gut gemacht!"
                : "Weiter üben!"}
          </div>
          {total > 0 && (
            <div className="mx-auto mt-5 grid max-w-md grid-cols-3 gap-2">
              <div className="rounded border border-line bg-parchment px-2 py-3">
                <div className="font-display text-2xl text-emerald-700">{correctCount}</div>
                <div className="text-xs text-ink-soft">benar</div>
              </div>
              <div className="rounded border border-line bg-parchment px-2 py-3">
                <div className="font-display text-2xl text-rose-700">{wrongCount}</div>
                <div className="text-xs text-ink-soft">salah</div>
              </div>
              <div className="rounded border border-line bg-parchment px-2 py-3">
                <div className="font-display text-2xl text-gold-deep">
                  {Math.max(1, Math.round(totalMs / 60000))}′
                </div>
                <div className="text-xs text-ink-soft">waktu</div>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-ink-soft">
            Rekomendasi berikutnya: <b className="text-ink">{drillTitle(recommendation)}</b>
          </p>
          {wrongCount > 0 && (
            <p className="mt-1 text-xs text-ink-soft">
              Item yang salah tercatat untuk diulang; tiga kali salah berturut-turut pada item yang
              sama → kartu terkait masuk antrean SRS untuk diperkuat.
            </p>
          )}
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn-gold" onClick={() => void start(code)}>
              Ulangi {code}
            </button>
            <button
              className="rounded border border-line bg-cream px-3 py-1.5 text-sm hover:bg-parchment"
              onClick={() => void start(recommendation)}
            >
              Lanjut {recommendation}
            </button>
            <button
              className="rounded px-3 py-1.5 text-sm text-ink-soft underline"
              onClick={reset}
            >
              Katalog
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ---- Sesi berjalan ----
  if (phase === "question" || phase === "submitting" || phase === "feedback" || (phase === "done" && !code)) {
    const meta = code ? DRILL_META[code] : null;
    return (
      <PageShell
        title={code ? drillTitle(code) : "Drill"}
        sub={meta?.mekanik ?? ""}
        meta="M2 · D1–D10"
      >
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between text-[11px] text-ink-soft">
            <span>
              Item {Math.min(index + 1, items.length)} / {items.length}
            </span>
            <div className="flex items-center gap-3">
              {timerOn && item?.mode !== "order" && item?.code !== "D8" && (
                <span className={remaining <= 3 && phase === "question" ? "font-bold text-rose-700" : ""}>
                  ⏱ {phase === "question" ? `${remaining} dtk` : "—"}
                </span>
              )}
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={timerOn}
                  disabled={submitting}
                  onChange={(e) => setTimerOn(e.target.checked)}
                />
                timer
              </label>
              {code && (
                <button
                  className="underline disabled:opacity-40"
                  disabled={submitting}
                  onClick={() => setTheoryCode(theoryCode === code ? null : code)}
                >
                  Kartu Teori
                </button>
              )}
              <button className="underline disabled:opacity-40" disabled={submitting} onClick={reset}>
                Akhiri
              </button>
            </div>
          </div>

          {submitting && (
            <p role="status" className="mt-2 text-xs text-ink-soft">
              Menyimpan jawaban…
            </p>
          )}
          {saveError && (
            <p role="alert" className="mt-2 rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900">
              Gagal menyimpan: {saveError}. Jawaban tetap di layar; coba lagi.
            </p>
          )}

          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-full bg-gold transition-all"
              style={{ width: `${items.length ? Math.round(((index + (phase === "feedback" ? 1 : 0)) / items.length) * 100) : 0}%` }}
            />
          </div>

          {theoryCode === code && code && <TheoryPanel code={code} onClose={() => setTheoryCode(null)} />}

          {item && (
            <div className="card mt-3 px-8 py-8 text-center">
              <div className="font-display text-3xl">{item.prompt}</div>
              <p className="mt-2 text-sm text-ink-soft">{item.sub}</p>

              {(phase === "question" || phase === "submitting") && item.code === "D8" && item.say && (
                <div className="mt-3">
                  <button
                    className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment disabled:opacity-40"
                    disabled={!canPlayItem || submitting}
                    onClick={() => {
                      setAudioState("pending");
                      void speak(item.say as string).then((source) => setAudioState(source ? "ready" : "failed"));
                    }}
                  >
                    🔊 Ulangi audio
                  </button>
                  {audioState === "failed" && <span role="alert" className="ml-2 text-xs text-rose-700">Audio gagal diputar. Coba ulangi atau periksa Pengaturan.</span>}
                  {audioState === "pending" && <span className="ml-2 text-xs text-ink-soft">Menyiapkan audio…</span>}
                  {!canPlayItem ? (
                    <span role="alert" className="ml-2 text-xs text-rose-700">
                      Audio item ini tidak tersedia (klip bawaan tidak ditemukan dan Piper mati).
                    </span>
                  ) : !voice && itemAudio ? (
                    <span className="ml-2 text-xs text-ink-soft">Memakai klip bawaan (Piper belum aktif).</span>
                  ) : null}
                </div>
              )}

              {(phase === "question" || phase === "submitting") && item.mode === "choice" && item.options && (
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {item.options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => void runOnce(() => choose(opt))}
                      disabled={submitting}
                      className="min-w-28 rounded border border-line bg-cream px-5 py-2 font-display text-lg hover:border-gold hover:bg-parchment disabled:opacity-50"
                    >
                      <span className="mr-2 text-xs text-ink-soft">{i + 1}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {(phase === "question" || phase === "submitting") && item.mode === "type" && (
                <div className="mt-6">
                  <input
                    ref={inputRef}
                    aria-label="Jawaban latihan"
                    value={input}
                    disabled={(item.code === "D8" && audioState !== "ready") || submitting}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full max-w-sm rounded border border-line bg-cream px-3 py-2 text-center font-display text-xl outline-none focus:border-gold"
                    placeholder="…"
                  />
                  <div className="mt-3">
                    <button className="btn-gold" onClick={() => void runOnce(submitTyped)} disabled={!input.trim() || submitting || (item.code === "D8" && audioState !== "ready")}>
                      {submitting ? "Menyimpan…" : "Jawab"}
                    </button>
                  </div>
                </div>
              )}

              {(phase === "question" || phase === "submitting") && item.mode === "order" && item.tokens && (
                <div className="mt-5">
                  <div className="mx-auto min-h-14 max-w-xl rounded border border-dashed border-line bg-parchment px-3 py-3 text-left font-display text-xl">
                    {order.length === 0 ? (
                      <span className="text-sm text-ink-soft">
                        Tap kata di bawah untuk menyusun kalimat…
                      </span>
                    ) : (
                      order.map((tokenIndex, pos) => (
                        <button
                          key={`${tokenIndex}-${pos}`}
                          className="mr-1.5 rounded border border-gold/40 bg-cream px-2 py-0.5 hover:bg-parchment"
                          onClick={() => unpickToken(pos)}
                        >
                          {item.tokens?.[tokenIndex]}
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                    {item.tokens.map((tok, i) =>
                      order.includes(i) ? null : (
                        <button
                          key={i}
                          className="rounded border border-line bg-cream px-3 py-1.5 font-display text-lg hover:border-gold hover:bg-parchment"
                          onClick={() => pickToken(i)}
                        >
                          {tok}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="mt-3">
                    <button
                      className="btn-gold"
                      disabled={order.length !== item.tokens.length || submitting}
                      onClick={() => void runOnce(submitOrder)}
                    >
                      {submitting ? "Menyimpan…" : "Periksa susunan"}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] text-ink-soft">
                    Timer dinonaktifkan untuk susun kalimat agar fokus pada urutan.
                  </p>
                </div>
              )}

              {phase === "feedback" && (
                <div className="mt-5">
                  <div className={`text-lg font-semibold ${correct ? "text-emerald-700" : "text-rose-700"}`}>
                    {correct ? "✔ Richtig!" : "✘ Nicht ganz."}
                    {!correct && item.mode === "choice" && (
                      <span className="ml-1 text-sm font-normal">
                        Jawaban: <b>{item.answer}</b>
                      </span>
                    )}
                    {!correct && item.mode === "type" && item.answer && (
                      <span className="ml-1 text-sm font-normal">
                        Jawaban: <b>{item.answer}</b>
                      </span>
                    )}
                    {!correct && item.mode === "order" && (
                      <span className="ml-1 text-sm font-normal">
                        Jawaban: <b>{item.answer}</b>
                      </span>
                    )}
                  </div>
                  <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft">{explanation}</p>
                  <button ref={nextButtonRef} className="btn-gold mt-4" onClick={next} disabled={submitting}>
                    Lanjut (Enter)
                  </button>
                </div>
              )}

              {selected !== null && phase === "feedback" && (
                <p className="mt-2 text-xs text-ink-soft">jawabanmu: {selected}</p>
              )}
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  // ---- Katalog ----
  return (
    <PageShell
      title="Drill Tata Bahasa"
      sub="Latihan pendek yang mengisolasi satu mekanika Jerman per sesi — jawaban produksi, umpan balik instan."
      meta="M2 · D1–D10 aktif"
    >
      <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        {ALL_CODES.map((c) => {
          const meta = DRILL_META[c];
          const needsVoice = Boolean(meta.requiresVoice) && !voice && !numberBundleReady();
          return (
            <button
              key={c}
              disabled={needsVoice}
              onClick={() => void start(c)}
              className={
                "card-soft px-4 py-3 text-left transition-colors " +
                (needsVoice ? "opacity-60" : "hover:border-gold")
              }
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-sm text-gold-deep">{c}</span>
                <span className="badge">{needsVoice ? "audio offline" : meta.level}</span>
              </div>
              <div className="mt-1 text-sm font-semibold">{meta.nama}</div>
              <div className="mt-1 text-[11px] text-ink-soft">{meta.mekanik}</div>
              <div className="mt-2 text-[11px] text-gold-deep">
                {needsVoice ? "Audio belum siap" : "Mulai sesi →"}
              </div>
            </button>
          );
        })}
      </div>

      <div className="card mt-8 px-6 py-5 text-sm text-ink-soft">
        Setiap sesi 8 item · timer 10 detik (bisa dimatikan; susun kalimat bebas timer) ·
        jawaban salah langsung menjelaskan. Item yang sering salah masuk daftar lemah dan
        diperkuat lewat SRS. D8 memakai Piper atau audio bawaan untuk angka dan jam.
      </div>
    </PageShell>
  );
}
