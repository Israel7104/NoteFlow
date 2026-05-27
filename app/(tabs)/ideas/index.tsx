// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TextInput } from "react-native-paper";

import { IdeaCard } from "../../../components/items/IdeaCard";
import { useNotesStore } from "../../../store/notesStore";
import type { IdeaNote } from "../../../types";

export default function IdeasScreen() {
  const ideas = useNotesStore((state) => state.ideas);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      ideas.filter((idea) => {
        const matchesQuery =
          idea.title.toLowerCase().includes(query.toLowerCase()) ||
          idea.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

        return matchesQuery;
      }),
    [ideas, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar alertas"
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlashList<IdeaNote>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 128 } as any)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View>
            <IdeaCard
              idea={item}
              onPress={() => router.push({ pathname: "/(tabs)/ideas/[id]", params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">Sin ideas registradas</Text>
            <Text variant="bodyMedium">Las ideas guardadas apareceran aqui con sus etiquetas.</Text>
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
