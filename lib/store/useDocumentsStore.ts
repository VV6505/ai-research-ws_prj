import { create } from "zustand";
import type { Document } from "@/lib/types";

interface DocumentsState {
    documents: Document[];
    selectedIds: string[];
    setDocuments: (docs: Document[]) => void;
    addDocument: (doc: Document) => void;
    removeDocument: (id: string) => void;
    toggleSelected: (id: string) => void;
}

export const useDocumentsStore = create<DocumentsState>((set) => ({
    documents: [],
    selectedIds: [],
    setDocuments: (docs) => set({ documents: docs }),
    addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),
    removeDocument: (id) =>
        set((state) => ({
            documents: state.documents.filter((d) => d.id !== id),
            selectedIds: state.selectedIds.filter((sid) => sid !== id),
        })),
    toggleSelected: (id) =>
        set((state) => ({
            selectedIds: state.selectedIds.includes(id)
                ? state.selectedIds.filter((sid) => sid !== id)
                : [...state.selectedIds, id],
        })),
}));