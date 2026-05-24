export interface BaseNote {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export type RestockStatus = "faltan" | "hay-pocos" | "hay-muchos" | "pasados";

export interface Note extends BaseNote {
  content: string;
  status: RestockStatus;
  expiresAt?: Date;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ChecklistNote extends BaseNote {
  items: ChecklistItem[];
  deliveryDate?: Date;
}

export interface IdeaNote extends BaseNote {
  tags: string[];
  color: string;
}

export type AnyNote = Note | ChecklistNote | IdeaNote;

export interface ArchivedItem {
  id: string;
  type: "note" | "checklist" | "idea";
  data: AnyNote;
  archivedAt: Date;
}

export const isChecklistNote = (note: AnyNote): note is ChecklistNote =>
  "items" in note;

export const isIdeaNote = (note: AnyNote): note is IdeaNote =>
  "tags" in note && "color" in note;

export const isTextNote = (note: AnyNote): note is Note => "content" in note;
