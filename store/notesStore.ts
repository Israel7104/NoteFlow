// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { api, type ApiChecklistItem, type ApiNote } from "../lib/api";
import { firebaseAuthService, type AuthUser } from "../lib/firebaseAuth";
import { tokenStorage } from "../lib/tokenStorage";
import type { ArchivedItem, ChecklistNote, IdeaNote, Note, ProductCategory } from "../types";

type RestockStatus = Note["status"];

type CreateRestockInput = {
  title: string;
  content: string;
  price: number;
  shelfLifeDays: number;
  category: ProductCategory;
  imagePlaceholder: string;
  status: RestockStatus;
  expiresAt: Date;
};

type CreateChecklistInput = {
  title: string;
  description: string;
  routeUrl: string;
  imagePlaceholder: string;
  deliveryDate?: Date;
};

type RestockMeta = {
  description: string;
  price: number;
  shelfLifeDays: number;
  category: ProductCategory;
  imagePlaceholder: string;
};

type OrderMeta = {
  description: string;
  routeUrl: string;
  imagePlaceholder: string;
};

type AlertMeta = {
  sourceType: "restock" | "order";
  sourceName: string;
  daysRemaining: number;
  imagePlaceholder: string;
  dueDate?: string;
};

const RESTOCK_META_PREFIX = "NF_RESTOCK_META::";
const ORDER_META_PREFIX = "NF_ORDER_META::";
const ALERT_META_PREFIX = "NF_ALERT_META::";

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
  resolveAuthToken: () => Promise<string>;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginWithGooglePopup: () => Promise<void>;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  loginWithGoogleCredential: (input: { idToken?: string; accessToken?: string }) => Promise<void>;
  updateProfileName: (displayName: string) => Promise<void>;
  updateProfilePhoto: (photoURL: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  uploadImageToS3: (input: {
    localUri: string;
    purpose: "avatar" | "restock" | "order";
    contentType?: string;
    extension?: string;
  }) => Promise<string>;
  logout: () => Promise<void>;
  refreshNotes: () => Promise<void>;
  createRestockNote: (input: CreateRestockInput) => Promise<void>;
  createChecklist: (input: CreateChecklistInput) => Promise<void>;
  addChecklistItem: (checklistId: string, text: string) => Promise<void>;
  addIdea: (idea: IdeaNote) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  deleteChecklist: (id: string) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  archiveChecklist: (id: string) => Promise<void>;
  archiveIdea: (id: string) => Promise<void>;
  toggleChecklistItem: (checklistId: string, itemId: string) => Promise<boolean>;
}

// Ordena colecciones por fecha de actualizacion descendente para mostrarlas primero.
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

// Extrae un mensaje util desde errores desconocidos lanzados en async.
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Ocurrio un error inesperado";

// Ajusta mensajes de autenticacion cuando el backend rechaza el token de Firebase.
const getAuthFlowErrorMessage = (error: unknown) => {
  const message = getErrorMessage(error);

  if (/token invalido|invalid token/i.test(message)) {
    return "El backend rechazo el token de Firebase. Debes habilitar validacion de ID token de Firebase en la API.";
  }

  return message;
};

// Convierte fechas opcionales de la API a objetos Date validos.
const parseDate = (value: string | null | undefined) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

// Calcula dias restantes sin devolver valores negativos para la UI.
const daysUntil = (date?: Date) => {
  if (!date) return 0;
  const now = new Date();
  const ms = date.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

// Serializa los metadatos de una reposicion dentro del campo content de la API.
const encodeRestockMeta = (meta: RestockMeta) => `${RESTOCK_META_PREFIX}${JSON.stringify(meta)}`;

// Recupera y valida los metadatos persistidos de una reposicion.
const parseRestockMeta = (value: string | null | undefined): RestockMeta | null => {
  if (!value || !value.startsWith(RESTOCK_META_PREFIX)) return null;

  try {
    const raw = JSON.parse(value.slice(RESTOCK_META_PREFIX.length)) as Partial<RestockMeta>;
    if (
      typeof raw.description === "string" &&
      typeof raw.price === "number" &&
      typeof raw.shelfLifeDays === "number" &&
      typeof raw.category === "string" &&
      typeof raw.imagePlaceholder === "string"
    ) {
      return raw as RestockMeta;
    }
  } catch {
    return null;
  }

  return null;
};

// Serializa los metadatos propios de un pedido/checklist.
const encodeOrderMeta = (meta: OrderMeta) => `${ORDER_META_PREFIX}${JSON.stringify(meta)}`;

// Recupera descripcion, ruta y placeholder de un pedido persistido.
const parseOrderMeta = (value: string | null | undefined): OrderMeta | null => {
  if (!value || !value.startsWith(ORDER_META_PREFIX)) return null;

  try {
    const raw = JSON.parse(value.slice(ORDER_META_PREFIX.length)) as Partial<OrderMeta>;
    if (
      typeof raw.description === "string" &&
      typeof raw.routeUrl === "string" &&
      typeof raw.imagePlaceholder === "string"
    ) {
      return raw as OrderMeta;
    }
  } catch {
    return null;
  }

  return null;
};

// Serializa la informacion base que luego se muestra como alerta/idea.
const encodeAlertMeta = (meta: AlertMeta) => `${ALERT_META_PREFIX}${JSON.stringify(meta)}`;

// Reconstruye una alerta guardada dentro del contenido de la nota remota.
const parseAlertMeta = (value: string | null | undefined): AlertMeta | null => {
  if (!value || !value.startsWith(ALERT_META_PREFIX)) return null;

  try {
    const raw = JSON.parse(value.slice(ALERT_META_PREFIX.length)) as Partial<AlertMeta>;
    if (
      (raw.sourceType === "restock" || raw.sourceType === "order") &&
      typeof raw.sourceName === "string" &&
      typeof raw.daysRemaining === "number" &&
      typeof raw.imagePlaceholder === "string"
    ) {
      return raw as AlertMeta;
    }
  } catch {
    return null;
  }

  return null;
};

// Adapta el formato de checklist de la API al formato usado por la UI.
const normalizeChecklistItem = (item: ApiChecklistItem) => ({
  id: item.id,
  text: item.text,
  isCompleted: item.is_completed,
});

// Deriva el estado visual de una reposicion segun color y fecha de caducidad.
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

// Convierte una nota remota tipo checklist al modelo interno del store.
const normalizeChecklist = (note: ApiNote, items: ApiChecklistItem[]): ChecklistNote => {
  const orderMeta = parseOrderMeta(note.content);

  return {
    id: note.id,
    title: note.title,
    items: items.map(normalizeChecklistItem),
    description: orderMeta?.description ?? "",
    routeUrl: orderMeta?.routeUrl ?? "",
    imagePlaceholder: orderMeta?.imagePlaceholder ?? "AWS",
    deliveryDate: parseDate(note.delivery_date),
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  };
};

// Convierte una nota de texto del backend en una reposicion lista para renderizar.
const normalizeTextNote = (note: ApiNote): Note => {
  const restockMeta = parseRestockMeta(note.content);

  return {
    id: note.id,
    title: note.title,
    content: restockMeta?.description ?? (note.content ?? ""),
    status: deriveStatus(note),
    price: restockMeta?.price ?? 0,
    shelfLifeDays: restockMeta?.shelfLifeDays ?? 0,
    category: restockMeta?.category ?? "otros",
    imagePlaceholder: restockMeta?.imagePlaceholder ?? "AWS",
    expiresAt: parseDate(note.expires_at),
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  };
};

// Convierte una nota de tipo idea/alerta al formato usado por la pestaña de alertas.
const normalizeIdea = (note: ApiNote): IdeaNote => {
  const alertMeta = parseAlertMeta(note.content);
  const dueDate = parseDate(alertMeta?.dueDate);

  return {
    id: note.id,
    title: note.title,
    color: note.color ?? "#DDDDDD",
    tags: note.tags ?? [],
    imagePlaceholder: alertMeta?.imagePlaceholder ?? "AWS",
    sourceType: alertMeta?.sourceType ?? "restock",
    daysRemaining: alertMeta?.daysRemaining ?? daysUntil(dueDate),
    dueDate,
    createdAt: new Date(note.created_at),
    updatedAt: new Date(note.updated_at),
  };
};

// Descarga todas las notas y completa los checklist-items faltantes antes de normalizar.
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

// Crea una idea automatica para recordar reposiciones o entregas proximas.
const createAlertIdea = async (
  token: string,
  params: {
    sourceType: "restock" | "order";
    sourceName: string;
    dueDate?: Date;
    imagePlaceholder: string;
  },
) => {
  const daysRemaining = daysUntil(params.dueDate);

  await api.createNote(token, {
    title:
      params.sourceType === "restock"
        ? `Reposicion: ${params.sourceName}`
        : `Pedido: ${params.sourceName}`,
    type: "idea",
    color: params.sourceType === "restock" ? "#F6EFCF" : "#D9EEF8",
    content: encodeAlertMeta({
      sourceType: params.sourceType,
      sourceName: params.sourceName,
      daysRemaining,
      imagePlaceholder: params.imagePlaceholder,
      dueDate: params.dueDate?.toISOString(),
    }),
    tags: [
      params.sourceType === "restock" ? "reposicion" : "pedido",
      `${daysRemaining} dias restantes`,
      "foto: placeholder",
    ],
  });
};

// Pide una URL firmada, sube el archivo y devuelve la URL publica final.
const uploadImageToS3 = async (
  token: string,
  input: {
    localUri: string;
    purpose: "avatar" | "restock" | "order";
    contentType?: string;
    extension?: string;
  },
) => {
  const contentType = input.contentType ?? "image/jpeg";

  const presign = await api.createUploadPresignedUrl(token, {
    purpose: input.purpose,
    contentType,
    extension: input.extension,
  });

  const localResponse = await fetch(input.localUri);
  if (!localResponse.ok) {
    throw new Error("No se pudo leer la imagen local seleccionada.");
  }

  const blob = await localResponse.blob();
  const uploadResponse = await fetch(presign.signedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error("No se pudo subir la imagen a AWS S3.");
  }

  return presign.publicUrl;
};

// Store central de la app: autentica, sincroniza notas y expone acciones de negocio.
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
      // Revalida la sesion de Firebase y sincroniza token y usuario en memoria.
      resolveAuthToken: async () => {
        const session = await firebaseAuthService.getSession();

        if (!session?.token) {
          throw new Error("Tu sesion expiro. Inicia sesion de nuevo.");
        }

        const currentToken = get().token;
        if (currentToken !== session.token || get().user?.id !== session.user.id) {
          set({ token: session.token, user: session.user });
        }

        await tokenStorage.setToken(session.token);
        return session.token;
      },
      // Inicializa la app restaurando sesion, token y datos remotos persistidos.
      initialize: async () => {
        if (get().hasHydrated) return;

        set({ isLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.getSession();

          if (!session?.token) {
            await tokenStorage.clearToken();
            set({ token: null, user: null, hasHydrated: true, isLoading: false });
            return;
          }

          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            ...normalized,
            hasHydrated: true,
            isLoading: false,
          });
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
      // Flujo de autenticacion por email y contrasena.
      login: async (email, password) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.login(email, password);
          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getAuthFlowErrorMessage(error) });
          throw error;
        }
      },
      // Registro de un nuevo usuario y carga inicial de datos.
      register: async (email, password) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.register(email, password);
          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getAuthFlowErrorMessage(error) });
          throw error;
        }
      },
      // Inicio de sesion con popup de Google en web.
      loginWithGooglePopup: async () => {
        set({ authLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.loginWithGooglePopup();
          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getAuthFlowErrorMessage(error) });
          throw error;
        }
      },
      // Inicio de sesion con ID token emitido por el flujo OAuth nativo.
      loginWithGoogleIdToken: async (idToken) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.loginWithGoogleIdToken(idToken);
          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getAuthFlowErrorMessage(error) });
          throw error;
        }
      },
      // Inicio de sesion con credenciales OAuth nativas (id token o access token).
      loginWithGoogleCredential: async (input) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const session = await firebaseAuthService.loginWithGoogleCredential(input);
          await tokenStorage.setToken(session.token);
          const normalized = await fetchAndNormalizeNotes(session.token);
          set({
            token: session.token,
            user: session.user,
            authLoading: false,
            ...normalized,
          });
        } catch (error) {
          set({ authLoading: false, errorMessage: getAuthFlowErrorMessage(error) });
          throw error;
        }
      },
      // Actualiza el nombre visible del usuario autenticado.
      updateProfileName: async (displayName) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const updatedUser = await firebaseAuthService.updateDisplayName(displayName);
          set({ user: updatedUser, authLoading: false });
        } catch (error) {
          set({ authLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Guarda una nueva foto de perfil ya subida al almacenamiento remoto.
      updateProfilePhoto: async (photoURL) => {
        set({ authLoading: true, errorMessage: null });

        try {
          const updatedUser = await firebaseAuthService.updatePhotoURL(photoURL);
          set((state) => ({
            user: state.user
              ? {
                  ...updatedUser,
                  photoURL,
                }
              : updatedUser,
            authLoading: false,
          }));
        } catch (error) {
          set({ authLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Reautentica al usuario antes de cambiar su contrasena en Firebase.
      changePassword: async (currentPassword, newPassword) => {
        set({ authLoading: true, errorMessage: null });

        try {
          await firebaseAuthService.changePassword(currentPassword, newPassword);
          set({ authLoading: false });
        } catch (error) {
          set({ authLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Limpia la sesion y borra todos los datos locales sensibles.
      logout: async () => {
        await firebaseAuthService.logout();
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
      // Fuerza una resincronizacion completa de notas, pedidos e ideas.
      refreshNotes: async () => {
        const token = await get().resolveAuthToken();

        set({ isLoading: true, errorMessage: null });

        try {
          const normalized = await fetchAndNormalizeNotes(token);
          set({ ...normalized, isLoading: false });
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Crea una reposicion y su alerta asociada a la fecha de vencimiento.
      createRestockNote: async ({ title, content, price, shelfLifeDays, category, imagePlaceholder, status, expiresAt }) => {
        const token = await get().resolveAuthToken();

        set({ isLoading: true, errorMessage: null });

        try {
          await api.createNote(token, {
            title,
            type: "note",
            content: encodeRestockMeta({
              description: content,
              price,
              shelfLifeDays,
              category,
              imagePlaceholder,
            }),
            color: statusToColor[status],
            expires_at: expiresAt.toISOString(),
          });

          await createAlertIdea(token, {
            sourceType: "restock",
            sourceName: title,
            dueDate: expiresAt,
            imagePlaceholder,
          });

          const normalized = await fetchAndNormalizeNotes(token);
          set({ ...normalized, isLoading: false });
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Crea un pedido tipo checklist y genera una alerta para su entrega.
      createChecklist: async ({ title, description, routeUrl, imagePlaceholder, deliveryDate }) => {
        const token = await get().resolveAuthToken();

        set({ isLoading: true, errorMessage: null });

        try {
          await api.createNote(token, {
            title,
            type: "checklist",
            content: encodeOrderMeta({
              description,
              routeUrl,
              imagePlaceholder,
            }),
            delivery_date: deliveryDate?.toISOString(),
          });

          await createAlertIdea(token, {
            sourceType: "order",
            sourceName: title,
            dueDate: deliveryDate,
            imagePlaceholder,
          });

          const normalized = await fetchAndNormalizeNotes(token);
          set({ ...normalized, isLoading: false });
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Sube una imagen a S3 a traves del backend y devuelve su URL publica.
      uploadImageToS3: async (input) => {
        const token = await get().resolveAuthToken();
        set({ isLoading: true, errorMessage: null });

        try {
          const publicUrl = await uploadImageToS3(token, input);
          set({ isLoading: false });
          return publicUrl;
        } catch (error) {
          set({ isLoading: false, errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Agrega una tarea al checklist seleccionado y actualiza el estado local.
      addChecklistItem: async (checklistId, text) => {
        const token = await get().resolveAuthToken();

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
      // Inserta una idea manual en el backend y la refleja en el store local.
      addIdea: async (idea) => {
        const token = await get().resolveAuthToken();

        try {
          const created = await api.createNote(token, {
            title: idea.title,
            type: "idea",
            color: idea.color,
          });

          set((state) => ({
            ideas: sortByDateDesc([
              ...state.ideas,
              {
                ...normalizeIdea(created),
                tags: idea.tags,
              },
            ]),
          }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Elimina una reposicion del backend y la saca del estado local.
      deleteNote: async (id) => {
        const token = await get().resolveAuthToken();

        try {
          await api.deleteNote(token, id);
          set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Elimina un pedido/checklist del backend y del store.
      deleteChecklist: async (id) => {
        const token = await get().resolveAuthToken();

        try {
          await api.deleteNote(token, id);
          set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Elimina una idea del backend y del store local.
      deleteIdea: async (id) => {
        const token = await get().resolveAuthToken();

        try {
          await api.deleteNote(token, id);
          set((state) => ({ ideas: state.ideas.filter((i) => i.id !== id) }));
        } catch (error) {
          set({ errorMessage: getErrorMessage(error) });
          throw error;
        }
      },
      // Mueve una reposicion al historial despues de eliminarla del backend.
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
      // Mueve un checklist al historial conservando su snapshot local.
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
      // Mueve una alerta al historial conservando sus datos para consulta.
      archiveIdea: async (id) => {
        const found = get().ideas.find((i) => i.id === id);
        if (!found) return;

        await get().deleteIdea(id);

        set((state) => ({
          archived: [
            {
              id: `arch-idea-${id}`,
              type: "idea",
              data: found,
              archivedAt: new Date(),
            },
            ...state.archived,
          ],
        }));
      },
      // Alterna el estado de una tarea remota y devuelve si el checklist quedo completo.
      toggleChecklistItem: async (checklistId, itemId) => {
        const token = await get().resolveAuthToken();

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

// Selector corto para saber cuando el store termino de hidratarse.
export const useStoreHydrated = () => useNotesStore((state) => state.hasHydrated);

// Devuelve una vista resumida del estado de hidratacion y listas principales.
export const useStoreHydration = () => {
  const hasHydrated = useNotesStore((state) => state.hasHydrated);

  return {
    hasHydrated,
    notes: useNotesStore.getState().notes,
    checklists: useNotesStore.getState().checklists,
    ideas: useNotesStore.getState().ideas,
  };
};
