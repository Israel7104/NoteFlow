import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { api, type ApiChecklistItem, type ApiNote, type AuthUser } from "../lib/api";
import { tokenStorage } from "../lib/tokenStorage";
import type { ArchivedItem, ChecklistNote, IdeaNote, Note } from "../types";

type RestockStatus = Note["status"];

type CreateRestockInput = {
  title: string;
  content: string;
  status: RestockStatus;
  expiresAt?: Date;
};

type CreateChecklistInput = {
  title: string;
  itemTexts: string[];
  deliveryDate?: Date;
};

interface NotesStore {
  notes: Note[];
  checklists: ChecklistNote[];
  ideas: IdeaNote[];
  archived: ArchivedItem[];
  user: AuthUser | null;
  token: string | null;
  hasHydrated: boolean;
  isLoading: boolean;
  authLoading: boolean;
  errorMessage: string | null;
  setHasHydrated: (state: boolean) => void;
  clearError: () => void;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  createRestockNote: (input: CreateRestockInput) => Promise<void>;
  createChecklist: (input: CreateChecklistInput) => Promise<void>;
  addChecklistItem: (checklistId: string, text: string) => Promise<void>;
  addIdea: (idea: IdeaNote) => void;
  deleteNote: (id: string) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  deleteIdea: (id: string) => void;
  archiveNote: (id: string) => Promise<void>;
  archiveChecklist: (id: string) => Promise<void>;
  archiveIdea: (id: string) => void;
  toggleChecklistItem: (checklistId: string, itemId: string) => Promise<boolean>;
}

const sortByDateDesc = <T extends { updatedAt: Date }>(list: T[]) =>
  [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const statusToColor: Record<RestockStatus, string> = {
  faltan: "#D32F2F",
  "hay-pocos": "#F57C00",
  "hay-muchos": "#2E7D32",
  pasados: "#455A64",
};

const colorToStatus = Object.entries(statusToColor).reduce(
  (acc, [status, color]) => ({ ...acc, [color.toLowerCase()]: status as RestockStatus }),
  {} as Record<string, RestockStatus>,
);

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrio un error inesperado";

const parseDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const normalizeChecklistItem = (item: ApiChecklistItem) => ({
  id: item.id,
  text: item.text,
  isCompleted: item.is_completed,
});

const deriveStatus = (note: ApiNote): RestockStatus => {
  if (!note.color) {
    return parseDate(note.expires_at)?.getTime() && parseDate(note.expires_at)!.getTime() < Date.now()
      ? "pasados"
      : "hay-pocos";
  }

  const byColor = colorToStatus[note.color.toLowerCase()];
  if (byColor) return byColor;

  const expiresAt = parseDate(note.expires_at);
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return "pasados";
  }

  return "hay-pocos";
};

const normalizeChecklist = (note: ApiNote, items: ApiChecklistItem[]): ChecklistNote => ({
  id: note.id,
  title: note.title,
  items: items.map(normalizeChecklistItem),
  deliveryDate: parseDate(note.delivery_date),
  createdAt: new Date(note.created_at),
  updatedAt: new Date(note.updated_at),
});

const normalizeTextNote = (note: ApiNote): Note => ({
  id: note.id,
  title: note.title,
  content: note.content ?? "",
  status: deriveStatus(note),
  expiresAt: parseDate(note.expires_at),
  createdAt: new Date(note.created_at),
  updatedAt: new Date(note.updated_at),
});

const normalizeIdea = (note: ApiNote): IdeaNote => ({
  id: note.id,
  title: note.title,
  color: note.color ?? "#DDDDDD",
  tags: note.tags ?? [],
  createdAt: new Date(note.created_at),
  updatedAt: new Date(note.updated_at),
});

const fetchAndNormalizeNotes = async (token: string) => {
  const apiNotes = await api.getNotes(token);

  const checklistNotes = apiNotes.filter((note) => note.type === "checklist");
  const checklistById: Record<string, ApiChecklistItem[]> = {};

  await Promise.all(
    checklistNotes.map(async (checklist) => {
      const apiItems = checklist.items ?? checklist.checklist_items;
      if (apiItems) {
        checklistById[checklist.id] = apiItems;
        return;
      }

      checklistById[checklist.id] = await api.getChecklistItems(token, checklist.id);
    }),
  );

  return {
    notes: sortByDateDesc(apiNotes.filter((note) => note.type !== "checklist" && note.type !== "idea").map(normalizeTextNote)),
    checklists: sortByDateDesc(
      checklistNotes.map((checklist) => normalizeChecklist(checklist, checklistById[checklist.id] ?? [])),
    ),
    ideas: sortByDateDesc(apiNotes.filter((note) => note.type === "idea").map(normalizeIdea)),
  };
};

export const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],
      checklists: [],
      ideas: [],
      archived: [],
      user: null,
      token: null,
      hasHydrated: false,
      isLoading: false,
      authLoading: false,
      errorMessage: null,
      setHasHydrated: (state) => set({ hasHydrated: state }),
      clearError: () => set({ errorMessage: null }),
      initialize: async () => {
        if (get().hasHydrated) return;

        set({ isLoading: true, errorMessage: null });

        try {
          const token = await tokenStorage.getToken();

          if (!token) {
            set({ token: null, user: null, hasHydrated: true, isLoading: false });
            return;
          }

          set({ token });
          const normalized = await fetchAndNormalizeNotes(token);
          set({ ...normalized, hasHydrated: true, isLoading: false });
        } catch (error) {
          await tokenStorage.clearToken();
          set({
            token: null,
            user: null,
            notes: [],
            checklists: [],
            ideas: [],
            hasHydrated: true,
            isLoading: false,
            errorMessage: getErrorMessage(error),
          });
        }
      },
      login: async (email, password) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const response = await api.login(email, password);
          await tokenStorage.setToken(response.token);
          const normalized = await fetchAndNormalizeNotes(response.token);
          set({
            token: response.token,
            user: response.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      register: async (email, password) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const response = await api.register(email, password);
          await tokenStorage.setToken(response.token);
          const normalized = await fetchAndNormalizeNotes(response.token);
          set({
            token: response.token,
            user: response.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      logout: async () => {
        await tokenStorage.clearToken();
        set({
          token: null,
          user: null,
          notes: [],
          checklists: [],
          ideas: [],
          archived: [],
          errorMessage: null,
        });
      },
      refreshNotes: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoading: true, errorMessage: null });

        try {
          const normalized = await fetchAndNormalizeNotes(token);
          set({ ...normalized, isLoading: false });
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      createRestockNote: async ({ title, content, status, expiresAt }) => {
        const token = get().token;
        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        set({ isLoading: true, errorMessage: null });

        try {
          const created = await api.createNote(token, {
            title,
            type: "note",
            content,
            color: statusToColor[status],
          });

          const note: Note = {
            ...normalizeTextNote(created),
            expiresAt,
            status,
          };

          set((state) => ({
            notes: sortByDateDesc([...state.notes, note]),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      createChecklist: async ({ title, itemTexts, deliveryDate }) => {
        const token = get().token;
        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        set({ isLoading: true, errorMessage: null });

        try {
          const createdChecklist = await api.createNote(token, {
            title,
            type: "checklist",
            content: deliveryDate ? deliveryDate.toISOString() : "",
          });

          const createdItems = await Promise.all(
            itemTexts.map((text) => api.createChecklistItem(token, createdChecklist.id, text)),
          );

          const checklist = normalizeChecklist(createdChecklist, createdItems);

          set((state) => ({
            checklists: sortByDateDesc([
              ...state.checklists,
              {
                ...checklist,
                deliveryDate,
              },
            ]),
            isLoading: false,
          }));
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      addChecklistItem: async (checklistId, text) => {
        const token = get().token;
        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        const created = await api.createChecklistItem(token, checklistId, text);
        set((state) => ({
          checklists: state.checklists.map((checklist) =>
            checklist.id === checklistId
              ? {
                  ...checklist,
                  updatedAt: new Date(),
                  items: [...checklist.items, normalizeChecklistItem(created)],
                }
              : checklist,
          ),
        }));
      },
      addIdea: (idea) => set((state) => ({ ideas: sortByDateDesc([...state.ideas, idea]) })),
      deleteNote: async (id) => {
        const token = get().token;

        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        try {
          await api.deleteNote(token, id);
          set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      deleteChecklist: async (id) => {
        const token = get().token;

        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        try {
          await api.deleteNote(token, id);
          set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      deleteIdea: (id) => set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) })),
      archiveNote: async (id) => {
        const found = get().notes.find((n) => n.id === id);
        if (!found) return;

        await get().deleteNote(id);

        set((state) => ({
          archived: [
            {
              id: `arch-note-${id}`,
              type: "note",
              data: found,
              archivedAt: new Date(),
            },
            ...state.archived,
          ],
        }));
      },
      archiveChecklist: async (id) => {
        const found = get().checklists.find((c) => c.id === id);
        if (!found) return;

        await get().deleteChecklist(id);

        set((state) => ({
          archived: [
            {
              id: `arch-checklist-${id}`,
              type: "checklist",
              data: found,
              archivedAt: new Date(),
            },
            ...state.archived,
          ],
        }));
      },
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
      toggleChecklistItem: async (checklistId, itemId) => {
        const token = get().token;
        if (!token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        const targetChecklist = get().checklists.find((checklist) => checklist.id === checklistId);
        const targetItem = targetChecklist?.items.find((item) => item.id === itemId);

        if (!targetChecklist || !targetItem) {
          return false;
        }

        const updated = await api.updateChecklistItem(token, itemId, {
          is_completed: !targetItem.isCompleted,
        });

        let allCompleted = false;

        set((state) => ({
          checklists: state.checklists.map((checklist) => {
            if (checklist.id !== checklistId) return checklist;

            const updatedItems = checklist.items.map((item) =>
              item.id === itemId
                ? { ...item, isCompleted: updated.is_completed }
                : item,
            );

            allCompleted = updatedItems.length > 0 && updatedItems.every((item) => item.isCompleted);

            return {
              ...checklist,
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
      version: 3,
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
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(false);
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
