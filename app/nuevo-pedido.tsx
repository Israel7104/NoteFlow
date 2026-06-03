// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState, type ChangeEvent } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, HelperText, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore } from "../store/notesStore";

const orderSchema = z.object({
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(3, "La descripcion debe tener al menos 3 caracteres"),
  routeUrl: z.string().url("La ruta debe ser una URL valida de Google Maps"),
  deliveryDate: z.date(),
});

// Formatea la fecha para mostrarla en etiquetas y botones.
const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

// Convierte la fecha al formato que espera el input HTML date en web.
const toHtmlDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const orderImagePlaceholder = "Sin imagen";

// Modal para registrar un pedido con entrega, ruta y evidencia visual.
export default function NewOrderModal() {
  const router = useRouter();
  const theme = useTheme();

  const createChecklist = useNotesStore((state) => state.createChecklist);
  const isLoading = useNotesStore((state) => state.isLoading);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [routeUrl, setRouteUrl] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restablece el estado local del formulario despues de guardar o salir.
  const reset = () => {
    setTitle("");
    setDescription("");
    setDeliveryDate(undefined);
    setShowDeliveryDatePicker(false);
    setRouteUrl("");
    setErrors({});
  };

  // Actualiza la fecha seleccionada desde el picker nativo.
  const onChangeDeliveryDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDeliveryDatePicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setDeliveryDate(selectedDate);
    }
  };

  // Sincroniza la fecha cuando la app corre en web con input HTML.
  const onWebDeliveryDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) {
      setDeliveryDate(undefined);
      return;
    }

    const parsed = new Date(`${value}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      setDeliveryDate(parsed);
    }
  };

  // Valida el formulario y crea el checklist asociado al pedido.
  const submit = async () => {
    setErrors({});

    const result = orderSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      routeUrl: routeUrl.trim(),
      deliveryDate,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        description: fieldErrors.description?.[0] ?? "",
        routeUrl: fieldErrors.routeUrl?.[0] ?? "",
        deliveryDate: fieldErrors.deliveryDate?.[0] ?? "",
      });
      return;
    }

    try {
      await createChecklist({
        title: result.data.title,
        description: result.data.description,
        routeUrl: result.data.routeUrl,
        imagePlaceholder: orderImagePlaceholder,
        deliveryDate: result.data.deliveryDate,
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

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge" style={{ color: theme.colors.secondary, fontWeight: "700" }}>
          Nuevo pedido
        </Text>

        {/* Datos base del pedido y su seguimiento logístico. */}
        <TextInput mode="outlined" label="Nombre del pedido" value={title} onChangeText={setTitle} />
        <HelperText type="error" visible={Boolean(errors.title)}>
          {errors.title}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Descripción"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        <HelperText type="error" visible={Boolean(errors.description)}>
          {errors.description}
        </HelperText>

        {Platform.OS === "web" ? (
          <>
            <Text variant="bodySmall">Fecha de entrega</Text>
            <input
              type="date"
              value={deliveryDate ? toHtmlDateValue(deliveryDate) : ""}
              onChange={onWebDeliveryDateChange}
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
            <Button mode="outlined" icon="calendar" onPress={() => setShowDeliveryDatePicker(true)}>
              {deliveryDate ? `Fecha de entrega: ${formatShortDate(deliveryDate)}` : "Seleccionar fecha de entrega"}
            </Button>
            {showDeliveryDatePicker && (
              <DateTimePicker
                mode="date"
                value={deliveryDate ?? new Date()}
                display={Platform.OS === "ios" ? "inline" : "default"}
                onChange={onChangeDeliveryDate}
              />
            )}
          </>
        )}
        <HelperText type="error" visible={Boolean(errors.deliveryDate)}>
          {errors.deliveryDate}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Ruta de Google Maps"
          autoCapitalize="none"
          value={routeUrl}
          onChangeText={setRouteUrl}
          placeholder="https://maps.google.com/..."
        />
        <HelperText type="error" visible={Boolean(errors.routeUrl)}>
          {errors.routeUrl}
        </HelperText>

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
});
