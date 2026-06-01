// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, useColorScheme, View } from "react-native";
import { ActivityIndicator, MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { darkTheme, lightTheme } from "../constants/theme";
import { useNotesStore, useStoreHydrated } from "../store/notesStore";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const hasHydrated = useStoreHydrated();
  const initialize = useNotesStore((state) => state.initialize);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const theme = useMemo(
    () => ({
      ...(isDark ? MD3DarkTheme : MD3LightTheme),
      ...(isDark ? darkTheme : lightTheme),
      fonts: {
        ...(isDark ? MD3DarkTheme : MD3LightTheme).fonts,
      },
    }),
    [isDark],
  );

  if (!hasHydrated) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={{ flex: 1, justifyContent: "center", backgroundColor: theme.colors.background }}>
            <ActivityIndicator animating size="large" />
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <View style={[styles.root, { backgroundColor: isWeb ? "#FFFFFF" : theme.colors.background }]}>
          <View
            style={[
              styles.stackContainer,
              isWeb && styles.webStackContainer,
              isWeb && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: isDark ? "#3A3A3A" : "#D6D6D6" },
              { backgroundColor: theme.colors.background },
            ]}
          >
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack>
              <Stack.Screen
                name="auth"
                options={{
                  title: "Acceso",
                  headerShown: false,
                }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="nueva-note"
                options={{
                  title: "Nueva reposicion",
                  presentation: "modal",
                }}
              />
              <Stack.Screen
                name="nuevo-pedido"
                options={{
                  title: "Nuevo pedido",
                  presentation: "modal",
                }}
              />
            </Stack>
          </View>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  stackContainer: {
    flex: 1,
  },
  webStackContainer: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
  },
});
