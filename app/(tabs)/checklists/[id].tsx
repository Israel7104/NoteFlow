// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
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
        <Text variant="headlineSmall">Pedido no encontrado</Text>
      </View>
    );
  }

  const onToggle = async (itemId: string) => {
    try {
      const completedAll = await toggleChecklistItem(checklist.id, itemId);
      if (completedAll) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo actualizar el item");
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium">{checklist.title}</Text>
      <Text variant="bodyMedium" style={styles.meta}>
        Creado: {new Date(checklist.createdAt).toLocaleDateString("es-ES")}
      </Text>
      <Text variant="bodyMedium" style={styles.meta}>
        {checklist.deliveryDate
          ? `Envio: ${new Date(checklist.deliveryDate).toLocaleDateString("es-ES")}`
          : "Envio: sin fecha"}
      </Text>
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
          try {
            await archiveChecklist(checklist.id);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "No se pudo archivar");
          }
        }}
      >
        Mover a historial
      </Button>

      <Button
        mode="contained"
        onPress={() => {
          Alert.alert("Eliminar pedido", "¿Seguro que quieres eliminarlo?", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                try {
                  await deleteChecklist(checklist.id);
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                } catch (error) {
                  Alert.alert("Error", error instanceof Error ? error.message : "No se pudo eliminar");
                }
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
  meta: {
    opacity: 0.75,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
