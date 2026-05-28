// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";

const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
});

const authResponseSchema = z.object({
  user: authUserSchema,
  token: z.string().min(1),
});

const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  is_completed: z.boolean(),
});

const apiNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.string(),
  content: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  expires_at: z.string().nullable().optional(),
  delivery_date: z.string().nullable().optional(),
  items: z.array(checklistItemSchema).optional(),
  checklist_items: z.array(checklistItemSchema).optional(),
  tags: z.array(z.string()).optional(),
});

const notesArraySchema = z.array(apiNoteSchema);
const checklistItemsArraySchema = z.array(checklistItemSchema);

export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type ApiNote = z.infer<typeof apiNoteSchema>;
export type ApiChecklistItem = z.infer<typeof checklistItemSchema>;

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

const getApiBaseUrl = () => {
  const rawUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!rawUrl) {
    throw new Error("Falta EXPO_PUBLIC_API_URL en variables de entorno");
  }

  return rawUrl.replace(/\/$/, "");
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error("Tiempo de espera agotado al llamar la API"));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
};

const getDeploymentProtectionMessage = (response: Response, contentType?: string) => {
  const isHtml = contentType?.includes("text/html");
  const hasVercelHeaders = Boolean(response.headers.get("x-vercel-id") || response.headers.get("x-frame-options"));

  if ((response.status === 401 || response.status === 403) && isHtml && hasVercelHeaders) {
    return "La API parece protegida por Vercel Deployment Protection. Desactiva la proteccion para este deployment o usa un dominio/API publica para EXPO_PUBLIC_API_URL.";
  }

  return undefined;
};

const request = async <T>(
  path: string,
  options: RequestInit & { token?: string },
  parser?: (payload: unknown) => T,
): Promise<T> => {
  const { token, headers, ...rest } = options;

  let response: Response;

  try {
    response = await withTimeout(
      fetch(`${getApiBaseUrl()}${path}`, {
        ...rest,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
      }),
      12000,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con la API";

    if (/fetch|network|failed|Load failed|NetworkError/i.test(message)) {
      throw new ApiError(
        "No se pudo conectar con la API. Si estas en web, revisa CORS y confirma que el backend no este protegido por Vercel Deployment Protection.",
        0,
        error,
      );
    }

    throw new ApiError(message, 0, error);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? undefined;
  const isJson = contentType?.includes("application/json");
  const payload = isJson ? await response.json() : undefined;

  if (!response.ok) {
    const deploymentProtectionMessage = getDeploymentProtectionMessage(response, contentType);
    if (deploymentProtectionMessage) {
      throw new ApiError(deploymentProtectionMessage, response.status);
    }

    const fallbackMessage = response.status >= 500 ? "Error interno del servidor" : "Solicitud invalida";
    const message =
      payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
        ? payload.message
        : fallbackMessage;

    throw new ApiError(message, response.status, payload);
  }

  if (!parser) {
    return payload as T;
  }

  return parser(payload);
};

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      (payload) => authResponseSchema.parse(payload),
    ),

  login: (email: string, password: string) =>
    request<AuthResponse>(
      "/api/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      (payload) => authResponseSchema.parse(payload),
    ),

  getNotes: (token: string) =>
    request<ApiNote[]>(
      `/api/notes?t=${Date.now()}`,
      {
        method: "GET",
        token,
      },
      (payload) => notesArraySchema.parse(payload),
    ),

  getNoteById: (token: string, noteId: string) =>
    request<ApiNote>(
      `/api/notes/${noteId}`,
      {
        method: "GET",
        token,
      },
      (payload) => apiNoteSchema.parse(payload),
    ),

  createNote: (
    token: string,
    payload: {
      title: string;
      type: "note" | "checklist" | "idea";
      content?: string;
      color?: string;
      expires_at?: string;
      delivery_date?: string;
      tags?: string[];
    },
  ) =>
    request<ApiNote>(
      "/api/notes",
      {
        method: "POST",
        token,
        body: JSON.stringify(payload),
      },
      (raw) => apiNoteSchema.parse(raw),
    ),

  updateNote: (
    token: string,
    noteId: string,
    payload: Partial<{ title: string; content: string; color: string }>,
  ) =>
    request<ApiNote>(
      `/api/notes/${noteId}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      },
      (raw) => apiNoteSchema.parse(raw),
    ),

  deleteNote: (token: string, noteId: string) =>
    request<void>(`/api/notes/${noteId}`, {
      method: "DELETE",
      token,
    }),

  getChecklistItems: (token: string, noteId: string) =>
    request<ApiChecklistItem[]>(
      `/api/notes/${noteId}/checklist-items`,
      {
        method: "GET",
        token,
      },
      (payload) => checklistItemsArraySchema.parse(payload),
    ),

  createChecklistItem: (token: string, noteId: string, text: string) =>
    request<ApiChecklistItem>(
      `/api/notes/${noteId}/checklist-items`,
      {
        method: "POST",
        token,
        body: JSON.stringify({ text }),
      },
      (payload) => checklistItemSchema.parse(payload),
    ),

  updateChecklistItem: (token: string, itemId: string, payload: Partial<{ text: string; is_completed: boolean }>) =>
    request<ApiChecklistItem>(
      `/api/checklist-items/${itemId}`,
      {
        method: "PATCH",
        token,
        body: JSON.stringify(payload),
      },
      (raw) => checklistItemSchema.parse(raw),
    ),

  deleteChecklistItem: (token: string, itemId: string) =>
    request<void>(`/api/checklist-items/${itemId}`, {
      method: "DELETE",
      token,
    }),
};
