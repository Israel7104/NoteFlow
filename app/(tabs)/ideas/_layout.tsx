import { Stack } from "expo-router";

export default function IdeasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Ideas" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de idea" }} />
    </Stack>
  );
}
