import { z } from "zod";
import { useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore } from "../store/notesStore";
import type { ChecklistItem, ChecklistNote, Note, RestockStatus } from "../types";

const restockSchema = z.object({
  title: z.string().min(3, "El nombre del pastel debe tener al menos 3 caracteres"),
  status: z.enum(["faltan", "hay-pocos", "hay-muchos", "pasados"]),
  content: z.string().min(1, "Agrega un detalle corto"),
  expiresAt: z.string().optional(),
});

const orderSchema = z.object({
  title: z.string().min(3, "El nombre del pedido debe tener al menos 3 caracteres"),
  items: z.array(z.string().min(1, "Cada item debe tener texto")).min(1, "Agrega al menos un item"),
  deliveryDate: z.string().optional(),
});

type FormType = "restock" | "order";

const parseDate = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  const ddmmyyyyMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, dayRaw, monthRaw, yearRaw] = ddmmyyyyMatch;
    const day = Number(dayRaw);
    const month = Number(monthRaw);
    const year = Number(yearRaw);
    const candidate = new Date(year, month - 1, day);

    if (
      candidate.getFullYear() === year &&
      candidate.getMonth() === month - 1 &&
      candidate.getDate() === day
    ) {
      return candidate;
    }

    return undefined;
  }

  const value = new Date(trimmed);
  return Number.isNaN(value.getTime()) ? undefined : value;
};

export default function NewNoteModal() {
  const router = useRouter();
  const theme = useTheme();

  const addNote = useNotesStore((state) => state.addNote);
  const addChecklist = useNotesStore((state) => state.addChecklist);

  const [type, setType] = useState<FormType>("restock");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<RestockStatus>("faltan");
  const [content, setContent] = useState("");
  const [expiresAtText, setExpiresAtText] = useState("");
  const [deliveryDateText, setDeliveryDateText] = useState("");
  const [itemText, setItemText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createId = () => `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const reset = () => {
    setTitle("");
    setStatus("faltan");
    setContent("");
    setExpiresAtText("");
    setDeliveryDateText("");
    setItemText("");
    setItems([]);
    setErrors({});
  };

  const submit = () => {
    if (type === "restock") {
      const result = restockSchema.safeParse({
        title,
        status,
        content,
        expiresAt: expiresAtText,
      });

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
        status,
        expiresAt: parseDate(expiresAtText),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      addNote(payload);
      reset();
      router.back();
      return;
    }

    const result = orderSchema.safeParse({
      title,
      items,
      deliveryDate: deliveryDateText,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        items: fieldErrors.items?.[0] ?? "",
      });
      return;
    }

    const orderItems: ChecklistItem[] = items.map((text) => ({
      id: createId(),
      text,
      isCompleted: false,
    }));

    const payload: ChecklistNote = {
      id: createId(),
      title,
      items: orderItems,
      deliveryDate: parseDate(deliveryDateText),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addChecklist(payload);
    reset();
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge" style={{ color: theme.colors.onBackground, fontWeight: "700" }}>
          Nuevo registro de pasteleria
        </Text>

        <SegmentedButtons
          value={type}
          onValueChange={(value) => {
            setType(value as FormType);
            setErrors({});
          }}
          buttons={[
            {
              value: "restock",
              label: "Reposicion",
              style: {
                backgroundColor:
                  type === "restock" ? theme.colors.primaryContainer : theme.colors.surface,
              },
              labelStyle: {
                color:
                  type === "restock" ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                fontWeight: "600",
              },
            },
            {
              value: "order",
              label: "Pedido",
              style: {
                backgroundColor:
                  type === "order" ? theme.colors.primaryContainer : theme.colors.surface,
              },
              labelStyle: {
                color:
                  type === "order" ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                fontWeight: "600",
              },
            },
          ]}
        />

        <TextInput
          mode="outlined"
          label={type === "restock" ? "Nombre del pastel" : "Nombre del pedido"}
          value={title}
          onChangeText={setTitle}
        />
        <HelperText type="error" visible={Boolean(errors.title)}>
          {errors.title}
        </HelperText>

        {type === "restock" && (
          <>
            <Text variant="bodySmall">Estado de reposicion</Text>
            <SegmentedButtons
              value={status}
              onValueChange={(value) => setStatus(value as RestockStatus)}
              buttons={[
                {
                  value: "faltan",
                  label: "Faltan",
                  style: {
                    backgroundColor:
                      status === "faltan" ? theme.colors.primaryContainer : theme.colors.surface,
                  },
                  labelStyle: {
                    color:
                      status === "faltan" ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                    fontWeight: "600",
                  },
                },
                {
                  value: "hay-pocos",
                  label: "Hay pocos",
                  style: {
                    backgroundColor:
                      status === "hay-pocos" ? theme.colors.primaryContainer : theme.colors.surface,
                  },
                  labelStyle: {
                    color:
                      status === "hay-pocos"
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                    fontWeight: "600",
                  },
                },
                {
                  value: "hay-muchos",
                  label: "Hay muchos",
                  style: {
                    backgroundColor:
                      status === "hay-muchos" ? theme.colors.primaryContainer : theme.colors.surface,
                  },
                  labelStyle: {
                    color:
                      status === "hay-muchos"
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                    fontWeight: "600",
                  },
                },
                {
                  value: "pasados",
                  label: "Pasados",
                  style: {
                    backgroundColor:
                      status === "pasados" ? theme.colors.primaryContainer : theme.colors.surface,
                  },
                  labelStyle: {
                    color:
                      status === "pasados" ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                    fontWeight: "600",
                  },
                },
              ]}
            />

            <TextInput
              mode="outlined"
              label="Detalle"
              multiline
              numberOfLines={4}
              value={content}
              onChangeText={setContent}
            />
            <HelperText type="error" visible={Boolean(errors.content)}>
              {errors.content}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Fecha de caducidad (DD/MM/YYYY)"
              value={expiresAtText}
              onChangeText={setExpiresAtText}
            />
          </>
        )}

        {type === "order" && (
          <>
            <TextInput
              mode="outlined"
              label="Fecha de envio (DD/MM/YYYY)"
              value={deliveryDateText}
              onChangeText={setDeliveryDateText}
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                label="Item del pedido"
                value={itemText}
                onChangeText={setItemText}
                style={styles.grow}
              />
              <Button
                mode="contained"
                onPress={() => {
                  const trimmed = itemText.trim();
                  if (!trimmed) return;
                  setItems((prev) => [...prev, trimmed]);
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
});
