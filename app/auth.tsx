// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ResponseType } from "expo-auth-session";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore, useStoreHydrated } from "../store/notesStore";

const authSchema = z.object({
  email: z.string().email("Ingresa un email valido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

type Mode = "login" | "register";

WebBrowser.maybeCompleteAuthSession();

const isGoogleOAuthClientId = (value?: string) => Boolean(value && value.trim().endsWith(".apps.googleusercontent.com"));

export default function AuthScreen() {
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);
  const authLoading = useNotesStore((state) => state.authLoading);
  const errorMessage = useNotesStore((state) => state.errorMessage);
  const clearError = useNotesStore((state) => state.clearError);
  const login = useNotesStore((state) => state.login);
  const register = useNotesStore((state) => state.register);
  const loginWithGooglePopup = useNotesStore((state) => state.loginWithGooglePopup);
  const loginWithGoogleIdToken = useNotesStore((state) => state.loginWithGoogleIdToken);
  const theme = useTheme();

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const googleExpoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID;
  const hasAnyValidGoogleClientId =
    isGoogleOAuthClientId(googleExpoClientId) ||
    isGoogleOAuthClientId(googleWebClientId) ||
    isGoogleOAuthClientId(googleIosClientId) ||
    isGoogleOAuthClientId(googleAndroidClientId);
  const resolvedGoogleClientId =
    googleExpoClientId ?? googleWebClientId ?? googleIosClientId ?? googleAndroidClientId ?? "missing-client-id";

  const [googleRequest, googleResponse, promptGoogle] = Google.useAuthRequest({
    clientId: resolvedGoogleClientId,
    webClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    androidClientId: googleAndroidClientId,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
  });

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState<string>("");

  const isWeb = Platform.OS === "web";
  const hasNativeGoogleClientId =
    isGoogleOAuthClientId(googleExpoClientId) ||
    isGoogleOAuthClientId(googleIosClientId) ||
    isGoogleOAuthClientId(googleAndroidClientId);

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === "cancel" || googleResponse.type === "dismiss") {
      setGoogleError("Se cancelo el inicio con Google.");
      return;
    }

    if (googleResponse.type === "error") {
      const message = googleResponse.error?.message ?? "Fallo el inicio con Google.";
      setGoogleError(message);
      return;
    }

    if (googleResponse.type !== "success") return;

    const idToken = googleResponse.authentication?.idToken ?? googleResponse.params?.id_token;
    if (!idToken) {
      setGoogleError("Google no devolvio un ID token valido.");
      return;
    }

    setGoogleError("");
    void loginWithGoogleIdToken(idToken).catch(() => {
      // El mensaje final se muestra desde el store.
    });
  }, [googleResponse, loginWithGoogleIdToken]);

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

  const triggerTapFeedback = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

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

  const submitGoogle = async () => {
    clearError();
    setGoogleError("");

    try {
      if (isWeb) {
        await loginWithGooglePopup();
        return;
      }

      if (!hasNativeGoogleClientId) {
        setGoogleError(
          "Configura OAuth Client ID valido (.apps.googleusercontent.com) en EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID o EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID.",
        );
        return;
      }

      if (!hasAnyValidGoogleClientId) {
        setGoogleError("Tus valores EXPO_PUBLIC_GOOGLE_* parecen App IDs de Firebase (1:...). Deben ser OAuth Client IDs de Google.");
        return;
      }

      await promptGoogle();
    } catch {
      setGoogleError("No se pudo abrir el flujo de Google en este entorno.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.container, isWeb && styles.webContainer]}>
        <Card mode="contained" style={{ backgroundColor: theme.colors.surfaceVariant }}>
          <Card.Content style={styles.formContainer}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onBackground, fontWeight: "700" }}>
              {title}
            </Text>

            <SegmentedButtons
              value={mode}
              style={styles.modeSelector}
              onValueChange={(value) => {
                triggerTapFeedback();
                setMode(value as Mode);
                setFieldErrors({});
                clearError();
              }}
              buttons={[
                {
                  value: "login",
                  label: "Entrar",
                  icon: mode === "login" ? "check-circle" : "login",
                  style: {
                    backgroundColor: mode === "login" ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                  labelStyle: {
                    color: mode === "login" ? theme.colors.onPrimary : theme.colors.primary,
                    fontWeight: "700",
                  },
                },
                {
                  value: "register",
                  label: "Registro",
                  icon: mode === "register" ? "check-circle" : "account-plus",
                  style: {
                    backgroundColor: mode === "register" ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                  labelStyle: {
                    color: mode === "register" ? theme.colors.onPrimary : theme.colors.primary,
                    fontWeight: "700",
                  },
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

            <Button
              mode="contained"
              onPress={() => {
                triggerTapFeedback();
                void submit();
              }}
              loading={authLoading}
              disabled={authLoading}
            >
              {mode === "login" ? "Entrar" : "Crear cuenta"}
            </Button>

            <Button
              mode="outlined"
              icon="google"
              onPress={() => {
                triggerTapFeedback();
                void submitGoogle();
              }}
              loading={authLoading}
              disabled={authLoading || (!isWeb && (!hasNativeGoogleClientId || !googleRequest))}
            >
              Continuar con Google
            </Button>

            <HelperText type="error" visible={Boolean(googleError)}>
              {googleError}
            </HelperText>
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
  webContainer: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingHorizontal: 28,
  },
  formContainer: {
    gap: 8,
  },
  modeSelector: {
    marginBottom: 4,
  },
});
