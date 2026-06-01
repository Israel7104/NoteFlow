import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from "firebase/auth";

import { firebaseAuth } from "./firebase";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  photoURL: string;
};

type AuthSession = {
  user: AuthUser;
  token: string;
};

const mapUser = (user: User): AuthUser => ({
  id: user.uid,
  email: user.email ?? "",
  displayName: user.displayName ?? "",
  photoURL: user.photoURL ?? "",
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

  if (message.includes("auth/popup-closed-by-user")) {
    return "Cancelaste el inicio de sesion con Google.";
  }

  if (message.includes("auth/cancelled-popup-request")) {
    return "Se cancelo la solicitud de inicio con Google.";
  }

  if (message.includes("auth/requires-recent-login")) {
    return "Por seguridad debes volver a iniciar sesion antes de cambiar la contrasena.";
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

  loginWithGooglePopup: async (): Promise<AuthSession> => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(firebaseAuth, provider);
      return buildSession(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseErrorMessage(error));
    }
  },

  loginWithGoogleIdToken: async (idToken: string): Promise<AuthSession> => {
    try {
      const providerCredential = GoogleAuthProvider.credential(idToken);
      const credential = await signInWithCredential(firebaseAuth, providerCredential);
      return buildSession(credential.user);
    } catch (error) {
      throw new Error(mapFirebaseErrorMessage(error));
    }
  },

  updateDisplayName: async (displayName: string): Promise<AuthUser> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      throw new Error("No hay sesion activa.");
    }

    try {
      await updateProfile(currentUser, { displayName: displayName.trim() });
      return mapUser(currentUser);
    } catch (error) {
      throw new Error(mapFirebaseErrorMessage(error));
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser || !currentUser.email) {
      throw new Error("No hay sesion activa para cambiar la contrasena.");
    }

    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
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
