import { Stack } from "expo-router";

export default function ArchivadasLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Archivadas" }} />
    </Stack>
  );
}
