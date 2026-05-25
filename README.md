<img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&amp;logo=expo&amp;logoColor=white" alt="Expo">

<img src="https://img.shields.io/badge/React_Native-05122A?style=for-the-badge&amp;logo=react" alt="React Native">

<img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&amp;logo=TypeScript&amp;logoColor=FFF" alt="TypeScript">

<img src="https://img.shields.io/badge/Expo_Router-000000?style=for-the-badge&amp;logo=expo&amp;logoColor=white" alt="Expo Router">

<img src="https://img.shields.io/badge/Zustand-443E38?style=for-the-badge" alt="Zustand">

<img src="https://img.shields.io/badge/AsyncStorage-3178C6?style=for-the-badge" alt="AsyncStorage">

<img src="https://img.shields.io/badge/React_Native_Paper-6200EE?style=for-the-badge" alt="React Native Paper">

<img src="https://img.shields.io/badge/FlashList-00C4B3?style=for-the-badge" alt="FlashList">

<img src="https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge" alt="Zod">

<img src="https://img.shields.io/badge/EAS_Build-000020?style=for-the-badge&amp;logo=expo&amp;logoColor=white" alt="EAS Build">

📝 NoteFlow
Gestión ágil de notas, pedidos y alertas para operación diaria de pastelería.

Aplicación móvil y web con autenticación, persistencia local y sincronización con API REST para registrar reposición, checklists y alertas en tiempo real.

Despliegue	URL
Frontend móvil/web	Expo
Backend API	Configurable por variable EXPO_PUBLIC_API_URL
Características
Autenticación con registro e inicio de sesión
Gestión de notas de reposición con estado y caducidad
Checklists de pedidos con ítems completables
Sección de ideas y alertas archivables
Búsqueda en tiempo real en cada módulo
Persistencia local con hidratación de estado
Feedback táctil en acciones clave
Tecnologías
Frontend	Uso
Expo + React Native	Base de aplicación multiplataforma
TypeScript estricto	Tipado y seguridad de desarrollo
Expo Router	Navegación por rutas
React Native Paper	Sistema visual y componentes UI
FlashList	Renderizado eficiente de listas
Estado y datos	Uso
Zustand	Estado global y acciones de negocio
AsyncStorage	Persistencia local del estado
Secure Store	Almacenamiento seguro de token
Zod	Validación de formularios y contratos
Backend e integración	Uso
API REST NoteFlow	CRUD de notas, checklists e ideas
JWT Bearer Token	Autenticación en endpoints protegidos
EAS Build	Generación de builds Android/iOS
Estructura del proyecto
project/
├── app/
│ ├── auth.tsx
│ ├── nueva-note.tsx
│ └── (tabs)/
│ ├── notas/
│ ├── checklists/
│ ├── ideas/
│ └── archivadas/
├── components/
│ └── items/
├── store/
│ └── notesStore.ts
├── lib/
│ ├── api.ts
│ └── tokenStorage.ts
├── types/
├── constants/
├── docs/
├── app.json
├── package.json
└── README.md

Descargar y ejecutar
Clonar repositorio
Instalar dependencias
Configurar variables de entorno
Iniciar Expo
Comandos:
npm install
npm run start

Crear archivo .env con:
EXPO_PUBLIC_API_URL=http://localhost:3000

Build ejecutable
Android
APK de prueba con EAS Build
AAB para Google Play con perfil de producción
iOS
Build IPA con EAS Build
Distribución por TestFlight/App Store
Roadmap
Mejorar métricas y observabilidad de sincronización
Reintroducir animaciones seguras para Android Expo Go
Tests de integración para flujo de creación y refresco
Modo offline con cola de sincronización
Desarrollado como proyecto de práctica y evolución continua de producto.