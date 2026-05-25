import { FlashList } from "@shopify/flash-list";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";

import { NoteCard } from "../../../components/items/NoteCard";
import { useNotesStore } from "../../../store/notesStore";
import type { Note } from "../../../types";

export default function NotesScreen() {
  const notes = useNotesStore((state) => state.notes);
  const isLoading = useNotesStore((state) => state.isLoading);
  const errorMessage = useNotesStore((state) => state.errorMessage);
  const refreshNotes = useNotesStore((state) => state.refreshNotes);
  const router = useRouter();
  const [query, setQuery] = useState("");

  useFocusEffect(
    useCallback(() => {
      void refreshNotes();
    }, [refreshNotes]),
  );

  const filtered = useMemo(
    () =>
      notes.filter(
        (note) =>
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.content.toLowerCase().includes(query.toLowerCase()) ||
          note.status.toLowerCase().includes(query.toLowerCase()),
      ),
    [notes, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar pastel o estado"
        left={<TextInput.Icon icon="magnify" />}
      />

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text variant="bodyMedium">{errorMessage}</Text>
          <Button mode="text" onPress={() => void refreshNotes()}>
            Reintentar
          </Button>
        </View>
      )}

      <FlashList<Note>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 108 } as any)}
        refreshing={isLoading}
        onRefresh={() => {
          void refreshNotes();
        }}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View>
            <NoteCard
              note={item}
              onPress={() => router.push({ pathname: "/(tabs)/notas/[id]", params: { id: item.id } })}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">Sin pasteles en reposicion</Text>
            <Text variant="bodyMedium">Crea el primer registro para controlar stock y fechas.</Text>
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
  errorBox: {
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 4,
  },
});
