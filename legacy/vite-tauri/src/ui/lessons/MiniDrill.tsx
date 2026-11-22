// Thumb drill & checkpoint: mesin kuis ringkas yang memakai bank item F2.
import { useEffect, useRef, useState } from "react";
import type { DrillItem } from "../../drills/items";
import { recordAttempt } from "../../drills/attempts";
import { checkWord } from "../../srs/answers";
import { speak } from "../../srs/tts";
import type { DrillDraft } from "../../lessons/drillDraft";
import { feedbackFor } from "../../lessons/feedback";
import { choiceMatches } from "../../lessons/answerMatch";

type Props = {
  items: DrillItem[];
  onDone: (correct: number, total: number) => void;
  onItemResult?: (item: DrillItem, correct: boolean, chosen: string) => void;
  onSkip?: () => void;
  doneLabel?: string;
  draft?: DrillDraft | null;
  onDraftChange?: (draft: DrillDraft) => void;
  sessionId?: string;
  draftKey?: string;
};

function Umlaut({ onInsert }: { onInsert: (ch: string) => void }) {
  return (
    <div className="mt-2 flex justify-center gap-1">
      {["ä", "ö", "ü", "ß"].map((ch) => (
        <button
          key={ch}
          onClick={() => onInsert(ch)}
          className="h-7 w-7 rounded border border-line bg-cream font-display text-sm hover:bg-parchment"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

export default function MiniDrill({
  items,
  onDone,
  onItemResult,
  onSkip,
  doneLabel = "Selesai",
  draft,
  onDraftChange,
  sessionId,
  draftKey,
}: Props) {
  const [index, setIndex] = useState(draft?.index ?? 0);
  const [input, setInput] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [correct, setCorrect] = useState<boolean | null>(draft?.correct ?? null);
  const [explanation, setExplanation] = useState(
    draft?.correct == null
      ? ""
      : draft.correct
        ? items[draft.index]?.explanation ?? ""
        : items[draft.index]?.hintOnWrong ?? items[draft.index]?.explanation ?? "",
  );
  const [correctCount, setCorrectCount] = useState(draft?.correctCount ?? 0);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const busyRef = useRef(false);
  const startedAt = useRef(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<() => void>(() => {});

  const item = items[index];

  useEffect(() => {
    setSaveError("");
    startedAt.current = Date.now();
    if (item?.mode === "type") {
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [index, item?.mode]);

  useEffect(() => {
    if (correct !== null && document.activeElement === document.body) {
      nextButtonRef.current?.focus();
    }
  }, [correct]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || event.repeat || event.defaultPrevented ||
        event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || correct === null) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, input, textarea, select, a, [contenteditable=true]")) return;
      event.preventDefault();
      nextRef.current();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [correct]);

  if (!item) {
    return (
      <div className="card px-6 py-8 text-center text-sm text-ink-soft">
        Tidak ada item untuk latihan ini.
        {onSkip ? (
          <button className="btn-gold mt-4 block mx-auto" onClick={onSkip}>
            Lewati
          </button>
        ) : null}
      </div>
    );
  }

  const answer = async (isCorrect: boolean, chosen = "") => {
    if (correct !== null || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setSaveError("");
    try {
      const count = correctCount + (isCorrect ? 1 : 0);
      const nextDraft: DrillDraft = { items, index, correct: isCorrect, correctCount: count, sessionId };
      const attempt = await recordAttempt(item, isCorrect, Date.now() - startedAt.current, {
        sessionId,
        draftKey,
        draft: draftKey ? nextDraft : undefined,
      });
      // Verdict canonical dari ledger; retry yang kalah cepat tidak boleh
      // mengubah tampilan verdict attempt pertama.
      const canonical = attempt.correct;
      const canonicalCount = correctCount + (canonical ? 1 : 0);
      const canonicalDraft: DrillDraft = {
        items,
        index,
        correct: canonical,
        correctCount: canonicalCount,
        sessionId,
      };
      onItemResult?.(item, canonical, chosen);
      onDraftChange?.(canonicalDraft);
      setCorrect(canonical);
      // Jika verdict berasal dari attempt lama, jangan menilai opsi klik baru
      // yang tidak tersimpan; pakai hint/penjelasan umum.
      setExplanation(attempt.reused
        ? (item.hintOnWrong ?? item.explanation)
        : feedbackFor(item, canonical, chosen));
      setCorrectCount(canonicalCount);
    } catch (e) {
      setSaveError(`Jawaban belum tersimpan. Silakan coba lagi: ${String(e)}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const submitTyped = () => {
    if (!input.trim()) return;
    const expected = [item.answer, ...(item.altAnswers ?? [])];
    void answer(expected.some((a) => checkWord(input, a)), input);
  };

  const submitOrder = () => {
    if (!item.tokens) return;
    const text = order.map((i) => item.tokens?.[i] ?? "").join(" ");
    const expected = [item.answer, ...(item.altAnswers ?? [])];
    void answer(expected.some((a) => checkWord(text, a)), text);
  };

  const next = () => {
    if (index + 1 >= items.length) {
      onDone(correctCount, items.length);
      return;
    }
    onDraftChange?.({ items, index: index + 1, correct: null, correctCount });
    setInput("");
    setOrder([]);
    setCorrect(null);
    setExplanation("");
    setIndex((i) => i + 1);
  };
  nextRef.current = next;

  const isLast = index + 1 >= items.length;

  return (
    <div className="card px-6 py-6 sm:px-8">
      <div className="flex items-center justify-between text-[11px] text-ink-soft">
        <span>
          Item {index + 1} / {items.length}
        </span>
        {onSkip ? (
          <button className="underline hover:text-ink" disabled={busy} onClick={onSkip}>
            Lewati latihan
          </button>
        ) : null}
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
        <div
          className="h-full bg-gold transition-all"
          style={{ width: `${Math.round(((index + (correct !== null ? 1 : 0)) / items.length) * 100)}%` }}
        />
      </div>

      <div className="mt-5 text-center">
        {saveError && <p role="alert" className="mb-3 text-sm text-rose-700">{saveError}</p>}
        <div className="font-display text-2xl sm:text-3xl">{item.prompt}</div>
        <p className="mt-2 text-sm text-ink-soft">{item.sub}</p>
        {item.say ? (
          <button
            className="mt-2 rounded border border-line px-3 py-1 text-xs hover:bg-parchment"
            onClick={() => speak(item.say as string)}
          >
            🔊 Dengarkan
          </button>
        ) : null}

        {correct === null && item.mode === "choice" && item.options && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {item.options.map((opt, i) => (
              <button
                key={`${opt}-${i}`}
                disabled={busy}
                onClick={() => void answer(choiceMatches(opt, item), opt)}
                className="min-w-24 rounded border border-line bg-cream px-4 py-2 font-display text-lg hover:border-gold hover:bg-parchment disabled:opacity-50"
              >
                <span className="mr-2 text-xs text-ink-soft">{i + 1}</span>
                {opt}
              </button>
            ))}
          </div>
        )}

        {correct === null && item.mode === "type" && (
          <div className="mt-5">
            <input
              ref={inputRef}
              aria-label="Jawaban latihan"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitTyped();
                }
              }}
              className="w-full max-w-sm rounded border border-line bg-cream px-3 py-2 text-center font-display text-xl outline-none focus:border-gold"
              placeholder="…"
            />
            <Umlaut onInsert={(ch) => setInput((s) => s + ch)} />
            <div className="mt-3">
              <button className="btn-gold" disabled={!input.trim() || busy} onClick={submitTyped}>
                Jawab
              </button>
            </div>
          </div>
        )}

        {correct === null && item.mode === "order" && item.tokens && (
          <div className="mt-5">
            <div className="mx-auto min-h-12 max-w-xl rounded border border-dashed border-line bg-parchment px-3 py-2 text-left font-display text-lg">
              {order.length === 0 ? (
                <span className="text-sm text-ink-soft">Tap kata untuk menyusun…</span>
              ) : (
                order.map((tokenIndex, pos) => (
                  <button
                    key={`${tokenIndex}-${pos}`}
                    className="mr-1.5 rounded border border-gold/40 bg-cream px-2 py-0.5"
                    onClick={() => setOrder((prev) => prev.filter((_, i) => i !== pos))}
                  >
                    {item.tokens?.[tokenIndex]}
                  </button>
                ))
              )}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {item.tokens.map((tok, i) =>
                order.includes(i) ? null : (
                  <button
                    key={i}
                    className="rounded border border-line bg-cream px-3 py-1.5 font-display text-lg hover:border-gold"
                    onClick={() => setOrder((prev) => [...prev, i])}
                  >
                    {tok}
                  </button>
                ),
              )}
            </div>
            <div className="mt-3">
              <button
                className="btn-gold"
                disabled={order.length !== item.tokens.length || busy}
                onClick={submitOrder}
              >
                Periksa susunan
              </button>
            </div>
          </div>
        )}

        {correct !== null && (
          <div className="mt-4">
            <div className={`text-lg font-semibold ${correct ? "text-emerald-700" : "text-rose-700"}`}>
              {correct ? "✔ Richtig!" : "✘ Nicht ganz."}
              {!correct ? (
                <span className="ml-1 text-sm font-normal">
                  Jawaban: <b>{item.answer}</b>
                </span>
              ) : null}
            </div>
            <p className="mx-auto mt-2 max-w-lg text-sm text-ink-soft">{explanation}</p>
            <button ref={nextButtonRef} className="btn-gold mt-4" onClick={next}>
              {isLast ? doneLabel : "Lanjut (Enter)"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
