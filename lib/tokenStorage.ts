// Comentario general: este archivo forma parte de la aplicacion NoteFlow y su logica principal.
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "noteflow.jwt";

const webStorage = {
  getItem: (key: string) => {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, value);
  },
  deleteItem: (key: string) => {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(key);
  },
};

export const tokenStorage = {
  getToken: async () => {
    if (Platform.OS === "web") {
      return webStorage.getItem(TOKEN_KEY);
    }

    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  setToken: async (token: string) => {
    if (Platform.OS === "web") {
      webStorage.setItem(TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  clearToken: async () => {
    if (Platform.OS === "web") {
      webStorage.deleteItem(TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
