import { z } from "zod";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useMemo, useState, type ChangeEvent } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore } from "../store/notesStore";
import type { ProductCategory } from "../types";

type FormType = "restock" | "order";

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

const orderSchema = z.object({
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().min(3, "La descripcion debe tener al menos 3 caracteres"),
  routeUrl: z.string().url("La ruta debe ser una URL valida de Google Maps"),
  deliveryDate: z.date(),
});

const addDays = (days: number) => {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value;
};

const formatShortDate = (value: Date) =>
  new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);

const toHtmlDateValue = (value: Date) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const awsPlaceholderText = "AWS placeholder";

export default function NewNoteModal() {
  const router = useRouter();
  const theme = useTheme();

  const createRestockNote = useNotesStore((state) => state.createRestockNote);
  const createChecklist = useNotesStore((state) => state.createChecklist);
  const isLoading = useNotesStore((state) => state.isLoading);

  const [type, setType] = useState<FormType>("restock");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [priceInput, setPriceInput] = useState("");
  const [shelfLifeInput, setShelfLifeInput] = useState("7");
  const [category, setCategory] = useState<ProductCategory>("cupcakes");

  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [showDeliveryDatePicker, setShowDeliveryDatePicker] = useState(false);
  const [routeUrl, setRouteUrl] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});

  const computedExpirationDate = useMemo(() => {
    const days = Number(shelfLifeInput);
    if (!Number.isFinite(days) || days <= 0) return undefined;
    return addDays(Math.floor(days));
  }, [shelfLifeInput]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setPriceInput("");
    setShelfLifeInput("7");
    setCategory("cupcakes");
    setDeliveryDate(undefined);
    setShowDeliveryDatePicker(false);
    setRouteUrl("");
    setErrors({});
  };

  const onChangeDeliveryDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDeliveryDatePicker(false);
    }

    if (event.type === "set" && selectedDate) {
      setDeliveryDate(selectedDate);
    }
  };

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

  const submit = async () => {
    setErrors({});

    if (type === "restock") {
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
          imagePlaceholder: awsPlaceholderText,
          status: "hay-pocos",
          expiresAt: computedExpirationDate,
        });

        reset();
        router.back();
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          submit: error instanceof Error ? error.message : "No se pudo crear la reposicion",
        }));
      }

      return;
    }

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
        imagePlaceholder: awsPlaceholderText,
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
            { value: "restock", label: "Reposicion" },
            { value: "order", label: "Pedido" },
          ]}
        />

        <TextInput
          mode="outlined"
          label={type === "restock" ? "Nombre de reposicion" : "Nombre del pedido"}
          value={title}
          onChangeText={setTitle}
        />
        <HelperText type="error" visible={Boolean(errors.title)}>
          {errors.title}
        </HelperText>

        <TextInput
          mode="outlined"
          label="Descripcion"
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />
        <HelperText type="error" visible={Boolean(errors.description)}>
          {errors.description}
        </HelperText>

        {type === "restock" ? (
          <>
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

            <Card mode="outlined" style={styles.placeholderCard}>
              <Card.Content>
                <Text variant="titleSmall">Foto del producto</Text>
                <Text variant="bodySmall" style={styles.metaText}>
                  Placeholder: conexion AWS pendiente.
                </Text>
                <Button mode="outlined" disabled>
                  Cargar foto (AWS)
                </Button>
              </Card.Content>
            </Card>
          </>
        ) : (
          <>
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
                <Text variant="titleSmall">Foto del pedido</Text>
                <Text variant="bodySmall" style={styles.metaText}>
                  Placeholder: conexion AWS pendiente.
                </Text>
                <Button mode="outlined" disabled>
                  Cargar foto (AWS)
                </Button>
              </Card.Content>
            </Card>
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
});
