import { Stack } from "expo-router";

export default function ChecklistsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Pedidos" }} />
      <Stack.Screen name="[id]" options={{ title: "Detalle de pedido" }} />
    </Stack>
  );
}
