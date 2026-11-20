// Koleksi aset / Pratinjau media — milik 4a (RAK-DIALOG-20261120).
// Data dari inventaris 1a + resolver sampul 4a. Bukan arsip QA/prompt/screenshot.
import { useMemo, useRef, useState } from 'react';
import Icon from '../Icon';
import { EmptyState } from '../components/ui';
import {
  COLLECTION_GROUPS, filterCollection, quickPreviewItems,
  type CollectionGroup, type CollectionItem,
} from '../mediaCollection';
import '../editorial.css';

export type AssetCollectionPageProps = {
  initialGroup?: CollectionGroup | 'semua';
  onBack?: () => void;
};

export default function AssetCollectionPage({ initialGroup = 'semua', onBack }: AssetCollectionPageProps) {
  const [group, setGroup] = useState<CollectionGroup | 'semua'>(initialGroup);
  const [query, setQuery] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);
  const items = useMemo(() => filterCollection(group, query), [group, query]);

  function chooseGroup(next: CollectionGroup | 'semua') {
    setGroup(next);
    headingRef.current?.focus({ preventScroll: true });
  }

  return <div className="shelf editorial-collection">
    <header className="editorial-page-header">
      <h1 ref={headingRef} tabIndex={-1}>Koleksi aset</h1>
      <p className="muted">Pratinjau media produksi: sampul, tokoh, latar, properti, ilustrasi, dan audio. Item draf atau alternatif diberi label.</p>
    </header>

    <div className="editorial-collection-toolbar">
      <div className="tabs" role="group" aria-label="Jenis media">
        {COLLECTION_GROUPS.map(option => <button key={option.id} type="button"
          aria-pressed={group === option.id} onClick={() => chooseGroup(option.id)}>
          {option.label}
        </button>)}
      </div>
      <label className="klab-field editorial-collection-search">Cari media
        <input type="search" value={query} aria-label="Cari nama media"
          placeholder="cari nama atau judul..."
          onChange={event => setQuery(event.target.value)} />
      </label>
    </div>

    <section className="editorial-quick-preview" aria-labelledby="klab-quick-preview-heading">
      <h2 id="klab-quick-preview-heading">Pratinjau cepat — satu contoh tiap jenis</h2>
      <p className="muted">Satu contoh per jenis media; audio bisa diputar langsung. Item draf/alternatif tetap berlabel.</p>
      <ul role="list">
        {quickPreviewItems.map(item => <CollectionCard key={item.id} item={item} />)}
      </ul>
    </section>

    <p className="shelf-count" role="status">Menampilkan {items.length} item</p>

    {items.length === 0 ? <EmptyState icon={<Icon name="book" />} title="Media tidak ditemukan"
      description="Coba kata kunci lain atau pilih jenis media lain."
      actionLabel="Tampilkan semua" onAction={() => { setQuery(''); setGroup('semua'); }} />
      : <ul className="editorial-collection-grid" role="list">
        {items.map(item => <CollectionCard key={item.id} item={item} />)}
      </ul>}

    {onBack && <div className="actions editorial-collection-actions">
      <button type="button" className="button button-secondary" onClick={onBack}>
        <Icon name="back" /> Kembali
      </button>
    </div>}
  </div>;
}

function CollectionCard({ item }: { item: CollectionItem }) {
  return <li className="collection-item" data-group={item.group}>
    <div className="collection-preview">
      {item.preview ? (item.media === 'audio'
        ? <audio src={item.preview} controls preload="none" aria-label={`Putar ${item.title}`} />
        : <img src={item.preview} alt="" decoding="async" loading="lazy" />)
        : <span className="collection-no-preview">Pratinjau tidak tersedia</span>}
    </div>
    <div className="collection-copy">
      <strong title={item.title}>{item.title}</strong>
      {item.subtitle && <small>{item.subtitle}</small>}
      {item.label && <span className="collection-label">{item.label}</span>}
    </div>
  </li>;
}
