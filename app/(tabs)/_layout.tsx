import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Link, Redirect, Tabs } from "expo-router";
import { Alert, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotesStore, useStoreHydrated } from "../../store/notesStore";

export default function TabsLayout() {
  const hasHydrated = useStoreHydrated();
  const token = useNotesStore((state) => state.token);
  const logout = useNotesStore((state) => state.logout);
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, 10);

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
        headerRight: () => (
          <Link href={{ pathname: "/nueva-note" }} asChild>
            <TouchableOpacity style={{ marginRight: 16 }}>
              <MaterialIcons name="note-add" size={22} />
            </TouchableOpacity>
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="notas"
        options={{
          title: "Reposicion",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="notes" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="checklists"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => <FontAwesome6 name="list-check" size={size} color={color} />,
        }}
      />
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
    </Tabs>
  );
}
