import { z } from "zod";
import { Redirect } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore, useStoreHydrated } from "../store/notesStore";

const authSchema = z.object({
  email: z.string().email("Ingresa un email valido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

type Mode = "login" | "register";

export default function AuthScreen() {
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);
  const authLoading = useNotesStore((state) => state.authLoading);
  const errorMessage = useNotesStore((state) => state.errorMessage);
  const clearError = useNotesStore((state) => state.clearError);
  const login = useNotesStore((state) => state.login);
  const register = useNotesStore((state) => state.register);
  const theme = useTheme();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const title = useMemo(
    () => (mode === "login" ? "Inicia sesion en NoteFlow" : "Crea tu cuenta NoteFlow"),
    [mode],
  );

  if (!hasHydrated) {
    return null;
  }

  if (token) {
    return <Redirect href="/notas" />;
  }

  const submit = async () => {
    clearError();

    const result = authSchema.safeParse({
      email: email.trim(),
      password,
    });

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0] ?? "",
        password: errors.password?.[0] ?? "",
      });
      return;
    }

    setFieldErrors({});

    try {
      if (mode === "login") {
        await login(result.data.email, result.data.password);
        return;
      }

      await register(result.data.email, result.data.password);
    } catch {
      // El mensaje se gestiona desde el store.
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <Card mode="contained" style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Card.Content style={styles.formContainer}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: "700" }}>
              {title}
            </Text>

            <SegmentedButtons
              value={mode}
              onValueChange={(value) => {
                setMode(value as Mode);
                setFieldErrors({});
                clearError();
              }}
              buttons={[
                {
                  value: "login",
                  label: "Entrar",
                },
                {
                  value: "register",
                  label: "Registro",
                },
              ]}
            />

            <TextInput
              mode="outlined"
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <HelperText type="error" visible={Boolean(fieldErrors.email)}>
              {fieldErrors.email}
            </HelperText>

            <TextInput
              mode="outlined"
              label="Contrasena"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <HelperText type="error" visible={Boolean(fieldErrors.password)}>
              {fieldErrors.password}
            </HelperText>

            <HelperText type="error" visible={Boolean(errorMessage)}>
              {errorMessage}
            </HelperText>

            <Button mode="contained" onPress={submit} loading={authLoading} disabled={authLoading}>
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  formContainer: {
    gap: 8,
  },
});
