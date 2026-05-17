import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { Text, TextInput } from "react-native-paper";

import { NoteCard } from "../../../components/items/NoteCard";
import { useNotesStore } from "../../../store/notesStore";
import type { Note } from "../../../types";

export default function NotesScreen() {
  const notes = useNotesStore((state) => state.notes);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.content.toLowerCase().includes(query.toLowerCase()),
      ),
    [notes, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar en notas"
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlashList<Note>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 108 } as any)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 45)} exiting={FadeOutLeft}>
            <NoteCard
              note={item}
              onPress={() => router.push({ pathname: "/(tabs)/notas/[id]", params: { id: item.id } })}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">No hay notas todavía</Text>
            <Text variant="bodyMedium">Toca el icono + para crear la primera.</Text>
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
