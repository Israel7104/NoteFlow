// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { memo } from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

import type { Note } from "../../types";
import { formatDate } from "./itemUtils";

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

const NoteCardComponent = ({ note, onPress }: NoteCardProps) => (
  <Card style={styles.card} onPress={onPress} mode="elevated">
    <Card.Content>
      <Text variant="titleMedium" numberOfLines={1}>
        {note.title}
      </Text>
      <Text variant="bodyMedium" numberOfLines={2} style={styles.preview}>
        Estado: {(note.status ?? "hay-pocos").replace("-", " ")} • {note.content}
      </Text>
      <Text variant="labelSmall" style={styles.meta}>
        Creada: {formatDate(note.createdAt)}
        {note.expiresAt ? ` • Caduca: ${formatDate(note.expiresAt)}` : ""}
      </Text>
    </Card.Content>
  </Card>
);

export const NoteCard = memo(NoteCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  preview: {
    marginTop: 8,
  },
  meta: {
    marginTop: 10,
  },
});
