// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Card, ProgressBar, Text } from "react-native-paper";

import type { ChecklistNote } from "../../types";
import { formatDate } from "./itemUtils";

interface ChecklistCardProps {
  checklist: ChecklistNote;
  onPress: () => void;
}

const ChecklistCardComponent = ({ checklist, onPress }: ChecklistCardProps) => {
  const total = checklist.items.length;
  const completed = checklist.items.filter((item) => item.isCompleted).length;
  const progress = total === 0 ? 0 : completed / total;

  return (
    <Card style={styles.card} onPress={onPress} mode="elevated">
      <Card.Content>
        <Text variant="titleMedium" numberOfLines={1}>
          {checklist.title}
        </Text>
        <View style={styles.row}>
          <Text variant="bodySmall">
            Pedido: {completed}/{total} items listos
          </Text>
          <Text variant="labelSmall">
            Entrega: {checklist.deliveryDate ? formatDate(checklist.deliveryDate) : "sin fecha"}
          </Text>
        </View>
        <ProgressBar progress={progress} style={styles.progress} />
      </Card.Content>
    </Card>
  );
};

export const ChecklistCard = memo(ChecklistCardComponent);

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progress: {
    marginTop: 10,
    height: 10,
    borderRadius: 999,
  },
});
