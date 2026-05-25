# NoteFlow

Aplicacion React Native (Expo + TypeScript) para organizar notas, checklists e ideas con busqueda en tiempo real y persistencia local.

## Tablero de trabajo

- Trello: https://trello.com/invite/b/6a03395c37287800df3990f7/ATTIf57e92c80aad09a7754e80eb1fd010a8F3EE1735/noteflow-ce

## Estructura del proyecto

- app/: rutas con Expo Router
- components/: componentes reutilizables
- store/: estado global con Zustand
- types/: modelos TypeScript
- constants/: tema y tokens visuales
- docs/: documentacion tecnica y de gestion

## Puesta en marcha

```bash
npm install
npm run start
```

## Integracion con API NoteFlow

1. Crear archivo `.env` en la raiz del proyecto con:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000
```

2. Levantar tu backend de NoteFlow API.

3. Iniciar la app Expo y autenticarse en la pantalla de acceso.

Notas:

- La app usa JWT con `expo-secure-store` (en web usa `localStorage`).
- Las rutas protegidas envian `Authorization: Bearer <token>`.
- El logout limpia token y estado local.

## Tecnologias clave

- Expo Router para navegacion por archivos
- React Native Paper para sistema de diseno
- Zustand + AsyncStorage para estado y persistencia local no sensible
- expo-secure-store para token JWT
- FlashList para listas de alto rendimiento
- Zod para validacion de formularios
- Expo Haptics para feedback tactil
