import type { ReactNode } from "react";

// Kerangka halaman gaya "Akademik Premium": badge kecil di atas, judul serif, subjudul.
export type PageShellProps = {
  title: string;
  sub: string;
  meta?: string;
  children: ReactNode;
};

export default function PageShell({ title, sub, meta, children }: PageShellProps) {
  return (
    <section>
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge">Siap offline</span>
        {meta && !/^M\d/.test(meta) ? <span className="badge text-[var(--color-ink-soft)]">{meta}</span> : null}
      </div>
      <h2 className="mt-4 font-display text-3xl tracking-tight">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-[var(--color-ink-soft)]">{sub}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}
