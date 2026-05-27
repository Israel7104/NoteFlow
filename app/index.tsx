// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Redirect } from "expo-router";

import { useNotesStore, useStoreHydrated } from "../store/notesStore";

export default function Index() {
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);

  if (!hasHydrated) {
    return null;
  }

  return <Redirect href={token ? "/notas" : "/auth"} />;
}
