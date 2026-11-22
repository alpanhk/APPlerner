// Lernen — aplikasi belajar bahasa Jerman (PRD-DEU-001).
// Rust core: registrasi plugin + migrasi SQLite (§9 PRD, versioned & idempotent),
// plus perintah backup JSON (F6) ke folder "Dokumen\Lernen Backups".

use std::collections::HashSet;
use std::fs;
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, UNIX_EPOCH};

use tauri::Manager;
use tauri_plugin_sql::{Migration, MigrationKind};

// ---- Migrasi v1: tabel inti PRD §9 -----------------------------------------
const MIGRATION_V1: &str = r#"
CREATE TABLE decks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  level TEXT,
  topic TEXT,
  kind TEXT NOT NULL DEFAULT 'vocab',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (name, level, topic)
);

CREATE TABLE entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  de TEXT NOT NULL UNIQUE,
  article TEXT,
  plural TEXT,
  forms_json TEXT,
  meaning_id TEXT NOT NULL,
  example_de TEXT,
  example_id TEXT,
  tags TEXT,
  audio_ok INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES entries(id),
  type TEXT NOT NULL,
  deck_id INTEGER REFERENCES decks(id),
  UNIQUE (entry_id, type, deck_id)
);

CREATE TABLE srs_state (
  card_id INTEGER PRIMARY KEY REFERENCES cards(id),
  due TEXT NOT NULL,
  stability REAL NOT NULL DEFAULT 0,
  difficulty REAL NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  lapses INTEGER NOT NULL DEFAULT 0,
  last_grade TEXT
);

CREATE TABLE attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  kind TEXT NOT NULL,
  item_id INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  ms INTEGER,
  drill_code TEXT
);

CREATE TABLE drills (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  item_source TEXT,
  lesson_ref TEXT
);

CREATE TABLE lesson_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unit_no INTEGER NOT NULL,
  lesson_no INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'locked',
  score REAL,
  finished_at TEXT,
  UNIQUE (unit_no, lesson_no)
);

CREATE TABLE texts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  body_json TEXT NOT NULL,
  tags TEXT
);

CREATE TABLE reading_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text_id INTEGER NOT NULL REFERENCES texts(id),
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  words_saved INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE progress_daily (
  date TEXT PRIMARY KEY,
  minutes INTEGER NOT NULL DEFAULT 0,
  cards_done INTEGER NOT NULL DEFAULT 0,
  drills_done INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE saved_from_chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  phrase TEXT NOT NULL,
  meaning TEXT,
  source TEXT
);

CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE INDEX idx_srs_state_due ON srs_state (due);
CREATE INDEX idx_entries_kind ON entries (kind);
CREATE INDEX idx_cards_deck ON cards (deck_id);
CREATE INDEX idx_attempts_ts ON attempts (ts);
CREATE INDEX idx_texts_level ON texts (level);
"#;

// ---- Migrasi v2: dukungan FSRS penuh & kunci item drill (M1) ----------------
const MIGRATION_V2: &str = r#"
ALTER TABLE srs_state ADD COLUMN state TEXT NOT NULL DEFAULT 'new';
ALTER TABLE srs_state ADD COLUMN last_review TEXT;
ALTER TABLE attempts ADD COLUMN item_key TEXT;
CREATE INDEX idx_attempts_drill ON attempts (drill_code, ts);
"#;

// ---- Migrasi v3: identitas sesi, objective, dan draft SQLite (DB-02/DB-03) --
const MIGRATION_V3: &str = r#"
ALTER TABLE attempts ADD COLUMN session_id TEXT;
ALTER TABLE attempts ADD COLUMN objective_id TEXT;
CREATE INDEX idx_attempts_session ON attempts (session_id, item_key);
CREATE UNIQUE INDEX idx_attempts_session_item ON attempts (session_id, item_key) WHERE session_id IS NOT NULL AND item_key IS NOT NULL;
CREATE TABLE lesson_drafts (
  key TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
"#;

// ---- Migrasi v4 (F1-GAP-01): grade review SRS ikut tersimpan di attempts ----
// PRD:283 meminta pasangan (timestamp, grade) pada ledger attempt. Kolom baru
// nullable agar backup lama tanpa grade tetap dapat direstore. Down migration
// disediakan untuk pembuktian reversibilitas pada DB uji terisolasi.
const MIGRATION_V4: &str = r#"
ALTER TABLE attempts ADD COLUMN grade TEXT;
"#;
#[allow(dead_code)] // dipakai pembuktian reversibilitas pada tes DB terisolasi
const MIGRATION_V4_DOWN: &str = r#"
ALTER TABLE attempts DROP COLUMN grade;
"#;

// Satu-satunya daftar migrasi untuk jalur aplikasi normal. Jalur recovery
// memakai konstanta yang sama; keduanya harus aktif agar save_review_atomic
// tidak menulis ke skema lama yang belum punya attempts.grade.
fn sql_migrations() -> Vec<Migration> {
    vec![
        Migration {
            version: 1,
            description: "tabel inti PRD section 9",
            sql: MIGRATION_V1,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "FRS state penuh + item drill (M1)",
            sql: MIGRATION_V2,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "identitas sesi + draft SQLite (DB-03)",
            sql: MIGRATION_V3,
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "grade review SRS pada attempts (F1-GAP-01)",
            sql: MIGRATION_V4,
            kind: MigrationKind::Up,
        },
    ]
}

// ---- Backup JSON (F6): tulis/baca file di "Dokumen\Lernen Backups" ----------
const BACKUP_PREFIX: &str = "lernen-backup-";

#[derive(serde::Serialize)]
struct BackupEntry {
    name: String,
    path: String,
    size: u64,
    modified_ms: u64,
}

fn probe_backup_dir_writable(dir: &Path) -> std::io::Result<()> {
    let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos()).unwrap_or(0);
    let probe = dir.join(format!(".lernen-write-probe-{}-{stamp}", std::process::id()));
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&probe)?;
    file.write_all(b"ok")?;
    file.sync_all()?;
    drop(file);
    fs::remove_file(&probe)
}

fn backups_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    // Urutan: Dokumen (paling mudah ditemukan pengguna) → folder data aplikasi
    // → Documents di home. Sebagian mesin memakai Dokumen ter-redirect OneDrive
    // yang belum ada, sehingga create_dir_all bisa gagal — jangan sampai
    // fitur backup mati karena itu.
    let mut candidates: Vec<PathBuf> = Vec::new();
    if let Ok(docs) = app.path().document_dir() {
        candidates.push(docs.join("Lernen Backups"));
    }
    if let Ok(data) = app.path().app_data_dir() {
        candidates.push(data.join("Backups"));
    }
    if let Ok(home) = app.path().home_dir() {
        candidates.push(home.join("Documents").join("Lernen Backups"));
    }

    let mut tried: Vec<String> = Vec::new();
    for dir in candidates {
        // U-03: create_dir_all saja tidak cukup — folder Dokumen yang di-redirect
        // OneDrive bisa terbentuk tetapi tidak bisa ditulis. Uji tulis nyata
        // sebelum memilih folder, lalu lanjut ke kandidat berikutnya.
        match fs::create_dir_all(&dir).and_then(|_| probe_backup_dir_writable(&dir)) {
            Ok(_) => return Ok(dir),
            Err(e) => tried.push(format!("{} ({e})", dir.display())),
        }
    }
    Err(format!(
        "tidak bisa membuat folder backup. Dicoba: {}",
        tried.join(" | ")
    ))
}

// Nama file dibuat oleh frontend; di sini hanya diizinkan bentuk yang aman
// (tanpa separator path) agar tidak bisa menulis ke luar folder backup.
fn valid_backup_name(name: &str) -> bool {
    name.starts_with(BACKUP_PREFIX)
        && name.ends_with(".json")
        && name.len() <= 120
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.' | ':'))
}

fn entry_of(path: &PathBuf) -> Result<BackupEntry, String> {
    let meta = fs::metadata(path).map_err(|e| e.to_string())?;
    let modified_ms = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0);
    Ok(BackupEntry {
        name: path
            .file_name()
            .and_then(|s| s.to_str())
            .unwrap_or_default()
            .to_string(),
        path: path.display().to_string(),
        size: meta.len(),
        modified_ms,
    })
}

fn is_backup_file(path: &PathBuf) -> bool {
    path.file_name()
        .and_then(|s| s.to_str())
        .map(|n| n.starts_with(BACKUP_PREFIX) && n.ends_with(".json"))
        .unwrap_or(false)
}

// Rotasi PRD F6: simpan 4 backup otomatis terakhir, 3 pra-restore terakhir.
fn prune_kind(dir: &PathBuf, suffix: &str, keep: usize) {
    let entries = match fs::read_dir(dir) {
        Ok(rd) => rd,
        Err(_) => return,
    };
    let mut files: Vec<(u64, PathBuf)> = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .filter(|p| {
            is_backup_file(p)
                && p.file_name()
                    .and_then(|s| s.to_str())
                    .map(|n| n.ends_with(suffix))
                    .unwrap_or(false)
        })
        .map(|p| {
            let ms = fs::metadata(&p)
                .ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);
            (ms, p)
        })
        .collect();
    files.sort_by(|a, b| b.0.cmp(&a.0));
    for (_, path) in files.into_iter().skip(keep) {
        let _ = fs::remove_file(path);
    }
}

// Folder aktif: pilihan pengguna (path absolut) bila ada, jika tidak folder default.
fn resolve_dir(app: &tauri::AppHandle, custom: Option<String>) -> Result<PathBuf, String> {
    match custom {
        Some(raw) if !raw.trim().is_empty() => {
            let candidate = PathBuf::from(raw.trim());
            if !candidate.is_absolute() {
                return Err(
                    "folder backup harus berupa path absolut, mis. D:\\Backup Lernen".into(),
                );
            }
            fs::create_dir_all(&candidate)
                .and_then(|_| probe_backup_dir_writable(&candidate))
                .map_err(|_| "Folder backup tidak dapat ditulis. Periksa izin atau pilih folder lain.".to_string())?;
            Ok(candidate)
        }
        _ => backups_dir(app),
    }
}

#[tauri::command]
fn backup_write(
    app: tauri::AppHandle,
    name: String,
    content: String,
    dir: Option<String>,
) -> Result<BackupEntry, String> {
    if !valid_backup_name(&name) {
        return Err(format!("nama file backup tidak valid: {name}"));
    }
    let folder = resolve_dir(&app, dir)?;
    let path = folder.join(&name);
    write_backup_atomic(&path, &content)?;
    if name.ends_with("-auto.json") {
        prune_kind(&folder, "-auto.json", 4);
    } else if name.ends_with("-pre-restore.json") {
        prune_kind(&folder, "-pre-restore.json", 3);
    }
    entry_of(&path)
}

// Tulis ke file sementara di folder yang sama lalu rename, sehingga pembaca
// tidak pernah melihat backup setengah jadi dengan nama final.
fn write_backup_atomic(path: &Path, content: &str) -> Result<(), String> {
    let file_name = path.file_name().and_then(|v| v.to_str()).ok_or("nama backup tidak valid")?;
    // First run pada profil kosong: folder induk bisa belum ada walaupun
    // resolve_dir sudah mencoba membuatnya (path Dokumen ter-redirect).
    // Pastikan induk ada sebelum create_new, dan jangan menampilkan "os error 2".
    if let Some(parent) = path.parent().filter(|p| !p.as_os_str().is_empty()) {
        fs::create_dir_all(parent).map_err(|_| {
            format!("Folder backup belum dapat disiapkan di {}. Periksa izin atau lokasi folder backup.", parent.display())
        })?;
    }
    // Nama sementara unik per proses+waktu: tidak bisa bertabrakan dengan sisa
    // tmp dari percobaan sebelumnya (penyebab create_new gagal pada first-run).
    let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos()).unwrap_or(0);
    let tmp = path.with_file_name(format!(".{file_name}.{}.{stamp}.tmp", std::process::id()));
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&tmp)
        .map_err(|_| "Backup belum dapat dibuat. Periksa izin folder backup lalu coba lagi.".to_string())?;
    if let Err(error) = file.write_all(content.as_bytes()).and_then(|_| file.sync_all()) {
        drop(file);
        let _ = fs::remove_file(&tmp);
        let _ = error;
        return Err("Backup belum selesai ditulis. Data belajar tetap aman; coba lagi.".to_string());
    }
    drop(file);
    // Windows menolak rename menimpa file yang sudah ada. Hapus file lama
    // hanya setelah tmp lengkap terverifikasi, lalu publikasikan.
    if path.exists() {
        let _ = fs::remove_file(path);
    }
    fs::rename(&tmp, path).map_err(|_| {
        let _ = fs::remove_file(&tmp);
        "Backup belum dapat disimpan. Data belajar tetap aman; coba lagi.".to_string()
    })
}

#[tauri::command]
async fn backup_export_snapshot(app: tauri::AppHandle) -> Result<serde_json::Value, String> {
    let instances = app.state::<tauri_plugin_sql::DbInstances>();
    let guard = instances.0.read().await;
    let pool = match guard.get("sqlite:lernen.db") { Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => pool, _ => return Err("Database belum siap".into()) };
    export_tables_to_json(pool).await
}

// Satu read-transaction untuk semua tabel: backup tidak mencampur state
// sebelum/sesudah jawaban yang ditulis bersamaan.
async fn export_tables_to_json(pool: &sqlx::SqlitePool) -> Result<serde_json::Value, String> {
    use sqlx::{Column, Row, ValueRef};
    let names = ["decks", "entries", "cards", "srs_state", "attempts", "drills", "lesson_progress", "texts", "reading_log", "progress_daily", "saved_from_chat", "config", "lesson_drafts"];
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut map = serde_json::Map::new();
    for name in names {
        let rows = sqlx::query(&format!("SELECT * FROM {name}")).fetch_all(&mut *tx).await
            .map_err(|e| format!("Tabel {name}: {e}"))?;
        let mut output = Vec::with_capacity(rows.len());
        for row in rows {
            let mut fields = serde_json::Map::new();
            for (index, column) in row.columns().iter().enumerate() {
                let raw = row.try_get_raw(index).map_err(|e| e.to_string())?;
                let value = if raw.is_null() {
                    serde_json::Value::Null
                } else if let Ok(value) = row.try_get::<i64, _>(index) {
                    serde_json::json!(value)
                } else if let Ok(value) = row.try_get::<f64, _>(index) {
                    serde_json::json!(value)
                } else if let Ok(value) = row.try_get::<String, _>(index) {
                    serde_json::json!(value)
                } else {
                    return Err(format!("Kolom {name}.{} memiliki tipe yang belum didukung backup", column.name()));
                };
                fields.insert(column.name().to_string(), value);
            }
            output.push(serde_json::Value::Object(fields));
        }
        map.insert(name.to_string(), serde_json::Value::Array(output));
    }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(serde_json::Value::Object(map))
}

#[tauri::command]
fn backup_list(app: tauri::AppHandle, dir: Option<String>) -> Result<Vec<BackupEntry>, String> {    let folder = resolve_dir(&app, dir)?;
    let mut items: Vec<BackupEntry> = match fs::read_dir(&folder) {
        Ok(rd) => rd
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| is_backup_file(p))
            .filter_map(|p| entry_of(&p).ok())
            .collect(),
        Err(e) => return Err(format!("gagal membaca folder backup: {e}")),
    };
    items.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));
    Ok(items)
}

#[tauri::command]
fn backup_read(
    app: tauri::AppHandle,
    name: String,
    dir: Option<String>,
) -> Result<String, String> {
    if !valid_backup_name(&name) {
        return Err(format!("nama file backup tidak valid: {name}"));
    }
    let path = resolve_dir(&app, dir)?.join(&name);
    fs::read_to_string(&path).map_err(|e| format!("gagal membaca backup: {e}"))
}

#[tauri::command]
fn backup_dir_path(app: tauri::AppHandle, dir: Option<String>) -> Result<String, String> {
    Ok(resolve_dir(&app, dir)?.display().to_string())
}

#[tauri::command]
fn backup_open_folder(app: tauri::AppHandle, dir: Option<String>) -> Result<String, String> {
    let folder = resolve_dir(&app, dir)?;
    std::process::Command::new("explorer")
        .arg(folder.as_os_str())
        .spawn()
        .map_err(|e| format!("gagal membuka Explorer: {e}"))?;
    Ok(folder.display().to_string())
}

#[tauri::command]
fn app_database_path(app: tauri::AppHandle) -> Result<String, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    Ok(dir.join("lernen.db").display().to_string())
}

// Restore uses one SQLite connection and rolls back automatically on any error.
#[tauri::command]
async fn backup_restore_atomic(app: tauri::AppHandle, tables: serde_json::Value) -> Result<usize, String> {
    let instances = app.state::<tauri_plugin_sql::DbInstances>();
    let guard = instances.0.read().await;
    let pool = match guard.get("sqlite:lernen.db") { Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => pool, _ => return Err("Database belum siap".into()) };
    restore_tables(pool, tables).await
}

#[derive(serde::Deserialize)]
struct ReviewState {
    card_id: i64, due: String, stability: f64, difficulty: f64, reps: i64,
    lapses: i64, last_grade: String, state: String, last_review: String,
}

#[tauri::command]
async fn save_review_atomic(app: tauri::AppHandle, row: ReviewState, correct: bool, ms: i64, ts: String) -> Result<(), String> {
    let instances = app.state::<tauri_plugin_sql::DbInstances>();
    let guard = instances.0.read().await;
    let pool = match guard.get("sqlite:lernen.db") { Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => pool, _ => return Err("Database belum siap".into()) };
    save_review_to_pool(pool, row, correct, ms, ts).await
}

async fn save_review_to_pool(pool: &sqlx::SqlitePool, row: ReviewState, correct: bool, ms: i64, ts: String) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    sqlx::query("INSERT INTO srs_state (card_id,due,stability,difficulty,reps,lapses,last_grade,state,last_review) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(card_id) DO UPDATE SET due=excluded.due,stability=excluded.stability,difficulty=excluded.difficulty,reps=excluded.reps,lapses=excluded.lapses,last_grade=excluded.last_grade,state=excluded.state,last_review=excluded.last_review")
        .bind(row.card_id).bind(row.due).bind(row.stability).bind(row.difficulty).bind(row.reps).bind(row.lapses).bind(row.last_grade.clone()).bind(row.state).bind(row.last_review)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("INSERT INTO attempts (ts,kind,item_id,correct,ms,drill_code,grade) VALUES (?,'srs',?,?,?,NULL,?)")
        .bind(ts).bind(row.card_id).bind(if correct {1i64} else {0}).bind(ms.max(0)).bind(row.last_grade.clone())
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())
}

#[derive(serde::Deserialize)]
struct CheckpointPayload {
    unit_no: i64,
    lesson_no: i64,
    state: String,
    score: f64,
    finished_at: String,
    snapshot_json: String,
}

#[derive(serde::Deserialize)]
struct AttemptPayload {
    ts: String,
    kind: String,
    item_id: i64,
    correct: bool,
    ms: i64,
    drill_code: Option<String>,
    item_key: Option<String>,
    session_id: Option<String>,
    objective_id: Option<String>,
    draft_key: String,
    draft_json: String,
    updated_at: String,
}

// DB-02/DB-03: lesson_progress + snapshot objective_result adalah satu unit.
// Skor terbaik/ever_passed dipertahankan terpisah dari percobaan terkini.
#[tauri::command]
async fn save_checkpoint_result(app: tauri::AppHandle, payload: serde_json::Value) -> Result<serde_json::Value, String> {
    let data: CheckpointPayload = serde_json::from_value(payload).map_err(|e| format!("payload checkpoint tidak valid: {e}"))?;
    if data.state != "done" && data.state != "failed" { return Err("state checkpoint tidak valid".into()); }
    let instances = app.state::<tauri_plugin_sql::DbInstances>();
    let guard = instances.0.read().await;
    let pool = match guard.get("sqlite:lernen.db") { Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => pool, _ => return Err("Database belum siap".into()) };
    save_checkpoint_to_pool(pool, data).await
}

async fn save_checkpoint_to_pool(pool: &sqlx::SqlitePool, data: CheckpointPayload) -> Result<serde_json::Value, String> {
    let mut snapshot: serde_json::Value = serde_json::from_str(&data.snapshot_json).map_err(|e| format!("snapshot tidak valid: {e}"))?;
    if !snapshot.is_object() { return Err("snapshot harus berupa objek".into()); }
    let new_pass = snapshot.get("pass").and_then(|v| v.as_bool()).unwrap_or(false);
    let new_score = snapshot.get("score").and_then(|v| v.as_f64()).unwrap_or(data.score);
    let key = format!("objective_result:{}", data.unit_no);
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let old_state: Option<String> = sqlx::query_scalar("SELECT state FROM lesson_progress WHERE unit_no=? AND lesson_no=?")
        .bind(data.unit_no).bind(data.lesson_no).fetch_optional(&mut *tx).await.map_err(|e| e.to_string())?;
    let old_score: Option<f64> = sqlx::query_scalar("SELECT COALESCE(score,0) FROM lesson_progress WHERE unit_no=? AND lesson_no=?")
        .bind(data.unit_no).bind(data.lesson_no).fetch_optional(&mut *tx).await.map_err(|e| e.to_string())?;
    let old_snapshot: Option<String> = sqlx::query_scalar("SELECT value FROM config WHERE key=?")
        .bind(&key).fetch_optional(&mut *tx).await.map_err(|e| e.to_string())?;
    let old_json: Option<serde_json::Value> = old_snapshot.as_deref().and_then(|s| serde_json::from_str(s).ok());
    let old_best = old_json.as_ref().and_then(|v| v.get("best_score").and_then(|x| x.as_f64()).or_else(|| v.get("score").and_then(|x| x.as_f64()))).unwrap_or(0.0);
    let old_passed = old_json.as_ref().and_then(|v| v.get("ever_passed").and_then(|x| x.as_bool()).or_else(|| v.get("pass").and_then(|x| x.as_bool()))).unwrap_or(false);
    let best_score = old_best.max(old_score.unwrap_or(0.0)).max(new_score);
    let ever_passed = old_passed || old_state.as_deref() == Some("done") || new_pass;
    snapshot["best_score"] = serde_json::json!(best_score);
    snapshot["ever_passed"] = serde_json::json!(ever_passed);
    let next_state = if ever_passed { "done" } else { "failed" };
    sqlx::query("INSERT INTO lesson_progress (unit_no,lesson_no,state,score,finished_at) VALUES (?,?,?,?,?) ON CONFLICT(unit_no,lesson_no) DO UPDATE SET state=excluded.state, score=excluded.score, finished_at=excluded.finished_at")
        .bind(data.unit_no).bind(data.lesson_no).bind(next_state).bind(best_score).bind(&data.finished_at)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    sqlx::query("INSERT INTO config (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value")
        .bind(&key).bind(snapshot.to_string())
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"best_score": best_score, "ever_passed": ever_passed}))
}

// DB-03: attempt + posisi/draft sesi ditulis dalam satu transaksi.
#[tauri::command]
async fn save_attempt_with_draft(app: tauri::AppHandle, payload: serde_json::Value) -> Result<(), String> {
    let data: AttemptPayload = serde_json::from_value(payload).map_err(|e| format!("payload attempt tidak valid: {e}"))?;
    let instances = app.state::<tauri_plugin_sql::DbInstances>();
    let guard = instances.0.read().await;
    let pool = match guard.get("sqlite:lernen.db") { Some(tauri_plugin_sql::DbPool::Sqlite(pool)) => pool, _ => return Err("Database belum siap".into()) };
    save_attempt_to_pool(pool, data).await
}

async fn save_attempt_to_pool(pool: &sqlx::SqlitePool, data: AttemptPayload) -> Result<(), String> {
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    sqlx::query("INSERT OR IGNORE INTO attempts (ts,kind,item_id,correct,ms,drill_code,item_key,session_id,objective_id) VALUES (?,?,?,?,?,?,?,?,?)")
        .bind(&data.ts).bind(&data.kind).bind(data.item_id).bind(if data.correct {1i64} else {0}).bind(data.ms.max(0))
        .bind(&data.drill_code).bind(&data.item_key).bind(&data.session_id).bind(&data.objective_id)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    // Draft harus mengikuti verdict yang benar-benar tersimpan. Ini menutup
    // retry setelah commit-before-response: INSERT OR IGNORE mempertahankan
    // verdict lama, jadi draft tidak boleh membawa verdict retry yang kalah.
    let canonical: Option<i64> = match (&data.session_id, &data.item_key) {
        (Some(session), Some(item)) => sqlx::query_scalar(
            "SELECT correct FROM attempts WHERE session_id=? AND item_key=? ORDER BY id LIMIT 1",
        ).bind(session).bind(item).fetch_optional(&mut *tx).await.map_err(|e| e.to_string())?,
        _ => None,
    };
    let mut draft: serde_json::Value = serde_json::from_str(&data.draft_json).unwrap_or(serde_json::Value::Null);
    if let Some(object) = draft.as_object_mut() {
        object.insert(
            "correct".into(),
            serde_json::json!(canonical.map(|value| value == 1).unwrap_or(data.correct)),
        );
    }
    let draft_json = if draft.is_object() { draft.to_string() } else { data.draft_json.clone() };
    sqlx::query("INSERT INTO lesson_drafts (key,payload,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at")
        .bind(&data.draft_key).bind(&draft_json).bind(&data.updated_at)
        .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    tx.commit().await.map_err(|e| e.to_string())
}

async fn restore_tables(pool: &sqlx::SqlitePool, tables: serde_json::Value) -> Result<usize, String> {
    use sqlx::Row;
    let required = ["decks", "entries", "cards", "srs_state", "attempts", "drills", "lesson_progress", "texts", "reading_log", "progress_daily", "saved_from_chat", "config"];
    // lesson_drafts baru ada di migrasi v3; backup lama boleh tidak memilikinya.
    let optional = ["lesson_drafts"];
    let obj = tables.as_object().ok_or("Tabel backup tidak valid")?;
    for name in required { if !obj.get(name).is_some_and(|v| v.is_array()) { return Err(format!("Tabel {name} tidak valid")); } }
    for name in optional { if let Some(v) = obj.get(name) { if !v.is_array() { return Err(format!("Tabel {name} tidak valid")); } } }
    let mut names: Vec<&str> = required.to_vec();
    // Tabel opsional tetap dikosongkan saat restore backup lama agar draft
    // lama tidak menunjuk ke keadaan yang sudah dipulihkan.
    names.push("lesson_drafts");
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let mut allowed = std::collections::HashMap::new();
    for name in &names {
        let rows = sqlx::query(&format!("PRAGMA table_info({name})")).fetch_all(&mut *tx).await.map_err(|e| e.to_string())?;
        allowed.insert(*name, rows.iter().map(|r| r.get::<String,_>("name")).collect::<HashSet<_>>());
    }
    for name in names.iter().rev() { sqlx::query(&format!("DELETE FROM {name}")).execute(&mut *tx).await.map_err(|e| e.to_string())?; }
    let mut count = 0;
    for name in names {
        let Some(rows) = obj.get(name) else { continue };
        for row in rows.as_array().unwrap() {
            let fields = row.as_object().ok_or_else(|| format!("Baris {name} tidak valid"))?;
            if fields.is_empty() || fields.keys().any(|k| !allowed[name].contains(k)) { return Err(format!("Kolom tabel {name} tidak valid")); }
            let cols: Vec<&String> = fields.keys().collect();
            let columns = cols.iter().map(|c| format!("\"{c}\"")).collect::<Vec<_>>().join(",");
            let statement = format!("INSERT INTO {name} ({columns}) VALUES ({})", vec!["?"; cols.len()].join(","));
            let mut q = sqlx::query(&statement);
            for col in cols { q = match &fields[col] {
                serde_json::Value::Null => q.bind(Option::<String>::None),
                serde_json::Value::Bool(v) => q.bind(if *v {1i64} else {0}),
                serde_json::Value::Number(v) => if let Some(i) = v.as_i64() { q.bind(i) } else { q.bind(v.as_f64().ok_or("Angka tidak valid")?) },
                serde_json::Value::String(v) => q.bind(v.clone()),
                _ => return Err(format!("Nilai tabel {name} tidak valid")),
            }; }
            q.execute(&mut *tx).await.map_err(|e| format!("Tabel {name}: {e}"))?;
            count += 1;
        }
    }
    if sqlx::query("PRAGMA foreign_key_check").fetch_optional(&mut *tx).await.map_err(|e| e.to_string())?.is_some() { return Err("Relasi backup tidak valid".into()); }
    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(count)
}

// Build a separate recovered database without opening or replacing the damaged one.
#[tauri::command]
async fn backup_recover_to_file(app: tauri::AppHandle, name: String, dir: Option<String>) -> Result<String, String> {
    if !valid_backup_name(&name) { return Err("Nama backup tidak valid".into()); }
    let folder = resolve_dir(&app, dir)?;
    let raw = fs::read_to_string(folder.join(name)).map_err(|e| e.to_string())?;
    let backup: serde_json::Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    if backup["format"] != "lernen-backup" || backup["version"] != 1 {
        return Err("Format atau versi backup tidak didukung".into());
    }
    let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH).map_err(|e| e.to_string())?.as_millis();
    let target = folder.join(format!("lernen-recovered-{stamp}.db"));
    recover_backup_to_path(&target, backup).await?;
    Ok(target.display().to_string())
}

async fn recover_backup_to_path(target: &Path, backup: serde_json::Value) -> Result<(), String> {
    fs::OpenOptions::new().write(true).create_new(true).open(&target).map_err(|e| e.to_string())?;
    let options = sqlx::sqlite::SqliteConnectOptions::new().filename(&target).create_if_missing(false).foreign_keys(true);
    let result = async {
        let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect_with(options).await.map_err(|e| e.to_string())?;
        {
            use sqlx::migrate::{Migrate, Migration as SqlMigration, MigrationType};
            let mut conn = pool.acquire().await.map_err(|e| e.to_string())?;
            conn.ensure_migrations_table().await.map_err(|e| e.to_string())?;
            for (version, description, sql) in [(1, "tabel inti PRD section 9", MIGRATION_V1), (2, "FRS state penuh + item drill (M1)", MIGRATION_V2), (3, "identitas sesi + draft SQLite (DB-03)", MIGRATION_V3), (4, "grade review SRS pada attempts (F1-GAP-01)", MIGRATION_V4)] {
                let migration = SqlMigration::new(version, description.into(), MigrationType::ReversibleUp, sql.into(), false);
                conn.apply(&migration).await.map_err(|e| e.to_string())?;
            }
        }
        restore_tables(&pool, backup["tables"].clone()).await?;
        let verdict: String = sqlx::query_scalar("PRAGMA integrity_check").fetch_one(&pool).await.map_err(|e| e.to_string())?;
        pool.close().await;
        if verdict != "ok" { return Err(format!("Integritas database hasil: {verdict}")); }
        Ok::<(), String>(())
    }.await;
    if let Err(e) = result { let _ = fs::remove_file(&target); return Err(e); }
    Ok(())
}

#[cfg(test)]
mod restore_tests {
    use super::*;

    #[test]
    fn invalid_restore_rolls_back_and_valid_restore_succeeds() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1)
                .connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO entries(kind,de,meaning_id) VALUES('noun','Old','lama')")
                .execute(&pool).await.unwrap();
            let mut tables = serde_json::Map::new();
            for name in ["decks", "entries", "cards", "srs_state", "attempts", "drills", "lesson_progress", "texts", "reading_log", "progress_daily", "saved_from_chat", "config"] {
                tables.insert(name.into(), serde_json::json!([]));
            }
            tables.insert("entries".into(), serde_json::json!([{ "id": 2, "kind": "noun", "de": "New", "meaning_id": "baru", "unknown": 1 }]));
            assert!(restore_tables(&pool, serde_json::Value::Object(tables.clone())).await.is_err());
            let before: String = sqlx::query_scalar("SELECT de FROM entries").fetch_one(&pool).await.unwrap();
            assert_eq!(before, "Old");
            tables.insert("entries".into(), serde_json::json!([{ "id": 2, "kind": "noun", "de": "New", "meaning_id": "baru" }]));
            assert_eq!(restore_tables(&pool, serde_json::Value::Object(tables)).await.unwrap(), 1);
            let after: String = sqlx::query_scalar("SELECT de FROM entries").fetch_one(&pool).await.unwrap();
            assert_eq!(after, "New");
        });
    }

    #[test]
    fn recovered_database_can_be_reopened_with_migration_history() {
        tauri::async_runtime::block_on(async {
            use sqlx::migrate::{Migrate, Migration as SqlMigration, MigrationType};
            let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
            let path = std::env::temp_dir().join(format!("lernen-recovery-test-{}-{stamp}.db", std::process::id()));
            let mut tables = serde_json::Map::new();
            for name in ["decks", "entries", "cards", "srs_state", "attempts", "drills", "lesson_progress", "texts", "reading_log", "progress_daily", "saved_from_chat", "config"] {
                tables.insert(name.into(), serde_json::json!([]));
            }
            tables.insert("entries".into(), serde_json::json!([{ "id": 2, "kind": "noun", "de": "Haus", "meaning_id": "rumah" }]));
            let backup = serde_json::json!({"format":"lernen-backup", "version":1, "tables":tables});
            recover_backup_to_path(&path, backup.clone()).await.unwrap();
            assert!(recover_backup_to_path(&path, backup).await.is_err());
            let options = sqlx::sqlite::SqliteConnectOptions::new().filename(&path).create_if_missing(false);
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect_with(options).await.unwrap();
            let word: String = sqlx::query_scalar("SELECT de FROM entries").fetch_one(&pool).await.unwrap();
            assert_eq!(word, "Haus");
            {
                let mut conn = pool.acquire().await.unwrap();
                let applied = conn.list_applied_migrations().await.unwrap();
                assert_eq!(applied.len(), 4);
                for (index, (version, description, sql)) in [(1, "tabel inti PRD section 9", MIGRATION_V1), (2, "FRS state penuh + item drill (M1)", MIGRATION_V2), (3, "identitas sesi + draft SQLite (DB-03)", MIGRATION_V3), (4, "grade review SRS pada attempts (F1-GAP-01)", MIGRATION_V4)].into_iter().enumerate() {
                    let expected = SqlMigration::new(version, description.into(), MigrationType::ReversibleUp, sql.into(), false);
                    assert_eq!(applied[index].version, version);
                    assert_eq!(applied[index].checksum, expected.checksum);
                }
            }
            pool.close().await;
            std::fs::remove_file(path).unwrap();
        });
    }

    #[test]
    fn review_and_attempt_commit_together() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V4).execute(&pool).await.unwrap();
            sqlx::raw_sql("INSERT INTO entries(id,kind,de,meaning_id) VALUES(1,'noun','Haus','rumah'); INSERT INTO cards(id,entry_id,type) VALUES(1,1,'recog'); CREATE TRIGGER reject_attempt BEFORE INSERT ON attempts BEGIN SELECT RAISE(ABORT,'test failure'); END;").execute(&pool).await.unwrap();
            let row = || ReviewState { card_id: 1, due: "2026-01-01".into(), stability: 1.0, difficulty: 1.0, reps: 1, lapses: 0, last_grade: "good".into(), state: "review".into(), last_review: "2026-01-01".into() };
            assert!(save_review_to_pool(&pool, row(), true, 100, "2026-01-01".into()).await.is_err());
            let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM srs_state").fetch_one(&pool).await.unwrap();
            assert_eq!(count, 0);
            sqlx::query("DROP TRIGGER reject_attempt").execute(&pool).await.unwrap();
            save_review_to_pool(&pool, row(), true, 100, "2026-01-01".into()).await.unwrap();
            let counts: (i64, i64) = sqlx::query_as("SELECT (SELECT COUNT(*) FROM srs_state), (SELECT COUNT(*) FROM attempts)").fetch_one(&pool).await.unwrap();
            assert_eq!(counts, (1, 1));
            // F1-GAP-01: ledger attempt membawa pasangan (timestamp, grade).
            let stored: (String, String) = sqlx::query_as("SELECT ts,grade FROM attempts WHERE kind='srs'")
                .fetch_one(&pool).await.unwrap();
            assert_eq!(stored.0, "2026-01-01");
            assert_eq!(stored.1, "good");
        });
    }

    #[test]
    fn attempt_grade_migration_is_reversible_and_preserves_old_rows() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1)
                .connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::raw_sql("INSERT INTO entries(id,kind,de,meaning_id) VALUES(7,'noun','Haus','rumah'); INSERT INTO cards(id,entry_id,type) VALUES(7,7,'recog');").execute(&pool).await.unwrap();
            // Baris lama ditulis sebelum migrasi v4 (tanpa kolom grade).
            sqlx::query("INSERT INTO attempts(ts,kind,item_id,correct,ms) VALUES(?,?,?,?,?)")
                .bind("2026-11-01T00:00:00Z").bind("srs").bind(7i64).bind(1i64).bind(120i64)
                .execute(&pool).await.unwrap();

            async fn has_grade(pool: &sqlx::SqlitePool) -> bool {
                let count: i64 = sqlx::query_scalar(
                    "SELECT COUNT(*) FROM pragma_table_info('attempts') WHERE name='grade'",
                ).fetch_one(pool).await.unwrap();
                count == 1
            }
            assert_eq!(has_grade(&pool).await, false, "skema lama belum punya grade");

            sqlx::raw_sql(MIGRATION_V4).execute(&pool).await.unwrap();
            assert_eq!(has_grade(&pool).await, true);
            let old_grade: Option<String> = sqlx::query_scalar("SELECT grade FROM attempts WHERE item_id=7")
                .fetch_one(&pool).await.unwrap();
            assert_eq!(old_grade, None, "baris lama tetap terbaca, grade null");

            // Review baru setelah migrasi menyimpan grade lengkap.
            let row = ReviewState {
                card_id: 7, due: "2026-12-01".into(), stability: 1.0, difficulty: 1.0,
                reps: 1, lapses: 0, last_grade: "again".into(), state: "review".into(),
                last_review: "2026-11-19".into(),
            };
            save_review_to_pool(&pool, row, false, 90, "2026-11-19T09:00:00Z".into()).await.unwrap();
            let stored: (String, String) = sqlx::query_as(
                "SELECT ts,grade FROM attempts WHERE kind='srs' AND grade IS NOT NULL",
            ).fetch_one(&pool).await.unwrap();
            assert_eq!(stored, ("2026-11-19T09:00:00Z".into(), "again".into()));

            // Reversibel: turunkan kolom, baris tetap ada, lalu pasang kembali.
            sqlx::raw_sql(MIGRATION_V4_DOWN).execute(&pool).await.unwrap();
            assert_eq!(has_grade(&pool).await, false);
            let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM attempts").fetch_one(&pool).await.unwrap();
            assert_eq!(rows, 2, "down migration tidak menghapus baris attempts");
            sqlx::raw_sql(MIGRATION_V4).execute(&pool).await.unwrap();
            assert_eq!(has_grade(&pool).await, true);
        });
    }

    #[test]
    fn normal_startup_migrations_include_grade_column() {
        tauri::async_runtime::block_on(async {
            // FIX-CORE U-01: daftar yang sama dipakai run() pada aplikasi normal.
            let migrations = sql_migrations();
            assert_eq!(migrations.len(), 4);
            assert_eq!(migrations[3].version, 4);
            assert_eq!(migrations[3].description, "grade review SRS pada attempts (F1-GAP-01)");
            assert_eq!(migrations[3].sql, MIGRATION_V4);

            // Eksekusi nyata pada DB kosong memakai SQL dari daftar startup.
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1)
                .connect("sqlite::memory:").await.unwrap();
            for migration in &migrations {
                sqlx::raw_sql(migration.sql).execute(&pool).await.unwrap();
            }
            let has_grade: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM pragma_table_info('attempts') WHERE name='grade'",
            ).fetch_one(&pool).await.unwrap();
            assert_eq!(has_grade, 1, "DB kosong dari jalur normal punya attempts.grade");

            sqlx::raw_sql("INSERT INTO entries(id,kind,de,meaning_id) VALUES(1,'noun','Haus','rumah'); INSERT INTO cards(id,entry_id,type) VALUES(1,1,'recog');")
                .execute(&pool).await.unwrap();
            let row = ReviewState {
                card_id: 1, due: "2026-12-01".into(), stability: 1.0, difficulty: 1.0,
                reps: 1, lapses: 0, last_grade: "good".into(), state: "review".into(),
                last_review: "2026-11-19".into(),
            };
            save_review_to_pool(&pool, row, true, 100, "2026-11-19T09:00:00Z".into()).await.unwrap();
            let stored: (String, String) = sqlx::query_as("SELECT ts,grade FROM attempts WHERE kind='srs'")
                .fetch_one(&pool).await.unwrap();
            assert_eq!(stored, ("2026-11-19T09:00:00Z".into(), "good".into()));
        });
    }

    #[test]
    #[test]
    fn backup_first_run_writes_valid_file_and_replaces_existing() {
        let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let base = std::env::temp_dir().join(format!("lernen-backup-first-run-{}-{stamp}", std::process::id()));
        let dir = base.join("Documents").join("Lernen Backups");
        assert!(!dir.exists(), "profil uji harus benar-benar kosong");

        fs::create_dir_all(&dir).unwrap(); // backups_dir sudah melakukan ini
        probe_backup_dir_writable(&dir).unwrap();
        assert_eq!(fs::read_dir(&dir).unwrap().count(), 0, "probe tidak meninggalkan berkas");

        let path = dir.join("lernen-backup-20261121-000000-000-auto.json");
        let payload = serde_json::json!({
            "format": "lernen-backup", "version": 1,
            "tables": {
                "decks": [], "entries": [], "cards": [], "srs_state": [], "attempts": [],
                "drills": [], "lesson_progress": [], "texts": [], "reading_log": [],
                "progress_daily": [], "saved_from_chat": [], "config": [], "lesson_drafts": []
            }
        }).to_string();
        write_backup_atomic(&path, &payload).unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), payload, "backup pertama tertulis utuh");
        assert_eq!(fs::read_dir(&dir).unwrap().count(), 1, "hanya satu file backup");

        // Manual backup berikutnya mengganti file lama tanpa menyisakan tmp.
        let second = payload.replace("\"version\": 1", "\"version\": 1, \"manual\": true");
        write_backup_atomic(&path, &second).unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), second);
        let tmp_count = fs::read_dir(&dir).unwrap().filter(|entry| {
            entry.as_ref().map(|e| e.file_name().to_string_lossy().ends_with(".tmp")).unwrap_or(false)
        }).count();
        assert_eq!(tmp_count, 0, "tidak ada file .tmp yatim");
        let _ = fs::remove_dir_all(base);
    }

    #[test]
    fn backup_first_run_creates_parent_and_uses_friendly_errors() {
        let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let base = std::env::temp_dir().join(format!("lernen-backup-first-{}-{stamp}", std::process::id()));
        let nested = base.join("Docs").join("Lernen Backups").join("lernen-backup-first-auto.json");
        write_backup_atomic(&nested, "{\"format\":\"lernen-backup\"}").unwrap();
        assert_eq!(fs::read_to_string(&nested).unwrap(), "{\"format\":\"lernen-backup\"}");

        // Kegagalan nyata: induk adalah berkas, bukan folder.
        let blocker = base.join("blocker.txt");
        fs::write(&blocker, "bukan folder").unwrap();
        let bad = blocker.join("lernen-backup-auto.json");
        let err = write_backup_atomic(&bad, "{}").unwrap_err();
        assert!(!err.contains("os error"), "pesan mentah OS tidak boleh tampil: {err}");
        assert!(err.contains("Folder backup belum dapat disiapkan"), "pesan ramah hilang: {err}");
        let _ = fs::remove_dir_all(base);
    }

    fn checkpoint_payload(score: f64, pass: bool) -> CheckpointPayload {
        CheckpointPayload {
            unit_no: 1, lesson_no: 99, state: if pass { "done".into() } else { "failed".into() },
            score, finished_at: "2026-11-17T08:00:00Z".into(),
            snapshot_json: serde_json::json!({
                "unit": 1, "score": score, "pass": pass, "correct": 11, "total": 15,
                "objectives": [{"id":"o1","correct":3,"total":3,"pass":true},{"id":"o5","correct":1,"total":3,"pass":false}]
            }).to_string(),
        }
    }

    #[test]
    fn checkpoint_progress_and_snapshot_commit_together() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::raw_sql("CREATE TRIGGER reject_snapshot BEFORE INSERT ON config WHEN NEW.key LIKE 'objective_result:%' BEGIN SELECT RAISE(ABORT,'test failure'); END;").execute(&pool).await.unwrap();
            assert!(save_checkpoint_to_pool(&pool, checkpoint_payload(73.0, false)).await.is_err());
            let progress: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM lesson_progress").fetch_one(&pool).await.unwrap();
            assert_eq!(progress, 0, "lesson_progress tidak boleh tersimpan bila snapshot gagal");
            sqlx::query("DROP TRIGGER reject_snapshot").execute(&pool).await.unwrap();
            let result = save_checkpoint_to_pool(&pool, checkpoint_payload(73.0, false)).await.unwrap();
            assert_eq!(result["ever_passed"], false);
            let state: String = sqlx::query_scalar("SELECT state FROM lesson_progress WHERE unit_no=1 AND lesson_no=99").fetch_one(&pool).await.unwrap();
            assert_eq!(state, "failed");
            // Retry hasil 73% yang sama tidak boleh menggandakan progres/attempt.
            save_checkpoint_to_pool(&pool, checkpoint_payload(73.0, false)).await.unwrap();
            let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM lesson_progress WHERE unit_no=1 AND lesson_no=99").fetch_one(&pool).await.unwrap();
            assert_eq!(rows, 1, "retry tidak boleh menggandakan lesson_progress");
            let saved_failed: String = sqlx::query_scalar("SELECT value FROM config WHERE key='objective_result:1'").fetch_one(&pool).await.unwrap();
            let json_failed: serde_json::Value = serde_json::from_str(&saved_failed).unwrap();
            assert_eq!(json_failed["pass"], false);
            assert_eq!(json_failed["objectives"][1]["correct"], 1);
            // Percobaan kedua lulus: snapshot terkini lulus, best/ever_passed tetap benar.
            save_checkpoint_to_pool(&pool, checkpoint_payload(100.0, true)).await.unwrap();
            let row: (String, f64) = sqlx::query_as("SELECT state,score FROM lesson_progress WHERE unit_no=1 AND lesson_no=99").fetch_one(&pool).await.unwrap();
            assert_eq!(row, ("done".to_string(), 100.0));
            let saved: String = sqlx::query_scalar("SELECT value FROM config WHERE key='objective_result:1'").fetch_one(&pool).await.unwrap();
            let json: serde_json::Value = serde_json::from_str(&saved).unwrap();
            assert_eq!(json["pass"], true);
            assert_eq!(json["best_score"], 100.0);
            assert_eq!(json["ever_passed"], true);
            let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM lesson_progress WHERE unit_no=1 AND lesson_no=99").fetch_one(&pool).await.unwrap();
            assert_eq!(rows, 1, "retry tidak boleh menggandakan lesson_progress");
        });
    }

    #[test]
    fn attempt_and_draft_commit_together() {        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::raw_sql("CREATE TRIGGER reject_draft BEFORE INSERT ON lesson_drafts BEGIN SELECT RAISE(ABORT,'test failure'); END;").execute(&pool).await.unwrap();
            let payload = || AttemptPayload {
                ts: "2026-11-17T08:00:00Z".into(), kind: "drill".into(), item_id: 1, correct: true, ms: 500,
                drill_code: None, item_key: Some("A1:1:o1-1".into()), session_id: Some("s1".into()),
                objective_id: Some("a1-u1-o1".into()), draft_key: "lesson_1_1".into(),
                draft_json: "{\"index\":2}".into(), updated_at: "2026-11-17T08:00:00Z".into(),
            };
            assert!(save_attempt_to_pool(&pool, payload()).await.is_err());
            let attempts: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM attempts").fetch_one(&pool).await.unwrap();
            assert_eq!(attempts, 0);
            sqlx::query("DROP TRIGGER reject_draft").execute(&pool).await.unwrap();
            save_attempt_to_pool(&pool, payload()).await.unwrap();
            // Retry respons hilang: INSERT OR IGNORE + draft upsert = tetap satu attempt.
            save_attempt_to_pool(&pool, payload()).await.unwrap();
            let counts: (i64, i64) = sqlx::query_as("SELECT (SELECT COUNT(*) FROM attempts), (SELECT COUNT(*) FROM lesson_drafts)").fetch_one(&pool).await.unwrap();
            assert_eq!(counts, (1, 1));
        });
    }

    #[test]
    fn checkpoint_progress_failure_rolls_back_snapshot() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::raw_sql("CREATE TRIGGER reject_progress BEFORE INSERT ON lesson_progress BEGIN SELECT RAISE(ABORT,'test failure'); END;").execute(&pool).await.unwrap();
            assert!(save_checkpoint_to_pool(&pool, checkpoint_payload(73.0, false)).await.is_err());
            let snapshots: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM config WHERE key LIKE 'objective_result:%'").fetch_one(&pool).await.unwrap();
            assert_eq!(snapshots, 0, "snapshot tidak boleh tersimpan bila lesson_progress gagal");
            sqlx::query("DROP TRIGGER reject_progress").execute(&pool).await.unwrap();
            save_checkpoint_to_pool(&pool, checkpoint_payload(73.0, false)).await.unwrap();
            let state: String = sqlx::query_scalar("SELECT state FROM lesson_progress WHERE unit_no=1 AND lesson_no=99").fetch_one(&pool).await.unwrap();
            assert_eq!(state, "failed");
            let rows: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM lesson_progress").fetch_one(&pool).await.unwrap();
            assert_eq!(rows, 1, "retry tidak boleh menggandakan baris");
        });
    }

    #[test]
    fn backup_snapshot_reads_all_tables_in_one_transaction() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO entries(id,kind,de,meaning_id) VALUES(1,'noun','Haus','rumah')").execute(&pool).await.unwrap();
            sqlx::query("INSERT INTO lesson_drafts(key,payload,updated_at) VALUES('lesson_1_1','{\"step\":2}','2026-11-17T08:00:00Z')").execute(&pool).await.unwrap();
            let json = export_tables_to_json(&pool).await.unwrap();
            for name in ["entries", "lesson_progress", "config", "lesson_drafts"] {
                assert!(json.get(name).and_then(|v| v.as_array()).is_some(), "tabel {name} hilang dari snapshot");
            }
            assert_eq!(json["entries"][0]["de"], "Haus");
            assert_eq!(json["lesson_drafts"][0]["key"], "lesson_1_1");
        });
    }

    #[test]
    fn attempt_retry_keeps_canonical_verdict_in_draft() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            let payload = || AttemptPayload {
                ts: "2026-11-17T08:00:00Z".into(), kind: "drill".into(), item_id: 1, correct: true, ms: 500,
                drill_code: None, item_key: Some("A1:1:o1-1".into()), session_id: Some("s1".into()),
                objective_id: Some("a1-u1-o1".into()), draft_key: "checkpoint_attempt:1".into(),
                draft_json: "{\"index\":0,\"correct\":true,\"correctCount\":1}".into(),
                updated_at: "2026-11-17T08:00:00Z".into(),
            };
            let mut first = payload();
            first.correct = false;
            first.draft_json = "{\"index\":0,\"correct\":false,\"correctCount\":0}".into();
            save_attempt_to_pool(&pool, first).await.unwrap();
            save_attempt_to_pool(&pool, payload()).await.unwrap();
            let attempts: (i64, i64) = sqlx::query_as("SELECT COUNT(*), MAX(correct) FROM attempts WHERE session_id='s1' AND item_key='A1:1:o1-1'").fetch_one(&pool).await.unwrap();
            assert_eq!(attempts, (1, 0), "retry tidak boleh menggandakan/menimpa verdict");
            let draft: String = sqlx::query_scalar("SELECT payload FROM lesson_drafts WHERE key='checkpoint_attempt:1'").fetch_one(&pool).await.unwrap();
            let json: serde_json::Value = serde_json::from_str(&draft).unwrap();
            assert_eq!(json["correct"], false, "draft harus mengikuti verdict committed pertama");
        });
    }

    #[test]
    fn restore_accepts_old_backup_without_lesson_drafts() {
        tauri::async_runtime::block_on(async {
            let pool = sqlx::sqlite::SqlitePoolOptions::new().max_connections(1).connect("sqlite::memory:").await.unwrap();
            sqlx::raw_sql(MIGRATION_V1).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V2).execute(&pool).await.unwrap();
            sqlx::raw_sql(MIGRATION_V3).execute(&pool).await.unwrap();
            let mut tables = serde_json::Map::new();
            for name in ["decks", "entries", "cards", "srs_state", "attempts", "drills", "lesson_progress", "texts", "reading_log", "progress_daily", "saved_from_chat", "config"] {
                tables.insert(name.into(), serde_json::json!([]));
            }
            tables.insert("lesson_progress".into(), serde_json::json!([{ "unit_no": 1, "lesson_no": 1, "state": "done", "score": 100 }]));
            let count = restore_tables(&pool, serde_json::Value::Object(tables.clone())).await.unwrap();
            assert_eq!(count, 1);
            // Backup baru yang menyertakan draft tetap dipulihkan.
            tables.insert("lesson_drafts".into(), serde_json::json!([{ "key": "lesson_1_1", "payload": "{\"step\":2}", "updated_at": "2026-11-17T08:00:00Z" }]));
            assert_eq!(restore_tables(&pool, serde_json::Value::Object(tables)).await.unwrap(), 2);
            let payload: String = sqlx::query_scalar("SELECT payload FROM lesson_drafts WHERE key='lesson_1_1'").fetch_one(&pool).await.unwrap();
            assert_eq!(payload, "{\"step\":2}");
        });
    }

    #[test]
    fn backup_write_publishes_complete_file() {
        let stamp = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_nanos();
        let dir = std::env::temp_dir().join(format!("lernen-backup-test-{}-{stamp}", std::process::id()));
        fs::create_dir_all(&dir).unwrap();
        let path = dir.join("lernen-backup-20261117-manual.json");
        let content = "{\"format\":\"lernen-backup\"}".repeat(100);
        write_backup_atomic(&path, &content).unwrap();
        assert_eq!(fs::read_to_string(&path).unwrap(), content);
        let files: Vec<_> = fs::read_dir(&dir).unwrap().filter_map(|e| e.ok()).collect();
        assert_eq!(files.len(), 1, "tidak boleh ada file sementara tersisa");
        fs::remove_dir_all(&dir).unwrap();
    }
}

// ---- TTS neural offline (Piper) --------------------------------------------
// Mesin diunduh sekali dari rilis resmi Piper; voice dari repo piper-voices.
// Piper dijalankan sebagai proses lokal, menghasilkan WAV, lalu WAV dikirim ke
// frontend (base64) untuk diputar lewat Web Audio — tanpa server/cloud.
const PIPER_ZIP_URL: &str =
    "https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_windows_amd64.zip";

const PIPER_VOICES: &[(&str, &str, &str, u32)] = &[
    (
        "de_thorsten_medium",
        "Thorsten · medium (pria)",
        "de/de_DE/thorsten/medium/de_DE-thorsten-medium",
        63,
    ),
    (
        "de_kerstin_low",
        "Kerstin · low (wanita)",
        "de/de_DE/kerstin/low/de_DE-kerstin-low",
        63,
    ),
    (
        "de_eva_k_x_low",
        "Eva K · x-low (wanita)",
        "de/de_DE/eva_k/x_low/de_DE-eva_k-x_low",
        18,
    ),
];

#[derive(serde::Serialize)]
struct PiperVoiceInfo {
    id: String,
    name: String,
    size_mb: u32,
    installed: bool,
}

#[derive(serde::Serialize)]
struct PiperStatus {
    engine: bool,
    dir: String,
    voices: Vec<PiperVoiceInfo>,
}

fn piper_root(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("folder data aplikasi tidak ditemukan: {e}"))?
        .join("piper");
    fs::create_dir_all(&dir).map_err(|e| format!("gagal membuat folder Piper: {e}"))?;
    Ok(dir)
}

// Piper 2023 expects single-codepoint phoneme map keys. Newer models may use
// multi-codepoint phonemes and crash this engine, so reject them before launch.
fn compatible_voice(root: &Path, voice: &str) -> bool {
    let model = root.join("voices").join(format!("{voice}.onnx"));
    let config = root.join("voices").join(format!("{voice}.onnx.json"));
    let expected_size = match voice { "de_thorsten_medium" => 63_201_294, "de_kerstin_low" => 63_104_526, "de_eva_k_x_low" => 20_628_813, _ => return false };
    if fs::metadata(model).map(|m| m.len()).ok() != Some(expected_size) { return false; }
    let Ok(bytes) = fs::read(config) else { return false; };
    let Ok(json) = serde_json::from_slice::<serde_json::Value>(&bytes) else { return false; };
    let Some(map) = json.get("phoneme_id_map").and_then(|value| value.as_object()) else { return false; };
    !map.is_empty() && map.keys().all(|key| key.chars().count() == 1)
}

fn http_get(url: &str) -> Result<Vec<u8>, String> {
    let resp = ureq::get(url)
        .timeout(std::time::Duration::from_secs(900))
        .call()
        .map_err(|e| format!("gagal mengunduh {url}: {e}"))?;
    let mut buf = Vec::new();
    resp.into_reader()
        .read_to_end(&mut buf)
        .map_err(|e| format!("gagal membaca unduhan: {e}"))?;
    Ok(buf)
}


// Proses Piper yang tetap hidup selama aplikasi berjalan: model dimuat sekali,
// lalu setiap kalimat hanya menunggu inferensi (jauh lebih cepat daripada
// memuat ulang model tiap kali bicara).
struct PiperProc {
    child: std::process::Child,
    dir: PathBuf,
    voice: String,
    length_scale: f64,
    known: HashSet<String>,
}

impl Drop for PiperProc {
    fn drop(&mut self) {
        let _ = self.child.kill();
        let _ = self.child.wait();
        let _ = fs::remove_dir_all(&self.dir);
    }
}

impl PiperProc {
    fn spawn(root: &Path, voice: &str, length_scale: f64) -> Result<Self, String> {
        let stamp = std::time::SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("lernen-piper-{}-{stamp}", std::process::id()));
        fs::create_dir_all(&dir).map_err(|e| format!("gagal membuat folder audio: {e}"))?;
        let mut command = std::process::Command::new(root.join("piper.exe"));
        command
            .current_dir(root)
            .arg("--model")
            .arg(root.join("voices").join(format!("{voice}.onnx")))
            .arg("--config")
            .arg(root.join("voices").join(format!("{voice}.onnx.json")))
            .arg("--output_dir")
            .arg(&dir)
            .arg("--length_scale")
            .arg(format!("{:.2}", length_scale.clamp(0.5, 2.0)))
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null());

        // piper.exe is a console application. Without CREATE_NO_WINDOW,
        // Windows may open a terminal window when synthesis starts.
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x0800_0000);
        }

        let child = command
            .spawn()
            .map_err(|e| format!("gagal menjalankan Piper: {e}"))?;
        Ok(Self {
            child,
            dir,
            voice: voice.to_string(),
            length_scale,
            known: HashSet::new(),
        })
    }

    fn synth(&mut self, text: &str) -> Result<Vec<u8>, String> {
        let line = text.replace(['\r', '\n'], " ");
        {
            let stdin = self
                .child
                .stdin
                .as_mut()
                .ok_or_else(|| "Piper tidak menerima input".to_string())?;
            stdin
                .write_all(line.as_bytes())
                .map_err(|e| format!("gagal mengirim teks: {e}"))?;
            stdin
                .write_all(b"\n")
                .map_err(|e| format!("gagal mengirim teks: {e}"))?;
            stdin.flush().map_err(|e| e.to_string())?;
        }

        let deadline = Instant::now() + Duration::from_secs(15);
        let mut found: Option<PathBuf> = None;
        let mut last_size = 0u64;
        let mut stable = 0;
        while Instant::now() < deadline {
            if found.is_none() {
                if let Ok(entries) = fs::read_dir(&self.dir) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        let is_wav = path
                            .extension()
                            .and_then(|e| e.to_str())
                            .map(|e| e.eq_ignore_ascii_case("wav"))
                            .unwrap_or(false);
                        if !is_wav {
                            continue;
                        }
                        let name = path
                            .file_name()
                            .and_then(|s| s.to_str())
                            .unwrap_or_default()
                            .to_string();
                        if !self.known.contains(&name) {
                            found = Some(path);
                            break;
                        }
                    }
                }
            }
            if let Some(ref path) = found {
                let size = fs::metadata(path).map(|m| m.len()).unwrap_or(0);
                if size > 0 && size == last_size {
                    stable += 1;
                    if stable >= 2 {
                        break;
                    }
                } else {
                    stable = 0;
                }
                last_size = size;
            }
            std::thread::sleep(Duration::from_millis(25));
        }

        if stable < 2 { return Err("Piper tidak menyelesaikan audio dalam 15 detik".into()); }
        let path = found.ok_or_else(|| "Piper tidak menghasilkan audio".to_string())?;
        std::thread::sleep(Duration::from_millis(30));
        let bytes = fs::read(&path).map_err(|e| format!("gagal membaca audio: {e}"))?;
        if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
            self.known.insert(name.to_string());
        }
        let _ = fs::remove_file(&path);
        if bytes.is_empty() {
            return Err("audio Piper kosong".into());
        }
        Ok(bytes)
    }
}

struct PiperState(Arc<Mutex<Option<PiperProc>>>);

impl Default for PiperState {
    fn default() -> Self {
        Self(Arc::new(Mutex::new(None)))
    }
}

#[tauri::command]
fn piper_status(app: tauri::AppHandle) -> Result<PiperStatus, String> {
    let root = piper_root(&app)?;
    let voices = PIPER_VOICES
        .iter()
        .map(|(id, name, _, size)| PiperVoiceInfo {
            id: id.to_string(),
            name: name.to_string(),
            size_mb: *size,
            installed: compatible_voice(&root, id),
        })
        .collect();
    Ok(PiperStatus {
        engine: root.join("piper.exe").exists(),
        dir: root.display().to_string(),
        voices,
    })
}

#[tauri::command]
async fn piper_install_engine(app: tauri::AppHandle) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let root = piper_root(&app)?;
        let bytes = http_get(PIPER_ZIP_URL)?;
        let mut archive = zip::ZipArchive::new(std::io::Cursor::new(bytes))
            .map_err(|e| format!("arsip Piper tidak valid: {e}"))?;
        for i in 0..archive.len() {
            let mut entry = archive
                .by_index(i)
                .map_err(|e| format!("gagal membaca arsip: {e}"))?;
            let safe_name = entry.enclosed_name().ok_or_else(|| "Path arsip Piper tidak aman".to_string())?;
            let rel = safe_name.strip_prefix("piper").unwrap_or(&safe_name);
            if rel.as_os_str().is_empty() {
                continue;
            }
            let out = root.join(rel);
            if entry.is_dir() {
                fs::create_dir_all(&out).map_err(|e| e.to_string())?;
            } else {
                if let Some(parent) = out.parent() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
                let mut file = fs::File::create(&out).map_err(|e| e.to_string())?;
                std::io::copy(&mut entry, &mut file).map_err(|e| e.to_string())?;
            }
        }
        if !root.join("piper.exe").exists() {
            return Err("piper.exe tidak ditemukan setelah ekstraksi".into());
        }
        Ok(root.display().to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn piper_download_voice(app: tauri::AppHandle, id: String) -> Result<String, String> {
    let (_, _, path, _) = PIPER_VOICES
        .iter()
        .find(|(voice_id, _, _, _)| *voice_id == id)
        .ok_or_else(|| format!("voice tidak dikenal: {id}"))?;
    let root = piper_root(&app)?;
    let voices_dir = root.join("voices");
    fs::create_dir_all(&voices_dir).map_err(|e| e.to_string())?;

    let base = format!("https://huggingface.co/rhasspy/piper-voices/resolve/142ef8f267e1904d9da7cde9df3d7237ac809b1e/{path}.onnx");
    let id_owned = id.clone();
    tauri::async_runtime::spawn_blocking(move || -> Result<String, String> {
        let model = http_get(&base)?;
        let config = http_get(&format!("{base}.json"))?;
        let metadata: serde_json::Value = serde_json::from_slice(&config).map_err(|e| format!("Konfigurasi suara tidak valid: {e}"))?;
        let map = metadata.get("phoneme_id_map").and_then(|value| value.as_object()).ok_or("Peta suara tidak ditemukan")?;
        let expected_size = match id_owned.as_str() { "de_thorsten_medium" => 63_201_294, "de_kerstin_low" => 63_104_526, "de_eva_k_x_low" => 20_628_813, _ => return Err("Suara tidak dikenal".into()) };
        if model.len() != expected_size || map.is_empty() || map.keys().any(|key| key.chars().count() != 1) { return Err("Suara tidak lengkap atau tidak kompatibel dengan mesin Piper".into()); }
        let model_temp = voices_dir.join(format!("{id_owned}.onnx.download"));
        let config_temp = voices_dir.join(format!("{id_owned}.onnx.json.download"));
        fs::write(&model_temp, model).map_err(|e| e.to_string())?;
        fs::write(&config_temp, config).map_err(|e| e.to_string())?;
        fs::rename(&model_temp, voices_dir.join(format!("{id_owned}.onnx"))).map_err(|e| e.to_string())?;
        fs::rename(&config_temp, voices_dir.join(format!("{id_owned}.onnx.json"))).map_err(|e| e.to_string())?;
        Ok(format!("voice {id_owned} terpasang"))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[tauri::command]
async fn piper_speak(
    app: tauri::AppHandle,
    state: tauri::State<'_, PiperState>,
    text: String,
    voice: String,
    length_scale: f64,
) -> Result<String, String> {
    let state = Arc::clone(&state.0);
    tauri::async_runtime::spawn_blocking(move || {
        piper_speak_blocking(app, state, text, voice, length_scale)
    })
    .await
    .map_err(|e| e.to_string())?
}

fn piper_speak_blocking(
    app: tauri::AppHandle,
    state: Arc<Mutex<Option<PiperProc>>>,
    text: String,
    voice: String,
    length_scale: f64,
) -> Result<String, String> {
    let root = piper_root(&app)?;
    if !root.join("piper.exe").exists() {
        return Err("mesin Piper belum dipasang".into());
    }
    if !PIPER_VOICES.iter().any(|(id, _, _, _)| *id == voice) || !compatible_voice(&root, &voice) {
        return Err("Suara Piper tidak kompatibel atau belum lengkap. Unduh ulang melalui Pengaturan.".into());
    }
    let model = root.join("voices").join(format!("{voice}.onnx"));
    let config = root.join("voices").join(format!("{voice}.onnx.json"));
    if !model.exists() || !config.exists() {
        return Err("voice Piper belum diunduh".into());
    }

    let mut guard = state.lock().map_err(|_| "state Piper rusak".to_string())?;
    let restart = match guard.as_mut() {
        Some(proc) => {
            proc.voice != voice
                || (proc.length_scale - length_scale.clamp(0.5, 2.0)).abs() > 0.01
                || proc.child.try_wait().ok().flatten().is_some()
        }
        None => true,
    };
    if restart {
        if let Some(old) = guard.take() {
            drop(old);
        }
        *guard = Some(PiperProc::spawn(&root, &voice, length_scale)?);
    }

    let outcome = guard.as_mut().ok_or_else(|| "Piper gagal dimulai".to_string())?.synth(&text);
    let bytes = match outcome {
        Ok(bytes) => bytes,
        Err(error) => { guard.take(); return Err(error); }
    };
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    Ok(STANDARD.encode(bytes))
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Halo, {}! Sambutan dari Rust core.", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_sql::Builder::new()
                .add_migrations("sqlite:lernen.db", sql_migrations())
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            backup_restore_atomic,
            save_review_atomic,
            save_checkpoint_result,
            save_attempt_with_draft,
            backup_export_snapshot,
            backup_recover_to_file,
            backup_write,
            backup_list,
            backup_read,
            backup_dir_path,
            backup_open_folder,
            app_database_path,
            piper_status,
            piper_install_engine,
            piper_download_voice,
            piper_speak
        ])
        .manage(PiperState::default())
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::Exit = event {
                if let Some(state) = app_handle.try_state::<PiperState>() {
                    if let Ok(mut guard) = state.0.lock() {
                        guard.take();
                    }
                }
            }
        });
}
