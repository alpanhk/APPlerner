// Validasi inventaris tujuan A1, bank soal transfer per unit, checkpoint
// per tujuan, dan remedial dari soal yang belum dipakai (seluruh Unit A1 1–12).
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const ts = require("typescript");
const { createRequire } = require("node:module");

const root = path.resolve(__dirname, "..");
const readJson = (rel) =>
  JSON.parse(fs.readFileSync(path.join(root, rel), "utf8").replace(/^\uFEFF/, ""));
const normalize = (value) => String(value).trim().toLowerCase().replace(/\s+/g, " ");

const objectivesFile = readJson("src/data/lessons/a1_objectives.json");
const unitsFile = readJson("src/data/lessons/units_a1.json");
const UNIT_NOS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const CODES = new Set(["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"]);
// Baseline 25 item per unit; hardening-07 menambah item hanya pada unit 5/10.
const EXPECTED_UNIT_BANK = { 5: 29, 10: 26 };
const EXPECTED_OBJECTIVE_POOL = {
  "a1-u5-o2": 8,
  "a1-u5-o5": 6,
  "a1-u10-o5": 6,
};

assert.equal(objectivesFile.level, "A1");

const objectives = objectivesFile.objectives;
const objectiveIds = new Set();
for (const objective of objectives) {
  assert.ok(objective.id && !objectiveIds.has(objective.id), `unique objective id: ${objective.id}`);
  objectiveIds.add(objective.id);
  assert.ok(objective.title.trim(), `${objective.id} title`);
  assert.ok(objective.canDo.trim(), `${objective.id} canDo`);
  assert.ok(["covered", "partial"].includes(objective.coverage), `${objective.id} coverage`);
  assert.ok(["reviewed", "not-reviewed"].includes(objective.review), `${objective.id} review`);
  assert.ok(Array.isArray(objective.lessonNos) && objective.lessonNos.length > 0, `${objective.id} lessonNos`);
  const unit = unitsFile.units.find((entry) => entry.unit === objective.unit);
  assert.ok(unit, `${objective.id} unit exists`);
  for (const lessonNo of objective.lessonNos) {
    assert.ok(unit.lessons.some((lesson) => lesson.no === lessonNo), `${objective.id} lesson ${lessonNo}`);
  }
  assert.ok(Array.isArray(objective.prerequisites), `${objective.id} prerequisites`);
  assert.ok(Array.isArray(objective.evidence) && objective.evidence.length > 0, `${objective.id} evidence`);
  for (const evidence of objective.evidence) {
    const match = /^Pelajaran (\d+), slide '(.+)'$/.exec(evidence);
    assert.ok(match, `${objective.id} evidence format: ${evidence}`);
    const lessonNo = Number(match[1]);
    const slideTitle = match[2];
    const lesson = unit.lessons.find((entry) => entry.no === lessonNo);
    assert.ok(lesson, `${objective.id} evidence lesson ${lessonNo}`);
    assert.ok(
      lesson.slides.some((slide) => slide.title === slideTitle),
      `${objective.id} evidence slide not found: ${slideTitle}`,
    );
  }
  assert.ok(objective.remedy.trim(), `${objective.id} remedy`);
}

const banks = new Map();
const allItems = [];

for (const unitNo of UNIT_NOS) {
  const unit = unitsFile.units.find((entry) => entry.unit === unitNo);
  assert.ok(unit, `A1 unit ${unitNo} must exist`);
  const bankFile = readJson(`src/data/lessons/a1_unit${unitNo}_bank.json`);
  assert.equal(bankFile.level, "A1", `unit ${unitNo} bank level`);
  assert.equal(bankFile.unit, unitNo, `unit ${unitNo} bank unit`);

  const unitObjectives = objectives.filter((objective) => objective.unit === unitNo);
  const unitObjectiveIds = new Set(unitObjectives.map((objective) => objective.id));
  assert.equal(unitObjectives.length, 5, `unit ${unitNo} must have 5 objectives`);

  const policy = objectivesFile.policies.find((entry) => entry.unit === unitNo);
  assert.ok(policy, `unit ${unitNo} policy must exist`);
  assert.equal(policy.itemsPerObjective, 3, `unit ${unitNo} itemsPerObjective`);
  assert.equal(policy.perObjectiveMin, 2, `unit ${unitNo} perObjectiveMin`);
  assert.equal(policy.pass, 70, `unit ${unitNo} pass`);
  assert.equal(policy.poolPerObjective, 5, `unit ${unitNo} poolPerObjective minimum`);
  assert.ok(policy.perObjectiveMin <= policy.itemsPerObjective);
  assert.equal(unitObjectives.length * policy.itemsPerObjective, 15, `unit ${unitNo} checkpoint item count`);
  assert.equal(unit.checkpoint.count, 15, `unit ${unitNo} units_a1 checkpoint count`);
  assert.equal(unit.checkpoint.pass, policy.pass, `unit ${unitNo} units_a1 checkpoint pass`);

  const bankIds = new Set();
  const promptKeys = new Set();
  const items = bankFile.items;
  assert.equal(items.length, EXPECTED_UNIT_BANK[unitNo] ?? 25, `unit ${unitNo} bank count`);
  for (const item of items) {
    assert.ok(item.id && !bankIds.has(item.id), `unit ${unitNo} unique bank id: ${item.id}`);
    bankIds.add(item.id);
    assert.ok(unitObjectiveIds.has(item.objectiveId), `${item.id} objective reference`);
    assert.ok(CODES.has(item.code), `${item.id} drill code`);
    assert.ok(["choice", "type", "order"].includes(item.mode), `${item.id} mode`);
    assert.ok(item.prompt.trim(), `${item.id} prompt`);
    assert.ok(item.sub.trim(), `${item.id} sub`);
    assert.ok(item.answer.trim(), `${item.id} answer`);
    assert.ok(item.explanation.trim(), `${item.id} explanation`);
    const promptKey = normalize(item.prompt);
    assert.ok(!promptKeys.has(promptKey), `${item.id} duplicate prompt`);
    promptKeys.add(promptKey);

    if (item.mode === "choice") {
      assert.ok(Array.isArray(item.options) && item.options.length >= 2, `${item.id} options`);
      assert.equal(new Set(item.options).size, item.options.length, `${item.id} unique options`);
      assert.ok(item.options.includes(item.answer), `${item.id} answer in options`);
      assert.ok(item.wrongFeedback && typeof item.wrongFeedback === "object", `${item.id} wrongFeedback`);
      for (const option of item.options) {
        if (option === item.answer) {
          assert.ok(!(option in item.wrongFeedback), `${item.id} answer must not have wrong feedback`);
        } else {
          assert.ok(item.wrongFeedback[option], `${item.id} feedback for option ${option}`);
        }
      }
      for (const key of Object.keys(item.wrongFeedback)) {
        assert.ok(item.options.includes(key), `${item.id} feedback key must be an option: ${key}`);
        assert.notEqual(key, item.answer, `${item.id} feedback key must not be the answer`);
      }
    }

    if (item.mode === "order") {
      assert.ok(Array.isArray(item.tokens) && item.tokens.length >= 2, `${item.id} tokens`);
      assert.equal(item.tokens.join(" "), item.answer, `${item.id} tokens must build the answer`);
    }

    if (item.altAnswers) {
      assert.ok(Array.isArray(item.altAnswers) && item.altAnswers.every((answer) => typeof answer === "string"));
    }
  }

  for (const objective of unitObjectives) {
    const own = items.filter((item) => item.objectiveId === objective.id);
    assert.equal(
      own.length,
      EXPECTED_OBJECTIVE_POOL[objective.id] ?? policy.poolPerObjective,
      `${objective.id} pool size`,
    );
    assert.ok(
      own.some((item) => item.mode !== "choice"),
      `${objective.id} must have at least one production item`,
    );
  }

  // Prompt soal tidak boleh menyalin contoh slide secara literal. Jawaban pilihan
  // ganda boleh berupa kalimat yang sudah dikenal bila prompt-nya situasi baru;
  // soal produksi (type/order) harus menghasilkan kalimat baru.
  const exampleSentences = new Set();
  for (const lesson of unit.lessons) {
    for (const slide of lesson.slides) {
      if (slide.example_de) exampleSentences.add(normalize(slide.example_de));
      if (slide.example_id) exampleSentences.add(normalize(slide.example_id));
    }
  }
  for (const item of items) {
    assert.ok(!exampleSentences.has(normalize(item.prompt)), `${item.id} prompt must not copy an example`);
    if (item.mode !== "choice") {
      assert.ok(!exampleSentences.has(normalize(item.answer)), `${item.id} production answer must not copy an example`);
    }
  }

  banks.set(unitNo, { unit, bankFile, policy, unitObjectives, items });
  allItems.push(...items);
}

// Uji fungsi checkpoint/remedial yang dipakai UI.
const sourcePath = path.join(root, "src/lessons/objectives.ts");
const optionOrderPath = path.join(root, "src/lessons/optionOrder.ts");
const compileModule = (file) =>
  ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
const optionOrderMod = { exports: {} };
new Function("require", "module", "exports", compileModule(optionOrderPath))(
  createRequire(optionOrderPath),
  optionOrderMod,
  optionOrderMod.exports,
);
const compiled = compileModule(sourcePath);
const mod = { exports: {} };
new Function("require", "module", "exports", compiled)(
  (id) => (id === "./optionOrder" ? optionOrderMod.exports : createRequire(sourcePath)(id)),
  mod,
  mod.exports,
);
const {
  objectiveCheckpointAvailable,
  buildObjectiveCheckpoint,
  buildRemedialItems,
} = mod.exports;

assert.equal(objectiveCheckpointAvailable(13), false, "unit 13 has no objective checkpoint");

const summaries = [];
for (const unitNo of UNIT_NOS) {
  const { policy, unitObjectives, items } = banks.get(unitNo);
  const unitObjectiveIds = new Set(unitObjectives.map((objective) => objective.id));
  assert.equal(objectiveCheckpointAvailable(unitNo), true, `unit ${unitNo} checkpoint available`);

  const plan = buildObjectiveCheckpoint(unitNo);
  assert.ok(plan, `unit ${unitNo} objective checkpoint plan`);
  assert.equal(plan.unitNo, unitNo);
  assert.equal(plan.items.length, 15);
  assert.equal(new Set(plan.items.map((item) => item.key)).size, 15);
  assert.ok(plan.items.every((item) => item.checkpoint === true));
  assert.ok(plan.items.every((item) => item.key.startsWith(`A1:${unitNo}:`)));
  assert.ok(plan.items.every((item) => unitObjectiveIds.has(item.objectiveId)));
  for (const objective of plan.objectives) {
    assert.equal(
      plan.items.filter((item) => item.objectiveId === objective.id).length,
      policy.itemsPerObjective,
      `${objective.id} checkpoint count`,
    );
  }
  for (const item of plan.items.filter((entry) => entry.mode === "order")) {
    assert.notEqual(item.tokens.join(" "), item.answer, `${item.key} tokens must be shuffled`);
  }

  const usedKeys = new Set(plan.items.map((item) => item.key));
  const failedIds = plan.objectives.slice(0, 2).map((objective) => objective.id);
  const remedial = buildRemedialItems(plan, failedIds, usedKeys);
  assert.equal(remedial.length, 4, `unit ${unitNo}: 2 unused items per failed objective`);
  assert.ok(remedial.every((item) => failedIds.includes(item.objectiveId)));
  assert.ok(remedial.every((item) => !usedKeys.has(item.key)), "remedial must use unused items");

  const exhausted = buildRemedialItems(plan, failedIds, new Set(plan.pool.map((item) => item.key)));
  assert.equal(exhausted.length, 0, "exhausted pool yields no remedial items");

  // Retry mengutamakan soal yang belum dipakai, tetapi tetap 3 per tujuan.
  const retry = buildObjectiveCheckpoint(unitNo, usedKeys);
  assert.ok(retry, `unit ${unitNo} retry plan`);
  assert.equal(retry.items.length, 15);
  for (const objective of retry.objectives) {
    const own = retry.items.filter((item) => item.objectiveId === objective.id);
    assert.equal(own.length, 3);
    assert.ok(own.filter((item) => usedKeys.has(item.key)).length <= 1, `${objective.id} retry prefers fresh items`);
  }

  summaries.push(
    `Unit ${unitNo}: ${unitObjectives.length} objectives, ${items.length} bank items, ` +
      `checkpoint ${plan.items.length}, remedial ${remedial.length}`,
  );
}

// ---------------------------------------------------------------------------
// P3 regresi deterministik: soal produksi (mode type/order) tidak boleh
// terlewat saat checkpoint diacak. Tujuan yang memang punya produksi wajib
// memuat minimal satu, termasuk seed 1 yang sebelumnya memilih tiga pilihan
// ganda untuk a1-u1-o1 (o1-02/o1-04/o1-03) dan melewatkan o1-05 (type).
// ---------------------------------------------------------------------------
const { mulberry32 } = optionOrderMod.exports;
const isProductionMode = (item) => item.mode === "type" || item.mode === "order";

const seed1Plan = buildObjectiveCheckpoint(1, new Set(), mulberry32(1));
assert.ok(seed1Plan, "seed 1: plan unit 1");
const seed1o1 = seed1Plan.items.filter((item) => item.objectiveId === "a1-u1-o1");
assert.equal(seed1o1.length, 3, "seed 1: a1-u1-o1 tetap 3 item");
assert.ok(
  seed1o1.some((item) => item.key === "A1:1:o1-05" && isProductionMode(item)),
  "seed 1: a1-u1-o1 memuat o1-05 (mode ketik)",
);
assert.equal(seed1Plan.items.length, 15, "seed 1: total 15 item");
assert.equal(new Set(seed1Plan.items.map((item) => item.key)).size, 15, "seed 1: 15 kunci unik");

// Banyak seed x semua unit: setiap tujuan yang bank-nya memuat produksi harus
// menyertakan minimal satu produksi; 3 item per tujuan dan 15 total tetap.
for (let seed = 1; seed <= 120; seed++) {
  for (const unitNo of UNIT_NOS) {
    const { unitObjectives, items } = banks.get(unitNo);
    const plan = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(seed));
    assert.ok(plan, `seed ${seed} unit ${unitNo}: plan`);
    assert.equal(plan.items.length, 15, `seed ${seed} unit ${unitNo}: 15 item`);
    for (const objective of unitObjectives) {
      const own = plan.items.filter((item) => item.objectiveId === objective.id);
      assert.equal(own.length, 3, `seed ${seed} ${objective.id}: 3 item`);
      const bankOwn = items.filter((item) => item.objectiveId === objective.id);
      if (bankOwn.some(isProductionMode)) {
        assert.ok(
          own.some(isProductionMode),
          `seed ${seed} ${objective.id}: minimal satu item produksi`,
        );
      }
    }
  }
}

// Retry memakai kunci percobaan pertama: produksi tetap hadir, fresh-first
// tetap terjaga (<= 1 item terpakai per tujuan), dan o1-05 yang merupakan
// satu-satunya produksi a1-u1-o1 tetap dipakai walaupun kuncinya terpakai.
for (let seed = 1; seed <= 40; seed++) {
  for (const unitNo of UNIT_NOS) {
    const { unitObjectives, items } = banks.get(unitNo);
    const first = buildObjectiveCheckpoint(unitNo, new Set(), mulberry32(seed));
    const usedKeys = new Set(first.items.map((item) => item.key));
    const retry = buildObjectiveCheckpoint(unitNo, usedKeys, mulberry32(seed + 1000));
    assert.ok(retry, `retry seed ${seed} unit ${unitNo}: plan`);
    assert.equal(retry.items.length, 15, `retry seed ${seed} unit ${unitNo}: 15 item`);
    for (const objective of unitObjectives) {
      const own = retry.items.filter((item) => item.objectiveId === objective.id);
      assert.equal(own.length, 3, `retry seed ${seed} ${objective.id}: 3 item`);
      assert.ok(
        own.filter((item) => usedKeys.has(item.key)).length <= 1,
        `retry seed ${seed} ${objective.id}: fresh-first`,
      );
      const bankOwn = items.filter((item) => item.objectiveId === objective.id);
      if (bankOwn.some(isProductionMode)) {
        assert.ok(
          own.some(isProductionMode),
          `retry seed ${seed} ${objective.id}: minimal satu item produksi`,
        );
      }
      if (objective.id === "a1-u1-o1") {
        assert.ok(
          own.some((item) => item.key === "A1:1:o1-05"),
          `retry seed ${seed} a1-u1-o1: o1-05 sebagai satu-satunya produksi`,
        );
      }
    }
  }
}

// Uji feedback benar, salah terpetakan, dan kesalahan yang tidak dikenal.
const loadTs = (rel, overrides = {}) => {
  const file = path.join(root, rel);
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) =>
    Object.prototype.hasOwnProperty.call(overrides, id) ? overrides[id] : createRequire(file)(id);
  new Function("require", "module", "exports", output)(localRequire, loaded, loaded.exports);
  return loaded.exports;
};

const answersModule = loadTs("src/srs/answers.ts");
const { feedbackFor } = loadTs("src/lessons/feedback.ts", { "../srs/answers": answersModule });
const { checkWord } = answersModule;

for (const unitNo of UNIT_NOS) {
  const { items } = banks.get(unitNo);
  const choiceItem = items.find(
    (item) => item.mode === "choice" && item.wrongFeedback && Object.keys(item.wrongFeedback).length > 0,
  );
  const wrongOption = Object.keys(choiceItem.wrongFeedback)[0];
  assert.equal(feedbackFor(choiceItem, true, ""), choiceItem.explanation);
  assert.equal(feedbackFor(choiceItem, false, wrongOption), choiceItem.wrongFeedback[wrongOption]);
  assert.equal(
    feedbackFor(choiceItem, false, "jawaban yang tidak dipetakan"),
    choiceItem.hintOnWrong ?? choiceItem.explanation,
  );
  const productionItem = items.find((item) => item.mode !== "choice" && item.hintOnWrong);
  assert.equal(feedbackFor(productionItem, false, "jawaban salah"), productionItem.hintOnWrong);
}

assert.equal(checkWord("heisse", "heiße"), true, "ae/ss alternative accepted");
assert.equal(checkWord("HEISSE", "heiße"), true, "case and alternative accepted");
assert.equal(checkWord("heißst", "heißt"), false, "wrong form rejected");

console.log(
  `A1 objective inventory OK:\n  ${summaries.join("\n  ")}\n` +
    "Checkpoint keys per unit, retry fresh-first, remedial dari pool tak terpakai, " +
    "feedback benar/salah/tak dikenal, dan jawaban alternatif lolos.",
);
