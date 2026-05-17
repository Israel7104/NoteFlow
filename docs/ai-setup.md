# Configuracion de herramientas IA

## Objetivo

Alinear las respuestas de IA con la arquitectura de NoteFlow desde el inicio para evitar codigo contradictorio.

## Cursor

Se creo el archivo .cursorrules con:

- Contexto del proyecto: Expo + React Native + TypeScript + Expo Router
- Convenciones de estructura: app/, components/, store/, types/, constants/, docs/
- Reglas de estilo: tipado estricto, componentes pequenos, nombres consistentes
- Restricciones: no logica de negocio en UI, no dependencias innecesarias, respetar tema y accesibilidad
- Reglas especificas recomendadas para RN TS: evitar any, preferir type guards, optimizar listas y evitar re-renders

## Gemini / Claude

Se configuro una base de instrucciones persistentes en:

- CLAUDE.md
- .github/copilot-instructions.md

El contenido incluye:

- Stack tecnico
- Convenciones de nombres
- Restricciones de arquitectura
- Criterios de rendimiento y UX

Para Gemini/Claude en entorno externo (web/desktop), se debe copiar estas instrucciones en su prompt de sistema persistente.

## Otras herramientas

Si una herramienta soporta contexto de proyecto (workspace instructions, repo instructions o memory files), usar el mismo documento fuente para mantener coherencia.

## Por que esta configuracion

1. Reduce discrepancias entre propuestas de IA.
2. Evita patrones incompatibles con Expo Router y Zustand.
3. Mantiene una base uniforme de calidad y arquitectura.
