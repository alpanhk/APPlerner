// Panel pencarian kosakata melayang. Store vanilla agar Shell (selalu terpasang)
// dan ExplorePage (berganti sesuai rute) memakai sumber state yang sama.
import { createStore } from 'zustand/vanilla';
import type { VocabularyItemData } from './pages/viewModels';

type VocabPanelState = {
  open: boolean;
  query: string;
  items: VocabularyItemData[];
  openPanel: (items?: VocabularyItemData[]) => void;
  closePanel: () => void;
  setQuery: (query: string) => void;
  setItems: (items: VocabularyItemData[]) => void;
};

export const vocabPanel = createStore<VocabPanelState>((set) => ({
  open: false,
  query: '',
  items: [],
  openPanel(items) {
    set((state) => ({ open: true, items: items && items.length ? items : state.items }));
  },
  closePanel: () => set({ open: false }),
  setQuery: (query) => set({ query }),
  setItems: (items) => set({ items }),
}));
