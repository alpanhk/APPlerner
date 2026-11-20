// Layar darurat bila database tidak bisa dibuka / integritasnya rusak (F6).
// Pengguna diberi jalan keluar: pulihkan backup terbaru, buka folder, muat ulang.
import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  listBackups,
  openBackupFolder,
} from "../stores/backup";

export default function FatalDatabase({ message }: { message: string }) {
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const openFolder = async () => {
    try {
      await openBackupFolder();
    } catch (e) {
      setNote({ tone: "err", text: String(e) });
    }
  };

  const restoreLatest = async () => {
    setBusy("restore");
    setNote(null);
    try {
      const items = await listBackups();
      if (items.length === 0) {
        setNote({ tone: "err", text: "Tidak ada file backup di folder cadangan." });
        return;
      }
      // Kandidat terbaru bisa rusak; coba berurutan sampai ada backup valid.
      const failures: string[] = [];
      for (const item of items) {
        try {
          const path = await invoke<string>("backup_recover_to_file", {
            name: item.name,
            dir: localStorage.getItem("lernen_backup_dir"),
          });
          const databasePath = await invoke<string>("app_database_path");
          setNote({
            tone: "ok",
            text:
              `Database pemulihan dibuat dari ${item.name}: ${path}. Tutup aplikasi, pindahkan database lama beserta file -wal dan -shm jika ada ke folder aman, ` +
              `lalu ganti database lama dengan berkas pemulihan di: ${databasePath}`,
          });
          return;
        } catch (e) {
          failures.push(`${item.name}: ${String(e)}`);
        }
      }
      setNote({
        tone: "err",
        text:
          `Semua ${items.length} backup gagal dipulihkan. ` +
          `Buka folder backup lalu pindahkan file JSON ke tempat aman sebelum mencoba lagi. ` +
          `Kegagalan terakhir: ${failures[failures.length - 1] ?? "-"}`,
      });
    } catch (e) {
      console.error(e);
      setNote({
        tone: "err",
        text:
          `Restore otomatis gagal: ${String(e)}. ` +
          `Buka folder backup lalu pindahkan file JSON ke tempat aman sebelum mencoba lagi.`,
      });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-parchment px-6 py-10 text-ink">
      <div className="card w-full max-w-2xl px-8 py-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge">Siap offline</span>
          <span className="badge">SQLite bermasalah</span>
        </div>
        <h1 className="mt-4 font-display text-3xl">Database tidak bisa dibuka</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Aplikasi berhenti sebelum menyentuh data belajar agar tidak memperburuk keadaan. File
          database dan backup tetap ada di disk.
        </p>

        <pre className="mt-4 max-h-40 overflow-auto rounded border border-line bg-cream px-3 py-2 text-[11px] text-rose-800">
          {message || "Penyebab tidak diketahui."}
        </pre>

        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn-gold disabled:opacity-50"
            disabled={busy !== ""}
            onClick={() => void restoreLatest()}
          >
            {busy === "restore" ? "Memulihkan…" : "Pulihkan backup terbaru"}
          </button>
          <button
            className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
            onClick={() => void openFolder()}
          >
            Buka folder backup
          </button>
          <button
            className="rounded border border-line px-3 py-1.5 text-sm hover:bg-parchment"
            onClick={() => window.location.reload()}
          >
            Muat ulang aplikasi
          </button>
        </div>

        {note ? (
          <div
            className={
              "mt-4 rounded border px-3 py-2 text-xs " +
              (note.tone === "ok"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800")
            }
          >
            {note.text}
          </div>
        ) : null}

        <div className="card-soft mt-5 px-4 py-3 text-[11px] text-ink-soft">
          <b>Urutan aman jika restore gagal:</b> buka folder backup → salin file{" "}
          <code>lernen-backup-*.json</code> terbaru ke tempat lain. File JSON perlu diimpor melalui
          proses pemulihan; jangan mengganti nama JSON menjadi <code>lernen.db</code>. Jika database
          tidak dapat dibuka, pulihkan melalui proses perbaikan database sebelum mencoba restore lagi.
        </div>
      </div>
    </div>
  );
}
