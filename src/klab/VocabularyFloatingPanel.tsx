// Panel kosakata melayang (modeless): tetap tampil saat pengguna berpindah
// halaman/tugas. Bisa digeser lewat bilah judul dan ditutup dengan × atau Esc.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { vocabPanel } from './vocabPanelStore';
import Icon from './Icon';

type Point = { x: number; y: number };

function clampPoint(point: Point): Point {
  const width = Math.min(380, Math.max(280, window.innerWidth - 24));
  const height = Math.min(520, Math.max(240, window.innerHeight - 120));
  return {
    x: Math.max(12, Math.min(point.x, window.innerWidth - width - 12)),
    y: Math.max(12, Math.min(point.y, window.innerHeight - height - 12)),
  };
}

export default function VocabularyFloatingPanel() {
  const open = useStore(vocabPanel, (state) => state.open);
  const query = useStore(vocabPanel, (state) => state.query);
  const items = useStore(vocabPanel, (state) => state.items);
  const { closePanel, setQuery } = vocabPanel.getState();

  const [point, setPoint] = useState<Point | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    if (open && !point) {
      setPoint(clampPoint({ x: window.innerWidth - 400, y: 96 }));
    }
  }, [open, point]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) closePanel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closePanel]);

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const start = drag.current;
      if (!start) return;
      setPoint(clampPoint({ x: event.clientX - start.dx, y: event.clientY - start.dy }));
    }
    function onUp() { drag.current = null; }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const source = items ?? [];
    return needle
      ? source.filter((item) => item.word.toLocaleLowerCase().includes(needle)
        || item.translation.toLocaleLowerCase().includes(needle))
      : source;
  }, [items, query]);

  if (!open || !point) return null;

  return <section className="klab-vocab-panel" role="dialog" aria-label="Pencarian kosakata"
    style={{ left: point.x, top: point.y }}>
    <header className="klab-vocab-panel-head" onPointerDown={(event) => {
      if ((event.target as HTMLElement).closest('button')) return;
      drag.current = { dx: event.clientX - point.x, dy: event.clientY - point.y };
    }}>
      <span className="klab-vocab-panel-title"><Icon name="notes" /> Kosakata</span>
      <button type="button" className="klab-vocab-panel-close" aria-label="Tutup pencarian kosakata"
        onClick={closePanel}>×</button>
    </header>
    <div className="klab-vocab-panel-body">
      <label className="klab-vocab-panel-field">
        <span className="klab-vocab-panel-label">Cari kata disini...</span>
        <input autoFocus type="search" value={query} aria-label="Cari kata disini..."
          placeholder="cari kata disini..."
          onChange={(event) => setQuery(event.target.value)} />
      </label>
      <p className="klab-vocab-panel-count" role="status">
        Menampilkan {filtered.length} dari {items.length} kata
      </p>
      <ul className="klab-vocab-panel-results" role="list">
        {filtered.map((item, index) => <li key={item.id ?? `${item.word}-${index}`}>
          <span lang="de">{item.word}</span>
          <span className="muted">{item.translation}</span>
        </li>)}
        {filtered.length === 0 && <li className="klab-vocab-panel-empty">Tidak ada kata yang cocok.</li>}
      </ul>
    </div>
  </section>;
}
