import { Stack } from "expo-router";

export default function ChecklistsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Tareas" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de checklist" }} />
    </Stack>
  );
}
