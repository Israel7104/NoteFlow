# React Native teoria aplicada a NoteFlow

## React Native vs app nativa

React Native no renderiza HTML en un WebView. Cuando usas componentes como View o Text, el framework crea vistas nativas reales del sistema operativo. Esto permite UX con look nativo, acceso a APIs nativas y buen rendimiento, siempre que el hilo de JavaScript no se bloquee.

## JS thread y UI thread

La arquitectura conecta dos hilos principales:

- JS thread: logica de React, estado y reglas de negocio.
- UI thread nativo: dibujado de componentes y animaciones nativas.

Si el JS thread se bloquea (calculos pesados, loops grandes, demasiados renders), la interfaz puede congelarse. Por eso se optimiza renderizado de listas y se evita trabajo innecesario por frame.

## Metro bundler

Metro es el empaquetador de React Native. Hace transformacion de codigo, resolucion de modulos, cache y hot reload para desarrollo rapido. Es clave para iterar con Expo, pero no reemplaza el proceso de compilacion nativa para modulos avanzados.

## Expo Go vs Development Build

- Expo Go: ideal para prototipado rapido sin compilar binarios.
- Development Build: necesario en proyectos reales cuando usas modulos nativos personalizados (camara avanzada, push complejas, biometria o plugins propios).

Para una app productiva, el camino normal termina en Development Build con EAS Build.

## Navegacion: Tabs vs Stack vs Modal

En NoteFlow usamos una combinacion:

- Tabs: secciones principales de uso diario (Notas, Tareas, Ideas, Archivadas).
- Stack: detalle por elemento con rutas dinamicas ([id]).
- Modal: creacion de contenido (nueva-note) sin sacar al usuario del contexto principal.

Esto mantiene navegacion clara: exploracion por tabs, profundidad por stack y acciones rapidas por modal.

## Sistemas de diseno

Se compararon Gluestack UI y React Native Paper:

- Gluestack UI: muy flexible, estilo utility-first y altamente personalizable.
- React Native Paper: Material Design estable, componentes listos y buena integracion Android.

Eleccion para esta fase: React Native Paper.

Motivos:

1. Acelera el MVP con componentes listos.
2. Incluye patrones accesibles y consistentes.
3. Facilita dark/light mode con theming MD3.

## Tokens visuales

En constants/theme.ts se definen tokens de:

- Paleta de colores
- Escala tipografica
- Espaciados base

El tema se selecciona con useColorScheme para soporte de modo claro y oscuro.

## Modelado de datos con TypeScript

Tipos base usados:

- BaseNote
- Note
- ChecklistNote
- IdeaNote
- ChecklistItem
- AnyNote (union)

AnyNote permite funciones comunes para multiples tipos. Para distinguirlos en runtime se usan type guards. Ejemplo: 'items' in note es true solo para ChecklistNote.

## Gestion de estado: useState vs Context API vs Zustand

- useState: simple y local, no escala bien entre pantallas.
- Context API: comparte estado, pero puede provocar re-renders amplios si no se segmenta bien.
- Zustand: store global liviano, sin providers anidados y con suscripciones finas por selector.

Para NoteFlow se usa Zustand + middleware persist para guardar notas localmente.

## Rehidratacion del store

Al iniciar la app, Zustand reconstruye el estado desde AsyncStorage (rehidratacion). Durante ese proceso, puede mostrarse un indicador de carga para evitar flashes de estado vacio. En este proyecto se expone hasHydrated para ese control.

## Persistencia con AsyncStorage

Ventajas:

- Facil de integrar en React Native
- Suficiente para MVP local

Limitaciones:

- Sin cifrado por defecto
- Limite de almacenamiento
- Datos solo en el dispositivo local

## Rendimiento en listas

FlashList mejora sobre FlatList en listas largas porque recicla componentes de forma mas agresiva y reduce blancos en scroll rapido. estimatedItemSize ayuda al motor a predecir altura y mejorar rendimiento.

## Auditoria recomendada

1. Poblar 50+ items por cada tipo.
2. Verificar scroll fluido sin caidas visibles.
3. Validar tema claro/oscuro en todas las pantallas.
4. Confirmar rehidratacion al cerrar y abrir app.
