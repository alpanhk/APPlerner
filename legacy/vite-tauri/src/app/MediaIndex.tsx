// ROMBAK UI/UX / 1a — indeks mesin untuk verifikasi aset & resolver.
// 96 baris manifest + 36 media unik setelah dedup hash. Tersembunyi secara
// visual, terbaca oleh 3b/3a/ork tanpa mengubah tampilan.
import { allMedia, manifestAggregate, manifestRows } from "./mediaResolver";

export default function MediaIndex() {
  const media = allMedia();
  return (
    <div hidden data-testid="media-index" data-count={manifestRows.length}
      data-aggregate={manifestAggregate} data-resolved-count={media.length}>
      {manifestRows.map((row) => (
        <span key={row.path} data-testid="manifest-row" data-path={row.path}
          data-bytes={row.bytes} data-sha256={row.sha256} />
      ))}
      {media.map((item) => (
        <span key={item.id} data-testid={`media-${item.id}`} data-kind={item.kind}
          data-src={item.src} data-sha256={item.sha256} />
      ))}
    </div>
  );
}
