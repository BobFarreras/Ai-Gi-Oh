<!-- docs/story/IMPLEMENTATION-PHASES.md - Seguimiento fase a fase de implementación técnica del modo Story. -->
# Story - Implementación por Fases

## Fase 4 - Estado/UI de escena Story

### Objetivo

Separar el estado de interacción del mapa Story de la capa de renderizado.

### Implementado

1. Store local Zustand para escena Story:
   - `src/components/hub/story/internal/story-scene-store.ts`.
2. Escena cliente `StoryScene` con selección de nodo e historial:
   - `src/components/hub/story/StoryScene.tsx`.
3. `StoryCircuitMap` adaptado a selección de nodo + nodo actual + layout móvil.
4. `StoryHistoryPanel` para timeline del jugador.

### Validación

1. Mapa renderiza con nodo seleccionado.
2. Historial Story visible en panel inferior.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 5 - Navegación semi-abierta y rutas

### Objetivo

Permitir movimiento explícito por nodos desbloqueados y mostrar caminos visuales.

### Implementado

1. API `POST /api/story/world/move` con casos de uso Story.
2. Persistencia del movimiento en estado/historial Story.
3. Rutas visuales en `StoryCircuitMap` (segmentos entre nodos).
4. Panel de nodo en `StoryScene` con acción `Moverse aquí`.

### Validación

1. El movimiento a nodo bloqueado devuelve error controlado.
2. El movimiento válido actualiza nodo actual e historial.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 6 - Interacciones por tipo de nodo

### Objetivo

Desacoplar la acción principal de la UI respecto al tipo de nodo Story.

### Implementado

1. Resolver de interacción por tipo:
   - `core/services/story/world/resolve-story-node-interaction.ts`.
2. Cobertura de tests de interacción por tipos (`DUEL`, `EVENT`, `REWARD_*`).
3. `StoryMapRuntimeData` expone `nodeType`.
4. `StoryScene` y `StoryCircuitMap` muestran/consumen la semántica de tipo.

### Validación

1. El label de acción en inspector depende del `nodeType`.
2. El mapa muestra etiqueta de tipo por nodo.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.
