import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo } from "react";
import { useColorScheme, View } from "react-native";
import { ActivityIndicator, MD3DarkTheme, MD3LightTheme, PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { darkTheme, lightTheme } from "../constants/theme";
import { useStoreHydrated } from "../store/notesStore";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const hasHydrated = useStoreHydrated();

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
          <View style={{ flex: 1, justifyContent: "center" }}>
            <ActivityIndicator animating size="large" />
          </View>
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="nueva-note"
            options={{
              title: "Nuevo registro",
              presentation: "modal",
            }}
          />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
