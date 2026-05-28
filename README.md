# NoteFlow

Aplicacion movil y web para gestionar reposicion, pedidos y alertas de pasteleria.

[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-05122A?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![Expo Router](https://img.shields.io/badge/Expo_Router-000000?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/router/introduction/)
[![Zustand](https://img.shields.io/badge/Zustand-443E38?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
[![FlashList](https://img.shields.io/badge/FlashList-00C4B3?style=for-the-badge)](https://shopify.github.io/flash-list/)
[![React Native Paper](https://img.shields.io/badge/React_Native_Paper-6200EE?style=for-the-badge)](https://callstack.github.io/react-native-paper/)
[![EAS Build](https://img.shields.io/badge/EAS_Build-000020?style=for-the-badge&logo=expo&logoColor=white)](https://docs.expo.dev/build/introduction/)

## Resumen

- Autenticacion con registro e inicio de sesion.
- Notas de reposicion con estado y fecha de caducidad.
- Checklists de pedidos con items completables.
- Ideas/alertas y seccion de archivados.
- Busqueda en tiempo real.
- Persistencia local + sincronizacion con API REST.

## Stack

| Area | Tecnologia | Uso |
|---|---|---|
| App | Expo + React Native | Base multiplataforma |
| Navegacion | Expo Router | Ruteo por archivos |
| Estado | Zustand + persist | Estado global e hidratacion |
| Persistencia | AsyncStorage + SecureStore | Datos locales y token |
| UI | React Native Paper | Componentes visuales |
| Listas | FlashList | Render de listas performante |
| Validacion | Zod | Validacion de formularios |
| Build | EAS Build | APK/AAB/IPA |

## Estructura

```text
app/
	auth.tsx
	nueva-note.tsx
	(tabs)/
		notas/
		checklists/
		ideas/
		archivadas/
components/
	items/
store/
	notesStore.ts
lib/
	api.ts
	tokenStorage.ts
types/
constants/
docs/
```

## Requisitos

- Node.js 18+
- npm 9+
- Expo CLI (via npx)

## Ejecutar en local

1. Instalar dependencias:

```bash
npm install
```

2. Crear archivo `.env` en la raiz:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_APP_ID=tu_app_id
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
```

3. Iniciar proyecto:

```bash
npm run start
```

Opcional:

```bash
npm run android
npm run ios
npm run web
```

## Build ejecutable

1. Configurar EAS (una sola vez):

```bash
npx eas build:configure
```

2. Android APK (pruebas):

```bash
npx eas build -p android --profile preview
```

3. Android AAB (Google Play):

```bash
npx eas build -p android --profile production
```

4. iOS (IPA/TestFlight):

```bash
npx eas build -p ios --profile production
```

## Notas

- Si cambias dependencias nativas y usas Expo Go, reinicia con cache limpia:

```bash
npx expo start -c
```

- La API se consume con `Authorization: Bearer <token>` (ID token de Firebase).

## Roadmap

- Mejorar observabilidad de sincronizacion.
- Reintroducir animaciones seguras para Android Expo Go.
- Agregar tests de integracion en flujos criticos.
- Explorar modo offline con cola de sincronizacion.