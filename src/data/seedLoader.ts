import Database from "@tauri-apps/plugin-sql";
import { ensureCards } from "../srs/cards";
import baselineRaw from "./seed/seed_v11_manifest.json";
import provenanceRaw from "./provenance/seed_v11_fields.json";

// Alur seed PRD §9: konten JSON dibundel → di-import idempotent → SQLite.
// Marker versi disimpan di tabel `config`; bila versi sudah sama, tak di-impor ulang.
const DB_URL = "sqlite:lernen.db";
const SEED_KEY = "seed_version";
const SEED_VERSION = 12;
const CONTENT_MARKER = "seed_v12_content_v1";

// Kunci konten yang sudah ada pada seed v11 (HEAD c45e0dd). Dipakai saat
// upgrade dari instalasi lama yang belum punya snapshot: item baseline yang
// hilang berarti dihapus pengguna (jangan dihidupkan lagi), item di luar
// baseline berarti konten baru (harus dipasang).
export type SeedBaseline = {
  words: string[];
  texts: [string, string, string][];
};

// Nilai konten v11 yang benar-benar dikirim ke pengguna. Dipakai hanya untuk
// profil lama yang belum punya snapshot: field yang masih sama dengan v11
// dianggap belum disunting sehingga boleh diperkaya, field yang berbeda
// dipertahankan sebagai suntingan pengguna.
// field_order: [article, plural, example_de, example_id]
export type SeedProvenance = {
  source?: string;
  words: Record<string, [string | null, string | null, string | null, string | null]>;
  texts: Record<string, string>;
};

const SEED_BASELINE = baselineRaw as unknown as SeedBaseline;
const SEED_PROVENANCE = provenanceRaw as unknown as SeedProvenance;
const PROVENANCE_FIELDS = ["article", "plural", "example_de", "example_id"] as const;

const empty = (value: string | null | undefined): string | null =>
  value === undefined || value === null || value === "" ? null : value;

type SeedWord = {
  kind: string;
  de: string;
  article: string | null;
  plural: string | null;
  meaning_id: string;
  example_de: string | null;
  example_id: string | null;
  tags: string;
};

type SeedFile = {
  unit: number;
  level: string;
  theme: string;
  source: string;
  seed_version: number;
  words: SeedWord[];
};

// Semua berkas seed kata dimuat otomatis: menambah level/unit cukup dengan
// menaruh words_<level>_unit<N>.json di src/data/seed/.
const wordModules = import.meta.glob<SeedFile>("./seed/words_*.json", {
  eager: true,
  import: "default",
});
const SEEDS: SeedFile[] = Object.values(wordModules).sort((a, b) => a.unit - b.unit);

type SeedText = {
  title: string;
  level: string;
  tags: string;
  sentences: { de: string; id: string }[];
};

type SeedTextFile = { level: string; source: string; texts: SeedText[] };

const textModules = import.meta.glob<SeedTextFile>("./reading/texts_*.json", {
  eager: true,
  import: "default",
});
const TEXT_SEEDS: SeedText[] = Object.values(textModules).flatMap((f) => f.texts);

// Seed teks F4 idempotent: dicocokkan pada judul + level + tag seed.
// Bersihkan duplikat lama (double-invoke dev) sebelum memeriksa seed baru.
export async function ensureTexts(
  db: Database,
  texts: SeedText[] = TEXT_SEEDS,
  baseline: SeedBaseline = SEED_BASELINE,
  provenance: SeedProvenance = SEED_PROVENANCE,
): Promise<number> {
  const status = await db.select<{ key: string; value: string }[]>("SELECT key,value FROM config WHERE key IN ('seed_version','seed_text_snapshot_v1','seed_v12_content_v1')");
  const installed = Number(status.find((row) => row.key === "seed_version")?.value ?? 0);
  const verified = status.some((row) => row.key === CONTENT_MARKER);
  const repairNewContent = installed >= SEED_VERSION && !verified;
  let previous: Record<string, string> | null = null;
  const saved = status.find((row) => row.key === "seed_text_snapshot_v1")?.value;
  if (saved) {
    try {
      const parsed = JSON.parse(saved) as Record<string, string>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bukan objek");
      // Snapshot kosong (profil v12 bermasalah) diperlakukan seperti tidak ada,
      // tetapi item baseline tetap dianggap sudah pernah dikirim.
      previous = Object.keys(parsed).length > 0 ? parsed : null;
    }
    catch { throw new Error("Metadata konten bacaan rusak; pembaruan otomatis dibatalkan."); }
  }
  const baselineKeys = new Set(baseline.texts.map(([title, level, tags]) => JSON.stringify([title, level, tags])));
  const snapshot: Record<string, string> = { ...(previous ?? {}) };
  await db.execute(
    "UPDATE reading_log SET text_id = (SELECT MIN(keeper.id) FROM texts current " +
      "JOIN texts keeper ON keeper.title = current.title AND keeper.level = current.level AND keeper.tags = current.tags AND keeper.body_json = current.body_json " +
      "WHERE current.id = reading_log.text_id) " +
      "WHERE text_id IN (SELECT id FROM texts WHERE tags LIKE 'seed%')",
  );
  await db.execute(
    "DELETE FROM texts WHERE tags LIKE 'seed%' AND id NOT IN (" +
      "SELECT MIN(id) FROM texts WHERE tags LIKE 'seed%' GROUP BY title, level, tags, body_json)",
  );

  let added = 0;
  for (const t of texts) {
    const key = JSON.stringify([t.title, t.level, t.tags]);
    const body = JSON.stringify(t.sentences);
    snapshot[key] = body;
    const found = await db.select<{ id: number; body_json: string }[]>(
      "SELECT id,body_json FROM texts WHERE title = $1 AND level = $2 AND tags = $3 LIMIT 1",
      [t.title, t.level, t.tags],
    );
    if (found.length > 0) {
      if (previous && previous[key] !== undefined && found[0].body_json === previous[key] && previous[key] !== body) {
        await db.execute("UPDATE texts SET body_json = $1 WHERE id = $2", [body, found[0].id]);
      } else if (!previous && installed > 0) {
        // Profil v11 tanpa snapshot: perbarui hanya bila isi masih persis
        // seperti yang dikirim v11. Suntingan pengguna tidak disentuh.
        const shipped = provenance.texts?.[key];
        if (shipped !== undefined && found[0].body_json === shipped && shipped !== body) {
          await db.execute("UPDATE texts SET body_json = $1 WHERE id = $2", [body, found[0].id]);
        }
      }
      continue;
    }
    const isOldContent = previous
      ? Object.prototype.hasOwnProperty.call(previous, key)
      : installed > 0 && baselineKeys.has(key);
    // Profil v12 yang sempat menulis snapshot lengkap tetapi isinya belum
    // terpasang: konten di luar baseline v11 adalah konten baru, bukan hapusan.
    const repair = repairNewContent && !baselineKeys.has(key);
    // A missing previously seeded text is a user deletion, not a fresh item.
    if (isOldContent && !repair) continue;
    await db.execute(
      "INSERT INTO texts (title, level, body_json, tags) VALUES ($1,$2,$3,$4)",
      [t.title, t.level, body, t.tags],
    );
    added += 1;
  }
  await db.execute("INSERT INTO config(key,value) VALUES ('seed_text_snapshot_v1',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [JSON.stringify(snapshot)]);
  return added;
}

export default function initDatabase(): Promise<string> {
  if (!initPromise) initPromise = runInit();
  return initPromise;
}

// Guard anti double-invoke (React StrictMode/HMR) — cegah seed ganda.
let initPromise: Promise<string> | null = null;

// A snapshot of the previous shipped values lets updates preserve user edits
// and deleted entries while still applying corrections to untouched fields.
export async function syncSeedWords(
  db: Database,
  installed: number,
  seeds: SeedFile[] = SEEDS,
  baseline: SeedBaseline = SEED_BASELINE,
  provenance: SeedProvenance = SEED_PROVENANCE,
): Promise<number> {
  const saved = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = 'seed_word_snapshot_v1'");
  const marker = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = $1", [CONTENT_MARKER]);
  const repairNewContent = installed >= SEED_VERSION && marker.length === 0;
  let previous: Record<string, SeedWord> | null = null;
  if (saved.length) {
    try {
      const parsed = JSON.parse(saved[0].value) as Record<string, SeedWord>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bukan objek");
      // Snapshot kosong (profil v12 bermasalah) diperlakukan seperti tidak ada,
      // sehingga konten baru tetap dipasang tanpa menghidupkan hapusan lama.
      previous = Object.keys(parsed).length > 0 ? parsed : null;
    }
    catch { throw new Error("Metadata kosakata rusak; pembaruan otomatis dibatalkan."); }
  }
  const baselineWords = new Set(baseline.words);
  const current = await db.select<SeedWord[]>("SELECT kind,de,article,plural,meaning_id,example_de,example_id,tags FROM entries");
  const byWord = new Map(current.map((word) => [word.de, word]));
  const next: Record<string, SeedWord> = { ...(previous ?? {}) };
  const firstForWord = new Map<string, SeedWord>();
  for (const seed of seeds) for (const word of seed.words) if (!firstForWord.has(word.de)) firstForWord.set(word.de, word);
  let changed = 0;
  for (const word of firstForWord.values()) {
    const old = previous?.[word.de];
    const existing = byWord.get(word.de);
    if (!existing) {
      // Missing item: if it was already shipped before, the user deleted it.
      // Otherwise it is genuinely new content and must be installed. Profil v12
      // yang snapshot-nya lengkap tetapi konten baru belum terpasang diperbaiki
      // selama marker verifikasi belum ada.
      const isOldContent = previous ? !!old : installed > 0 && baselineWords.has(word.de);
      const isFreshInstall = installed === 0 && !previous;
      const repair = repairNewContent && !baselineWords.has(word.de);
      if (!isOldContent || isFreshInstall || repair) {
        await db.execute("INSERT OR IGNORE INTO entries (kind,de,article,plural,meaning_id,example_de,example_id,tags,audio_ok) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0)",
          [word.kind, word.de, word.article, word.plural, word.meaning_id, word.example_de, word.example_id, word.tags]);
        changed++;
      }
    } else if (old && existing.tags === old.tags) {
      const fields = ["kind", "article", "plural", "meaning_id", "example_de", "example_id", "tags"] as const;
      const merged = { ...existing };
      for (const field of fields) {
        if (existing[field] === old[field]) (merged as Record<string, unknown>)[field] = word[field];
      }
      if (fields.some((field) => merged[field] !== existing[field])) {
        await db.execute("UPDATE entries SET kind=$1,article=$2,plural=$3,meaning_id=$4,example_de=$5,example_id=$6,tags=$7 WHERE de=$8",
          [merged.kind, merged.article, merged.plural, merged.meaning_id, merged.example_de, merged.example_id, merged.tags, word.de]);
        changed++;
      }
    } else if (!old) {
      // Profil lama tanpa snapshot field-level: hanya isi/ perbaiki field yang
      // masih persis sama dengan nilai v11 yang dikirim. Field yang sudah
      // berbeda adalah suntingan pengguna dan tidak disentuh. Field kosong
      // boleh diperkaya; field yang sudah berisi tidak pernah dikosongkan.
      const shipped = provenance.words?.[word.de];
      if (shipped) {
        const merged = { ...existing };
        let touched = false;
        PROVENANCE_FIELDS.forEach((field, index) => {
          const baselineValue = shipped[index] ?? null;
          const nextValue = empty(word[field]);
          if (empty(existing[field]) === baselineValue && nextValue !== null && nextValue !== baselineValue) {
            (merged as Record<string, unknown>)[field] = word[field];
            touched = true;
          }
        });
        if (touched) {
          await db.execute("UPDATE entries SET article=$1,plural=$2,example_de=$3,example_id=$4 WHERE de=$5",
            [merged.article, merged.plural, merged.example_de, merged.example_id, word.de]);
          changed++;
        }
      }
    }
    next[word.de] = word;
  }
  await db.execute("INSERT INTO config(key,value) VALUES ('seed_word_snapshot_v1',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [JSON.stringify(next)]);
  return changed;
}

async function runInit(): Promise<string> {
  const db = await Database.load(DB_URL);
  const integrity = await db.select<{ integrity_check: string }[]>("PRAGMA integrity_check");
  if (integrity[0]?.integrity_check?.toLowerCase() !== "ok") throw new Error("Pemeriksaan integritas database gagal.");
  await ensureTexts(db);

  // Install core auxiliaries once without reintroducing entries deleted later.
  const coreMarker = await db.select<{ value: string }[]>("SELECT value FROM config WHERE key = 'core_auxiliaries_v1'");
  if (!coreMarker.length) {
    await db.execute("INSERT OR IGNORE INTO entries (kind,de,meaning_id,tags) VALUES ('verb','sein','menjadi; berada','a1,verba-inti')");
    await db.execute("INSERT OR IGNORE INTO entries (kind,de,meaning_id,tags) VALUES ('verb','haben','memiliki','a1,verba-inti')");
    await db.execute("INSERT INTO config (key,value) VALUES ('core_auxiliaries_v1','1') ON CONFLICT(key) DO NOTHING");
  }

  const rows = await db.select<{ key: string; value: string }[]>(
    "SELECT key, value FROM config WHERE key = $1",
    [SEED_KEY],
  );
  const installed = rows.length > 0 ? Number(rows[0].value) : 0;

  const count = await syncSeedWords(db, installed);

  await db.execute(
    "INSERT INTO config (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [SEED_KEY, String(Math.max(installed, SEED_VERSION))],
  );

  await ensureCards(db);

  // Marker ditulis hanya setelah kata dan teks selesai tanpa error. Selama
  // marker belum ada, konten baru yang hilang boleh diperbaiki sekali.
  await db.execute(
    "INSERT INTO config (key, value) VALUES ($1, '1') ON CONFLICT(key) DO NOTHING",
    [CONTENT_MARKER],
  );

  const texts = await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM texts");
  const cards = await db.select<{ n: number }[]>("SELECT COUNT(*) n FROM cards");
  return (
    "seed v" + SEED_VERSION + " diterapkan (" + count + " kata diproses, " + (cards[0]?.n ?? 0) + " kartu) · " +
    (texts[0]?.n ?? 0) + " teks"
  );
}
