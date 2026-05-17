import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Checkbox, List, Text } from "react-native-paper";

import { useNotesStore } from "../../../store/notesStore";

export default function ChecklistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const checklist = useNotesStore((state) => state.checklists.find((c) => c.id === id));
  const deleteChecklist = useNotesStore((state) => state.deleteChecklist);
  const archiveChecklist = useNotesStore((state) => state.archiveChecklist);
  const toggleChecklistItem = useNotesStore((state) => state.toggleChecklistItem);

  if (!checklist) {
    return (
      <View style={styles.center}>
        <Text variant="headlineSmall">Checklist no encontrado</Text>
      </View>
    );
  }

  const onToggle = async (itemId: string) => {
    const completedAll = toggleChecklistItem(checklist.id, itemId);
    if (completedAll) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">{checklist.title}</Text>
      {checklist.items.map((item) => (
        <List.Item
          key={item.id}
          title={item.text}
          onPress={() => onToggle(item.id)}
          left={() => (
            <Checkbox status={item.isCompleted ? "checked" : "unchecked"} onPress={() => onToggle(item.id)} />
          )}
        />
      ))}

      <Button
        mode="contained-tonal"
        icon="archive"
        onPress={async () => {
          archiveChecklist(checklist.id);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        Archivar
      </Button>

      <Button
        mode="contained"
        buttonColor="#B7483C"
        onPress={() => {
          Alert.alert("Eliminar checklist", "¿Seguro que quieres eliminarlo?", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                deleteChecklist(checklist.id);
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              },
            },
          ]);
        }}
      >
        Eliminar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
