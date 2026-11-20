import getDb, { todayLocal } from "../stores/db";

// Study time only counts while the user is actually interacting. The old clock
// credited every visible 15-second tick, so an app left open on screen silently
// accumulated study time. Now a tick is only credited inside the activity window
// after the last real input, and gaps (hidden, blurred, or idle) are dropped.
const IDLE_LIMIT_MS = 30_000;

export function startStudyClock(): () => void {
  let lastInput = 0;
  let lastTick = Date.now();
  let stopped = false;
  const markInput = () => { lastInput = Date.now(); };
  // Do not credit the gap while the window was hidden or unfocused.
  const resetTick = () => { lastTick = Date.now(); };
  const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
  events.forEach((name) => window.addEventListener(name, markInput, { passive: true }));
  document.addEventListener("visibilitychange", resetTick);
  window.addEventListener("focus", resetTick);
  window.addEventListener("blur", resetTick);
  const flush = async () => {
    const now = Date.now();
    const start = lastTick;
    lastTick = now;
    if (stopped || document.visibilityState !== "visible" || !document.hasFocus()) return;
    if (lastInput === 0) return;
    const activeUntil = Math.min(now, lastInput + IDLE_LIMIT_MS);
    const elapsed = Math.min(activeUntil - start, 15_000);
    if (elapsed <= 0) return;
    const db = await getDb();
    await db.execute(
      "INSERT INTO config(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=CAST(CAST(config.value AS INTEGER)+CAST(excluded.value AS INTEGER) AS TEXT)",
      [`study_ms:${todayLocal()}`, String(elapsed)],
    );
  };
  const timer = window.setInterval(() => { void flush().catch((e) => console.error("study clock:", e)); }, 15_000);
  return () => {
    stopped = true;
    window.clearInterval(timer);
    events.forEach((name) => window.removeEventListener(name, markInput));
    document.removeEventListener("visibilitychange", resetTick);
    window.removeEventListener("focus", resetTick);
    window.removeEventListener("blur", resetTick);
  };
}
