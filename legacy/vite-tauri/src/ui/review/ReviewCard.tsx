import { useEffect, useRef, useState } from "react";
import { useSrsSession } from "../../srs/session";
import type { QueueItem } from "../../srs/queue";
import {
  GRADES,
  GRADE_LABEL,
  previewInterval,
  rowToCard,
  type GradeKey,
  type SrsRow,
} from "../../srs/fsrs";
import { loadSrsRow } from "../../srs/review";
import { checkProduce, checkWord, clozeMask, findTargetToken } from "../../srs/answers";
import { speak } from "../../srs/tts";

const TYPE_LABEL: Record<string, string> = {
  recog: "Kenali — DE → ID",
  produce: "Produksi — ID → DE (dengan artikel)",
  listen: "Dengar → tulis",
  cloze: "Cloze kalimat contoh",
};

function HintUmlaut({ onInsert }: { onInsert: (ch: string) => void }) {
  return (
    <div className="mt-2 flex gap-1">
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

function InputAnswer({
  value,
  onChange,
  onEnter,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <input
      ref={ref}
      aria-label="Jawaban kartu review"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== "Enter" || e.defaultPrevented || e.repeat || e.nativeEvent.isComposing ||
          e.keyCode === 229 || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        onEnter();
      }}
      placeholder={placeholder}
      className="mt-3 w-full max-w-sm rounded border border-line bg-cream px-3 py-2 font-display text-lg outline-none focus:border-gold"
    />
  );
}

export default function ReviewCard() {
  const phase = useSrsSession((s) => s.phase);
  const queue = useSrsSession((s) => s.queue);
  const index = useSrsSession((s) => s.index);
  const itemStartedAt = useSrsSession((s) => s.itemStartedAt);
  const reveal = useSrsSession((s) => s.reveal);
  const grade = useSrsSession((s) => s.grade);

  const [input, setInput] = useState("");
  const [gradeError, setGradeError] = useState("");
  const [srsRow, setSrsRow] = useState<SrsRow | null>(null);
  const firstGradeRef = useRef<HTMLButtonElement>(null);
  const item: QueueItem | undefined = queue[index];
  const { entry } = item ?? { entry: null as never };

  useEffect(() => {
    setSrsRow(null);
    if (item) {
      loadSrsRow(item.card_id).then(setSrsRow);
    }
    if (phase === "front" && item?.type === "listen") speak(entry.de);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index]);

  useEffect(() => { setInput(""); setGradeError(""); }, [index]);

  // P9: setelah jawaban tampil, klik/Enter mengubah phase dan elemen yang
  // dihapus kehilangan fokus ke BODY. Pindahkan fokus ke aksi berikutnya yang
  // terlihat (tombol nilai pertama) bila memang tidak ada yang aktif.
  useEffect(() => {
    if (phase === "back" && document.activeElement === document.body) {
      firstGradeRef.current?.focus();
    }
  }, [phase]);

  const commitGrade = async (gradeKey: GradeKey) => {
    setGradeError("");
    try { await grade(gradeKey, Date.now() - itemStartedAt); }
    catch (error) { setGradeError(`Review belum tersimpan. Coba lagi: ${String(error)}`); }
  };

  // Shortcut: Enter membuka jawaban; 1–4 menilai sisi belakang.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.isComposing || e.keyCode === 229 ||
        e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.isContentEditable || target?.closest?.("input, textarea, select")) return;
      if (e.key === "Enter" && target?.closest?.("button, a, [role=button]")) return;
      if (phase === "front" && e.key === "Enter" && (item?.type === "recog" || (e.target as HTMLElement)?.tagName !== "INPUT" && input.trim())) {
        e.preventDefault();
        reveal();
      }
      if (phase === "back") {
        const map: Record<string, GradeKey> = { "1": "again", "2": "hard", "3": "good", "4": "easy" };
        const g = map[e.key];
        if (g) {
          e.preventDefault();
          void commitGrade(g);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [phase, reveal, grade, itemStartedAt, item?.type, input]);

  if (!item) return null;
  const isNoun = entry.kind === "noun";

  // Cloze: token target dari kalimat contoh.
  const clozeInfo =
    item.type === "cloze" && entry.example_de ? findTargetToken(entry.example_de, entry.de) : null;
  const clozeSentence = entry.example_de ?? "";

  const doSubmit = () => {
    if (item.type === "produce" || item.type === "listen" || item.type === "cloze") {
      if (input.trim()) reveal();
    } else {
      reveal();
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center text-[11px] uppercase tracking-wide text-ink-soft">
        Kartu {index + 1} / {queue.length} · {TYPE_LABEL[item.type]}
      </div>

      <div className="card mt-3 px-10 py-10 text-center">
        {/* ---- DEPAN ---- */}
        {phase === "front" && (
          <div>
            {item.type === "recog" && (
              <>
                <div className="font-display text-5xl">
                  {isNoun ? (
                    <span>
                      <span className="text-gold-deep">{entry.article}</span> {entry.de}
                    </span>
                  ) : (
                    entry.de
                  )}
                </div>
                <p className="mt-4 text-sm text-ink-soft">Ingat artinya, lalu tekan Enter / lihat jawaban.</p>
                <button onClick={reveal} className="btn-gold mt-6">
                  Lihat jawaban
                </button>
              </>
            )}

            {item.type === "produce" && (
              <>
                <div className="font-display text-4xl">{entry.meaning_id}</div>
                <p className="mt-4 text-sm text-ink-soft">
                  {isNoun ? "Ketik artikel + kata (contoh: die Frau)." : "Ketik kata Jermannya."}
                </p>
                <InputAnswer value={input} onChange={setInput} onEnter={doSubmit} placeholder="…" />
                <HintUmlaut onInsert={(ch) => setInput((s) => s + ch)} />
                <button onClick={doSubmit} className="btn-gold mt-4" disabled={!input.trim()}>
                  Cek jawaban
                </button>
              </>
            )}

            {item.type === "listen" && (
              <>
                <button
                  onClick={() => speak(entry.de)}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-gold bg-cream text-3xl"
                  title="Putar lagi"
                  aria-label="Putar ulang kata"
                >
                  🔊
                </button>
                <p className="mt-4 text-sm text-ink-soft">Ketik kata yang terdengar.</p>
                <InputAnswer value={input} onChange={setInput} onEnter={doSubmit} placeholder="…" />
                <HintUmlaut onInsert={(ch) => setInput((s) => s + ch)} />
                <button onClick={doSubmit} className="btn-gold mt-4" disabled={!input.trim()}>
                  Cek jawaban
                </button>
              </>
            )}

            {item.type === "cloze" && clozeInfo && (
              <>
                <div className="font-display text-2xl leading-relaxed">
                  {clozeMask(clozeSentence, clozeInfo.token)}
                </div>
                <p className="mt-4 text-sm text-ink-soft">Isi bagian yang hilang (kata utuh).</p>
                <InputAnswer value={input} onChange={setInput} onEnter={doSubmit} placeholder="…" />
                <HintUmlaut onInsert={(ch) => setInput((s) => s + ch)} />
                <button onClick={doSubmit} className="btn-gold mt-4" disabled={!input.trim()}>
                  Cek jawaban
                </button>
              </>
            )}
            {item.type === "cloze" && !clozeInfo && <p className="text-sm text-ink-soft">Contoh belum mendukung cloze — tekan Enter.</p>}
          </div>
        )}

        {/* ---- BELAKANG ---- */}
        {phase === "back" && (
          <div>
            {gradeError && <p role="alert" className="mb-3 text-sm text-rose-700">{gradeError}</p>}
            <div className="font-display text-5xl">
              {isNoun ? (
                <span>
                  <span className="text-gold-deep">{entry.article}</span> {entry.de}
                </span>
              ) : (
                entry.de
              )}
            </div>
            {entry.plural ? <div className="mt-1 text-sm text-ink-soft">Plural: {entry.plural}</div> : null}
            <div className="mt-3 text-xl">{entry.meaning_id}</div>
            {entry.example_de ? (
              <div className="mt-4 rounded border border-line-soft bg-parchment px-4 py-3 text-sm">
                <div className="font-display">{entry.example_de}</div>
                {entry.example_id ? <div className="mt-1 text-ink-soft">{entry.example_id}</div> : null}
                <button onClick={() => speak(entry.example_de ?? "")} className="mt-2 text-xs text-gold-deep">
                  🔊 Terjemahan
                </button>
              </div>
            ) : null}

            {item.type !== "recog" && (
              <div className="mt-3 text-sm">
                {item.type === "produce" && checkProduce(input, entry.article, entry.de) && (
                  <span className="text-emerald-700">✔ jawabanmu benar</span>
                )}
                {item.type !== "produce" && checkWord(input, item.type === "cloze" ? clozeInfo?.token ?? entry.de : entry.de) && (
                  <span className="text-emerald-700">✔ betul: {input}</span>
                )}
                {item.type !== "produce" && !checkWord(input, item.type === "cloze" ? clozeInfo?.token ?? entry.de : entry.de) && input.trim() && (
                  <span className="text-rose-700">
                    jawabanmu: <b>{input}</b> — jawabannya <b>{item.type === "cloze" ? clozeInfo?.token ?? entry.de : entry.de}</b>
                  </span>
                )}
                {item.type === "produce" && !checkProduce(input, entry.article, entry.de) && input.trim() && (
                  <span className="text-rose-700">
                    jawabanmu: <b>{input}</b> — yang benar <b>{(entry.article ?? "") + " " + entry.de}</b>
                  </span>
                )}
              </div>
            )}

            {/* Grade: FSRS + interval pratinjau */}
            <div className="mt-6 grid grid-cols-4 gap-2">
              {GRADES.map((g, i) => (
                <button
                  key={g.key}
                  ref={i === 0 ? firstGradeRef : undefined}
                  onClick={() => void commitGrade(g.key)}
                  className="rounded border border-line bg-cream px-2 py-2 text-sm hover:border-gold hover:bg-parchment"
                >
                  <span className="block text-xs text-ink-soft">{i + 1}</span>
                  <b>{GRADE_LABEL[g.rating]}</b>
                  <span className="mt-0.5 block text-[10px] text-ink-soft">
                    {previewInterval(srsRow ? rowToCard(srsRow) : null, g.key)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
