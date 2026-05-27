// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Stack } from "expo-router";

export default function IdeasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Alertas" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de alerta" }} />
    </Stack>
  );
}
