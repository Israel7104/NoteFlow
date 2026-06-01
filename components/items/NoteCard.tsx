// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { memo } from "react";
import { StyleSheet } from "react-native";
import { Card, Text } from "react-native-paper";

import { RemoteImage } from "./RemoteImage";
import type { Note } from "../../types";
import { formatDate } from "./itemUtils";

interface NoteCardProps {
  note: Note;
  onPress: () => void;
}

const NoteCardComponent = ({ note, onPress }: NoteCardProps) => (
  <Card style={styles.card} onPress={onPress} mode="elevated">
    <Card.Content>
      <RemoteImage
        uri={note.imagePlaceholder}
        containerStyle={styles.thumbnail}
        style={styles.thumbnail}
        placeholderText="Sin foto"
      />
      <Text variant="titleMedium" numberOfLines={1}>
        {note.title}
      </Text>
      <Text variant="bodyMedium" numberOfLines={2} style={styles.preview}>
        {note.category.replace(/-/g, " ")} • ${note.price.toFixed(2)} • {note.content}
      </Text>
      <Text variant="labelSmall" style={styles.meta}>
        Duracion: {note.shelfLifeDays} dias • Creada: {formatDate(note.createdAt)}
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
  thumbnail: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
  },
  meta: {
    marginTop: 10,
  },
});
