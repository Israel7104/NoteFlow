import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";

import type { IdeaNote } from "../../types";
import { formatDate } from "./itemUtils";

interface IdeaCardProps {
  idea: IdeaNote;
  onPress: () => void;
}

const IdeaCardComponent = ({ idea, onPress }: IdeaCardProps) => (
  <Card style={[styles.card, { backgroundColor: idea.color }]} onPress={onPress} mode="elevated">
    <Card.Content>
      <Text variant="titleMedium" numberOfLines={1}>
        {idea.title}
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
  chip: {
    marginRight: 8,
    marginTop: 6,
  },
  meta: {
    marginTop: 10,
    opacity: 0.7,
  },
});
