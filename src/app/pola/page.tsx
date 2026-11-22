import Link from "next/link";
import { auditAll } from "@/story/audit";
import { CHAPTERS } from "@/story/chapters";

export const metadata = { title: "Pola Prolog — Audit konsistensi · Lernen" };

const STEPS = [
  ["1", "Tiba", "Narasi membuka adegan. Pemain memeriksa benda berbahasa Jerman di sekitarnya sebelum cerita berjalan."],
  ["2", "Belajar", "Frau Lehmann memodelkan kalimat, memberi kiat dalam bahasa Indonesia, lalu melatihnya bersama pemain."],
  ["3", "Bertemu", "Kalimat yang sama dipakai kepada tokoh sungguhan. Tokoh bereaksi dalam bahasa Jerman, juga saat pemain keliru."],
  ["4", "Menjelajah", "Satu pertemuan pilihan mengulang materi bab lama; satu misi utama berkelok karena salah paham."],
  ["5", "Temuan", "Sebuah benda cerita menutup bab dan menarik pemain ke bab berikutnya."],
];

export default function PolaPage() {
  const results = auditAll(CHAPTERS);
  const allOk = results.every((r) => r.ok);
  const labels = results[0].checks.map((c) => c.label);
  const totalInputs = results.reduce((s, r) => s + r.inputs, 0);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <Link href="/" className="text-sm font-bold text-terra hover:underline">
        ← Kembali ke Lernen
      </Link>
      <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.2em] text-terra">Audit konsistensi</p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-balance sm:text-5xl">Setiap bab mengajar seperti prolog</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">
        Prolog mengajar dengan lima langkah. Lima langkah itu kini menjadi cetakan yang dipakai semua bab, dan halaman ini memeriksa naskahnya secara otomatis setiap kali dibuka.
      </p>

      <ol className="mt-8 grid gap-3 sm:grid-cols-5">
        {STEPS.map(([no, name, text]) => (
          <li key={no} className="rounded-2xl border border-line bg-cream p-4">
            <span className="font-display text-3xl font-semibold text-terra">{no}</span>
            <h2 className="mt-1 font-bold">{name}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{text}</p>
          </li>
        ))}
      </ol>

      <div className={`mt-10 rounded-2xl p-5 text-cream ${allOk ? "bg-olive" : "bg-terra"}`}>
        <p className="font-display text-2xl font-semibold">
          {allOk ? `${results.length} dari ${results.length} bab lolos semua pemeriksaan.` : `${results.filter((r) => !r.ok).length} bab melanggar pola.`}
        </p>
        <p className="mt-1 text-sm opacity-90">
          {totalInputs} giliran menjawab diperiksa: contoh lengkapnya diterima, kepingan katanya cukup, dan petunjuknya tiga tingkat.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-cream">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line align-bottom">
              <th className="p-3 font-bold">Bab</th>
              {labels.map((l, i) => (
                <th key={l} className="p-3 text-center font-bold" title={l}>
                  <abbr title={l} className="no-underline">
                    {i + 1}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((r, idx) => (
              <tr key={r.id} className="border-b border-line last:border-0">
                <td className="p-3">
                  <span className="font-bold">{idx === 0 ? "Prolog" : `Bab ${idx}`}</span> · {r.title}
                  <span className="block text-xs text-ink-soft">
                    {r.nodes} adegan · {r.inputs} giliran
                  </span>
                </td>
                {r.checks.map((c) => (
                  <td key={c.id} className="p-3 text-center" title={c.detail ?? c.label}>
                    <span className={`inline-grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold text-cream ${c.ok ? "bg-olive" : "bg-terra"}`}>
                      {c.ok ? "✓" : "✗"}
                    </span>
                    {!c.ok && <span className="mt-1 block text-xs text-terra">{c.detail}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ol className="mt-6 grid gap-x-8 gap-y-2 text-sm text-ink-soft sm:grid-cols-2">
        {labels.map((l, i) => (
          <li key={l} className="flex gap-2">
            <span className="font-extrabold text-ink">{i + 1}.</span>
            {l}
          </li>
        ))}
      </ol>
    </main>
  );
}
