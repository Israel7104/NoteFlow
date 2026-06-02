// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Stack } from "expo-router";

// Expone la navegacion interna de la seccion de historial.
export default function ArchivadasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Historial" }} />
    </Stack>
  );
}
