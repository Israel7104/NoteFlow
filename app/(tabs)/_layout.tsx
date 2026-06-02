// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Link, Redirect, Tabs } from "expo-router";
import { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotesStore, useStoreHydrated } from "../../store/notesStore";

// Define las tabs principales y sus acciones globales de navegacion.
export default function TabsLayout() {
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);
  const logout = useNotesStore((state) => state.logout);
  const refreshNotes = useNotesStore((state) => state.refreshNotes);
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, 10);

  // Mantiene las listas sincronizadas cada vez que existe una sesion valida.
  useEffect(() => {
    if (!token) return;
    void refreshNotes();
  }, [refreshNotes, token]);

  if (!hasHydrated) {
    return null;
  }

  if (!token) {
    return <Redirect href="/auth" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          height: 58 + tabBarBottomInset,
          paddingTop: 6,
          paddingBottom: tabBarBottomInset,
        },
        headerLeft: () => (
          // Permite cerrar la sesion desde cualquier pestaña principal.
          <TouchableOpacity
            style={{ marginLeft: 16 }}
            onPress={() => {
              Alert.alert("Cerrar sesion", "Se cerrara tu sesion en este dispositivo", [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Salir",
                  style: "destructive",
                  onPress: () => {
                    void logout();
                  },
                },
              ]);
            }}
          >
            <MaterialIcons name="logout" size={22} />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Pestaña de reposicion y acceso al modal de alta. */}
      <Tabs.Screen
        name="notas"
        options={{
          title: "Reposicion",
          headerRight: () => (
            <Link href={{ pathname: "/nueva-note" }} asChild>
              <TouchableOpacity style={styles.headerActionButton}>
                <View style={styles.headerActionInner}>
                  <MaterialIcons name="note-add" size={18} />
                  <Text style={styles.headerActionText}>Nueva reposicion</Text>
                </View>
              </TouchableOpacity>
            </Link>
          ),
          tabBarIcon: ({ color, size }) => <MaterialIcons name="notes" size={size} color={color} />,
        }}
      />
      {/* Pestaña de pedidos con acceso rapido al nuevo checklist. */}
      <Tabs.Screen
        name="checklists"
        options={{
          title: "Pedidos",
          headerRight: () => (
            <Link href={{ pathname: "/nuevo-pedido" }} asChild>
              <TouchableOpacity style={styles.headerActionButton}>
                <View style={styles.headerActionInner}>
                  <MaterialIcons name="note-add" size={18} />
                  <Text style={styles.headerActionText}>Nuevo pedido</Text>
                </View>
              </TouchableOpacity>
            </Link>
          ),
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="list-check" size={size} color={color} />,
        }}
      />
      {/* Pestañas secundarias de alertas, historial y perfil. */}
      <Tabs.Screen
        name="ideas"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="lightbulb" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="archivadas"
        options={{
          title: "Historial",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="archive" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="usuario"
        options={{
          title: "Usuario",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerActionButton: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  headerActionInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerActionText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
