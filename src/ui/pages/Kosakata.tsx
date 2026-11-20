import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import PageShell from "../PageShell";
import getDb, { nowIso } from "../../stores/db";
import { addManualEntry, deleteEntry, updateEntry } from "../../srs/cards";
import { importWords, loadExistingDe, parseWordImport } from "../../data/importWords";
import { levelFromTags, readingHint } from "../../data/pronunciation";

type EntryRow = {
  id: number;
  kind: string;
  de: string;
  article: string | null;
  plural: string | null;
  meaning_id: string;
  example_de: string | null;
  example_id: string | null;
  source: string;
  tags: string | null;
};

// P5-GAP-03: hasil syllabify/respell adalah heuristik, bukan transkripsi
// tervalidasi penutur asli. Label ini wajib tampil bila bantuan baca aktif.
export type ReadingHintViewProps = {
  syllables: string;
  spoken: string;
  compact?: boolean;
};

export function ReadingHintView({ syllables, spoken, compact = false }: ReadingHintViewProps) {
  return (
    <div className={compact ? "mt-0.5 text-[11px] text-ink-soft" : "text-[11px] text-ink-soft"}
      data-reading-aid="heuristic" role="note" aria-label="Bantuan baca heuristik, bukan pelafalan tervalidasi">
      <span className="font-medium">Bantuan baca (heuristik):</span>{" "}
      {syllables} · perkiraan bunyi{" "}
      <span className="text-gold-deep">{spoken}</span>
      <span className="block text-[10px] text-ink-soft">
        Bukan pelafalan tervalidasi penutur asli. Dengarkan audio bila tersedia.
      </span>
    </div>
  );
}

type Counts = { entries: number; cards: number; scheduled: number; due: number };

const EMPTY_FORM = {
  kind: "noun",
  de: "",
  article: "der",
  plural: "",
  meaning_id: "",
  example_de: "",
  example_id: "",
};

export default function Kosakata() {
  const [rows, setRows] = useState<EntryRow[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dailyNew, setDailyNew] = useState("20");
  const [dailyMax, setDailyMax] = useState("30");
  const [newLevel, setNewLevel] = useState("A1");
  const [savedMsg, setSavedMsg] = useState("");

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [existingDe, setExistingDe] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [sortMode, setSortMode] = useState<"de" | "meaning" | "new" | "level">("de");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [showReading, setShowReading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(100);
  const searchRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const db = await getDb();
    const list = await db.select<EntryRow[]>(
      "SELECT e.id, e.kind, e.de, e.article, e.plural, e.meaning_id, e.example_de, e.example_id, e.tags, " +
        "CASE WHEN e.tags='manual' THEN 'manual' ELSE 'seed' END source " +
        "FROM entries e ORDER BY e.id",
    );
    const c = await db.select<{ entries: number; cards: number }[]>(
      "SELECT (SELECT COUNT(*) FROM entries) entries, (SELECT COUNT(*) FROM cards) cards",
    );
    const s = await db.select<{ scheduled: number; due: number }[]>(
      "SELECT COUNT(*) scheduled, COALESCE(SUM(due <= $1),0) due FROM srs_state",
      [nowIso()],
    );
    setRows(list);
    setCounts({
      entries: c[0]?.entries ?? 0,
      cards: c[0]?.cards ?? 0,
      scheduled: s[0]?.scheduled ?? 0,
      due: s[0]?.due ?? 0,
    });
    const cfg = await db.select<{ key: string; value: string }[]>(
      "SELECT key, value FROM config WHERE key IN ('daily_new','daily_max','srs_new_level')",
    );
    for (const r of cfg) {
      if (r.key === "daily_new") setDailyNew(r.value);
      if (r.key === "daily_max") setDailyMax(r.value);
      if (r.key === "srs_new_level") setNewLevel(r.value);
    }
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  const submit = async () => {
    if (!form.de.trim() || !form.meaning_id.trim()) return;
    setBusy(true);
    setFormError("");
    try {
      const payload = {
        kind: form.kind,
        de: form.de.trim(),
        article: form.kind === "noun" ? form.article : null,
        plural: form.kind === "noun" ? form.plural.trim() || null : null,
        meaning_id: form.meaning_id.trim(),
        example_de: form.example_de.trim() || null,
        example_id: form.example_id.trim() || null,
      };
      if (editingId !== null) await updateEntry(editingId, payload);
      else await addManualEntry(payload);
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      await load();
    } catch (e) {
      console.error(e);
      setFormError(
        String(e).includes("UNIQUE")
          ? "Kata ini sudah ada di deck — ubah entri lama atau pakai bentuk lain."
          : String(e),
      );
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row: EntryRow) => {
    setEditingId(row.id);
    setForm({
      kind: row.kind,
      de: row.de,
      article: row.article ?? "der",
      plural: row.plural ?? "",
      meaning_id: row.meaning_id,
      example_de: row.example_de ?? "",
      example_id: row.example_id ?? "",
    });
    setShowForm(true);
    setFormError("");
  };

  const doDelete = async (id: number) => {
    setBusy(true);
    setFormError("");
    try {
      await deleteEntry(id);
      setConfirmId(null);
      if (editingId === id) {
        setEditingId(null);
        setForm({ ...EMPTY_FORM });
      }
      await load();
    } catch (e) {
      console.error(e);
      setFormError(String(e));
    } finally {
      setBusy(false);
    }
  };

  const saveLimits = async () => {
    const db = await getDb();
    const n = Math.max(0, Math.min(200, dailyNew.trim() === "" ? 20 : Number(dailyNew)));
    const m = Math.max(1, Math.min(300, Number(dailyMax) || 30));
    await db.execute(
      "INSERT INTO config (key,value) VALUES ('daily_new',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [String(n)],
    );
    await db.execute(
      "INSERT INTO config (key,value) VALUES ('daily_max',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [String(m)],
    );
    await db.execute(
      "INSERT INTO config (key,value) VALUES ('srs_new_level',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
      [newLevel],
    );
    setDailyNew(String(n));
    setDailyMax(String(m));
    setSavedMsg("Beban harian disimpan — antrian berikutnya memakai nilai ini.");
    setTimeout(() => setSavedMsg(""), 3000);
  };

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const label = levelFromTags(row.tags);
      counts[label] = (counts[label] ?? 0) + 1;
    }
    return counts;
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    let list = rows;
    if (levelFilter === "wortschatz") {
      list = list.filter((row) => (row.tags ?? "").toLowerCase().includes("wortschatz"));
    } else if (levelFilter !== "all") {
      list = list.filter((row) => levelFromTags(row.tags) === levelFilter);
    }
    if (kindFilter !== "all") list = list.filter((row) => row.kind === kindFilter);
    if (q) {
      list = list.filter((row) =>
        `${row.de} ${row.meaning_id} ${row.article ?? ""} ${row.plural ?? ""} ${row.tags ?? ""}`
          .toLowerCase()
          .includes(q),
      );
    }
    const order: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3, Wortschatz: 4, Manual: 5 };
    const sorted = [...list];
    if (sortMode === "de") sorted.sort((a, b) => a.de.localeCompare(b.de, "de"));
    else if (sortMode === "meaning") sorted.sort((a, b) => a.meaning_id.localeCompare(b.meaning_id, "id"));
    else if (sortMode === "new") sorted.sort((a, b) => b.id - a.id);
    else
      sorted.sort(
        (a, b) =>
          (order[levelFromTags(a.tags)] ?? 9) - (order[levelFromTags(b.tags)] ?? 9) ||
          a.de.localeCompare(b.de, "de"),
      );
    return sorted;
  }, [rows, deferredQuery, levelFilter, kindFilter, sortMode]);

  useEffect(() => {
    setVisibleCount(100);
  }, [deferredQuery, levelFilter, kindFilter, sortMode]);

  // Mengetik di mana saja langsung membuka pencarian (keyboard-first).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
      if (typing) return;
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
        setQuery((prev) => prev + e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const parsed = useMemo(() => parseWordImport(importText, existingDe), [importText, existingDe]);

  const openImport = async () => {
    setImportOpen(true);
    setImportMsg(null);
    try {
      setExistingDe(await loadExistingDe());
    } catch (e) {
      console.error(e);
    }
  };

  const doImport = async () => {
    if (parsed.rows.length === 0) return;
    setImporting(true);
    setImportMsg(null);
    try {
      const res = await importWords(parsed.rows);
      setImportMsg({
        tone: res.failed === 0 ? "ok" : "err",
        text:
          `${res.inserted} kata diimpor · ${res.cards} kartu SRS dibuat` +
          (res.failed > 0 ? ` · ${res.failed} gagal (duplikat?)` : ""),
      });
      setImportText("");
      await load();
      setExistingDe(await loadExistingDe());
    } catch (e) {
      console.error(e);
      setImportMsg({ tone: "err", text: String(e) });
    } finally {
      setImporting(false);
    }
  };

  const statCards = [
    { angka: counts ? String(counts.entries) : "…", label: "kata tersimpan" },
    { angka: counts ? String(counts.cards) : "…", label: "kartu tersedia" },
    { angka: counts ? String(counts.scheduled) : "…", label: "kartu berjadwal (SRS)" },
    { angka: counts ? String(counts.due) : "…", label: "jatuh tempo sekarang" },
  ];

  const previewWord =
    form.kind === "noun" && form.article ? `${form.article} ${form.de.trim()}` : form.de.trim();
  const previewCloze = (() => {
    const example = form.example_de.trim();
    const de = form.de.trim();
    if (!example || !de) return "";
    const escaped = de.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return example.replace(new RegExp(`\\b${escaped}\\w*`, "i"), "______");
  })();

  const input = "w-full rounded border border-line bg-cream px-2.5 py-1.5 text-sm outline-none focus:border-gold";

  return (
    <PageShell
      title="Kosakata (SRS)"
      sub="Kelola kosakata dan kartu belajar. Kartu cloze tersedia jika ada contoh kalimat."
      meta="M1 · data nyata"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <div key={s.label} className="card px-5 py-4">
            <div className="font-display text-3xl text-gold-deep">{s.angka}</div>
            <div className="mt-1 text-xs text-ink-soft">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          className="btn-gold"
          onClick={() => {
            setEditingId(null);
            setForm({ ...EMPTY_FORM });
            setFormError("");
            setShowForm((v) => !v);
          }}
        >
          {showForm ? "Tutup editor" : "+ Entri baru"}
        </button>
        <button
          className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
          onClick={() => void openImport()}
        >
          {importOpen ? "Tutup impor" : "Import CSV/JSON"}
        </button>
        <span className="text-xs text-ink-soft">
          Isi kata dan arti; contoh kalimat diperlukan untuk membuat kartu cloze.
        </span>
      </div>

      {showForm && (
        <div className="card mt-3 px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">
              {editingId !== null ? `Ubah entri #${editingId}` : "Entri baru"}
            </div>
            {editingId !== null ? (
              <button
                className="text-xs text-ink-soft underline"
                onClick={() => {
                  setEditingId(null);
                  setForm({ ...EMPTY_FORM });
                }}
              >
                Batalkan edit
              </button>
            ) : null}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <label className="text-xs text-ink-soft">
              Jenis
              <select
                className={input}
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="noun">kata benda</option>
                <option value="verb">kata kerja</option>
                <option value="adj">kata sifat</option>
                <option value="other">lainnya</option>
              </select>
            </label>
            <label className="text-xs text-ink-soft">
              Kata Jerman *
              <input className={input} value={form.de} onChange={(e) => setForm({ ...form, de: e.target.value })} />
            </label>
            <label className="text-xs text-ink-soft">
              Arti (Indonesia) *
              <input
                className={input}
                value={form.meaning_id}
                onChange={(e) => setForm({ ...form, meaning_id: e.target.value })}
              />
            </label>
            {form.kind === "noun" && (
              <>
                <label className="text-xs text-ink-soft">
                  Artikel
                  <select
                    className={input}
                    value={form.article}
                    onChange={(e) => setForm({ ...form, article: e.target.value })}
                  >
                    <option value="der">der</option>
                    <option value="die">die</option>
                    <option value="das">das</option>
                  </select>
                </label>
                <label className="text-xs text-ink-soft">
                  Plural
                  <input
                    className={input}
                    value={form.plural}
                    onChange={(e) => setForm({ ...form, plural: e.target.value })}
                    placeholder="die …"
                  />
                </label>
              </>
            )}
            <label className="text-xs text-ink-soft">
              Contoh (Jerman)
              <input
                className={input}
                value={form.example_de}
                onChange={(e) => setForm({ ...form, example_de: e.target.value })}
              />
            </label>
            <label className="text-xs text-ink-soft">
              Contoh (arti)
              <input
                className={input}
                value={form.example_id}
                onChange={(e) => setForm({ ...form, example_id: e.target.value })}
              />
            </label>
          </div>

          {/* Pratinjau 4 tipe kartu sebelum disimpan (PRD F6). */}
          <div className="mt-3 rounded border border-line-soft bg-parchment/40 px-3 py-3">
            <div className="text-[11px] uppercase tracking-wide text-ink-soft">Pratinjau jenis kartu</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Kenali (DE→ID)",
                  front: previewWord || "…",
                  back: form.meaning_id || "…",
                },
                {
                  label: "Produksi (ID→DE)",
                  front: form.meaning_id || "…",
                  back: previewWord || "…",
                },
                {
                  label: "Dengar → tulis",
                  front: "🔊 audio offline",
                  back: previewWord || "…",
                },
                {
                  label: "Cloze",
                  front: previewCloze || "butuh contoh kalimat",
                  back: previewWord || "…",
                },
              ].map((c) => (
                <div key={c.label} className="rounded border border-line bg-cream px-3 py-2">
                  <div className="text-[10px] text-gold-deep">{c.label}</div>
                  <div className="mt-1 truncate font-display text-base" title={c.front}>
                    {c.front}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-ink-soft" title={c.back}>
                    → {c.back}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formError ? (
            <p className="mt-2 text-xs text-rose-700">{formError}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              className="btn-gold disabled:opacity-50"
              onClick={() => void submit()}
              disabled={busy || !form.de.trim() || !form.meaning_id.trim()}
            >
              {busy
                ? "Menyimpan…"
                : editingId !== null
                  ? "Simpan perubahan"
                  : "Simpan entri dan kartu"}
            </button>
            {editingId !== null ? (
              <button
                className="rounded border border-rose-300 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-50"
                onClick={() => setConfirmId(editingId)}
                disabled={busy}
              >
                Hapus entri ini
              </button>
            ) : null}
          </div>

          {confirmId !== null ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              Hapus entri beserta {4} kartu SRS-nya? Riwayat jawaban tetap tersimpan untuk statistik.
              <button
                className="rounded bg-rose-700 px-2 py-1 font-semibold text-white"
                onClick={() => void doDelete(confirmId)}
              >
                Ya, hapus
              </button>
              <button
                className="rounded border border-rose-300 px-2 py-1"
                onClick={() => setConfirmId(null)}
              >
                Batal
              </button>
            </div>
          ) : null}
        </div>
      )}

      {importOpen && (
        <div className="card mt-3 px-5 py-4">
          <div className="text-sm font-semibold">Import daftar kata</div>
          <p className="mt-1 text-xs text-ink-soft">
            Tempel CSV berpemisah <code>|</code> / tab / <code>;</code> / koma, atau JSON. Kolom:{" "}
            <code>de | meaning_id | article | plural</code> (opsional: <code>kind</code>,{" "}
            <code>example_de</code>, <code>example_id</code>). Baris berawalan <code>#</code> diabaikan;
            header dikenali otomatis.
          </p>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={7}
            spellCheck={false}
            placeholder={
              "de|meaning_id|article|plural\n" +
              "Lampe|alat penerangan|die|die Lampen\n" +
              "Tisch|meja|der|die Tische\n" +
              "arbeiten|bekerja||||"
            }
            className="mt-3 w-full rounded border border-line bg-cream px-3 py-2 font-mono text-[12px] outline-none focus:border-gold"
          />

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-emerald-700">{parsed.rows.length} kata siap diimpor</span>
            <span className={parsed.issues.length ? "text-rose-700" : "text-ink-soft"}>
              {parsed.issues.length} baris dilewati
            </span>
            <button
              className="btn-gold ml-auto disabled:opacity-50"
              disabled={importing || parsed.rows.length === 0}
              onClick={() => void doImport()}
            >
              {importing ? "Mengimpor…" : `Impor ${parsed.rows.length} kata + kartu`}
            </button>
          </div>

          {importMsg ? (
            <div
              className={
                "mt-2 rounded border px-3 py-2 text-xs " +
                (importMsg.tone === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800")
              }
            >
              {importMsg.text}
            </div>
          ) : null}

          {parsed.issues.length > 0 && (
            <ul className="mt-2 max-h-28 overflow-y-auto text-[11px] text-rose-700">
              {parsed.issues.slice(0, 8).map((iss, i) => (
                <li key={`${iss.line}-${i}`}>
                  {iss.line > 0 ? `baris ${iss.line}: ` : ""}
                  {iss.text ? <span className="font-mono">{iss.text}</span> : null} — {iss.reason}
                </li>
              ))}
              {parsed.issues.length > 8 ? <li>… {parsed.issues.length - 8} lainnya</li> : null}
            </ul>
          )}

          {parsed.rows.length > 0 && (
            <div className="mt-3 overflow-hidden rounded border border-line-soft">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-[10px] uppercase tracking-wide text-ink-soft">
                    <th className="px-3 py-1.5">Kata</th>
                    <th className="px-3 py-1.5">Artikel</th>
                    <th className="px-3 py-1.5">Plural</th>
                    <th className="px-3 py-1.5">Arti</th>
                    <th className="px-3 py-1.5">Jenis</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 6).map((r, i) => (
                    <tr key={`${r.de}-${i}`} className="border-b border-line-soft last:border-0">
                      <td className="px-3 py-1.5 font-medium">{r.de}</td>
                      <td className="px-3 py-1.5 text-gold-deep">{r.article ?? "—"}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.plural ?? "—"}</td>
                      <td className="px-3 py-1.5">{r.meaning_id}</td>
                      <td className="px-3 py-1.5 text-ink-soft">{r.kind}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsed.rows.length > 6 ? (
                <div className="px-3 py-1.5 text-[11px] text-ink-soft">
                  … dan {parsed.rows.length - 6} kata lain
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      <h4 className="mt-8 font-display text-xl">Cari &amp; filter kosakata</h4>
      <div className="card mt-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kata Jerman atau arti… (langsung ketik di mana saja, / untuk fokus)"
              aria-label="Cari kosakata"
              className="w-full rounded border border-line bg-cream px-3 py-2 text-sm outline-none focus:border-gold"
            />
            {query ? (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-ink-soft hover:text-ink"
                onClick={() => setQuery("")}
                aria-label="Hapus pencarian"
              >
                ✕
              </button>
            ) : null}
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as "de" | "meaning" | "new" | "level")}
            className="rounded border border-line bg-cream px-2 py-2 text-xs"
            aria-label="Urutkan"
          >
            <option value="de">Urut A–Z Jerman</option>
            <option value="meaning">Urut A–Z arti</option>
            <option value="new">Terbaru dulu</option>
            <option value="level">Urut level</option>
          </select>
          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            className="rounded border border-line bg-cream px-2 py-2 text-xs"
            aria-label="Filter jenis"
          >
            <option value="all">Semua jenis</option>
            <option value="noun">Kata benda</option>
            <option value="verb">Kata kerja</option>
            <option value="adj">Kata sifat</option>
            <option value="other">Lainnya</option>
          </select>
          <label className="flex items-center gap-1 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={showReading}
              onChange={(e) => setShowReading(e.target.checked)}
            />
            Bantuan baca
          </label>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {[
            { key: "all", label: "Semua" },
            { key: "A1", label: "A1" },
            { key: "A2", label: "A2" },
            { key: "B1", label: "B1" },
            { key: "B2", label: "B2" },
            { key: "wortschatz", label: "Wortschatz" },
            { key: "Manual", label: "Manual" },
          ].map((chip) => {
            const count =
              chip.key === "all"
                ? rows.length
                : chip.key === "wortschatz"
                  ? rows.filter((r) => (r.tags ?? "").toLowerCase().includes("wortschatz")).length
                  : (levelCounts[chip.key] ?? 0);
            const active = levelFilter === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setLevelFilter(chip.key)}
                className={
                  "rounded-full border px-2.5 py-0.5 text-[11px] transition-colors " +
                  (active
                    ? "border-gold bg-gold/10 font-semibold text-gold-deep"
                    : "border-line text-ink-soft hover:border-gold/60")
                }
              >
                {chip.label} <span className="opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 text-[11px] text-ink-soft">
          Menampilkan {Math.min(visibleCount, filteredRows.length)} dari {filteredRows.length} kata
          {filteredRows.length !== rows.length ? ` (total deck ${rows.length})` : ""}.
          {query ? ` Pencarian: “${query}”` : ""}
        </div>
      </div>

      <details className="card-soft mt-3 px-4 py-3 text-xs text-ink-soft">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          Bantuan cara baca &amp; pemenggalan (Bahasa Indonesia)
        </summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="font-semibold text-ink">Pemenggalan suku kata</div>
            <p className="mt-1">
              Tanda <b>-</b> memisahkan suku kata: <b>Woh-nung</b>, <b>Lam-pe</b>, <b>Mög-lich-keit</b>.
              Pemenggalan ini perkiraan otomatis, berguna untuk membaca bertahap.
            </p>
            <div className="mt-2 font-semibold text-ink">Pelafalan (ejaan Indonesia)</div>
            <ul className="mt-1 list-disc pl-4">
              <li>
                <b>w</b> seperti “w” Indonesia (Wasser), <b>v</b> = f (Vater), <b>z</b> = ts (Zeit)
              </li>
              <li>
                <b>sch</b> = sy (Schule), <b>ch</b> = kh (Buch, ich), <b>ß</b> = ss
              </li>
              <li>
                <b>ei/ai</b> = ai (Zeit), <b>ie</b> = ii panjang (Buch), <b>eu/äu</b> = oi (heute)
              </li>
              <li>
                <b>ä</b> = e (Mädchen), <b>ö</b> = e dengan bibir bulat (schön), <b>ü</b> = i dengan bibir bulat (Bücher)
              </li>
              <li>
                <b>h</b> setelah vokal tidak dibaca (Jahr → yar), akhiran <b>-er</b> dibaca “a” (Vater → fata)
              </li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-ink">Tips</div>
            <ul className="mt-1 list-disc pl-4">
              <li>Tekan tombol 🔊 untuk mendengar Piper atau klip offline bawaan jika tersedia.</li>
              <li>Huruf besar di awal kata hanya penulisan; kata benda Jerman selalu diawali huruf besar.</li>
              <li>
                Pelafalan di sini <b>perkiraan</b> untuk pembelajar Indonesia — kata majemuk dan kata serapan bisa
                berbeda; kamus/TTS tetap acuan utama.
              </li>
              <li>Ketik di mana saja di halaman ini untuk langsung mencari; tekan “/” untuk fokus ke kolom cari.</li>
            </ul>
          </div>
        </div>
      </details>

      <h4 className="mt-8 font-display text-xl">Isi deck</h4>
      <div className="card mt-3 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-2">Kata (de)</th>
              <th className="px-4 py-2">Artikel</th>
              <th className="px-4 py-2">Plural</th>
              <th className="px-4 py-2">Arti (id)</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.slice(0, visibleCount).map((w) => (
              <tr key={w.id} className="border-b border-line-soft last:border-0">
                <td className="px-4 py-2">
                  <div className="font-medium">{w.de}</div>
                  {showReading
                    ? (() => {
                        const hint = readingHint(w.de);
                        return <ReadingHintView syllables={hint.syllables} spoken={hint.spoken} compact />;
                      })()
                    : null}
                </td>
                <td className="px-4 py-2 text-gold-deep">{w.article ?? "—"}</td>
                <td className="px-4 py-2 text-ink-soft">{w.plural ?? "—"}</td>
                <td className="px-4 py-2">{w.meaning_id}</td>
                <td className="px-4 py-2 text-[11px] text-ink-soft">{levelFromTags(w.tags)}</td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-1.5">
                    <button
                      className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-gold"
                      onClick={() => startEdit(w)}
                    >
                      Ubah
                    </button>
                    {confirmId === w.id ? (
                      <>
                        <button
                          className="rounded bg-rose-700 px-2 py-0.5 text-[11px] font-semibold text-white"
                          onClick={() => void doDelete(w.id)}
                        >
                          Hapus?
                        </button>
                        <button
                          className="rounded border border-line px-2 py-0.5 text-[11px]"
                          onClick={() => setConfirmId(null)}
                        >
                          Batal
                        </button>
                      </>
                    ) : (
                      <button
                        className="rounded border border-line px-2 py-0.5 text-[11px] text-rose-700 hover:border-rose-300"
                        onClick={() => setConfirmId(w.id)}
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-ink-soft">
          <span>
            {filteredRows.length} kata cocok · jenis kartu bergantung pada contoh kalimat dan audio yang tersedia.
          </span>
          {filteredRows.length > visibleCount ? (
            <button
              className="rounded border border-line px-2 py-1 text-[11px] hover:border-gold"
              onClick={() => setVisibleCount((n) => n + 100)}
            >
              Tampilkan 100 lagi
            </button>
          ) : null}
        </div>
      </div>

      <h4 className="mt-8 font-display text-xl">Beban harian</h4>
      <div className="card-soft mt-3 flex flex-wrap items-end gap-3 px-5 py-4 text-sm">
        <label className="text-xs text-ink-soft">
          Kartu baru / hari
          <input
            className={input}
            type="number"
            min={0}
            max={200}
            value={dailyNew}
            onChange={(e) => setDailyNew(e.target.value)}
          />
        </label>
        <label className="text-xs text-ink-soft">
          Level kartu baru
          <select className={input} value={newLevel} onChange={(e) => setNewLevel(e.target.value)}>
            <option value="A1">A1</option><option value="A2">A2</option><option value="B1">B1</option><option value="B2">B2</option><option value="all">Semua level</option>
          </select>
        </label>
        <p className="max-w-xs text-xs text-ink-soft">Kata unit yang sudah terbuka diprioritaskan; kata manual dan kartu jatuh tempo tetap tersedia.</p>
        <label className="text-xs text-ink-soft">
          Batas total / hari
          <input
            className={input}
            type="number"
            min={1}
            max={300}
            value={dailyMax}
            onChange={(e) => setDailyMax(e.target.value)}
          />
        </label>
        <button className="btn-gold" onClick={() => void saveLimits()}>
          Simpan
        </button>
        {savedMsg ? <span className="text-xs text-emerald-700">{savedMsg}</span> : null}
      </div>
    </PageShell>
  );
}
