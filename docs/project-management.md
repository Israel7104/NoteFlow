# Gestion del proyecto

## Flujo de trabajo

El trabajo se gestiona con un tablero Trello en 5 columnas:

1. Backlog
2. Todo
3. In Progress
4. Review
5. Done

En cada tarjeta se incluye una funcionalidad principal de NoteFlow y una lista de subtareas tecnicas concretas (modelo de datos, UI, estado, pruebas y documentacion).

## Flujo de ramas

1. Cada funcionalidad nueva o arreglo vive primero en una rama separada.
2. `develop` funciona como rama de integracion para desarrollo continuo.
3. `main` solo recibe cambios cuando ya fueron verificados y se considera que funcionan.
4. Si una tarea grande necesita validacion, se desarrolla en una rama de tipo `feature/*` o `fix/*` y luego se integra en `develop`.

## Tarjetas principales recomendadas

1. Notas de texto con detalle y eliminacion
2. Checklists con progreso y completado
3. Ideas con etiquetas y color
4. Navegacion Tabs + Stack + modal
5. Estado global con Zustand + persistencia
6. Formularios dinamicos con Zod
7. Rendimiento de listas con FlashList
8. Soporte tema claro/oscuro
9. Archivado y busqueda global
10. Documentacion tecnica

## Enlace al tablero

- https://trello.com/invite/b/6a03395c37287800df3990f7/ATTIf57e92c80aad09a7754e80eb1fd010a8F3EE1735/noteflow-ce

## Regla operativa

Cada vez que una funcionalidad pasa de implementacion a validacion, la tarjeta se mueve de In Progress a Review. Cuando queda validada manualmente en Expo Go o Development Build, se mueve a Done.
