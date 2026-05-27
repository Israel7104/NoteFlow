// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Button, Card, Text } from "react-native-paper";

import { useNotesStore } from "../../../store/notesStore";

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const note = useNotesStore((state) => state.notes.find((n) => n.id === id));
  const archiveNote = useNotesStore((state) => state.archiveNote);
  const deleteNote = useNotesStore((state) => state.deleteNote);

  if (!note) {
    return (
      <View style={styles.center}>
        <Text variant="headlineSmall">Registro no encontrado</Text>
      </View>
    );
  }

  const confirmDelete = () => {
    Alert.alert("Eliminar registro", "Esta accion no se puede deshacer", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(note.id);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Card mode="elevated">
        <Card.Content>
          <Text variant="headlineMedium">{note.title}</Text>
          <Text variant="bodyMedium" style={styles.date}>
            Creado: {new Date(note.createdAt).toLocaleString("es-ES")}
          </Text>
          <Text variant="bodyMedium" style={styles.date}>
            Estado: {(note.status ?? "hay-pocos").replace("-", " ")}
          </Text>
          <Text variant="bodyMedium" style={styles.date}>
            {note.expiresAt
              ? `Caducidad: ${new Date(note.expiresAt).toLocaleDateString("es-ES")}`
              : "Caducidad: sin fecha"}
          </Text>
          <Text variant="bodyLarge" style={styles.content}>
            {note.content}
          </Text>
        </Card.Content>
      </Card>

      <Button
        mode="contained-tonal"
        icon="archive"
        onPress={async () => {
          try {
            await archiveNote(note.id);
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "No se pudo archivar");
          }
        }}
        style={styles.button}
      >
        Mover a historial
      </Button>
      <Button mode="contained" onPress={confirmDelete} style={styles.button}>
        Eliminar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  date: {
    marginTop: 8,
  },
  content: {
    marginTop: 16,
    lineHeight: 24,
  },
  button: {
    marginTop: 4,
  },
});
