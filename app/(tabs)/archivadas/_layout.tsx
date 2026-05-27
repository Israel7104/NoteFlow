// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Stack } from "expo-router";

export default function ArchivadasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Historial" }} />
    </Stack>
  );
}
