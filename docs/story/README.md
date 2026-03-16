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
6. `docs/story/OPPONENT_CONTENT_INVENTORY.md`: inventario de assets por oponente para planificar cargas faltantes.
7. `src/services/story/map-definitions/`: layout visual editable por acto (sin tocar reglas de dominio).
8. `docs/story/STORY_DIALOGUE_ASSETS_TEMPLATE.md`: plantilla para producción de texto/retrato/audio por nodo.
9. `docs/story/STORY-DUEL-IMPLEMENTATION-LOG.md`: bitácora fase a fase del flujo Story <-> Duel.
10. `docs/story/MOBILE-STORY-PHASES-1-3.md`: plan base para habilitar Story en móvil sin romper desktop.

## Estado actual

1. Fase 1 implementada: grafo Story puro en `src/core/services/story/world/`.
2. Runtime de mapa conectado al grafo en `src/services/story/get-story-map-runtime-data.ts`.
3. Fase 2 implementada: casos de uso Story en `src/core/use-cases/story/`.
4. Fase 3 implementada: persistencia de cursor/historial Story en Supabase.
5. Fase 7 implementada: briefing narrativo dinámico por capítulo/acto.
6. Fase B implementada: definiciones visuales locales por acto + merge con runtime real.
7. Fase C implementada: nodos virtuales con interacción contextual y rutas secundarias.
8. Fase D implementada: transición visual del avatar en movimiento y lock temporal de interacción.
9. Fase E implementada: diálogos narrativos por nodo virtual con modal secuencial.
10. Fase F implementada: persistencia de interacción narrativa y variantes por repetición.
11. Fase G implementada: catálogo local de imágenes/audios para diálogos narrativos.
12. Fase H implementada: selección directa de nodos + plataformas decorativas + bloqueo estricto por progreso completado.
13. Fase I implementada: zoom, nodo inicial de jugador y rutas de mayor densidad con reconvergencias.
14. Fase 0-5 (duelo Story) implementada:
   - contrato canónico de resultado (`WON`, `LOST`, `ABANDONED`),
   - salida de pausa Story hacia `/hub/story` con persistencia de abandono,
   - transición visual post-duelo en mapa (retirada de rival o retroceso de jugador),
   - coin toss previo al combate con base 50/50 y soporte de modificadores.
