import { z } from "zod";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState, type ChangeEvent } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore } from "../store/notesStore";
import type { RestockStatus } from "../types";

const restockSchema = z.object({
  title: z.string().min(3, "El nombre del pastel debe tener al menos 3 caracteres"),
  status: z.enum(["faltan", "hay-pocos", "hay-muchos", "pasados"]),
  content: z.string().min(1, "Agrega un detalle corto"),
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

const formatShortDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
};

const toHtmlDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NewNoteModal() {
  const router = useRouter();
  const theme = useTheme();

  const createRestockNote = useNotesStore((state) => state.createRestockNote);
  const createChecklist = useNotesStore((state) => state.createChecklist);
  const isLoading = useNotesStore((state) => state.isLoading);

  const [type, setType] = useState<FormType>("restock");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<RestockStatus>("faltan");
  const [content, setContent] = useState("");
  const [expiresAtDate, setExpiresAtDate] = useState<Date | undefined>(undefined);
  const [showExpiresAtPicker, setShowExpiresAtPicker] = useState(false);
  const [deliveryDateText, setDeliveryDateText] = useState("");
  const [itemText, setItemText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = () => {
    setTitle("");
    setStatus("faltan");
    setContent("");
    setExpiresAtDate(undefined);
    setShowExpiresAtPicker(false);
    setDeliveryDateText("");
    setItemText("");
    setItems([]);
    setErrors({});
  };

  const submit = async () => {
    if (type === "restock") {
      const result = restockSchema.safeParse({
        title,
        status,
        content,
      });

      if (!result.success) {
        const fieldErrors = result.error.flatten().fieldErrors;
        setErrors({
          title: fieldErrors.title?.[0] ?? "",
          content: fieldErrors.content?.[0] ?? "",
        });
        return;
      }

      try {
        await createRestockNote({
          title,
          content,
          status,
          expiresAt: expiresAtDate,
        });

        reset();
        router.back();
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error instanceof Error ? error.message : "No se pudo crear la nota",
        }));
      }
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

    try {
      await createChecklist({
        title,
        itemTexts: items,
        deliveryDate: parseDate(deliveryDateText),
      });

      reset();
      router.back();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "No se pudo crear el pedido",
      }));
    }
  };

  const onChangeExpiresAt = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowExpiresAtPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setExpiresAtDate(selectedDate);
    }
  };

  const onWebExpiresAtChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setExpiresAtDate(undefined);
      return;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setExpiresAtDate(parsed);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: "700" }}>
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

            {Platform.OS === "web" ? (
              <>
                <Text variant="bodySmall">Fecha de caducidad</Text>
                <input
                  type="date"
                  value={expiresAtDate ? toHtmlDateValue(expiresAtDate) : ""}
                  onChange={onWebExpiresAtChange}
                  style={{
                    borderRadius: 12,
                    border: `1px solid ${theme.colors.outline}`,
                    padding: "14px 12px",
                    fontSize: 16,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.onSurface,
                  }}
                />
              </>
            ) : (
              <>
                <Button mode="outlined" icon="calendar" onPress={() => setShowExpiresAtPicker(true)}>
                  {expiresAtDate
                    ? `Fecha de caducidad: ${formatShortDate(expiresAtDate)}`
                    : "Seleccionar fecha de caducidad"}
                </Button>

                {expiresAtDate && (
                  <Button mode="text" icon="close" onPress={() => setExpiresAtDate(undefined)}>
                    Quitar fecha de caducidad
                  </Button>
                )}

                {showExpiresAtPicker && (
                  <DateTimePicker
                    mode="date"
                    value={expiresAtDate ?? new Date()}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onChangeExpiresAt}
                  />
                )}
              </>
            )}
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

        <HelperText type="error" visible={Boolean(errors.submit)}>
          {errors.submit}
        </HelperText>

        <Button mode="contained" onPress={() => void submit()} loading={isLoading} disabled={isLoading}>
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
