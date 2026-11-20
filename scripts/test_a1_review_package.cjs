// Validasi paket telaah A1: inventaris, relasi ID, temuan, dan status jujur.
// Tidak mengubah konten; baseline diperiksa terpisah oleh test_content_parity.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const pkg = path.join(root, "outputs/windows-next-2026-11-17/telaah-a1");
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
const readPkg = (rel) => JSON.parse(fs.readFileSync(path.join(pkg, rel), "utf8"));

const inventory = readPkg("inventaris-12-unit.json");
const audit = readPkg("audit-sampel.json");
const status = readPkg("status.json");
const objectivesFile = readJson("src/data/lessons/a1_objectives.json");
const unitsFile = readJson("src/data/lessons/units_a1.json");
const practiceFile = readJson("src/data/lessons/a1_lesson_practice.json");

assert.equal(inventory.baseline, "CONTENT-PARITY-20261117-01");
assert.equal(inventory.units.length, 12, "12 unit");
assert.equal(inventory.units.reduce((n, u) => n + u.lessons.length, 0), 36, "36 pelajaran");
assert.equal(inventory.units.reduce((n, u) => n + u.objectives.length, 0), 60, "60 tujuan");
assert.equal(
  inventory.units.reduce((n, u) => n + u.objectives.reduce((m, o) => m + o.bankItems.length, 0), 0),
  305,
  "305 bank (300 baseline + 5 item gap)",
);
assert.equal(inventory.units.reduce((n, u) => n + u.objectives.reduce((m, o) => m + o.applicationItemIds.length, 0), 0), 35, "35 aplikasi");

const objectiveIds = new Set(objectivesFile.objectives.map((o) => o.id));
const unitByNo = new Map(unitsFile.units.map((u) => [u.unit, u]));
const practiceById = new Map(practiceFile.items.map((i) => [i.id, i]));
const knownInvalidEvidence = new Set();

for (const unit of inventory.units) {
  const sourceUnit = unitByNo.get(unit.unit);
  assert.ok(sourceUnit, `unit ${unit.unit} ada di sumber`);
  assert.equal(unit.title, sourceUnit.title, `unit ${unit.unit} judul`);
  for (const lesson of unit.lessons) {
    const sourceLesson = sourceUnit.lessons.find((l) => l.no === lesson.no && l.title === lesson.title);
    assert.ok(sourceLesson, `lesson ${unit.unit}/${lesson.no}`);
    const body = sourceLesson.slides[sourceLesson.slides.length - 1].body;
    assert.ok(
      Array.isArray(body) && body.some((line) => String(line).startsWith("Prasyarat:") && String(line).includes("Kesalahan umum:") && String(line).includes("Ringkasan:")),
      `lesson ${unit.unit}/${lesson.no} P1 note in source`,
    );
  }
  for (const objective of unit.objectives) {
    assert.ok(objectiveIds.has(objective.id), `${objective.id} ada di sumber`);
    for (const lessonNo of objective.lessonNos) {
      assert.ok(sourceUnit.lessons.some((l) => l.no === lessonNo), `${objective.id} lesson ${lessonNo}`);
    }
    for (const ref of objective.evidenceRefs) {
      if (ref.valid) {
        assert.ok(ref.sourceId && ref.sourceId.includes("units_a1.json#"), `${objective.id} sourceId evidence`);
        const [, rest] = ref.sourceId.split("#");
        const m = /unit(\d+)\.lesson(\d+)\.slide(\d+)/.exec(rest);
        assert.ok(m, `${objective.id} format sourceId`);
        const u = Number(m[1]);
        const l = Number(m[2]);
        const s = Number(m[3]);
        const lesson = unitByNo.get(u)?.lessons.find((x) => x.no === l);
        assert.ok(lesson && lesson.slides[s - 1], `${objective.id} evidence slide exists`);
      } else {
        knownInvalidEvidence.add(`${objective.id}|${ref.text}`);
      }
    }
    const sourceBank = readJson(`src/data/lessons/a1_unit${unit.unit}_bank.json`);
    const sourceItems = sourceBank.items.filter((i) => i.objectiveId === objective.id);
    assert.deepEqual(objective.checkpointPoolIds, sourceItems.map((i) => i.id), `${objective.id} bank IDs`);
    for (const appId of objective.applicationItemIds) {
      const app = practiceById.get(appId);
      assert.ok(app && app.objectiveId === objective.id, `${objective.id} app ${appId}`);
    }
  }
}

// Setelah koreksi teknis, tidak ada evidence invalid. Temuan tetap tercatat
// sebagai riwayat dan harus berstatus fixed_technical.
assert.equal(knownInvalidEvidence.size, 0, "0 evidence invalid setelah koreksi");
const finding1 = audit.findings.find((f) => f.id === "A1-REV-01");
assert.ok(finding1 && finding1.objective === "a1-u1-o3", "temuan evidence U1-o3");
assert.equal(finding1.status, "fixed_technical");
for (const finding of audit.findings) assert.equal(finding.status, "fixed_technical", `${finding.id} fixed`);
assert.equal(audit.findings.length, 9, "9 temuan sampel");

for (const finding of audit.findings) {
  assert.ok(objectiveIds.has(finding.objective), `${finding.id} objective valid`);
  assert.ok(finding.source && finding.evidence && finding.proposed_revision && finding.acceptance, `${finding.id} fields`);
  assert.ok(["P1", "P2", "P3"].includes(finding.severity), `${finding.id} severity`);
}

assert.equal(audit.findings.length, 9, "9 temuan sampel");
assert.equal(audit.scope.objective_count, 8, "8 tujuan sampel");
const fullAudit = readJson("outputs/completion-2026-11-18/audit-full-a1.json");
assert.equal(fullAudit.totals.units, 12);
assert.equal(fullAudit.totals.objectives, 60);
assert.equal(fullAudit.totals.bank_items, 305);
assert.equal(fullAudit.totals.added_items, 5);
assert.equal(fullAudit.totals.evidence_invalid, 0);
assert.equal(fullAudit.totals.failed_objectives, 0);
assert.equal(fullAudit.totals.corrections, 15);
assert.deepEqual(status.status, {
  paket: "siap_dipakai",
  telaah_pengajar: "menunggu_pelaksanaan",
  pilot_pembelajar: "belum_dilaksanakan",
  perubahan_konten: "15_koreksi_teknis_plus_36_pelajaran_P1_plus_5_item_gap_delta_12_file",
});
assert.equal(status.content_delta.changed_files, 12);
assert.equal(status.content_delta.added_bank_items, 5);
assert.equal(status.gap_items.count, 5);
assert.equal(status.gap_items.status, "closed_technical");
assert.deepEqual(status.gap_items.ids, ["u5-o2-06", "u5-o2-07", "u5-o2-08", "u5-o5-06", "u10-o5-06"]);
assert.equal(status.lesson_enrichment.lessons, 36, "36 pelajaran diperkaya");
assert.equal(status.lesson_enrichment.common_errors, true);
assert.equal(status.vocab_audit.a1_rows, 221);
assert.equal(status.vocab_audit.example_complete, 221);
assert.equal(status.vocab_audit.mass_nouns_no_plural, 5);
assert.equal(status.baseline.json_files, 81);
assert.equal(status.baseline.wav_files, 454);
assert.equal(objectivesFile.objectives.every((o) => o.review === "not-reviewed"), true, "tidak ada klaim reviewed");

for (const rel of ["README.md", "inventaris-12-unit.md", "audit-sampel.md", "lembar-telaah.csv", "pilot/README.md", "pilot/skenario.md", "pilot/lembar-pengamatan.csv", "pilot/lembar-persetujuan.md"]) {
  assert.ok(fs.existsSync(path.join(pkg, rel)), `file paket ${rel}`);
}
const observation = fs.readFileSync(path.join(pkg, "pilot/lembar-pengamatan.csv"), "utf8");
for (const col of ["participant_code", "task_id", "completion_mode", "interventions", "objective_ids", "severity", "consent_withdrawn"]) {
  assert.ok(observation.includes(col), `kolom pengamatan ${col}`);
}
const consent = fs.readFileSync(path.join(pkg, "pilot/lembar-persetujuan.md"), "utf8");
assert.ok(consent.includes("menarik persetujuan") && consent.includes("tidak disimpan"), "consent withdrawal clause");

const pilotReadme = fs.readFileSync(path.join(pkg, "pilot/README.md"), "utf8");
assert.ok(pilotReadme.includes("ceil(0.8"), "target pilot harus memakai formula N");
assert.ok(pilotReadme.includes("N=3") && pilotReadme.includes("N=5"), "contoh target 3/3, 4/4, 4/5");
assert.equal(pilotReadme.includes("minimal 4/5"), false, "jangan memakai target literal 4/5");
assert.ok(pilotReadme.includes("memulai sesi inti"), "N harus memakai peserta yang memulai sesi inti");
assert.ok(pilotReadme.includes("termasuk") && pilotReadme.includes("hambatan aplikasi"), "N mencakup peserta yang gagal karena hambatan");
assert.ok(pilotReadme.toLowerCase().includes("penarikan persetujuan") && pilotReadme.includes("tidak disimpan"), "kebijakan penarikan persetujuan");
assert.equal(pilotReadme.includes("hadir dan menyelesaikan sesi inti"), false, "definisi N lama tidak boleh tersisa");
assert.ok(pilotReadme.includes("menyalin direktori profil tidak mengubah identifier") || pilotReadme.includes("Menyalin direktori profil tidak mengubah identifier"), "peringatan identifier Tauri");
assert.equal(status.pilot.target_formula.includes("ceil(0.8"), true, "status pilot target formula");
assert.ok(status.pilot.participants.includes("memulai sesi inti"), "status pilot N definition");
assert.ok(status.pilot.withdrawal_policy.toLowerCase().includes("tidak disimpan"), "status pilot withdrawal policy");
assert.equal(status.pilot.status, "belum_dilaksanakan");
const scenario = fs.readFileSync(path.join(pkg, "pilot/skenario.md"), "utf8");
assert.ok(scenario.includes("menarik persetujuan") && scenario.includes("W tanpa"), "skenario mencatat penarikan persetujuan");

console.log(
  "Paket telaah A1 OK: 12 unit/36 pelajaran/60 tujuan/305 bank/35 aplikasi; " +
    "9 temuan sampel berstatus fixed_technical, 5 item gap ditambahkan, 0 evidence invalid; " +
    "full audit 60/60 struktur lulus, 15 koreksi; status telaah/pilot menunggu pelaksanaan; " +
    "semua ID tujuan/lesson/bank/practice valid.",
);
