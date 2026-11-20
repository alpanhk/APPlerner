// WINDOWS-HARDENING-20261118-07: bukti tiga gap canDo A1 ditutup oleh item
// yang benar-benar menguji klaim, tanpa menghapus ID/konten lama.
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
const objectives = readJson("src/data/lessons/a1_objectives.json");
const units = readJson("src/data/lessons/units_a1.json").units;
const byObjective = new Map(objectives.objectives.map((objective) => [objective.id, objective]));

const targetIds = {
  "a1-u5-o2": ["u5-o2-01", "u5-o2-02", "u5-o2-03", "u5-o2-04", "u5-o2-05", "u5-o2-06", "u5-o2-07", "u5-o2-08"],
  "a1-u5-o5": ["u5-o5-01", "u5-o5-02", "u5-o5-03", "u5-o5-04", "u5-o5-05", "u5-o5-06"],
  "a1-u10-o5": ["u10-o5-01", "u10-o5-02", "u10-o5-03", "u10-o5-04", "u10-o5-05", "u10-o5-06"],
};
const newIds = new Set(["u5-o2-06", "u5-o2-07", "u5-o2-08", "u5-o5-06", "u10-o5-06"]);
const bankByUnit = new Map();
for (const unitNo of [5, 10]) {
  bankByUnit.set(unitNo, readJson(`src/data/lessons/a1_unit${unitNo}_bank.json`));
}

for (const [objectiveId, ids] of Object.entries(targetIds)) {
  const objective = byObjective.get(objectiveId);
  assert.ok(objective, `${objectiveId} exists`);
  const unitNo = objective.unit;
  const bank = bankByUnit.get(unitNo);
  const unitItems = bank.items;
  const own = unitItems.filter((item) => item.objectiveId === objectiveId);
  assert.deepEqual(own.map((item) => item.id), ids, `${objectiveId} ID lama + baru`);
  assert.equal(new Set(unitItems.map((item) => item.id)).size, unitItems.length, `unit ${unitNo} unique ids`);
  assert.equal(new Set(unitItems.map((item) => item.prompt)).size, unitItems.length, `unit ${unitNo} unique prompts`);

  for (const id of ids.filter((id) => newIds.has(id))) {
    const item = own.find((entry) => entry.id === id);
    assert.ok(item, `${id} present`);
    assert.equal(item.mode, "choice", `${id} mode`);
    assert.ok(item.options.includes(item.answer), `${id} answer in options`);
    assert.equal(new Set(item.options).size, item.options.length, `${id} unique options`);
    assert.equal(item.options[0], item.answer, `${id} authored answer first`);
    for (const option of item.options.filter((option) => option !== item.answer)) {
      assert.ok(item.wrongFeedback && item.wrongFeedback[option], `${id} feedback ${option}`);
    }
    assert.ok(item.explanation.trim(), `${id} explanation`);
  }
}

const own5o2 = bankByUnit.get(5).items.filter((item) => item.objectiveId === "a1-u5-o2");
const answers5o2 = new Set(own5o2.map((item) => item.answer.toLowerCase()));
for (const adjective of ["groß", "klein", "lang", "kurz"]) {
  assert.ok(answers5o2.has(adjective), `U5-o2 correct answer covers ${adjective}`);
}
assert.ok(byObjective.get("a1-u5-o2").canDo.includes("groß/klein"));
assert.ok(byObjective.get("a1-u5-o2").canDo.includes("lang/kurz"));

const own5o5 = bankByUnit.get(5).items.filter((item) => item.objectiveId === "a1-u5-o5");
assert.ok(own5o5.some((item) => item.answer.toLowerCase() === "bar"), "U5-o5 covers bar");
assert.ok(
  own5o5.some((item) => item.answer.toLowerCase() === "mit" && item.prompt.includes("Karte")),
  "U5-o5 covers mit + Karte",
);
assert.ok(byObjective.get("a1-u5-o5").canDo.includes("bar atau mit Karte"));

const own10o5 = bankByUnit.get(10).items.filter((item) => item.objectiveId === "a1-u10-o5");
const answers10o5 = new Set(own10o5.map((item) => item.answer.toLowerCase()));
assert.ok(answers10o5.has("einmal"), "U10-o5 covers einmal");
assert.ok(answers10o5.has("zweimal"), "U10-o5 covers zweimal");

const slideText = (unitNo, lessonNo, title) => {
  const lesson = units.find((unit) => unit.unit === unitNo).lessons.find((entry) => entry.no === lessonNo);
  return lesson.slides.find((slide) => slide.title === title).body.join(" ");
};
assert.ok(slideText(5, 2, "Menyatakan cocok").includes("zu groß/klein/lang/kurz"), "materi U5-o2");
assert.ok(slideText(5, 3, "Membayar di kasir").includes("Ich bezahle bar"), "materi U5-o5 bar");
assert.ok(slideText(5, 3, "Membayar di kasir").includes("mit Karte"), "materi U5-o5 Karte");
assert.ok(slideText(10, 3, "Jadwal latihan").includes("einmal pro Woche"), "materi U10-o5 einmal");
assert.ok(slideText(10, 3, "Jadwal latihan").includes("zweimal pro Woche"), "materi U10-o5 zweimal");

for (const unitNo of [5, 10]) {
  const unit = units.find((entry) => entry.unit === unitNo);
  assert.equal(unit.checkpoint.count, 15, `unit ${unitNo} checkpoint tetap 15`);
  assert.equal(unit.checkpoint.pass, 70, `unit ${unitNo} pass tetap 70`);
  const policy = objectives.policies.find((entry) => entry.unit === unitNo);
  assert.equal(policy.itemsPerObjective, 3, `unit ${unitNo} 3 item per tujuan`);
  assert.equal(policy.perObjectiveMin, 2, `unit ${unitNo} minimal 2 benar`);
}

console.log(
  "A1 hardening gaps OK: U5-o2 groß/klein/lang/kurz, U5-o5 bar + mit Karte, " +
    "U10-o5 einmal/zweimal; 5 item baru, ID lama utuh, checkpoint 15 tetap.",
);
