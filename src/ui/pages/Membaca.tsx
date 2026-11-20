// Membaca berjenjang + TTS (F4): perpustakaan teks, reader per kalimat,
// popover kata + simpan SRS, import teks, dan progres baca dari reading_log.
import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "../PageShell";
import {
  importText,
  loadText,
  loadTexts,
  logReading,
  type TextSummary,
} from "../../reading/texts";
import {
  displayWord,
  findEntry,
  loadDictionary,
  saveWordToSrs,
  tokenizeSentence,
  type DictEntry,
  type DictLookup,
} from "../../reading/dictionary";
import { hasBundledAudio, retryPiper, setTtsRate, speak, ttsReadyAsync } from "../../srs/tts";
import getDb from "../../stores/db";

const RATES = [0.75, 0.8, 0.85, 0.9, 0.95, 1];

type Popover = {
  token: string;
  lookup: DictLookup | null;
  x: number;
  y: number;
  meaning: string;
  saved: boolean;
  error: string;
};

function formatRead(ts: string | null): string {
  if (!ts) return "belum dibaca";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PiperBanner({ ready }: { ready: boolean }) {
  if (ready) return null;
  return (
    <div className="card-soft mt-4 border-l-2 border-gold px-5 py-3 text-xs text-ink-soft">
      <b>Piper belum aktif.</b> Pasang mesin dan voice Piper melalui Pengaturan untuk mendengar kalimat
      bebas. Tanpa Piper, klip bawaan tetap tersedia untuk frasa tertentu.
    </div>
  );
}

export default function Membaca() {
  const [texts, setTexts] = useState<TextSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"library" | "reader">("library");
  const [text, setText] = useState<TextSummary | null>(null);
  const [finished, setFinished] = useState(false);
  const [dict, setDict] = useState<Map<string, DictEntry>>(new Map());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [assist, setAssist] = useState(true);
  const [rate, setRate] = useState(0.85);
  const [voice, setVoice] = useState(false);
  const [popover, setPopover] = useState<Popover | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [impTitle, setImpTitle] = useState("");
  const [impLevel, setImpLevel] = useState("A1");
  const [impBody, setImpBody] = useState("");
  const [importing, setImporting] = useState(false);

  const refresh = useCallback(async () => {
    const list = await loadTexts();
    setTexts(list);
    setText((current) => current ? list.find((item) => item.id === current.id) ?? current : null);
    return list;
  }, []);

  useEffect(() => {
    refresh()
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const db = await getDb();
      const rows = await db.select<{ value: string }[]>(
        "SELECT value FROM config WHERE key = 'tts_rate'",
      );
      if (!alive || rows.length === 0) return;
      const n = Number(rows[0].value);
      if (Number.isFinite(n)) setRate(Math.min(1, Math.max(0.75, n)));
    })().catch(console.error);
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let aliveVoice = true;
    const refreshVoice = () => {
      void ttsReadyAsync().then((ready) => {
        if (aliveVoice) setVoice(ready);
      });
    };
    refreshVoice();
    const t = window.setTimeout(refreshVoice, 1200);
    return () => window.clearTimeout(t);
  }, []);

  const stats = useMemo(() => {
    return {
      a1: texts.filter((t) => t.level === "A1").length,
      a2: texts.filter((t) => t.level === "A2").length,
      b1: texts.filter((t) => t.level === "B1").length,
      b2: texts.filter((t) => t.level === "B2").length,
      reads: texts.reduce((n, t) => n + t.reads, 0),
      saved: texts.reduce((n, t) => n + t.words_saved, 0),
    };
  }, [texts]);

  const changeRate = async (value: number) => {
    setRate(value);
    setTtsRate(value);
    const db = await getDb();
    await db.execute(
      "INSERT INTO config (key, value) VALUES ('tts_rate', $1) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [String(value)],
    );
  };

  const openText = async (id: number) => {
    setError("");
    setNotice("");
    try {
      const [t, d] = await Promise.all([loadText(id), loadDictionary()]);
      if (!t) return;
      setText(t);
      setFinished(false);
      setDict(d);
      setRevealed(new Set());
      setShowAll(false);
      setAssist(true);
      setPopover(null);
      setView("reader");
      void refresh().catch((e) => setError(String(e)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const backToLibrary = () => {
    setView("library");
    setText(null);
    setPopover(null);
    setNotice("");
    void refresh().catch((e) => setError(String(e)));
  };

  const play = async (de: string) => {
    // Klip bawaan dipakai lebih dulu jika Piper tidak terpasang. Sebelumnya
    // tombol dikunci oleh status Piper sehingga 100 klip bacaan A1 tidak bisa
    // diputar sama sekali tanpa Piper.
    if (!voice && !hasBundledAudio(de)) {
      setNotice(
        "Kalimat ini belum punya klip bawaan. Pasang voice Piper di Pengaturan untuk teks bebas.",
      );
      return;
    }
    retryPiper();
    const source = await speak(de, rate);
    if (!source) {
      setError(
        "Audio tidak dapat diputar. Periksa klip bawaan atau suara Piper di Pengaturan, lalu coba lagi.",
      );
    } else {
      setError("");
      setNotice(
        source === "bundle" && !voice
          ? "Diputar dari klip audio bawaan (Piper belum aktif)."
          : "",
      );
    }
  };

  const toggleSentence = (index: number) => {
    if (!assist) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const openWord = (token: string, el: HTMLElement) => {
    const lookup = findEntry(dict, token);
    const rect = el.getBoundingClientRect();
    const width = 320;
    const x = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8));
    const y = Math.min(rect.bottom + 8, Math.max(8, window.innerHeight - 250));
    setPopover({ token, lookup, x, y, meaning: "", saved: false, error: "" });
  };

  const savePopover = async () => {
    const p = popover;
    if (!p || p.saved) return;
    try {
      const res = await saveWordToSrs(p.lookup?.entry.de ?? p.token, p.meaning);
      const d = await loadDictionary();
      setDict(d);
      if (text) await logReading(text.id, 1);
      setPopover({
        ...p,
        lookup: { entry: res.entry, matchedForm: p.token },
        saved: true,
        error: "",
      });
      setNotice(
        `"${p.token}" → ${displayWord(res.entry)} tersimpan di SRS.`,
      );
      void refresh().catch((e) => setError(String(e)));
    } catch (e) {
      setPopover({
        ...p,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const doImport = async () => {
    if (!impTitle.trim() || !impBody.trim()) return;
    setImporting(true);
    setError("");
    try {
      const id = await importText(impTitle.trim(), impLevel, impBody);
      setShowImport(false);
      setImpTitle("");
      setImpBody("");
      await refresh();
      await openText(id);
      setNotice("Teks baru tersimpan di perpustakaan.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  };

  const markFinished = async () => {
    if (!text || finished) return;
    setFinished(true);
    try {
      await logReading(text.id, 0);
      setNotice("Progres bacaan tersimpan.");
      void refresh().catch((e) => setError(String(e)));
    } catch (e) {
      setFinished(false);
      setError(String(e));
    }
  };

  // ---------------- Reader ----------------
  if (view === "reader" && text) {
    return (
      <PageShell
        title={text.title}
        sub={`${text.level} · ${text.tags ?? "tanpa tag"} · ${text.sentences.length} kalimat`}
        meta="M2 · F4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            className="text-sm text-ink-soft underline hover:text-ink"
            onClick={backToLibrary}
          >
            ← Perpustakaan teks
          </button>
          <span className="text-[11px] text-ink-soft">
            dibaca {text.reads}× · {text.words_saved} kata disimpan · terakhir{" "}
            {formatRead(text.last_read)}
          </span>
        </div>

        <div className="card mt-3 flex flex-wrap items-center gap-3 px-5 py-3">
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            Kecepatan
            <select
              className="rounded border border-line bg-cream px-2 py-1 text-sm"
              value={rate}
              onChange={(e) => void changeRate(Number(e.target.value))}
            >
              {RATES.map((r) => (
                <option key={r} value={r}>
                  {r.toFixed(2)}×
                </option>
              ))}
            </select>
          </label>
          <button
            className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment disabled:opacity-40"
            disabled={!assist}
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}
          </button>
          <button
            className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment"
            onClick={() => {
              setAssist((v) => !v);
              setShowAll(false);
            }}
          >
            {assist ? "Mode tanpa bantuan" : "Aktifkan bantuan"}
          </button>
          <span className="ml-auto text-[11px] text-ink-soft">
            {assist
              ? "Klik kata untuk arti; gunakan tombol terjemahan pada setiap kalimat."
              : "Terjemahan dan kamus dinonaktifkan. Aktifkan bantuan untuk menggunakannya kembali."}
          </span>
        </div>

        <PiperBanner ready={voice} />
        {notice ? (
          <div className="card-soft mt-3 px-5 py-2 text-xs text-emerald-700">{notice}</div>
        ) : null}
        {error ? <div className="mt-3 text-xs text-rose-700">{error}</div> : null}

        <div className="mt-4 space-y-2">
          {text.sentences.map((s, i) => {
            const visible = assist && (showAll || revealed.has(i));
            return (
              <div key={i} className="card px-5 py-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 font-display text-sm text-gold-deep">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <button
                        className="mt-0.5 rounded border border-line px-2 py-1 text-sm hover:bg-parchment disabled:opacity-40"
                        disabled={!voice && !hasBundledAudio(s.de)}
                        aria-label={`Dengarkan kalimat ${i + 1}`}
                        title={
                          voice
                            ? "Ulangi kalimat ini"
                            : hasBundledAudio(s.de)
                              ? "Putar klip audio bawaan"
                              : "Belum ada audio untuk kalimat ini"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          void play(s.de);
                        }}
                      >
                        🔊
                      </button>
                      <div className="flex-1 font-display text-xl leading-relaxed">
                        {tokenizeSentence(s.de).map((tok, j) => {
                          if (!tok.word || !assist) return <span key={j}>{tok.text}</span>;
                          const hit = findEntry(dict, tok.text);
                          return (
                            <button
                              key={j}
                              className={
                                "rounded px-0.5 text-left underline-offset-2 hover:bg-parchment " +
                                (hit
                                  ? "text-gold-deep decoration-gold/60 decoration-dotted underline"
                                  : "decoration-ink-soft/40 decoration-dashed underline")
                              }
                              onClick={(e) => {
                                e.stopPropagation();
                                openWord(tok.text, e.currentTarget);
                              }}
                            >
                              {tok.text}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {assist && <button className="mt-2 text-xs text-gold-deep underline" aria-expanded={visible} onClick={() => toggleSentence(i)}>
                      {visible ? "Sembunyikan terjemahan" : "Tampilkan terjemahan"}
                    </button>}
                    {visible ? (
                      <div className="mt-2 border-l-2 border-gold/40 pl-3 text-sm text-ink-soft">
                        {s.id || "Terjemahan belum tersedia (teks impor)."}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button className="btn-gold" disabled={finished} onClick={() => void markFinished()}>
            {finished ? "Sudah ditandai selesai" : "Tandai selesai membaca"}
          </button>
          <button
            className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
            onClick={backToLibrary}
          >
            Kembali ke perpustakaan
          </button>
          <span className="text-xs text-ink-soft">
            {text.sentences.length} kalimat · kecepatan {rate.toFixed(2)}×
          </span>
        </div>

        {popover ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setPopover(null)}
            />
            <div
              className="fixed z-50 w-80 rounded-lg border border-line bg-cream p-4 shadow-xl"
              style={{ left: popover.x, top: popover.y }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-display text-lg">{popover.token}</div>
                <button
                  className="text-lg leading-none text-ink-soft hover:text-ink"
                  onClick={() => setPopover(null)}
                >
                  ×
                </button>
              </div>
              {popover.lookup ? (
                <>
                  <div className="mt-1 text-sm font-medium">
                    {displayWord(popover.lookup.entry)}
                  </div>
                  <div className="text-sm text-ink-soft">
                    {popover.lookup.entry.meaning_id}
                  </div>
                  {popover.lookup.entry.de.toLowerCase() !==
                  popover.token.toLowerCase() ? (
                    <div className="mt-1 text-[11px] text-ink-soft">
                      bentuk dari <b>{popover.lookup.entry.de}</b>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-1 text-sm text-ink-soft">
                  Belum ada di kamus lokal. Isi artinya untuk menyimpan:
                </div>
              )}

              {!popover.saved ? (
                <>
                  {!popover.lookup ? (
                    <input
                      value={popover.meaning}
                      onChange={(e) =>
                        setPopover({ ...popover, meaning: e.target.value })
                      }
                      placeholder="arti dalam bahasa Indonesia"
                      className="mt-3 w-full rounded border border-line bg-parchment px-2 py-1.5 text-sm outline-none focus:border-gold"
                    />
                  ) : null}
                  <button
                    className="btn-gold mt-3 w-full"
                    disabled={!popover.lookup && !popover.meaning.trim()}
                    onClick={() => void savePopover()}
                  >
                    {popover.lookup ? "Simpan ke SRS" : "Simpan arti + SRS"}
                  </button>
                </>
              ) : (
                <div className="mt-2 text-xs text-emerald-700">
                  ✔ Tersimpan di SRS · jenis kartu mengikuti data yang tersedia
                </div>
              )}
              {popover.error ? (
                <div className="mt-2 text-xs text-rose-700">{popover.error}</div>
              ) : null}
            </div>
          </>
        ) : null}
      </PageShell>
    );
  }

  // ---------------- Library ----------------
  return (
    <PageShell
      title="Membaca + TTS"
      sub="Teks berjenjang A1–B2, terjemahan per kalimat, tap kata untuk arti, dan audio lokal."
      meta={loading ? "memuat…" : `M2 · F4 · ${texts.length} teks`}
    >
      <div className="card px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-display text-2xl">Perpustakaan teks</div>
            <div className="mt-1 text-xs text-ink-soft">
              {stats.a1} teks A1 · {stats.a2} teks A2 · {stats.b1} teks B1 · {stats.b2} teks B2 · dibaca {stats.reads}× ·{" "}
              {stats.saved} kata disimpan ke SRS
            </div>
            {stats.reads > 0 && <p className="mt-1 text-xs text-ink-soft">Riwayat sebelum pembaruan dapat mencakup teks yang hanya dibuka.</p>}
          </div>
          <button
            className="btn-gold"
            onClick={() => {
              setShowImport((v) => !v);
              setNotice("");
              setError("");
            }}
          >
            {showImport ? "Tutup impor" : "Impor teks"}
          </button>
        </div>
      </div>

      <PiperBanner ready={voice} />
      {notice ? (
        <div className="card-soft mt-3 px-5 py-2 text-xs text-emerald-700">{notice}</div>
      ) : null}
      {error ? <div className="mt-3 text-xs text-rose-700">{error}</div> : null}

      {showImport ? (
        <div className="card mt-4 px-6 py-5">
          <h4 className="font-display text-lg">Impor teks sendiri</h4>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_120px]">
            <input
              value={impTitle}
              onChange={(e) => setImpTitle(e.target.value)}
              placeholder="Judul teks"
              className="rounded border border-line bg-parchment px-3 py-2 text-sm outline-none focus:border-gold"
            />
            <select
              value={impLevel}
              onChange={(e) => setImpLevel(e.target.value)}
              className="rounded border border-line bg-parchment px-3 py-2 text-sm"
            >
              <option value="A1">A1</option>
              <option value="A2">A2</option>
            </select>
          </div>
          <textarea
            value={impBody}
            onChange={(e) => setImpBody(e.target.value)}
            rows={7}
            placeholder="Tempel teks Jerman di sini… Kalimat dipisahkan otomatis."
            className="mt-3 w-full rounded border border-line bg-parchment px-3 py-2 text-sm outline-none focus:border-gold"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="btn-gold"
              disabled={importing || !impTitle.trim() || !impBody.trim()}
              onClick={() => void doImport()}
            >
              {importing ? "Menyimpan…" : "Simpan & buka reader"}
            </button>
            <span className="text-xs text-ink-soft">
              Teks disimpan ke SQLite; kata tak dikenal bisa didefinisikan saat dibaca.
            </span>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="card mt-4 px-6 py-8 text-center text-sm text-ink-soft">
          Memuat perpustakaan…
        </div>
      ) : texts.length === 0 ? (
        <div className="card mt-4 px-6 py-8 text-center text-sm text-ink-soft">
          Belum ada teks. Impor teks pertamamu untuk mulai membaca.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {texts.map((t) => (
            <div key={t.id} className="card flex flex-col px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="badge">{t.level}</span>
                <span className="text-[11px] text-ink-soft">{t.tags}</span>
              </div>
              <h4 className="mt-2 font-display text-xl">{t.title}</h4>
              <div className="mt-1 text-xs text-ink-soft">
                {t.sentences.length} kalimat · dibaca {t.reads}× · {t.words_saved} kata
                disimpan · terakhir {formatRead(t.last_read)}
              </div>
              <div className="mt-3">
                <button className="btn-gold" onClick={() => void openText(t.id)}>
                  Baca
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card-soft mt-4 px-5 py-3 text-xs text-ink-soft">
        TTS memakai Piper lokal; klip offline bawaan tersedia untuk frasa inti. Kecepatan diatur di
        Pengaturan atau langsung di reader.
      </div>
    </PageShell>
  );
}
