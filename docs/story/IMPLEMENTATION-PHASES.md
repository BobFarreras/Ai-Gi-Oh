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

## Fase 7 - Motor narrativo de capítulo

### Objetivo

Mostrar contexto de acto/capítulo en el mapa sin hardcodear texto en componentes.

### Implementado

1. Servicio `build-story-chapter-briefing`.
2. Tests del servicio y fallback.
3. Panel UI de briefing (`StoryBriefingPanel`).
4. Integración en `StoryPage` con capítulo desbloqueado máximo.

### Validación

1. El mapa muestra briefing narrativo del capítulo activo.
2. Capítulos no definidos usan fallback estable.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 8 - Integración mapa/combate Story

### Objetivo

Alinear entrada a combate con el estado real del mundo Story (nodo activo + desbloqueo).

### Implementado

1. `get-story-duel-runtime-data` usa `GetStoryWorldStateUseCase` para validar desbloqueo.
2. Se comprueba `currentNodeId` persistido antes de permitir iniciar duelo.
3. Página de duelo bloquea entrada con mensaje claro si el nodo no está activo.

### Validación

1. Si el jugador no está en el nodo, no entra al duelo.
2. Si el nodo está activo y desbloqueado, el flujo de combate funciona.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 9 - Hardening de rendimiento Story (mobile)

### Objetivo

Reducir coste visual del mapa Story en móviles low-end sin cambiar flujo de juego.

### Implementado

1. Perfil de rendimiento Story por viewport:
   - `resolve-story-performance-profile.ts`.
2. `StoryCircuitMap` aplica degradación visual en low-power:
   - menos capas decorativas,
   - sin trazado SVG de caminos,
   - sombras reducidas.
3. `StoryHistoryPanel` modo compacto para móvil.

### Validación

1. En móvil estrecho se reducen efectos del mapa.
2. En desktop se mantiene estética completa.
3. `pnpm lint`, `pnpm test`, `pnpm build` en verde.

## Fase 10 - Seguridad y QA de flujos Story

### Objetivo

Blindar rutas Story ante entradas inválidas y documentar hardening aplicado.

### Implementado

1. Validador de `nodeId` en capa de aplicación:
   - `assert-valid-story-node-id.ts`.
2. Tests de validación de formato.
3. API `/api/story/world/move` reforzada con validación explícita.
4. Documento de hardening:
   - `docs/security/story-world-hardening.md`.

### Validación

1. `nodeId` inválido dispara `ValidationError`.
2. `pnpm lint`, `pnpm test`, `pnpm build` en verde.
