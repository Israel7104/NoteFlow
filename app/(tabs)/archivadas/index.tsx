// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, Text, TextInput } from "react-native-paper";

import { useNotesStore } from "../../../store/notesStore";
import type { ArchivedItem } from "../../../types";
import { isChecklistNote, isIdeaNote, isTextNote } from "../../../types";

export default function ArchivedScreen() {
  const archived = useNotesStore((state) => state.archived);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      archived.filter((item) => {
        const target = item.data.title.toLowerCase();
        return target.includes(query.toLowerCase());
      }),
    [archived, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar historial"
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlashList<ArchivedItem>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 110 } as any)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium">{item.data.title}</Text>
              <View style={styles.row}>
                <Chip compact>{item.type}</Chip>
                <Text variant="labelSmall">
                  Movido: {new Date(item.archivedAt).toLocaleDateString("es-ES")}
                </Text>
              </View>
              {isTextNote(item.data) && (
                <Text variant="bodySmall" numberOfLines={2} style={styles.preview}>
                  {item.data.content}
                </Text>
              )}
              {isChecklistNote(item.data) && (
                <Text variant="bodySmall" style={styles.preview}>
                  {item.data.items.filter((i: { isCompleted: boolean }) => i.isCompleted).length}/
                  {item.data.items.length} tareas
                </Text>
              )}
              {isIdeaNote(item.data) && (
                <Text variant="bodySmall" style={styles.preview}>
                  {item.data.tags.join(", ")}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">No hay historial</Text>
            <Text variant="bodyMedium">Cuando muevas un registro al historial aparecera aqui.</Text>
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
  card: {
    marginBottom: 12,
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preview: {
    marginTop: 10,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    gap: 8,
  },
});
