import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { Card, Chip, Text, TextInput } from "react-native-paper";

import { useNotesStore } from "../../../store/notesStore";
import { formatDate } from "../../../components/items/itemUtils";
import type { Note } from "../../../types";

export default function IdeasScreen() {
  const notes = useNotesStore((state) => state.notes);
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      notes.filter((note) => {
        const isExpiredByStatus = (note.status ?? "hay-pocos") === "pasados";
        const isExpiredByDate = note.expiresAt ? new Date(note.expiresAt).getTime() < Date.now() : false;
        const matchesQuery =
          note.title.toLowerCase().includes(query.toLowerCase()) ||
          note.content.toLowerCase().includes(query.toLowerCase());

        return (isExpiredByStatus || isExpiredByDate) && matchesQuery;
      }),
    [notes, query],
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

      <FlashList<Note>
        data={filtered}
        keyExtractor={(item) => item.id}
        {...({ estimatedItemSize: 128 } as any)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 45)} exiting={FadeOutLeft}>
            <Card style={styles.alertCard} mode="outlined">
              <Card.Content>
                <Text variant="titleMedium">{item.title}</Text>
                <Text variant="bodySmall" style={styles.alertText}>
                  {item.content}
                </Text>
                <View style={styles.alertRow}>
                  <Chip compact icon="alert-circle">Pastel pasado</Chip>
                  <Text variant="labelSmall">
                    {item.expiresAt ? `Caduca: ${formatDate(item.expiresAt)}` : "Sin fecha de caducidad"}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">Sin alertas de pasteles pasados</Text>
            <Text variant="bodyMedium">Cuando un pastel se marque como pasado aparecera aqui.</Text>
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
  alertCard: {
    marginBottom: 12,
  },
  alertText: {
    marginTop: 8,
    opacity: 0.8,
  },
  alertRow: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
});
