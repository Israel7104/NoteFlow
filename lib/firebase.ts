import { initializeApp, getApp, getApps, type FirebaseOptions } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { Platform } from "react-native";

const getFirebaseConfig = (): FirebaseOptions => {
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;

  if (!apiKey || !authDomain || !projectId || !appId || !messagingSenderId) {
    throw new Error(
      "Faltan variables de Firebase. Revisa EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN, EXPO_PUBLIC_FIREBASE_PROJECT_ID, EXPO_PUBLIC_FIREBASE_APP_ID y EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID.",
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    messagingSenderId,
    storageBucket,
  };
};

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());

const firebaseAuth =
  Platform.OS === "web"
    ? getAuth(firebaseApp)
    : (() => {
        try {
          return initializeAuth(firebaseApp);
        } catch {
          return getAuth(firebaseApp);
        }
      })();

export { firebaseApp, firebaseAuth };
