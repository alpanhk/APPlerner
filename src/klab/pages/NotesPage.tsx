// Catatan - production presentational page (Agent 4a).
// Debounce, revision checks and persistence belong to the controller (1a).
import type { LoadState, NoteDraft, NoteItemData } from './viewModels';
import Icon from '../Icon';
import { EmptyState, ErrorState, KButton, LoadingState, SaveStatus } from '../components/ui';
import { sampleVisuals } from '../sampleVisuals';

export type NotesPageProps = {
  loadState: LoadState;
  notes: NoteItemData[];
  selectedId?: string;
  draft: NoteDraft;
  onSelect: (id: string) => void;
  onDraftChange: (change: { title?: string; body?: string }) => void;
  onSave: () => void;
  onNew: () => void;
  onDelete?: (id: string) => void;
  onOpenSource?: (id: string) => void;
  onRetry: () => void;
};

export default function NotesPage({
  loadState, notes, selectedId, draft, onSelect, onDraftChange,
  onSave, onNew, onDelete, onOpenSource, onRetry,
}: NotesPageProps) {
  if (loadState === 'loading') return <div className="home"><LoadingState label="Memuat catatan..." /></div>;
  if (loadState === 'failed') return <div className="home">
    <h1>Catatan</h1>
    <ErrorState title="Catatan belum siap" message="Daftar catatan tidak dapat dimuat."
      detail="Catatan Anda tidak dihapus. Coba lagi setelah penyimpanan tersedia."
      onRetry={onRetry} />
  </div>;

  const selected = notes.find(note => note.id === selectedId);

  return <div className="shelf">
    <h1>Catatan</h1>
    <div className="actions"><KButton variant="primary" onClick={onNew}>Buat catatan</KButton></div>

    {notes.length === 0 ? <div style={{ marginTop: 18 }}>
      <EmptyState icon={<Icon name="notes" />} title="Belum ada catatan"
        description="Soroti bagian materi dan tulis pengingat pertama Anda."
        actionLabel="Buat catatan" onAction={onNew} />
    </div> : <div className="notes-layout" style={{ marginTop: 18 }}>
      <div className="notes-list">
        {notes.map(note => <button key={note.id} type="button" className="note-item"
          data-selected={note.id === selectedId} onClick={() => onSelect(note.id)}>
          <strong>{note.title || 'Catatan tanpa judul'}</strong>
          <small>{note.updatedAt}</small>
          {note.orphaned && <span className="note-flag">Bagian sumber berubah</span>}
        </button>)}
      </div>

      <section className="note-editor" aria-label="Editor catatan">
        <label className="klab-field">Judul
          <input value={draft.title} onChange={e => onDraftChange({ title: e.target.value })} />
        </label>
        <label className="klab-field">Isi catatan
          <textarea value={draft.body} onChange={e => onDraftChange({ body: e.target.value })} />
        </label>
        <SaveStatus state={draft.saveState} onRetry={onSave} />
        <div className="actions">
          <KButton variant="primary" onClick={onSave} disabled={draft.saveState === 'saving'}>Simpan catatan</KButton>
          {selected?.sourceLabel && onOpenSource && <KButton variant="secondary" onClick={() => onOpenSource(selected.id)}>Buka sumber</KButton>}
          {selected && onDelete && <KButton variant="text" onClick={() => onDelete(selected.id)}>Hapus</KButton>}
        </div>
      </section>

      {selected && <aside className="note-preview" aria-label="Pratinjau catatan">
        <p className="eyebrow">Pratinjau</p>
        <img className="visual-source-thumb" src={sampleVisuals.catatan} alt="" decoding="async" />
        <h3>{draft.title || selected.title}</h3>
        <p>{draft.body || selected.body}</p>
        {selected.sourceLabel && <p className="muted">Sumber: {selected.sourceLabel}</p>}
      </aside>}
    </div>}
  </div>;
}
