import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, View } from "react-native";
import { Button, Chip, Text } from "react-native-paper";

import { useNotesStore } from "../../../store/notesStore";

export default function IdeaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const idea = useNotesStore((state) => state.ideas.find((i) => i.id === id));
  const deleteIdea = useNotesStore((state) => state.deleteIdea);
  const archiveIdea = useNotesStore((state) => state.archiveIdea);

  if (!idea) {
    return (
      <View style={styles.center}>
        <Text variant="headlineSmall">Idea no encontrada</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: idea.color }]}>
      <Text variant="headlineMedium">{idea.title}</Text>
      <View style={styles.tags}>
        {idea.tags.map((tag) => (
          <Chip key={tag}>{tag}</Chip>
        ))}
      </View>

      <Button
        mode="contained-tonal"
        icon="archive"
        onPress={async () => {
          archiveIdea(idea.id);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        Archivar
      </Button>

      <Button
        mode="contained"
        onPress={() => {
          Alert.alert("Eliminar idea", "¿Seguro que quieres eliminarla?", [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Eliminar",
              style: "destructive",
              onPress: async () => {
                deleteIdea(idea.id);
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
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
