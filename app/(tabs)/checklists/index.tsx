import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import { ChecklistCard } from "../../../components/items/ChecklistCard";
import { useNotesStore } from "../../../store/notesStore";
import type { ChecklistNote } from "../../../types";

export default function ChecklistsScreen() {
  const checklists = useNotesStore((state) => state.checklists);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      checklists.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
        const listMatch = item.items.some((task) =>
          task.text.toLowerCase().includes(query.toLowerCase()),
        );
        return titleMatch || listMatch;
      }),
    [checklists, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar pedido"
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlashList<ChecklistNote>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 116 } as any)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View>
            <ChecklistCard
              checklist={item}
              onPress={() =>
                router.push({ pathname: "/(tabs)/checklists/[id]", params: { id: item.id } })
              }
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">No hay pedidos todavía</Text>
            <Text variant="bodyMedium">Registra pedidos con fecha de envio para dar seguimiento.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  listContent: {
    paddingTop: 14,
    paddingBottom: 120,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    gap: 8,
  },
});
