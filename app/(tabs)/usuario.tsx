import { useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { Avatar, Button, Card, Divider, HelperText, Text, TextInput, useTheme } from "react-native-paper";

import { useNotesStore, useStoreHydrated } from "../../store/notesStore";

const getInitials = (email: string) => {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) return "NF";

  const chunks = localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) return localPart.slice(0, 2).toUpperCase();
  if (chunks.length === 1) return chunks[0].slice(0, 2).toUpperCase();

  return `${chunks[0][0]}${chunks[1][0]}`.toUpperCase();
};

export default function UsuarioScreen() {
  const theme = useTheme();
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);
  const user = useNotesStore((state) => state.user);
  const logout = useNotesStore((state) => state.logout);
  const updateProfileName = useNotesStore((state) => state.updateProfileName);
  const changePassword = useNotesStore((state) => state.changePassword);
  const errorMessage = useNotesStore((state) => state.errorMessage);
  const authLoading = useNotesStore((state) => state.authLoading);

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  if (!hasHydrated) {
    return null;
  }

  if (!token || !user) {
    return <Redirect href="/auth" />;
  }

  const initials = useMemo(() => getInitials(user.email), [user.email]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card mode="contained" style={{ backgroundColor: theme.colors.surfaceVariant }}>
        <Card.Content style={styles.content}>
          <Avatar.Text size={84} label={initials} />
          <Button mode="outlined" disabled>
            Cambiar foto (AWS)
          </Button>

          <View style={styles.textBlock}>
            <Text variant="titleLarge" style={{ fontWeight: "700" }}>
              Tu perfil
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user.displayName || "Sin nombre de usuario"}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user.email}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {Platform.OS === "web"
                ? "Sesion iniciada en web"
                : "Sesion iniciada en dispositivo"}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <TextInput
            mode="outlined"
            label="Nombre de usuario"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Button
            mode="contained-tonal"
            onPress={async () => {
              setSuccessMessage("");
              await updateProfileName(displayName);
              setSuccessMessage("Nombre actualizado correctamente.");
            }}
            loading={authLoading}
            disabled={authLoading}
          >
            Guardar nombre
          </Button>

          <Divider style={styles.divider} />

          <TextInput
            mode="outlined"
            label="Contrasena actual"
            secureTextEntry
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TextInput
            mode="outlined"
            label="Nueva contrasena"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Button
            mode="contained-tonal"
            onPress={async () => {
              setSuccessMessage("");
              await changePassword(currentPassword, newPassword);
              setCurrentPassword("");
              setNewPassword("");
              setSuccessMessage("Contrasena actualizada correctamente.");
            }}
            loading={authLoading}
            disabled={authLoading}
          >
            Cambiar contrasena
          </Button>

          <HelperText type="error" visible={Boolean(errorMessage)}>
            {errorMessage}
          </HelperText>
          <HelperText type="info" visible={Boolean(successMessage)}>
            {successMessage}
          </HelperText>

          <Button
            mode="contained"
            icon="logout"
            onPress={() => {
              void logout();
            }}
            loading={authLoading}
            disabled={authLoading}
          >
            Cerrar sesion
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  content: {
    gap: 16,
    alignItems: "center",
  },
  textBlock: {
    alignItems: "center",
    gap: 4,
  },
  divider: {
    width: "100%",
  },
});
