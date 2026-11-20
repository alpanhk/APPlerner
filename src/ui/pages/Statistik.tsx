// Statistik (F5): streak, heatmap, forecast SRS, mastery kurikulum, kelemahan,
// kesiapan A1. Semua angka berasal dari loadStats() → tabel nyata di SQLite.
import { useEffect, useState } from "react";
import PageShell from "../PageShell";
import { loadStats, type Stats } from "../../stats/queries";
import { weekdayIndexMondayFirst, WEEKDAY_ID } from "../../stats/dates";
import { DRILL_META } from "../../drills/items";
import { useNav } from "../../stores/nav";
import getDb from "../../stores/db";
import { loadSession } from "../../lessons/sessionRepository";
import type { ExamResult, ExamSession } from "./latihanState";
import { chooseMockResult, sessionKeys } from "./latihanState";

const HEAT_CLASS = (n: number) => {
  if (n <= 0) return "bg-line-soft";
  if (n < 10) return "bg-gold/20";
  if (n < 20) return "bg-gold/40";
  if (n < 40) return "bg-gold/70";
  return "bg-gold-deep";
};

function Metric({ value, label, hint }: { value: string | number; label: string; hint?: string }) {
  return (
    <div className="rounded border border-line bg-cream px-4 py-3">
      <div className="font-display text-2xl text-gold-deep">{value}</div>
      <div className="mt-0.5 text-[11px] text-ink-soft">{label}</div>
      {hint ? <div className="mt-1 text-[10px] text-ink-soft/80">{hint}</div> : null}
    </div>
  );
}

function Bar({ value, tone = "gold" }: { value: number; tone?: "gold" | "emerald" | "rose" }) {
  const color =
    tone === "emerald" ? "bg-emerald-600" : tone === "rose" ? "bg-rose-600" : "bg-gold";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
      <div
        className={"h-full " + color}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function Heatmap({ data }: { data: Stats["activity"] }) {
  const offset = data.length ? weekdayIndexMondayFirst(data[0].date) : 0;
  const blanks = Array.from({ length: offset });
  const dayName = (key: string) => WEEKDAY_ID[(weekdayIndexMondayFirst(key) + 1) % 7];
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex flex-col gap-1 py-0.5 text-[10px] leading-[14px] text-ink-soft">
          {["Sen", "", "Rab", "", "Jum", "", "Min"].map((label, i) => (
            <span key={i} className="h-3.5">
              {label}
            </span>
          ))}
        </div>
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {blanks.map((_, i) => (
            <div key={`b${i}`} className="h-3.5 w-3.5 rounded-sm bg-transparent" />
          ))}
          {data.map((d) => (
            <div
              key={d.date}
              title={`${dayName(d.date)} ${d.date} · ${d.attempts} jawaban · ${d.minutes} menit`}
              className={"h-3.5 w-3.5 rounded-sm " + HEAT_CLASS(d.attempts || (d.active ? 1 : 0))}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-ink-soft">
        <span>sepi</span>
        <span className="h-3 w-3 rounded-sm bg-line-soft" />
        <span className="h-3 w-3 rounded-sm bg-gold/20" />
        <span className="h-3 w-3 rounded-sm bg-gold/40" />
        <span className="h-3 w-3 rounded-sm bg-gold/70" />
        <span className="h-3 w-3 rounded-sm bg-gold-deep" />
        <span>ramai</span>
        <span className="ml-auto">12 minggu terakhir · warna = jumlah jawaban per hari</span>
      </div>
    </div>
  );
}

export default function Statistik() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [mockResult, setMockResult] = useState<ExamResult | null>(null);
  const [objectiveSnapshots, setObjectiveSnapshots] = useState<
    Array<{
      unit: number;
      ts: string;
      score: number;
      pass: boolean;
      best_score?: number;
      ever_passed?: boolean;
      objectives: Array<{ id: string; title: string; correct: number; total: number; pass: boolean }>;
    }>
  >([]);
  const startDrill = useNav((s) => s.startDrill);
  const setPage = useNav((s) => s.setPage);

  useEffect(() => {
    let alive = true;
    getDb()
      .then((db) =>
        Promise.all([
          db.select<{ value: string }[]>("SELECT value FROM config WHERE key = 'mock_a1_last_result'"),
          db.select<{ key: string; value: string }[]>(
            "SELECT key, value FROM config WHERE key LIKE 'objective_result:%' ORDER BY key",
          ),
          loadSession<ExamSession>(sessionKeys.exam),
        ]),
      )
      .then(([mockRows, objectiveRows, examSession]) => {
        if (!alive) return;
        // Hasil Uji A1 berasal dari commit sesi yang sama dengan status
        // finished. Config hanya fallback hasil lama (backwards-compatible).
        const configResult = mockRows.length > 0 ? (JSON.parse(mockRows[0].value) as ExamResult) : null;
        const chosen = chooseMockResult(examSession?.data, configResult);
        if (chosen) setMockResult(chosen);
        const parsed = objectiveRows.flatMap((row) => {
          try {
            return [JSON.parse(row.value)];
          } catch {
            return [];
          }
        });
        setObjectiveSnapshots(parsed);
      })
      .catch((e) => console.error("result snapshots:", e));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    loadStats()
      .then((s) => alive && setStats(s))
      .catch((e) => {
        console.error(e);
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
    };
  }, []);

  if (error) {
    return (
      <PageShell title="Statistik Belajar" sub="Gagal memuat data." meta="M3 · F5">
        <div className="card px-6 py-6 text-sm text-rose-700">{error}</div>
      </PageShell>
    );
  }

  if (!stats) {
    return (
      <PageShell title="Statistik Belajar" sub="Menghitung dari database…" meta="M3 · F5">
        <div className="card px-6 py-8 text-sm text-ink-soft">Memuat statistik…</div>
      </PageShell>
    );
  }

  const { today, week, totals, streak, forecast, srs, units, weak, reading, skills } = stats;
  const accToday = today.attempts ? Math.round((today.correct / today.attempts) * 100) : null;
  const accWeek = week.attempts ? Math.round((week.correct / week.attempts) * 100) : null;
  const goalPct = Math.min(100, Math.round((today.minutes / today.goalMin) * 100));
  const futureDays = forecast.buckets;
  const maxForecast = Math.max(1, ...futureDays.map((b) => b.count));
  const readyScores = skills.map((s) => s.score).filter((s): s is number => s !== null);
  const readiness = readyScores.length
    ? Math.round(readyScores.reduce((a, b) => a + b, 0) / readyScores.length)
    : null;

  // Zero state (PRD F5): hari pertama pakai panduan singkat, bukan panel kosong.
  if (totals.attempts === 0 && totals.activeDays === 0) {
    return (
      <PageShell
        title="Statistik Belajar"
        sub="Belum ada aktivitas tercatat — statistik akan terisi otomatis setelah sesi pertama."
        meta="M3 · F5"
      >
        <div className="card px-8 py-8">
          <h3 className="font-display text-2xl">Mulai dari satu sesi kecil</h3>
          <ol className="mt-4 space-y-2 text-sm text-ink-soft">
            <li>
              <b className="text-ink">1.</b> Buka tab <b>Hari Ini</b>, kerjakan antrian SRS (±5 menit).
            </li>
            <li>
              <b className="text-ink">2.</b> Lanjut satu drill D1–D10 (±3 menit) — jawaban salah
              langsung masuk daftar kelemahan di layar ini.
            </li>
            <li>
              <b className="text-ink">3.</b> Baca satu teks A1 di tab <b>Membaca</b>, simpan kata baru.
            </li>
          </ol>
          <p className="mt-4 text-xs text-ink-soft">
            Streak dihitung per hari lokal; hari ini boleh belum aktif. Data tersimpan offline di
            SQLite.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Statistik Belajar"
      sub="Ringkasan progres, kebiasaan, dan beban review — dihitung dari database setelah setiap jawaban."
      meta="M3 · F5"
    >
      {/* Ringkasan atas */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric value={`${streak.current} hari`} label="Streak berjalan" hint={`Rekor ${streak.best} hari`} />
        <Metric
          value={`${today.minutes}′`}
          label="Menit hari ini"
          hint={`Target ${today.goalMin} menit (${goalPct}%)`}
        />
        <Metric value={today.attempts} label="Jawaban hari ini" hint={accToday === null ? "belum ada" : `Akurasi ${accToday}%`} />
        <Metric
          value={srs.dueNow}
          label="Kartu jatuh tempo"
          hint={`${srs.mature} kartu matang dari ${srs.total}`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <div className="card px-5 py-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg">Streak &amp; kebiasaan</h4>
            <span className="badge">{totals.activeDays} hari aktif</span>
          </div>
          <div className="mt-3">
            <Heatmap data={stats.activity} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="font-display text-xl">{today.cards}</div>
              <div className="text-[11px] text-ink-soft">kartu hari ini</div>
            </div>
            <div>
              <div className="font-display text-xl">{today.drills}</div>
              <div className="text-[11px] text-ink-soft">item drill hari ini</div>
            </div>
            <div>
              <div className="font-display text-xl">{accWeek === null ? "—" : `${accWeek}%`}</div>
              <div className="text-[11px] text-ink-soft">akurasi 7 hari</div>
            </div>
          </div>
        </div>

        <div className="card min-w-0 px-5 py-4">
          <h4 className="font-display text-lg">Beban review</h4>
          <p className="mt-1 text-[11px] text-ink-soft">Kartu jatuh tempo 7 hari ke depan.</p>
          <div className="mt-4 flex h-28 items-end gap-1.5">
            {futureDays.map((b) => (
              <div key={b.date} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-ink-soft">{b.count}</span>
                <div
                  className="w-full rounded-t bg-gold/40"
                  style={{ height: `${Math.max(4, Math.round((b.count / maxForecast) * 88))}px` }}
                  title={`${b.date}: ${b.count} kartu`}
                />
                <span className="text-center text-[9px] leading-tight text-ink-soft">
                  {b.label.replace("Hari ini", "Kini")}
                </span>
              </div>
            ))}
          </div>
          {forecast.overdue > 0 ? (
            <p className="mt-3 text-[11px] text-rose-700">
              {forecast.overdue} kartu lewat jatuh tempo — segera review.
            </p>
          ) : (
            <p className="mt-3 text-[11px] text-ink-soft">
              {forecast.horizon} kartu akan jatuh tempo dalam sepekan.
            </p>
          )}
          <div className="mt-3 space-y-1.5">
            {[
              { label: "baru", value: srs.newCards, tone: "bg-ink-soft/40" },
              { label: "belajar", value: srs.learning, tone: "bg-gold/60" },
              { label: "review", value: srs.review, tone: "bg-gold-deep" },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-2 text-[11px]">
                <span className="w-14 text-ink-soft">{row.label}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-soft">
                  <div
                    className={"h-full " + row.tone}
                    style={{ width: `${srs.total ? Math.round((row.value / srs.total) * 100) : 0}%` }}
                  />
                </div>
                <span className="w-7 text-right text-ink-soft">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-soft">
            <b className="text-ink">{srs.mature}</b> kartu matang (interval ≥ 21 hari) dari{" "}
            {srs.total} kartu.
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {/* Kelemahan */}
        <div className="card px-5 py-4">
          <h4 className="font-display text-lg">Kelemahan teratas</h4>
          <p className="mt-1 text-[11px] text-ink-soft">
            Item yang paling sering salah di drill — latih langsung dari sini.
          </p>
          {weak.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">
              Belum ada salah yang tercatat. Kerjakan drill dulu agar daftar ini terisi.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line-soft">
              {weak.map((w) => (
                <li key={w.key} className="flex items-center gap-3 py-2">
                  <span className="badge shrink-0">{w.code}</span>
                  <span className="min-w-0 flex-1 truncate text-sm" title={w.label}>
                    {w.label}
                  </span>
                  <span className="shrink-0 text-[11px] text-rose-700">{w.wrong}× salah</span>
                  <button
                    className="shrink-0 rounded border border-line px-2 py-1 text-[11px] hover:border-gold"
                    onClick={() => startDrill(w.code)}
                    title={DRILL_META[w.code].nama}
                  >
                    Latih →
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center justify-between text-[11px] text-ink-soft">
            <span>
              {reading.texts} teks dibaca · {reading.wordsSaved} kata disimpan dari bacaan
            </span>
            <span>
              total {totals.attempts} jawaban · {totals.minutes} menit
            </span>
          </div>
        </div>

        {/* Kesiapan A1 */}
        <div className="card px-5 py-4">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-lg">Aktivitas per keterampilan</h4>
            <span className="badge">
              {readiness === null ? "butuh data" : `± ${readiness}% · ${readyScores.length}/${skills.length} skill`}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            Aktivitas ini belum merupakan asesmen keterampilan atau perkiraan kesiapan ujian.
          </p>
          <div className="mt-3 space-y-3">
            {skills.map((s) => (
              <div key={s.id}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold">{s.label}</span>
                  <span className="text-ink-soft">{s.score === null ? "—" : `${s.score}%`}</span>
                </div>
                <div className="mt-1">
                  <Bar value={s.score ?? 0} tone={s.score === null ? "gold" : s.score >= 70 ? "emerald" : "rose"} />
                </div>
                <div className="mt-1 text-[10px] text-ink-soft">{s.detail}</div>
                {s.id === "hoeren" && s.score === null ? (
                  <button
                    className="mt-1 text-[10px] text-gold-deep underline underline-offset-2"
                    onClick={() => startDrill("D8")}
                  >
                    Mulai latihan dengar D8 →
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hasil uji tiruan A1 */}
      <div className="card mt-3 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-display text-lg">Uji tiruan A1 terakhir</h4>
          <button className="text-sm text-gold-deep underline" onClick={() => setPage("uji-a1")}>
            Buka uji tiruan →
          </button>
        </div>
        {mockResult ? (
          <>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              <div className="rounded border border-line bg-cream px-3 py-2 text-xs">
                <b>Hören</b>
                <div className="text-lg">{mockResult.hoeren.correct}/{mockResult.hoeren.total}</div>
                <div className="text-[10px] text-ink-soft">
                  {mockResult.hoeren.answered !== undefined
                    ? `terjawab ${mockResult.hoeren.answered} · tidak dikerjakan ${mockResult.hoeren.skipped ?? 0}`
                    : "rincian tidak dikerjakan belum tercatat"}
                  {mockResult.hoeren.audioFailed
                    ? ` · audio gagal ${mockResult.hoeren.audioFailed}`
                    : ""}
                </div>
              </div>
              <div className="rounded border border-line bg-cream px-3 py-2 text-xs">
                <b>Lesen</b>
                <div className="text-lg">{mockResult.lesen.correct}/{mockResult.lesen.total}</div>
                <div className="text-[10px] text-ink-soft">
                  {mockResult.lesen.answered !== undefined
                    ? `terjawab ${mockResult.lesen.answered} · tidak dikerjakan ${mockResult.lesen.skipped ?? 0}`
                    : "rincian tidak dikerjakan belum tercatat"}
                </div>
              </div>
              <div className="rounded border border-line bg-cream px-3 py-2 text-xs">
                <b>Schreiben</b>
                <div className="text-lg">{mockResult.schreiben.checked}/{mockResult.schreiben.total}</div>
                <div className="text-[10px] text-ink-soft">rubrik mandiri · tidak dinilai otomatis</div>
              </div>
              <div className="rounded border border-line bg-cream px-3 py-2 text-xs">
                <b>Sprechen</b>
                <div className="text-lg">{mockResult.sprechen.checked}/{mockResult.sprechen.total}</div>
                <div className="text-[10px] text-ink-soft">rubrik mandiri · tidak dinilai otomatis</div>
              </div>
            </div>
            <p className="mt-2 text-[10px] text-ink-soft">
              Hören/Lesen dinilai dari kunci jawaban; pertanyaan yang tidak dikerjakan atau gagal
              audio dilaporkan terpisah dan tidak disamakan dengan jawaban salah. Schreiben/Sprechen
              hanya daftar periksa mandiri, bukan skor. Bukan skor resmi atau perkiraan kesiapan ujian.
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-soft">
            Belum ada hasil. Uji tiruan tersedia di halaman Uji A1.
          </p>
        )}
      </div>

      {/* Hasil checkpoint per tujuan */}
      {objectiveSnapshots.length > 0 ? (
        <div className="card mt-3 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-display text-lg">Checkpoint per tujuan tersimpan</h4>
            <span className="badge">{objectiveSnapshots.length} unit</span>
          </div>
          <p className="mt-1 text-[11px] text-ink-soft">
            Percobaan terakhir dan skor terbaik dipisahkan. `lesson_progress` menyimpan state
            pernah-lulus dan skor terbaik; percobaan terakhir bisa belum lulus meski unit pernah lulus.
          </p>
          <div className="mt-2 space-y-1.5">
            {[...objectiveSnapshots]
              .sort((a, b) => a.unit - b.unit)
              .map((snapshot) => (
                <details key={snapshot.unit} className="rounded border border-line bg-cream/60 px-3 py-2">
                  <summary className="cursor-pointer text-sm">
                    Unit {snapshot.unit} · percobaan terakhir {snapshot.score}% ·{" "}
                    <span className={snapshot.pass ? "text-emerald-700" : "text-rose-700"}>
                      {snapshot.pass ? "Lulus" : "Belum lulus"}
                    </span>
                    {typeof snapshot.best_score === "number" ? (
                      <span className="text-ink-soft">
                        {" "}
                        · terbaik {snapshot.best_score}%
                        {snapshot.ever_passed ? " (pernah lulus)" : ""}
                      </span>
                    ) : null}
                  </summary>
                  <div className="mt-2 space-y-1">
                    {snapshot.objectives.map((objective) => (
                      <div key={objective.id} className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                        <span>{objective.title}</span>
                        <span className={objective.pass ? "text-emerald-700" : "text-rose-700"}>
                          {objective.correct}/{objective.total} · {objective.pass ? "Lulus" : "Perlu latihan"}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
          </div>
        </div>
      ) : null}

      {/* Mastery kurikulum */}
      <div className="card mt-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <h4 className="font-display text-lg">Mastery kurikulum A1–B2</h4>
          <span className="badge">4 level</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {units.map((u) => (
            <div key={u.level} className="flex items-center gap-3 text-sm">
              <span className="w-10 shrink-0 font-display text-base text-gold-deep">{u.level}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[11px] text-ink-soft">
                    {u.unitsWithContent > 0
                      ? `${u.unitsWithContent} dari ${u.totalUnits} unit berisi konten`
                      : "konten menyusul"}
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-soft">
                    {u.done}/{u.total} pelajaran
                  </span>
                </div>
                <div className="mt-1">
                  <Bar value={u.total ? Math.round((u.done / u.total) * 100) : 0} />
                </div>
              </div>
              <span className="w-28 shrink-0 text-right text-[11px] text-ink-soft">
                {u.checkpoints} checkpoint lulus
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-ink-soft">
          Progres dihitung dari tabel <code>lesson_progress</code>; tiap level punya 12 unit
          dengan checkpoint di akhir unit.
        </p>
      </div>
    </PageShell>
  );
}
