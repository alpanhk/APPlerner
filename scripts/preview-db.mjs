// Postgres terisolasi untuk preview Lernen (Next.js + Drizzle).
//
// Menyalakan Postgres tertanam (embedded-postgres, biner dari npm) di
// port 5433 dengan direktori data di /tmp/lernen-preview-pg-data, lalu
// mencetak DATABASE_URL yang siap dipakai. Proses ini harus tetap berjalan
// selama preview/dev. Jangan memasukkan kredensial ke Git.
//
// Pakai:
//   npm run preview:db
// lalu di terminal lain:
//   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5433/app_db npm run db:push
//   DATABASE_URL=... npm run dev
//
// Kredensial di bawah hanya untuk preview lokal terisolasi, bukan produksi.

import EmbeddedPostgres from "embedded-postgres";

const PORT = Number(process.env.PREVIEW_PG_PORT ?? 5433);
const USER = "postgres";
const PASSWORD = "postgres";
const DB_NAME = "app_db";
const DATA_DIR = process.env.PREVIEW_PG_DATA ?? "/tmp/lernen-preview-pg-data";

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

try {
  await pg.initialise();
} catch (e) {
  // initialise() gagal bila direktori sudah berisi data yang valid;
  // lanjutkan ke start() dalam kasus itu.
  if (!String(e?.message ?? e).includes("already exists")) {
    // Bukan error "sudah ada" — tampilkan tetapi tetap coba start.
    console.warn("[preview-db] initialise:", e?.message ?? e);
  }
}
await pg.start();
try {
  await pg.createDatabase(DB_NAME);
} catch {
  // Database sudah ada — tidak masalah.
}
const url = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DB_NAME}`;
console.log(`[preview-db] Postgres terisolasi berjalan di port ${PORT}`);
console.log(`[preview-db] DATABASE_URL=${url}`);
console.log("[preview-db] Biarkan proses ini berjalan selama preview/dev. Ctrl+C untuk berhenti.");
console.log("[preview-db] Terapkan skema dengan: npm run db:push (dengan DATABASE_URL di atas)");

const stop = async () => {
  console.log("[preview-db] menghentikan…");
  try {
    await pg.stop();
  } finally {
    process.exit(0);
  }
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
