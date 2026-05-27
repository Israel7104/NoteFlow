// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState, type ChangeEvent } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore } from "../store/notesStore";
import type { RestockStatus } from "../types";

// Validaciones para notas de reposicion.
const restockSchema = z.object({
  title: z.string().min(3, "El nombre del pastel debe tener al menos 3 caracteres"),
  status: z.enum(["faltan", "hay-pocos", "hay-muchos", "pasados"]),
  content: z.string().min(1, "Agrega un detalle corto"),
});

// Validaciones para pedidos tipo checklist.
const orderSchema = z.object({
  title: z.string().min(3, "El nombre del pedido debe tener al menos 3 caracteres"),
  items: z.array(z.string().min(1, "Cada item debe tener texto")).min(1, "Agrega al menos un item"),
  deliveryDate: z.string().optional(),
});

type FormType = "restock" | "order";

// Convierte texto libre (o DD/MM/YYYY) a Date valido.
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

// Formatea una fecha en formato corto local (es-ES).
const formatShortDate = (value: Date) => {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
};

// Formato YYYY-MM-DD requerido por input type="date" en web.
const toHtmlDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function NewNoteModal() {
  const router = useRouter();
  const theme = useTheme();

  // Acciones y estado global desde Zustand.
  const createRestockNote = useNotesStore((state) => state.createRestockNote);
  const createChecklist = useNotesStore((state) => state.createChecklist);
  const isLoading = useNotesStore((state) => state.isLoading);

  // Estado local del formulario y errores.
  const [type, setType] = useState<FormType>("restock");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<RestockStatus>("faltan");
  const [content, setContent] = useState("");
  const [expiresAtDate, setExpiresAtDate] = useState<Date | undefined>(undefined);
  const [showExpiresAtPicker, setShowExpiresAtPicker] = useState(false);
  const [orderAtDate, setOrderAtDate] = useState<Date | undefined>(undefined);
  const [showOrderAtPicker, setShowOrderAtPicker] = useState(false);
  const [itemText, setItemText] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Limpia el formulario completo despues de guardar.
  const reset = () => {
    setTitle("");
    setStatus("faltan");
    setContent("");
    setExpiresAtDate(undefined);
    setShowExpiresAtPicker(false);
    setOrderAtDate(undefined);
    setShowOrderAtPicker(false);
    setItemText("");
    setItems([]);
    setErrors({});
  };

  // Envia segun el tipo de formulario seleccionado.
  const submit = async () => {
    if (type === "restock") {
      // Valida datos de reposicion antes de persistir.
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
        // Guarda nota de reposicion.
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

    // Valida datos del pedido antes de persistir.
    const result = orderSchema.safeParse({
      title,
      items,
      deliveryDate: orderAtDate ? formatShortDate(orderAtDate) : "",
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
      // Guarda checklist con fecha opcional de envio.
      await createChecklist({
        title,
        itemTexts: items,
        deliveryDate: orderAtDate,
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

  // Handler nativo para fecha de caducidad (reposicion).
  const onChangeExpiresAt = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // En Android se cierra el picker luego de seleccionar/cancelar.
      setShowExpiresAtPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setExpiresAtDate(selectedDate);
    }
  };

  // Handler web para fecha de caducidad usando input date.
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

  // Handler nativo para fecha de envio (pedido).
  const onChangeOrderAt = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      // En Android se cierra el picker luego de seleccionar/cancelar.
      setShowOrderAtPicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setOrderAtDate(selectedDate);
    }
  };

  // Handler web para fecha de envio usando input date.
  const onWebOrderAtChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setOrderAtDate(undefined);
      return;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setOrderAtDate(parsed);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Titulo principal del modal */}
        <Text variant="titleLarge" style={{ color: theme.colors.primary, fontWeight: "700" }}>
          Nuevo registro de pasteleria
        </Text>

        {/* Selector entre formulario de reposicion y pedido */}
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

        {/* Formulario para reposicion de productos */}
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

            {/* Fecha de caducidad con UI especifica por plataforma */}
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

        {/* Formulario para pedidos/checklist */}
        {type === "order" && (
          <>
            {/* Fecha de envio con UI especifica por plataforma */}
            {Platform.OS === "web" ? (
              <>
                <Text variant="bodySmall">Fecha de envio</Text>
                <input
                  type="date"
                  value={orderAtDate ? toHtmlDateValue(orderAtDate) : ""}
                  onChange={onWebOrderAtChange}
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
                <Button mode="outlined" icon="calendar" onPress={() => setShowOrderAtPicker(true)}>
                  {orderAtDate
                    ? `Fecha de envio: ${formatShortDate(orderAtDate)}`
                    : "Seleccionar fecha de envio"}
                </Button>

                {orderAtDate && (
                  <Button mode="text" icon="close" onPress={() => setOrderAtDate(undefined)}>
                    Quitar fecha de envio
                  </Button>
                )}

                {showOrderAtPicker && (
                  <DateTimePicker
                    mode="date"
                    value={orderAtDate ?? new Date()}
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    onChange={onChangeOrderAt}
                  />
                )}
              </>
            )}

            {/* Campo para agregar items al pedido */}
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
                  // Evita agregar items vacios y limpia el input.
                  const trimmed = itemText.trim();
                  if (!trimmed) return;
                  setItems((prev) => [...prev, trimmed]);
                  setItemText("");
                }}
              >
                Agregar
              </Button>
            </View>

            {/* Listado simple de items agregados */}
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

        {/* Boton principal de guardado */}
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
