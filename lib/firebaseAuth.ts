import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "./firebase";

export type AuthUser = {
  id: string;
  email: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

const mapUser = (user: User): AuthUser => ({
  id: user.uid,
  email: user.email ?? "",
});

const mapFirebaseErrorMessage = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return "No fue posible autenticar. Intenta de nuevo.";
  }

  const message = error.message;

  if (message.includes("auth/invalid-credential")) {
    return "Correo o contrasena incorrectos.";
  }

  if (message.includes("auth/email-already-in-use")) {
    return "Ese correo ya esta registrado.";
  }

  if (message.includes("auth/weak-password")) {
    return "La contrasena es demasiado debil.";
  }

  if (message.includes("auth/too-many-requests")) {
    return "Demasiados intentos. Espera un momento e intenta otra vez.";
  }

  return message;
};

const waitForAuthRestore = async (): Promise<void> => {
  if (firebaseAuth.currentUser) return;

  await new Promise<void>((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, () => {
      unsubscribe();
      resolve();
    });
  });
};

const buildSession = async (user: User): Promise<AuthSession> => {
  const token = await user.getIdToken();

  return {
    user: mapUser(user),
    token,
  };
};

export const firebaseAuthService = {
  login: async (email: string, password: string): Promise<AuthSession> => {
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return buildSession(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseErrorMessage(error));
    }
  },

  register: async (email: string, password: string): Promise<AuthSession> => {
    try {
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return buildSession(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseErrorMessage(error));
    }
  },

  getSession: async (): Promise<AuthSession | null> => {
    await waitForAuthRestore();

    const user = firebaseAuth.currentUser;
    if (!user) return null;

    return buildSession(user);
  },

  logout: async (): Promise<void> => {
    await signOut(firebaseAuth);
  },
};
