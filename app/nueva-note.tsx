import { z } from "zod";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, HelperText, SegmentedButtons, Text, TextInput } from "react-native-paper";

import { noteIdeaColors } from "../constants/theme";
import { useNotesStore } from "../store/notesStore";
import type { ChecklistItem, ChecklistNote, IdeaNote, Note } from "../types";

const noteSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres"),
  content: z.string().min(1, "El contenido no puede estar vacio"),
});

const checklistSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres"),
  items: z.array(z.string().min(1, "Cada item debe tener texto")).min(1, "Agrega al menos una tarea"),
});

const ideaSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres"),
  tags: z.array(z.string().min(1)).min(1, "Agrega al menos una etiqueta"),
  color: z.string().min(1, "Selecciona un color"),
});

type FormType = "note" | "checklist" | "idea";

export default function NewNoteModal() {
  const router = useRouter();

  const addNote = useNotesStore((state) => state.addNote);
  const addChecklist = useNotesStore((state) => state.addChecklist);
  const addIdea = useNotesStore((state) => state.addIdea);

  const [type, setType] = useState<FormType>("note");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [itemText, setItemText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [tagsText, setTagsText] = useState("");
  const [selectedColor, setSelectedColor] = useState(noteIdeaColors[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText],
  );

  const createId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const reset = () => {
    setTitle("");
    setContent("");
    setItemText("");
    setItems([]);
    setTagsText("");
    setSelectedColor(noteIdeaColors[0]);
    setErrors({});
  };

  const submit = () => {
    if (type === "note") {
      const result = noteSchema.safeParse({ title, content });
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors({
          title: fieldErrors.title?.[0] ?? "",
          content: fieldErrors.content?.[0] ?? "",
        });
        return;
      }

      const payload: Note = {
        id: createId(),
        title,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addNote(payload);
      reset();
      router.back();
      return;
    }

    if (type === "checklist") {
      const result = checklistSchema.safeParse({ title, items });
      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors({
          title: fieldErrors.title?.[0] ?? "",
          items: fieldErrors.items?.[0] ?? "",
        });
        return;
      }

      const checklistItems: ChecklistItem[] = items.map((text) => ({
        id: createId(),
        text,
        isCompleted: false,
      }));

      const payload: ChecklistNote = {
        id: createId(),
        title,
        items: checklistItems,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addChecklist(payload);
      reset();
      router.back();
      return;
    }

    const result = ideaSchema.safeParse({ title, tags, color: selectedColor });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        tags: fieldErrors.tags?.[0] ?? "",
      });
      return;
    }

    const payload: IdeaNote = {
      id: createId(),
      title,
      tags,
      color: selectedColor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addIdea(payload);
    reset();
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge">Crear contenido</Text>

        <SegmentedButtons
          value={type}
          onValueChange={(value) => {
            setType(value as FormType);
            setErrors({});
          }}
          buttons={[
            { value: "note", label: "Nota" },
            { value: "checklist", label: "Checklist" },
            { value: "idea", label: "Idea" },
          ]}
        />

        <TextInput mode="outlined" label="Titulo" value={title} onChangeText={setTitle} />
        <HelperText type="error" visible={Boolean(errors.title)}>
          {errors.title}
        </HelperText>

        {type === "note" && (
          <>
            <TextInput
              mode="outlined"
              label="Contenido"
              multiline
              numberOfLines={5}
              value={content}
              onChangeText={setContent}
            />
            <HelperText type="error" visible={Boolean(errors.content)}>
              {errors.content}
            </HelperText>
          </>
        )}

        {type === "checklist" && (
          <>
            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="Nueva tarea"
                value={itemText}
                onChangeText={setItemText}
                style={styles.grow}
              />
              <Button
                mode="contained"
                onPress={() => {
                  if (itemText.trim().length === 0) return;
                  setItems((prev) => [...prev, itemText.trim()]);
                  setItemText("");
                }}
              >
                Agregar
              </Button>
            </View>
            {items.map((item, index) => (
              <Text key={`${item}-${index}`} variant="bodyMedium">
                - {item}
              </Text>
            ))}
            <HelperText type="error" visible={Boolean(errors.items)}>
              {errors.items}
            </HelperText>
          </>
        )}

        {type === "idea" && (
          <>
            <TextInput
              mode="outlined"
              label="Etiquetas (separadas por coma)"
              value={tagsText}
              onChangeText={setTagsText}
            />
            <HelperText type="error" visible={Boolean(errors.tags)}>
              {errors.tags}
            </HelperText>
            <Text variant="bodySmall">Color</Text>
            <View style={styles.palette}>
              {noteIdeaColors.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.color,
                    { backgroundColor: color },
                    color === selectedColor && styles.selected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>
          </>
        )}

        <Button mode="contained" onPress={submit}>
          Guardar
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    gap: 8,
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  palette: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  color: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#B8A89A",
  },
  selected: {
    borderWidth: 3,
    borderColor: "#1E1B16",
  },
});
