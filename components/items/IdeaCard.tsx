// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Avatar, Card, Chip, Text } from "react-native-paper";

import type { IdeaNote } from "../../types";
import { formatDate } from "./itemUtils";

interface IdeaCardProps {
  idea: IdeaNote;
  onPress: () => void;
}

const IdeaCardComponent = ({ idea, onPress }: IdeaCardProps) => (
  <Card style={[styles.card, { backgroundColor: idea.color }]} onPress={onPress} mode="elevated">
    <Card.Content>
      <View style={styles.headerRow}>
        <Avatar.Text size={36} label="AWS" />
        <View style={styles.titleBlock}>
          <Text variant="titleMedium" numberOfLines={1}>
            {idea.title}
          </Text>
          <Text variant="bodySmall">{idea.daysRemaining} dias restantes</Text>
        </View>
      </View>
      <Text variant="titleMedium" numberOfLines={1}>
        {idea.sourceType === "restock" ? "Reposicion" : "Pedido"}
      </Text>
      <View style={styles.chipsRow}>
        {idea.tags.slice(0, 3).map((tag) => (
          <Chip key={tag} compact style={styles.chip}>
            {tag}
          </Chip>
        ))}
      </View>
      <Text variant="labelSmall" style={styles.meta}>
        Creada: {formatDate(idea.createdAt)}
      </Text>
    </Card.Content>
  </Card>
);

export const IdeaCard = memo(IdeaCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  chipsRow: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  titleBlock: {
    flex: 1,
  },
  chip: {
    marginRight: 8,
    marginTop: 6,
  },
  meta: {
    marginTop: 10,
    opacity: 0.7,
  },
});
