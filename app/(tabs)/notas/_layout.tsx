import { Stack } from "expo-router";

export default function NotasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Reposicion de pasteles" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de reposicion" }} />
    </Stack>
  );
}
