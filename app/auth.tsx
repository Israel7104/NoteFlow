// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { z } from "zod";
import { Redirect } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { Button, Card, HelperText, SegmentedButtons, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore, useStoreHydrated } from "../store/notesStore";

const authSchema = z.object({
  email: z.string().email("Ingresa un email valido"),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

type Mode = "login" | "register";
type AuthMethod = "email" | "google";

// Comprueba si la variable de entorno parece un client ID OAuth valido de Google.
const isGoogleOAuthClientId = (value?: string) => Boolean(value && value.trim().endsWith(".apps.googleusercontent.com"));

// Gestiona el acceso por email o Google y redirige cuando ya existe sesion.
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
  const validGoogleWebClientId = isGoogleOAuthClientId(googleWebClientId) ? googleWebClientId : undefined;
  const validGoogleIosClientId = isGoogleOAuthClientId(googleIosClientId) ? googleIosClientId : undefined;
  const validGoogleAndroidClientId = isGoogleOAuthClientId(googleAndroidClientId)
    ? googleAndroidClientId
    : undefined;

  const [mode, setMode] = useState<Mode>("login");
  const [authMethod, setAuthMethod] = useState<AuthMethod>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleError, setGoogleError] = useState<string>("");

  const isWeb = Platform.OS === "web";
  const hasAnyValidGoogleClientId =
    Boolean(validGoogleWebClientId) ||
    Boolean(validGoogleIosClientId) ||
    Boolean(validGoogleAndroidClientId);

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

  // Lanza una vibracion corta para dar feedback a los botones principales.
  const triggerTapFeedback = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Valida el formulario y ejecuta login o registro segun el modo activo.
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

  // Decide si el inicio con Google debe hacerse por popup web o por Google Sign-In nativo.
  const submitGoogle = async () => {
    clearError();
    setGoogleError("");

    try {
      if (isWeb) {
        await loginWithGooglePopup();
        return;
      }

      if (!hasAnyValidGoogleClientId) {
        setGoogleError("Tus valores EXPO_PUBLIC_GOOGLE_* parecen App IDs de Firebase (1:...). Deben ser OAuth Client IDs de Google.");
        return;
      }

      if (!validGoogleWebClientId) {
        setGoogleError(
          "Para Android/iOS nativo configura EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (OAuth Web) valido en formato .apps.googleusercontent.com.",
        );
        return;
      }

      GoogleSignin.configure({
        webClientId: validGoogleWebClientId,
        iosClientId: validGoogleIosClientId,
      });

      if (Platform.OS === "android") {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const result = await GoogleSignin.signIn();

      if (!isSuccessResponse(result)) {
        setGoogleError("Se cancelo el inicio con Google.");
        return;
      }

      const idToken = result.data.idToken;

      if (!idToken) {
        setGoogleError("Google no devolvio un idToken valido en el flujo nativo.");
        return;
      }

      await loginWithGoogleIdToken(idToken);
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          setGoogleError("Se cancelo el inicio con Google.");
          return;
        }

        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setGoogleError("Google Play Services no esta disponible o necesita actualizarse en este dispositivo.");
          return;
        }

        if (error.code === statusCodes.IN_PROGRESS) {
          setGoogleError("Ya hay un inicio de sesion con Google en progreso.");
          return;
        }

        if (error.code === statusCodes.SIGN_IN_REQUIRED) {
          setGoogleError("Google requiere iniciar sesion de nuevo en este dispositivo.");
          return;
        }
      }

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
              value={authMethod}
              style={styles.modeSelector}
              onValueChange={(value) => {
                triggerTapFeedback();
                setAuthMethod(value as AuthMethod);
                setGoogleError("");
                clearError();
              }}
              buttons={[
                {
                  value: "email",
                  label: "Email",
                  icon: authMethod === "email" ? "check-circle" : "email",
                  style: {
                    backgroundColor: authMethod === "email" ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                  labelStyle: {
                    color: authMethod === "email" ? theme.colors.onPrimary : theme.colors.primary,
                    fontWeight: "700",
                  },
                },
                {
                  value: "google",
                  label: "Google",
                  icon: authMethod === "google" ? "check-circle" : "google",
                  style: {
                    backgroundColor: authMethod === "google" ? theme.colors.primary : theme.colors.surface,
                    borderColor: theme.colors.primary,
                  },
                  labelStyle: {
                    color: authMethod === "google" ? theme.colors.onPrimary : theme.colors.primary,
                    fontWeight: "700",
                  },
                },
              ]}
            />

            {/* Selector entre acceso y registro dentro del mismo formulario. */}
            {authMethod === "email" ? (
              <>
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
              </>
            ) : (
              <>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Accede con tu cuenta de Google. En Android necesitas un OAuth Client ID especifico para Android.
                </Text>

                <Button
                  mode="contained"
                  icon="google"
                  onPress={() => {
                    triggerTapFeedback();
                    void submitGoogle();
                  }}
                  loading={authLoading}
                  disabled={authLoading}
                >
                  Iniciar con Google
                </Button>

                <HelperText type="error" visible={Boolean(googleError)}>
                  {googleError}
                </HelperText>
              </>
            )}
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
