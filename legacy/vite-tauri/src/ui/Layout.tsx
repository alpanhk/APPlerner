export type PageDef = {
  id: string;
  label: string;
  hint: string;
};

type DbState = "loading" | "ready" | "error";

export type LayoutProps = {
  activeId: string;
  onSelect: (id: string) => void;
  pages: PageDef[];
  dbState: DbState;
  dbMessage: string;
  children: React.ReactNode;
};

const DB_LABEL: Record<DbState, string> = {
  loading: "menyiapkan data…",
  ready: "siap offline",
  error: "data bermasalah",
};

export default function Layout({
  activeId,
  onSelect,
  pages,
  dbState,
  children,
}: LayoutProps) {
  return (
    <div className="flex h-full bg-parchment text-ink">
      {/* Rail navigasi kiri — gaya Akademik Premium */}
      <nav className="flex w-60 shrink-0 flex-col border-r border-line bg-cream px-4 py-6">
        <div>
          <h1 className="font-display text-4xl tracking-tight">Lernen</h1>
          <p className="mt-0.5 font-display text-sm italic text-gold-deep">
            Belajar Bahasa Jerman
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-1">
          {pages.map((p, i) => {
            const active = p.id === activeId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.id)}
                className={
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors " +
                  (active
                    ? "bg-parchment font-semibold text-ink shadow-[inset_2px_0_0_0_var(--color-gold)]"
                    : "text-ink-soft hover:bg-parchment/70 hover:text-ink")
                }
              >
                <span className="font-display text-xs text-gold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto card-soft px-3 py-2 text-[11px] text-ink-soft">
          Data lokal &middot; {DB_LABEL[dbState]}
        </div>
      </nav>

      {/* Konten */}
      <main className="flex-1 overflow-y-auto px-10 py-8">{children}</main>
    </div>
  );
}
