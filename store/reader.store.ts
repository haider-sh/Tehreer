import { create } from 'zustand';

interface ReaderState {
  currentDocId: string | null;
  currentPage: number;
  totalPages: number;
  zoom: number;
  pendingSelection: { text: string; page: number } | null;
  setDoc: (docId: string, totalPages: number) => void;
  setPage: (page: number) => void;
  setZoom: (zoom: number) => void;
  setPendingSelection: (sel: { text: string; page: number } | null) => void;
  reset: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  currentDocId: null,
  currentPage: 1,
  totalPages: 0,
  zoom: 1,
  pendingSelection: null,

  setDoc: (docId, totalPages) =>
    set({ currentDocId: docId, currentPage: 1, totalPages, pendingSelection: null }),
  setPage: (page) => set({ currentPage: page }),
  setZoom: (zoom) => set({ zoom }),
  setPendingSelection: (sel) => set({ pendingSelection: sel }),
  reset: () =>
    set({ currentDocId: null, currentPage: 1, totalPages: 0, zoom: 1, pendingSelection: null }),
}));
