// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, Text, TextInput, useTheme } from "react-native-paper";

import { RemoteImage } from "../components/items/RemoteImage";
import { useNotesStore } from "../store/notesStore";
import type { ProductCategory } from "../types";

const categories: Array<{ value: ProductCategory; label: string }> = [
  { value: "cupcakes", label: "Cupcakes" },
  { value: "pastel-entero-pequeno", label: "Pastel pequeno" },
  { value: "pastel-entero-grande", label: "Pastel grande" },
  { value: "dulces", label: "Dulces" },
  { value: "galletas", label: "Galletas" },
  { value: "otros", label: "Otros" },
];

const restockSchema = z.object({
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(3, "La descripcion debe tener al menos 3 caracteres"),
  price: z.number().positive("El precio debe ser mayor a 0"),
  shelfLifeDays: z.number().int().min(1, "Debe durar al menos 1 dia").max(365, "Maximo 365 dias"),
  category: z.enum(["cupcakes", "pastel-entero-pequeno", "pastel-entero-grande", "dulces", "galletas", "otros"]),
});

// Calcula una fecha futura a partir de la fecha actual.
const addDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value;
};

// Convierte una fecha a un formato corto legible para la UI.
const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

const awsPlaceholderText = "AWS placeholder";

// Modal para registrar una nueva reposicion de producto.
export default function NewNoteModal() {
  const router = useRouter();
  const theme = useTheme();

  const createRestockNote = useNotesStore((state) => state.createRestockNote);
  const uploadImageToS3 = useNotesStore((state) => state.uploadImageToS3);
  const isLoading = useNotesStore((state) => state.isLoading);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [priceInput, setPriceInput] = useState("");
  const [shelfLifeInput, setShelfLifeInput] = useState("");
  const [category, setCategory] = useState<ProductCategory>("cupcakes");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const computedExpirationDate = useMemo(() => {
    const days = Number(shelfLifeInput);
    if (!Number.isFinite(days) || days <= 0) return undefined;
    return addDays(Math.floor(days));
  }, [shelfLifeInput]);

  // Limpia el formulario despues de guardar o cancelar la captura.
  const reset = () => {
    setTitle("");
    setDescription("");
    setPriceInput("");
    setShelfLifeInput("");
    setCategory("cupcakes");
    setUploadedImageUrl(null);
    setErrors({});
  };

  // Abre la galeria, sube la imagen seleccionada y conserva la URL publica.
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
      purpose: "restock",
      contentType: asset.mimeType ?? "image/jpeg",
      extension,
    });

    setUploadedImageUrl(publicUrl);
  };

  // Valida los campos y crea la nota de reposicion en el store.
  const submit = async () => {
    setErrors({});

    const parsedPrice = Number(priceInput.replace(",", "."));
    const parsedShelfLife = Number(shelfLifeInput);

    const result = restockSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      price: parsedPrice,
      shelfLifeDays: parsedShelfLife,
      category,
    });

    if (!result.success || !computedExpirationDate) {
      const fieldErrors = result.success ? {} : result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] ?? "",
        description: fieldErrors.description?.[0] ?? "",
        price: fieldErrors.price?.[0] ?? "",
        shelfLifeDays: fieldErrors.shelfLifeDays?.[0] ?? "",
        submit: computedExpirationDate ? "" : "Define una duracion valida para calcular la caducidad.",
      });
      return;
    }

    try {
      await createRestockNote({
        title: result.data.title,
        content: result.data.description,
        price: result.data.price,
        shelfLifeDays: result.data.shelfLifeDays,
        category: result.data.category,
        imagePlaceholder: uploadedImageUrl ?? awsPlaceholderText,
        status: "hay-pocos",
        expiresAt: computedExpirationDate,
      });

      reset();
      router.back();
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error instanceof Error ? error.message : "No se pudo crear la reposición",
      }));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text variant="titleLarge" style={{ color: theme.colors.secondary, fontWeight: "700" }}>
          Nueva reposicion
        </Text>

        {/* Datos principales del producto que se va a reponer. */}
        <TextInput
          mode="outlined"
          label="Nombre de reposición"
          value={title}
          onChangeText={setTitle}
        />
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

        <TextInput
          mode="outlined"
          label="Precio"
          keyboardType="decimal-pad"
          value={priceInput}
          onChangeText={setPriceInput}
        />
        <HelperText type="error" visible={Boolean(errors.price)}>
          {errors.price}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Tiempo de caducidad (dias)"
          keyboardType="number-pad"
          value={shelfLifeInput}
          onChangeText={setShelfLifeInput}
        />
        <HelperText type="error" visible={Boolean(errors.shelfLifeDays)}>
          {errors.shelfLifeDays}
        </HelperText>

        <Text variant="bodySmall">Etiqueta</Text>
        <View style={styles.wrapRow}>
          {categories.map((item) => (
            <Button
              key={item.value}
              mode={category === item.value ? "contained" : "outlined"}
              onPress={() => setCategory(item.value)}
            >
              {item.label}
            </Button>
          ))}
        </View>

        <Text variant="bodySmall" style={styles.metaText}>
          Caduca aproximadamente: {computedExpirationDate ? formatShortDate(computedExpirationDate) : "sin calcular"}
        </Text>

        {/* Seccion de imagen para almacenar la foto del producto en S3. */}
        <Card mode="outlined" style={styles.placeholderCard}>
          <Card.Content>
            <Text variant="titleSmall">Foto del producto</Text>
            <RemoteImage
              uri={uploadedImageUrl}
              containerStyle={styles.restockImagePreview}
              style={styles.restockImagePreview}
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
  wrapRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaText: {
    opacity: 0.75,
  },
  placeholderCard: {
    marginTop: 6,
  },
  restockImagePreview: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
  },
});
