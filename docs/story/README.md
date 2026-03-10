<!-- docs/story/README.md - Índice de documentación del modo Story y su motor de mundo. -->
# Modo Story - Documentación

## Objetivo

Definir cómo se modela el mapa, desbloqueos, navegación e integración con duelos.

## Índice

1. `docs/story/01-world-graph.md`: modelo de grafo de mundo, reglas de desbloqueo y movimiento.
2. `docs/story/02-use-cases.md`: casos de uso de Story para estado, movimiento y resolución.
3. `docs/story/03-narrative-engine.md`: motor de briefing narrativo por capítulo.
4. `docs/story/PHASES-4-11-REPORT.md`: reporte de implementación y trazabilidad de fases.
5. `docs/story/NARRACION_OPONENTES.md`: narrativa y personalidad de oponentes.

## Estado actual

1. Fase 1 implementada: grafo Story puro en `src/core/services/story/world/`.
2. Runtime de mapa conectado al grafo en `src/services/story/get-story-map-runtime-data.ts`.
3. Fase 2 implementada: casos de uso Story en `src/core/use-cases/story/`.
4. Fase 3 implementada: persistencia de cursor/historial Story en Supabase.
5. Fase 7 implementada: briefing narrativo dinámico por capítulo/acto.
