// RAK-DIALOG-03: indeks mesin untuk otomasi 67 kartu vs cuplikan.
// Tersembunyi secara visual tetapi terbaca di DOM; judul dan src berasal dari
// resolver yang SAMA dengan rak/cuplikan.
import { allCovers } from "./coverResolver";

export default function CoverIndex() {
  const covers = allCovers();
  return (
    <div hidden data-testid="cover-index" data-count={covers.length}>
      {covers.map((cover) => (
        <span
          key={cover.textId}
          data-testid={`cover-${cover.textId}`}
          data-text-id={cover.textId}
          data-title={cover.title}
          data-src={cover.src}
          data-cover-kind={cover.kind}
        />
      ))}
    </div>
  );
}
