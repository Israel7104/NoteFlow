import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ArchivedItem, ChecklistNote, IdeaNote, Note } from "../types";

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  archived: ArchivedItem[];
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  addNote: (note: Note) => void;
  addChecklist: (checklist: ChecklistNote) => void;
  addIdea: (idea: IdeaNote) => void;
  deleteNote: (id: string) => void;
  deleteChecklist: (id: string) => void;
  deleteIdea: (id: string) => void;
  archiveNote: (id: string) => void;
  archiveChecklist: (id: string) => void;
  archiveIdea: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => boolean;
}

const sortByDateDesc = <T extends { updatedAt: Date }>(list: T[]) =>
  [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      checklists: [],
      ideas: [],
      archived: [],
      hasHydrated: false,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      addNote: (note) => set((state) => ({ notes: sortByDateDesc([...state.notes, note]) })),
      addChecklist: (checklist) =>
        set((state) => ({ checklists: sortByDateDesc([...state.checklists, checklist]) })),
      addIdea: (idea) => set((state) => ({ ideas: sortByDateDesc([...state.ideas, idea]) })),
      deleteNote: (id) => set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      deleteChecklist: (id) =>
        set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) })),
      deleteIdea: (id) => set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) })),
      archiveNote: (id) =>
        set((state) => {
          const found = state.notes.find((n) => n.id === id);
          if (!found) return state;
          return {
            notes: state.notes.filter((n) => n.id !== id),
            archived: [
              {
                id: `arch-note-${id}`,
                type: "note",
                data: found,
                archivedAt: new Date(),
              },
              ...state.archived,
            ],
          };
        }),
      archiveChecklist: (id) =>
        set((state) => {
          const found = state.checklists.find((c) => c.id === id);
          if (!found) return state;
          return {
            checklists: state.checklists.filter((c) => c.id !== id),
            archived: [
              {
                id: `arch-checklist-${id}`,
                type: "checklist",
                data: found,
                archivedAt: new Date(),
              },
              ...state.archived,
            ],
          };
        }),
      archiveIdea: (id) =>
        set((state) => {
          const found = state.ideas.find((i) => i.id === id);
          if (!found) return state;
          return {
            ideas: state.ideas.filter((i) => i.id !== id),
            archived: [
              {
                id: `arch-idea-${id}`,
                type: "idea",
                data: found,
                archivedAt: new Date(),
              },
              ...state.archived,
            ],
          };
        }),
      toggleChecklistItem: (checklistId, itemId) => {
        let allCompleted = false;

        set((state) => ({
          checklists: state.checklists.map((c) => {
            if (c.id !== checklistId) return c;

            const updatedItems = c.items.map((i) =>
              i.id === itemId ? { ...i, isCompleted: !i.isCompleted } : i,
            );

            allCompleted = updatedItems.length > 0 && updatedItems.every((i) => i.isCompleted);

            return {
              ...c,
              updatedAt: new Date(),
              items: updatedItems,
            };
          }),
        }));

        return allCompleted;
      },
    }),
    {
      name: "noteflow-storage",
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persistedState) => {
        const state = persistedState as Partial<NotesStore> | undefined;
        if (!state) return persistedState as NotesStore;

        return {
          ...state,
          notes: (state.notes ?? []).map((note) => ({
            ...note,
            status: note.status ?? "hay-pocos",
          })),
        } as NotesStore;
      },
      partialize: (state) => ({
        notes: state.notes,
        checklists: state.checklists,
        ideas: state.ideas,
        archived: state.archived,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

export const useStoreHydrated = () => useNotesStore((state) => state.hasHydrated);

export const useStoreHydration = () => {
  const hasHydrated = useNotesStore((state) => state.hasHydrated);

  return {
    hasHydrated,
    notes: useNotesStore.getState().notes,
    checklists: useNotesStore.getState().checklists,
    ideas: useNotesStore.getState().ideas,
  };
};
