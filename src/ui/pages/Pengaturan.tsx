// Pengaturan (M2/M3): preferensi belajar, status voice, target harian,
// dan backup/restore JSON (F6) ke folder backup aplikasi.
import { useCallback, useEffect, useState } from "react";
import { friendlyErrorMessage } from "../../klab/errorMessage";
import PageShell from "../PageShell";
import getDb from "../../stores/db";
import {
  getPiperEnabled,
  installPiperEngine,
  installPiperVoice,
  piperReady,
  piperFaultMessage,
  piperStatusCached,
  refreshPiper,
  retryPiper,
  selectedPiperVoice,
  setTtsRate,
  setPiperEnabled,
  setPiperVoice,
  speak,
  type PiperStatus,
} from "../../srs/tts";
import {
  backupFolder,
  exportBackup,
  formatBytes,
  formatWhen,
  lastAutoBackup,
  listBackups,
  openBackupFolder,
  readBackup,
  readBackupDir,
  restoreBackup,
  saveBackupDir,
  type BackupEntry,
  type BackupSummary,
} from "../../stores/backup";

const RATES = [0.75, 0.8, 0.85, 0.9, 0.95, 1];
const GOALS = [10, 15, 20, 25, 30];

function kindOf(name: string): "auto" | "manual" | "pre-restore" {
  if (name.endsWith("-auto.json")) return "auto";
  if (name.endsWith("-pre-restore.json")) return "pre-restore";
  return "manual";
}

const KIND_LABEL: Record<string, string> = {
  auto: "otomatis",
  manual: "manual",
  "pre-restore": "pra-restore",
};

export default function Pengaturan() {
  const [rate, setRate] = useState(0.85);
  const [goal, setGoal] = useState(15);
  const [dailyNew, setDailyNew] = useState<number | null>(null);
  const [piper, setPiper] = useState<PiperStatus | null>(null);
  const [piperBusy, setPiperBusy] = useState("");
  const [piperMsg, setPiperMsg] = useState("");
  const [piperOn, setPiperOn] = useState(true);
  const [saved, setSaved] = useState("");

  const [folder, setFolder] = useState("");
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [lastAuto, setLastAuto] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [preview, setPreview] = useState<BackupSummary | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [customDir, setCustomDir] = useState<string | null>(null);
  const [dirInput, setDirInput] = useState("");
  const [dirBusy, setDirBusy] = useState(false);

  const loadBackupInfo = useCallback(async () => {
    try {
      const [dir, items, last, custom] = await Promise.all([
        backupFolder(),
        listBackups(),
        lastAutoBackup(),
        readBackupDir(),
      ]);
      setFolder(dir);
      setBackups(items);
      setLastAuto(last);
      setCustomDir(custom);
      setDirInput(custom ?? "");
    } catch (e) {
      console.error(e);
      setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const db = await getDb();
      const rows = await db.select<{ key: string; value: string }[]>(
        "SELECT key, value FROM config WHERE key IN ('tts_rate', 'daily_goal_min', 'daily_new')",
      );
      if (!alive) return;
      setDailyNew(20);
      for (const row of rows) {
        const n = Number(row.value);
        if (!Number.isFinite(n)) continue;
        if (row.key === "tts_rate") setRate(Math.min(1, Math.max(0.75, n)));
        if (row.key === "daily_goal_min") setGoal(Math.min(60, Math.max(5, n)));
        if (row.key === "daily_new" && n >= 0) setDailyNew(n);
      }
    })().catch(console.error);

    const syncPiper = () => {
      void refreshPiper().then((status) => {
        if (!alive) return;
        setPiper(status);
        setPiperOn(getPiperEnabled());
      });
    };
    syncPiper();
    const t = window.setTimeout(() => {
      syncPiper();
    }, 900);
    void loadBackupInfo();
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [loadBackupInfo]);

  const saveConfig = async (key: string, value: string) => {
    const db = await getDb();
    await db.execute(
      "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
      [key, value],
    );
  };

  const changeRate = async (value: number) => {
    setRate(value);
    setTtsRate(value);
    await saveConfig("tts_rate", String(value));
    setSaved(`Kecepatan TTS disimpan: ${value.toFixed(2)}×`);
  };

  const installEngine = async () => {
    setPiperBusy("engine");
    setPiperMsg("");
    try {
      await installPiperEngine();
      setPiper(piperStatusCached());
      setPiperMsg("Mesin Piper terpasang. Sekarang unduh salah satu voice di bawah.");
    } catch (e) {
      console.error(e);
      setPiperMsg(`Gagal memasang mesin: ${String(e)}`);
    } finally {
      setPiperBusy("");
    }
  };

  const downloadVoice = async (id: string) => {
    setPiperBusy(id);
    setPiperMsg("");
    try {
      await installPiperVoice(id);
      setPiper(piperStatusCached());
      setPiperMsg("Voice Piper terunduh dan siap dipakai.");
    } catch (e) {
      console.error(e);
      setPiperMsg(`Gagal mengunduh voice: ${String(e)}`);
    } finally {
      setPiperBusy("");
    }
  };

  const togglePiper = async (enabled: boolean) => {
    setPiperOn(enabled);
    setPiperEnabled(enabled);
    await saveConfig("piper_enabled", enabled ? "1" : "0");
    setPiperMsg(
      enabled
        ? "Piper diaktifkan. Klip audio bawaan tetap tersedia."
        : "Piper dimatikan; hanya klip audio bawaan yang tersedia.",
    );
  };

  const choosePiperVoice = async (id: string) => {
    setPiperVoice(id);
    await saveConfig("piper_voice", id);
    setPiper(piperStatusCached());
    setPiperMsg("Voice Piper aktif diperbarui.");
  };

  const testPiper = async () => {
    retryPiper();
    setPiperMsg(piperReady() ? "Menghubungkan ke Piper…" : "Memutar klip bawaan…");
    const source = await speak("Guten Tag! Ich heiße Alex und lerne Deutsch.", rate);
    if (source === "piper") setPiperMsg("Piper berhasil membacakan contoh suara.");
    else if (source === "bundle") {
      setPiperMsg(
        piperReady()
          ? "Piper gagal merespons; contoh diputar dari audio bawaan."
          : "Piper belum aktif. Contoh diputar dari klip audio bawaan.",
      );
    } else {
      setPiperMsg(
        `Tidak ada audio yang berhasil diputar. ${piperFaultMessage() ?? "Periksa pemasangan Piper atau klip bawaan."}`,
      );
    }
  };

  const changeGoal = async (value: number) => {
    setGoal(value);
    await saveConfig("daily_goal_min", String(value));
    setSaved(`Target harian disimpan: ${value} menit`);
  };

  const runExport = async () => {
    setBusy("export");
    setMessage(null);
    try {
      const { entry, total } = await exportBackup("manual");
      setMessage({ tone: "ok", text: `Backup selesai: ${total} baris → ${entry.name}` });
      await loadBackupInfo();
    } catch (e) {
      console.error(e);
      setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
    } finally {
      setBusy("");
    }
  };

  const runInspect = async (entry: BackupEntry) => {
    setBusy(`inspect:${entry.name}`);
    setConfirmed(false);
    setMessage({ tone: "ok", text: `Memeriksa ${entry.name}…` });
    try {
      const { summary } = await readBackup(entry.name);
      setPreview(summary);
      setMessage(null);
    } catch (e) {
      console.error(e);
      setPreview(null);
      setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
    } finally {
      setBusy("");
    }
  };

  const runRestore = async () => {
    if (!preview) return;
    setBusy("restore");
    setMessage(null);
    try {
      const report = await restoreBackup(preview.name);
      setMessage({
        tone: "ok",
        text:
          `Restore selesai: ${report.restored} baris dimuat. ` +
          `Backup pra-restore: ${report.preBackup}. Muat ulang aplikasi untuk melihat data baru.`,
      });
      setPreview(null);
      setConfirmed(false);
      await loadBackupInfo();
    } catch (e) {
      console.error(e);
      setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
    } finally {
      setBusy("");
    }
  };

  const applyDir = async (value: string | null) => {
    setDirBusy(true);
    setMessage(null);
    const previous = customDir;
    try {
      await saveBackupDir(value);
      const active = await backupFolder();
      setCustomDir(value);
      setDirInput(value ?? "");
      setMessage({ tone: "ok", text: `Folder backup aktif: ${active}` });
      await loadBackupInfo();
    } catch (e) {
      console.error(e);
      await saveBackupDir(previous);
      setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
    } finally {
      setDirBusy(false);
    }
  };

  const saveDir = async () => {
    const value = dirInput.trim();
    if (!value) {
      setMessage({ tone: "err", text: "Isi path absolut folder backup terlebih dahulu." });
      return;
    }
    await applyDir(value);
  };

  return (
    <PageShell
      title="Pengaturan"
      sub="Preferensi belajar, suara aplikasi, dan cadangan data — semuanya tersimpan lokal."
      meta="M3 · F6"
    >
      <div className="card divide-y divide-line-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
          <div>
            <div className="text-ink-soft">Kecepatan suara TTS</div>
            <div className="text-[11px] text-ink-soft">
              Berlaku untuk reader dan contoh kalimat di pelajaran.
            </div>
          </div>
          <select
            value={rate}
            aria-label="Kecepatan suara"
            onChange={(e) => void changeRate(Number(e.target.value))}
            className="rounded border border-line bg-cream px-3 py-1.5 text-sm"
          >
            {RATES.map((r) => (
              <option key={r} value={r}>
                {r.toFixed(2)}×
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
          <div>
            <div className="text-ink-soft">Target belajar harian</div>
            <div className="text-[11px] text-ink-soft">
              Dipakai grafik "menit hari ini" di Statistik.
            </div>
          </div>
          <select
            value={goal}
            aria-label="Target belajar harian"
            onChange={(e) => void changeGoal(Number(e.target.value))}
            className="rounded border border-line bg-cream px-3 py-1.5 text-sm"
          >
            {GOALS.map((g) => (
              <option key={g} value={g}>
                {g} menit / hari
              </option>
            ))}
          </select>
        </div>

        <div className="px-5 py-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-ink-soft">Suara offline (Piper + klip bawaan)</div>
              <div className="text-[11px] text-ink-soft">
                Piper membacakan teks bebas secara offline. Klip bawaan mencakup angka 1-100, jam, sapaan,
                kosakata dan contoh A1, 100 kalimat bacaan A1, dialog mendengar, dan percakapan A1.
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-ink-soft">
                <input
                  type="checkbox"
                  checked={piperOn}
                  onChange={(e) => void togglePiper(e.target.checked)}
                />
                Aktifkan
              </label>
              <button
                className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment disabled:opacity-40"
                onClick={testPiper}
                title="Putar contoh suara: Piper jika aktif, jika tidak klip bawaan"
              >
                Putar contoh suara
              </button>
            </div>
          </div>

          {!piper || !piper.engine ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="badge bg-amber-50 text-amber-800">Mesin belum terpasang</span>
              <button
                className="btn-gold disabled:opacity-50"
                disabled={piperBusy !== ""}
                onClick={() => void installEngine()}
              >
                {piperBusy === "engine" ? "Mengunduh mesin (±21 MB)…" : "Pasang mesin Piper (±21 MB)"}
              </button>
            </div>
          ) : (
            <div className="mt-2">
              <div className="text-[11px] text-emerald-700">
                Mesin terpasang · folder <span className="font-mono">{piper.dir}</span>
              </div>
              <ul className="mt-2 divide-y divide-line-soft">
                {(piper.voices ?? []).map((v) => (
                  <li key={v.id} className="flex flex-wrap items-center gap-2 py-1.5 text-xs">
                    <input
                      type="radio"
                      name="piperVoice"
                      checked={selectedPiperVoice() === v.id}
                      onChange={() => void choosePiperVoice(v.id)}
                      disabled={!v.installed}
                    />
                    <span className="flex-1">
                      {v.name} <span className="text-ink-soft">· ±{v.size_mb} MB</span>
                    </span>
                    {v.installed ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Terpasang</span>
                    ) : (
                      <button
                        className="rounded border border-line px-2 py-0.5 text-[11px] hover:border-gold disabled:opacity-50"
                        disabled={piperBusy !== ""}
                        onClick={() => void downloadVoice(v.id)}
                      >
                        {piperBusy === v.id ? "Mengunduh…" : "Unduh"}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {piperMsg ? <div className="mt-2 text-[11px] text-ink-soft">{piperMsg}</div> : null}
          <p className="mt-2 text-[11px] text-ink-soft">
            Piper adalah TTS neural lokal. Voice Windows tidak digunakan. Jika Piper belum siap, audio bawaan
            hanya membacakan frasa dan kata yang memang tersedia di paket.
          </p>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-ink-soft">Beban baru per hari</span>
          <span className="font-medium">{dailyNew === null ? "Memuat…" : `${dailyNew} kartu (bisa diubah di Kosakata)`}</span>
        </div>
        <div className="flex items-center justify-between px-5 py-3 text-sm">
          <span className="text-ink-soft">Tema visual</span>
          <span className="font-medium">Akademik Premium (ivory + emas)</span>
        </div>
      </div>

      {saved ? (
        <div className="card-soft mt-3 px-5 py-2 text-xs text-emerald-700">{saved}</div>
      ) : null}

      {/* ---- Backup & restore (F6) ---- */}
      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl">Backup &amp; Restore</h3>
          <span className="badge">
            {lastAuto
              ? `auto terakhir ${formatWhen(new Date(lastAuto).getTime())}`
              : "belum pernah auto"}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          Backup JSON berisi seluruh tabel belajar. Otomatis dibuat seminggu sekali; empat backup
          otomatis terakhir disimpan, ditambah backup manual dan pra-restore. Bila folder Dokumen
          tidak bisa ditulis di mesin ini, aplikasi memakai folder data aplikasi (path di bawah).
        </p>

        <div className="card mt-3 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 text-xs text-ink-soft">
              Folder:{" "}
              <span className="break-all font-mono text-[11px] text-ink">{folder || "memuat…"}</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment disabled:opacity-50"
                disabled={!folder}
                onClick={() => {
                  openBackupFolder().catch((e) => {
                    console.error(e);
                    setMessage({ tone: "err", text: friendlyErrorMessage(e, "backup") });
                  });
                }}
              >
                Buka folder
              </button>
              <button
                className="btn-gold shrink-0 disabled:opacity-50"
                onClick={() => void runExport()}
                disabled={busy !== ""}
              >
                {busy === "export" ? "Membuat backup…" : "Backup sekarang"}
              </button>
            </div>
          </div>

          <div className="mt-3 rounded border border-line-soft bg-parchment/30 px-3 py-3">
            <div className="text-[11px] uppercase tracking-wide text-ink-soft">
              Folder cadangan (opsional)
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className="min-w-0 flex-1 text-[11px] text-ink-soft">
                Path absolut — mis. <code>D:\Backup Lernen</code>
                <input
                  className="mt-1 w-full rounded border border-line bg-cream px-2 py-1.5 font-mono text-[11px] outline-none focus:border-gold"
                  value={dirInput}
                  onChange={(e) => setDirInput(e.target.value)}
                  placeholder="D:\Backup Lernen"
                />
              </label>
              <button
                className="btn-gold shrink-0 disabled:opacity-50"
                disabled={dirBusy}
                onClick={() => void saveDir()}
              >
                {dirBusy ? "Memeriksa…" : "Simpan folder"}
              </button>
              <button
                className="shrink-0 rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment disabled:opacity-40"
                disabled={dirBusy || !customDir}
                onClick={() => void applyDir(null)}
              >
                Pakai default
              </button>
            </div>
            <p className="mt-1 text-[10px] text-ink-soft">
              Berguna untuk menyimpan cadangan ke flashdisk/Drive. Folder dibuat otomatis bila
              belum ada; folder harus bisa ditulis.
            </p>
          </div>

          {message ? (
            <div
              className={
                "mt-3 rounded border px-3 py-2 text-xs " +
                (message.tone === "ok"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800")
              }
            >
              {message.text}
            </div>
          ) : null}

          {preview ? (
            <div className="card-soft mt-3 border-l-2 border-gold px-4 py-3">
              <div className="text-sm font-semibold">Verifikasi: {preview.name}</div>
              <div className="mt-1 text-xs text-ink-soft">
                Dibuat {formatWhen(new Date(preview.exportedAt).getTime())} · {preview.total} baris ·
                struktur lengkap ({Object.keys(preview.counts).length} tabel)
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-ink-soft">
                {Object.entries(preview.counts).map(([table, n]) => (
                  <span key={table}>
                    {table}: <b className="text-ink">{n}</b>
                  </span>
                ))}
              </div>
              <div className="mt-3">
                {confirmed ? (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      disabled={busy !== ""}
                      onClick={() => void runRestore()}
                    >
                      {busy === "restore" ? "Memulihkan…" : "Restore backup ini"}
                    </button>
                    <button
                      className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment"
                      onClick={() => setConfirmed(false)}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100"
                      onClick={() => setConfirmed(true)}
                    >
                      Saya paham — ganti data sekarang
                    </button>
                    <button
                      className="rounded border border-line px-3 py-1.5 text-xs hover:bg-parchment"
                      onClick={() => {
                        setPreview(null);
                        setConfirmed(false);
                      }}
                    >
                      Tutup
                    </button>
                  </div>
                )}
                <p className="mt-2 text-[11px] text-ink-soft">
                  Restore diproses dua langkah; backup pra-restore dibuat otomatis sebelum data
                  diganti.
                </p>
              </div>
            </div>
          ) : null}

          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-wide text-ink-soft">
              File backup tersedia ({backups.length})
            </div>
            {backups.length === 0 ? (
              <p className="mt-2 text-xs text-ink-soft">
                Belum ada file. Tekan "Backup sekarang" untuk membuat yang pertama.
              </p>
            ) : (
              <ul className="mt-2 max-h-56 divide-y divide-line-soft overflow-y-auto">
                {backups.map((b) => (
                  <li key={b.name} className="flex flex-wrap items-center gap-2 py-1.5 text-xs">
                    <span className="badge shrink-0">{KIND_LABEL[kindOf(b.name)]}</span>
                    <span className="min-w-0 flex-1 truncate font-mono text-[11px]" title={b.path}>
                      {b.name}
                    </span>
                    <span className="shrink-0 text-ink-soft">
                      {formatWhen(b.modified_ms)} · {formatBytes(b.size)}
                    </span>
                    <button
                      className="shrink-0 rounded border border-line px-2 py-1 hover:border-gold disabled:opacity-50"
                      disabled={busy !== ""}
                      onClick={() => void runInspect(b)}
                    >
                      {busy === `inspect:${b.name}` ? "Memeriksa…" : "Periksa"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>


      <div className="card-soft mt-4 px-5 py-3 text-xs text-ink-soft">
        Data belajar tersimpan di <b>SQLite</b> (folder data aplikasi). Backup di atas adalah
        salinan JSON lengkap — bisa dipindahkan ke PC lain atau disimpan di flashdisk.
      </div>
    </PageShell>
  );
}
