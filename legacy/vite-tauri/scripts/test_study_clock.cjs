const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/stats/studyClock.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const originalNow = Date.now;
let now = 100_000, handler, cleared = false, total = 0;
let fireInput = () => {};
const docHandlers = new Map();
Date.now = () => now;
global.document = {
  visibilityState: "visible",
  hasFocus: () => true,
  addEventListener(name, fn) { docHandlers.set(name, fn); },
  removeEventListener(name) { docHandlers.delete(name); },
};
global.window = {
  addEventListener(name, fn) { if (name === "keydown") fireInput = fn; },
  removeEventListener() {},
  setInterval(fn) { handler = fn; return 1; }, clearInterval() { cleared = true; },
};
const fakeDb = { async execute(_sql, values) { total += Number(values[1]); } };
const mod = { exports: {} };
new Function("require", "module", "exports", code)(() => ({ __esModule: true, default: async () => fakeDb, todayLocal: () => "2026-11-10" }), mod, mod.exports);
const settle = () => new Promise((resolve) => setImmediate(resolve));
(async () => {
  const stop = mod.exports.startStudyClock();
  // 1. App open, no interaction at all: nothing may be recorded.
  now += 15_000; handler(); await settle();
  assert.equal(total, 0, "idle app without input must not add study time");
  // 2. Real input, then active ticks count.
  fireInput();
  now += 15_000; handler(); await settle();
  assert.equal(total, 15_000, "first active 15s window counts");
  now += 15_000; handler(); await settle();
  assert.equal(total, 30_000, "second active 15s window counts");
  // 3. Past the idle limit, further ticks add nothing.
  now += 15_000; handler(); await settle();
  assert.equal(total, 30_000, "idle time after the activity window must not be counted");
  now += 15_000; handler(); await settle();
  assert.equal(total, 30_000, "staying idle keeps the total flat");
  // 4. Hidden window never counts, even with input.
  fireInput();
  document.visibilityState = "hidden";
  now += 15_000; handler(); await settle();
  assert.equal(total, 30_000, "hidden time must not be counted");
  // 5. Cleanup removes listeners and the timer.
  document.visibilityState = "visible";
  stop();
  assert.equal(cleared, true);
  assert.equal(docHandlers.size, 0, "visibilitychange listener removed on stop");
  console.log("Study clock counts only active, visible time and ignores idle/hidden periods.");
})().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => { Date.now = originalNow; });
