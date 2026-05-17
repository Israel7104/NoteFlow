import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutLeft } from "react-native-reanimated";
import { Text, TextInput } from "react-native-paper";

import { IdeaCard } from "../../../components/items/IdeaCard";
import { useNotesStore } from "../../../store/notesStore";

export default function IdeasScreen() {
  const ideas = useNotesStore((state) => state.ideas);
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      ideas.filter(
        (idea) =>
          idea.title.toLowerCase().includes(query.toLowerCase()) ||
          idea.tags.join(" ").toLowerCase().includes(query.toLowerCase()),
      ),
    [ideas, query],
  );

  return (
    <View style={styles.container}>
      <TextInput
        mode="outlined"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por etiqueta o título"
        left={<TextInput.Icon icon="magnify" />}
      />

      <FlashList
        data={filtered}
        keyExtractor={(item) => item.id}
        estimatedItemSize={128}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 45)} exiting={FadeOutLeft}>
            <IdeaCard
              idea={item}
              onPress={() => router.push({ pathname: "/(tabs)/ideas/[id]", params: { id: item.id } })}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="headlineSmall">Sin ideas por ahora</Text>
            <Text variant="bodyMedium">Anota inspiraciones rápidas y etiquétalas.</Text>
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
});
