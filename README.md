# NoteFlow

Aplicacion React Native (Expo + TypeScript) para organizar notas, checklists e ideas con busqueda en tiempo real y persistencia local.

## Tablero de trabajo

- Trello: https://trello.com/b/REEMPLAZAR_NOTEFLOW_BOARD

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

## Tecnologias clave

- Expo Router para navegacion por archivos
- React Native Paper para sistema de diseno
- Zustand + AsyncStorage para estado y persistencia
- FlashList para listas de alto rendimiento
- Zod para validacion de formularios
- Expo Haptics para feedback tactil
