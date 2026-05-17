# Definicion de la idea - NoteFlow

## Problema que resuelve

En una pasteleria es facil perder trazabilidad cuando hay que gestionar, al mismo tiempo, reposicion diaria de productos, tareas internas y notas de ideas comerciales. NoteFlow centraliza esa informacion para reducir olvidos, errores de seguimiento y perdida de contexto operativo.

## Usuario objetivo

El usuario principal es una persona encargada de operacion en negocio pequeno (dueno, administrador o encargado de turno) que necesita:

1. Registrar notas rapidas durante el dia.
2. Gestionar checklists de tareas de produccion y vitrina.
3. Guardar ideas etiquetadas para promociones, sabores y mejoras.

Uso diario esperado:

1. Abrir la app al iniciar turno.
2. Revisar pendientes en Tareas.
3. Agregar notas de incidencias o decisiones.
4. Capturar ideas con etiquetas para retomar despues.
5. Consultar y archivar elementos completados.

## Funcionalidades principales (v1)

1. Tres tipos de contenido: notas de texto, checklists e ideas.
2. Navegacion por pestañas: Notas, Tareas, Ideas y Archivadas.
3. Detalle por elemento con rutas dinamicas.
4. Creacion de contenido en modal con validacion Zod.
5. Estado global con Zustand y persistencia local en AsyncStorage.
6. Listas optimizadas con FlashList.
7. Busqueda en tiempo real por cada seccion.
8. Soporte de tema claro/oscuro.
9. Feedback tactil en acciones clave (eliminar y checklist completo).

## Funcionalidades opcionales (futuro)

1. Gestion de pedidos con fecha de entrega y recordatorios.
2. Notificaciones push programadas para vencimientos y envios.
3. Autenticacion social (Google/Facebook) y sincronizacion cloud.
4. Registro de ventas y metricas de productos top.
5. Recuperacion de archivados y papelera temporal.
6. Colaboracion multiusuario por equipo/turno.