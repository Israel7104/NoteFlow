// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useState, type ChangeEvent } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { Button, Card, HelperText, Text, TextInput, useTheme } from "react-native-paper";

import { RemoteImage } from "../components/items/RemoteImage";
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

const awsPlaceholderText = "AWS placeholder";

// Modal para registrar un pedido con entrega, ruta y evidencia visual.
export default function NewOrderModal() {
  const router = useRouter();
  const theme = useTheme();

  const createChecklist = useNotesStore((state) => state.createChecklist);
  const uploadImageToS3 = useNotesStore((state) => state.uploadImageToS3);
  const isLoading = useNotesStore((state) => state.isLoading);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [routeUrl, setRouteUrl] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Restablece el estado local del formulario despues de guardar o salir.
  const reset = () => {
    setTitle("");
    setDescription("");
    setDeliveryDate(undefined);
    setShowDeliveryDatePicker(false);
    setRouteUrl("");
    setUploadedImageUrl(null);
    setErrors({});
  };

  // Abre la galeria y sube la foto del pedido al almacenamiento remoto.
  const pickAndUploadPhoto = async () => {
    if (Platform.OS !== "web") {
      const permissions = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissions.granted) {
        throw new Error("Debes permitir acceso a la galeria para subir foto.");
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.8,
      mediaTypes: ["images"],
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const asset = result.assets[0];
    const extensionFromName = asset.fileName?.split(".").pop()?.toLowerCase();
    const extensionFromMime = asset.mimeType?.split("/").pop()?.toLowerCase();
    const extension = extensionFromName || extensionFromMime;

    const publicUrl = await uploadImageToS3({
      localUri: asset.uri,
      purpose: "order",
      contentType: asset.mimeType ?? "image/jpeg",
      extension,
    });

    setUploadedImageUrl(publicUrl);
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
        imagePlaceholder: uploadedImageUrl ?? awsPlaceholderText,
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

        <Card mode="outlined" style={styles.placeholderCard}>
          <Card.Content>
            {/* La imagen se usa como referencia visual del pedido. */}
            <Text variant="titleSmall">Foto del pedido</Text>
            <RemoteImage
              uri={uploadedImageUrl}
              containerStyle={styles.orderImagePreview}
              style={styles.orderImagePreview}
              placeholderText="Sin foto subida"
            />
            <Text variant="bodySmall" style={styles.metaText}>
              {uploadedImageUrl ? "Imagen subida en AWS S3." : "La imagen se subira a AWS S3."}
            </Text>
            <Button
              mode="outlined"
              onPress={() => {
                void pickAndUploadPhoto().catch((error) => {
                  setErrors((prev) => ({
                    ...prev,
                    submit: error instanceof Error ? error.message : "No se pudo subir la imagen",
                  }));
                });
              }}
              disabled={isLoading}
            >
              {uploadedImageUrl ? "Cambiar foto" : "Subir foto"}
            </Button>
          </Card.Content>
        </Card>

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
  metaText: {
    opacity: 0.75,
  },
  placeholderCard: {
    marginTop: 6,
  },
  orderImagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
});
