// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Stack } from "expo-router";

// Registra las rutas del tablero de reposicion y su vista individual.
export default function NotasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Reposicion de pasteles" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de reposicion" }} />
    </Stack>
  );
}
