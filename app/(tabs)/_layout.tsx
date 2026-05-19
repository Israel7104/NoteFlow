import { FontAwesome6, MaterialIcons } from "@expo/vector-icons";
import { Link, Tabs } from "expo-router";
import { TouchableOpacity } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleStyle: { fontWeight: "700" },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
        tabBarStyle: {
          height: 68,
          paddingTop: 6,
          paddingBottom: 10,
        },
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
