// Migrasi konservatif dari backup SQLite lama (Vite/Tauri) ke Postgres baru.
//
// Aplikasi lama (legacy/vite-tauri/) menyimpan data di SQLite `lernen.db`
// dan mengekspor backup JSON format `lernen-backup` v1 (lihat
// legacy/vite-tauri/src/stores/backup.ts). Aplikasi baru (Next.js) memakai
// Postgres dengan skema profiles / chapter_progress / attempts yang berbeda
// (lihat src/db/schema.ts). Kedua skema TIDAK 1:1:
//
//   - Lama: satu pengguna, tabel decks/entries/cards/srs_state/attempts/
//     drills/lesson_progress/texts/reading_log/progress_daily/
//     saved_from_chat/config/lesson_drafts.
//   - Baru: banyak profil, tabel profiles/chapter_progress/attempts
//     (attempts baru menyimpan teks kalimat Jerman + objective + who).
//
// Skrip ini SENGAJA konservatif dan tidak memalsukan bukti:
//   - Membuat SATU profil baru (nama dari --name, avatar dari --avatar).
//   - Mengimpor lesson_progress sebagai chapter_progress HANYA untuk
//     status selesai/aktif (state Game tidak dapat direkonstruksi -> null,
//     notes -> []).
//   - TIDAK mengimpor SRS, drafts, teks bacaan, atau attempts lama karena
//     tidak ada pemetaan yang jujur ke bukti kalimat baru. Semua itu tetap
//     ada di file backup dan di legacy/vite-tauri/ untuk kelanjutan A2–B2.
//   - File backup TIDAK diubah; database pengguna lama TIDAK dihapus.
//
// Pakai:
//   DATABASE_URL=... node scripts/migrate-legacy.mjs --backup <file.json> --name "Rina" [--avatar player-01] [--dry-run]
// Uji dengan salinan sintetis (tidak menyentuh data pengguna):
//   node scripts/migrate-legacy.mjs --synthetic-test
// (mode ini membuat backup sintetis di /tmp, memigrasikannya ke DATABASE_URL
// yang diberikan, lalu memverifikasi hasilnya. Tanpa DATABASE_URL, mode ini
// hanya memvalidasi pemetaan tanpa menulis ke DB.)

import { readFileSync, writeFileSync } from "node:fs";
import pg from "pg";

const AVATARS = ["player-01", "player-02", "player-03", "player-04"];
// Pemetaan unit lama (unit_no 1..12) ke bab baru (bab01..bab12).
// Prolog baru (prolog) tidak punya padanan lama -> tidak dimigrasikan.
function chapterIdForUnit(unitNo) {
  if (!Number.isInteger(unitNo) || unitNo < 1 || unitNo > 12) return null;
  return `bab${String(unitNo).padStart(2, "0")}`;
}

function parseArgs(argv) {
  const out = { dryRun: false, syntheticTest: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--backup") out.backup = argv[++i];
    else if (a === "--name") out.name = argv[++i];
    else if (a === "--avatar") out.avatar = argv[++i];
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--synthetic-test") out.syntheticTest = true;
    else if (a === "--help" || a === "-h") out.help = true;
  }
  return out;
}

function validateBackup(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Backup bukan objek JSON.");
  if (payload.format !== "lernen-backup") throw new Error(`Format backup tidak dikenal: ${payload.format}`);
  if (!payload.tables || typeof payload.tables !== "object") throw new Error("Backup tidak memiliki tables.");
  return payload;
}

function planMigration(payload, name, avatar) {
  if (!name || !/^[A-Za-zÀ-ÿ' -]{2,20}$/.test(name)) {
    throw new Error("Nama profil harus 2–20 huruf Latin (dipakai dalam kalimat Jerman).");
  }
  if (!AVATARS.includes(avatar)) throw new Error(`Avatar harus salah satu dari: ${AVATARS.join(", ")}`);
  const tables = payload.tables;
  const lessonProgress = Array.isArray(tables.lesson_progress) ? tables.lesson_progress : [];
  const rows = [];
  const skipped = [];
  for (const r of lessonProgress) {
    const chapterId = chapterIdForUnit(Number(r.unit_no));
    if (!chapterId) {
      skipped.push(`lesson_progress unit_no=${r.unit_no} (di luar 1–12)`);
      continue;
    }
    // Hanya status yang dapat dipetakan dengan jujur. State Game lama
    // (draft/checkpoint JSON) tidak dapat direkonstruksi menjadi Game baru.
    const done = r.state === "done" || r.state === "finished" || r.state === "passed";
    rows.push({ chapterId, status: done ? "selesai" : "aktif" });
  }
  // Deduplikasi per bab: selesai menang atas aktif.
  const byChapter = new Map();
  for (const r of rows) {
    const prev = byChapter.get(r.chapterId);
    if (!prev || r.status === "selesai") byChapter.set(r.chapterId, r);
  }
  const notMigrated = [
    "decks", "entries", "cards", "srs_state", "drills", "texts",
    "reading_log", "progress_daily", "saved_from_chat", "config", "lesson_drafts",
  ].filter((t) => Array.isArray(tables[t]) && tables[t].length > 0);
  const oldAttempts = Array.isArray(tables.attempts) ? tables.attempts.length : 0;
  return { profile: { name, avatar }, progress: [...byChapter.values()], skipped, notMigrated, oldAttempts };
}

async function applyMigration(plan, databaseUrl) {
  const pool = new pg.Pool({ connectionString: databaseUrl });
  try {
    const { rows } = await pool.query(
      "INSERT INTO profiles (name, avatar) VALUES ($1, $2) RETURNING id",
      [plan.profile.name, plan.profile.avatar],
    );
    const profileId = rows[0].id;
    for (const p of plan.progress) {
      await pool.query(
        `INSERT INTO chapter_progress (profile_id, chapter_id, status, state, notes)
         VALUES ($1, $2, $3, NULL, '[]'::jsonb)
         ON CONFLICT (profile_id, chapter_id) DO UPDATE SET status = EXCLUDED.status`,
        [profileId, p.chapterId, p.status],
      );
    }
    return profileId;
  } finally {
    await pool.end();
  }
}

function syntheticBackup() {
  return {
    format: "lernen-backup",
    version: 1,
    exported_at: new Date().toISOString(),
    app: "Lernen (legacy Vite/Tauri)",
    tables: {
      decks: [{ id: 1, name: "Sintetis", level: "A1", topic: "uji", kind: "vocab" }],
      entries: [],
      cards: [],
      srs_state: [],
      attempts: [{ id: 1, ts: "2026-01-01T00:00:00Z", kind: "drill", item_id: 1, correct: 1 }],
      drills: [],
      lesson_progress: [
        { id: 1, unit_no: 1, lesson_no: 1, state: "done", score: 90 },
        { id: 2, unit_no: 2, lesson_no: 1, state: "locked", score: null },
        { id: 3, unit_no: 99, lesson_no: 1, state: "done", score: 50 },
      ],
      texts: [],
      reading_log: [],
      progress_daily: [],
      saved_from_chat: [],
      config: [{ key: "backup_dir", value: "/tmp/sintetis" }],
      lesson_drafts: [{ key: "lesson_1_1", payload: '{"step":2}', updated_at: "2026-01-01T00:00:00Z" }],
    },
  };
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log("Pakai: DATABASE_URL=... node scripts/migrate-legacy.mjs --backup <file.json> --name \"Rina\" [--avatar player-01] [--dry-run]");
  console.log("Uji sintetis: node scripts/migrate-legacy.mjs --synthetic-test");
  process.exit(0);
}

if (args.syntheticTest) {
  const payload = syntheticBackup();
  writeFileSync("/tmp/lernen-backup-sintetis.json", JSON.stringify(payload, null, 2));
  console.log("[synthetic] backup sintetis ditulis ke /tmp/lernen-backup-sintetis.json");
  const plan = planMigration(validateBackup(payload), "Rina", "player-01");
  console.log("[synthetic] rencana:", JSON.stringify(plan, null, 2));
  const expectProgress = plan.progress.length === 2 && plan.progress.every((p) => ["bab01", "bab02"].includes(p.chapterId));
  const expectSkipped = plan.skipped.length === 1;
  const expectNotMigrated = plan.notMigrated.includes("lesson_drafts") && plan.notMigrated.includes("decks");
  if (!expectProgress || !expectSkipped || !expectNotMigrated) {
    console.error("[synthetic] GAGAL: pemetaan tidak sesuai harapan.");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.log("[synthetic] OK (validasi pemetaan saja; tanpa DATABASE_URL tidak ada penulisan DB).");
    process.exit(0);
  }
  const profileId = await applyMigration(plan, process.env.DATABASE_URL);
  console.log(`[synthetic] OK: profil ${profileId} dibuat, ${plan.progress.length} baris chapter_progress ditulis.`);
  process.exit(0);
}

if (!args.backup || !args.name) {
  console.error("Wajib: --backup <file.json> --name \"Nama\"");
  process.exit(1);
}
const payload = validateBackup(JSON.parse(readFileSync(args.backup, "utf8")));
const plan = planMigration(payload, args.name, args.avatar ?? "player-01");
console.log("[migrasi] rencana:", JSON.stringify(plan, null, 2));
if (args.dryRun) {
  console.log("[migrasi] --dry-run: tidak ada penulisan DB.");
  process.exit(0);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL wajib diisi (lihat .env.example).");
  process.exit(1);
}
const profileId = await applyMigration(plan, process.env.DATABASE_URL);
console.log(`[migrasi] selesai: profil ${profileId} dibuat. File backup tidak diubah.`);
