import { MeaningResponse } from '@/services/meaning.service';
import { create } from 'zustand';

export interface DictionaryEntry {
  id: string;
  word: string;
  meanings: MeaningResponse[];
  created_at: string;
}

interface DictionaryState {
  entries: DictionaryEntry[];
  loading: boolean;
  setEntries: (entries: DictionaryEntry[]) => void;
  addEntry: (entry: DictionaryEntry) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useDictionaryStore = create<DictionaryState>((set) => ({
  entries: [],
  loading: false,

  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((s) => ({ entries: [entry, ...s.entries] })),
  removeEntry: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
  setLoading: (loading) => set({ loading }),
}));
