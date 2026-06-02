// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
// Campos comunes que comparten todas las entidades mostradas en la app.
export interface BaseNote {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

// Categorias disponibles para productos de reposicion.
export type ProductCategory =
  | "cupcakes"
  | "pastel-entero-pequeno"
  | "pastel-entero-grande"
  | "dulces"
  | "galletas"
  | "otros";

// Estado visual de una reposicion dentro del tablero principal.
export type RestockStatus = "faltan" | "hay-pocos" | "hay-muchos" | "pasados";

// Modelo de una nota de reposicion con datos comerciales del producto.
export interface Note extends BaseNote {
  content: string;
  status: RestockStatus;
  expiresAt?: Date;
  price: number;
  shelfLifeDays: number;
  category: ProductCategory;
  imagePlaceholder: string;
}

// Item individual dentro de un checklist de pedido.
export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

// Modelo para pedidos con tareas, entrega y ruta de seguimiento.
export interface ChecklistNote extends BaseNote {
  items: ChecklistItem[];
  deliveryDate?: Date;
  description: string;
  routeUrl: string;
  imagePlaceholder: string;
}

// Modelo de alerta derivada de vencimientos o entregas proximas.
export interface IdeaNote extends BaseNote {
  tags: string[];
  color: string;
  imagePlaceholder: string;
  sourceType: "restock" | "order";
  daysRemaining: number;
  dueDate?: Date;
}

export type AnyNote = Note | ChecklistNote | IdeaNote;

// Estructura persistida cuando un elemento se mueve al historial.
export interface ArchivedItem {
  id: string;
  type: "note" | "checklist" | "idea";
  data: AnyNote;
  archivedAt: Date;
}

// Type guard para distinguir checklists del resto de elementos archivables.
export const isChecklistNote = (note: AnyNote): note is ChecklistNote =>
  "items" in note;

// Type guard para distinguir alertas e ideas derivadas.
export const isIdeaNote = (note: AnyNote): note is IdeaNote =>
  "tags" in note && "color" in note;

// Type guard para detectar notas de texto y reposicion.
export const isTextNote = (note: AnyNote): note is Note => "content" in note;
