<!-- docs/story/STORY-DUEL-IMPLEMENTATION-LOG.md - Registro por fases de la implementación del flujo Story/Duelo y sus archivos afectados. -->
# Story Duel - Registro de Implementación por Fases

## Fase 0 - Contrato de cierre de duelo

### Objetivo
Definir un contrato canónico de resultado de duelo Story y mantener compatibilidad con el payload legado.

### Cambios aplicados
1. Se introdujo el tipo `StoryDuelOutcome` (`WON`, `LOST`, `ABANDONED`).
2. Se agregó normalización de payload para aceptar:
   - contrato nuevo: `outcome`
   - contrato legacy: `didWin`
3. `POST /api/story/duels/complete` ahora devuelve metadatos de retorno:
   - `outcome`
   - `duelNodeId`
   - `returnNodeId`

### Archivos creados
- `src/services/story/duel-flow/story-duel-outcome.ts`
- `src/services/story/duel-flow/story-duel-outcome.test.ts`
- `src/services/story/duel-flow/resolve-story-duel-completion-input.ts`
- `src/services/story/duel-flow/resolve-story-duel-completion-input.test.ts`

### Archivos modificados
- `src/app/api/story/duels/complete/route.ts`

### Validación (TDD)
- Tests unitarios del nuevo contrato y parser.
- Compatibilidad backward validada en test (`didWin -> outcome`).

## Fase 1 - Abandono de combate vuelve a Story

### Objetivo
Forzar que la acción "Desconectar y salir" en combate Story registre `ABANDONED` y redirija a `/hub/story`.

### Cambios aplicados
1. Se añadió `onExitMatch` en `Board` para desacoplar la acción de salida del `PauseOverlay`.
2. `PauseOverlay` ahora prioriza callback `onExit`; si no existe mantiene fallback a `/hub`.
3. `StoryDuelClient` registra `ABANDONED` con API y vuelve al mapa Story con contexto de transición.
4. Se extrajo cliente HTTP de cierre de duelo para evitar duplicación.

### Archivos creados
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/story-duel-completion-client.ts`

### Archivos modificados
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx`
- `src/components/game/board/index.tsx`
- `src/components/game/board/internal/board-view-types.ts`
- `src/components/game/board/internal/BoardStatusAndTopBarSection.tsx`
- `src/components/game/board/ui/overlays/BoardStatusOverlays.tsx`
- `src/components/game/board/ui/overlays/PauseOverlay.tsx`
- `src/components/game/board/ui/overlays/PauseOverlay.test.tsx`

### Validación (TDD)
- Se añadió test de `PauseOverlay` para comprobar que `onExit` se ejecuta al abandonar.

## Fase 2 - Transición visual post-duelo en Story

### Objetivo
Mostrar retorno visual coherente al salir del duelo:
- `LOST`/`ABANDONED`: retroceso del jugador al nodo previo.
- `WON`: retirada visual del nodo oponente antes de desaparecer.

### Cambios aplicados
1. Se creó parser tipado de transición post-duelo desde `searchParams`.
2. `/hub/story` ahora inyecta transición en `StoryScene`.
3. `StoryScene` aplica transición inicial mediante hook dedicado.
4. `StoryCircuitMap` renderiza efecto de retirada de oponente (`StoryNodeRetreatEffect`).
5. `StoryDuelClient` conserva outcome real (`WON`/`LOST`) para volver al mapa con datos exactos.

### Archivos creados
- `src/services/story/duel-flow/story-post-duel-transition.ts`
- `src/services/story/duel-flow/story-post-duel-transition.test.ts`
- `src/components/hub/story/internal/scene/transitions/use-story-post-duel-transition.ts`
- `src/components/hub/story/internal/map/components/StoryNodeRetreatEffect.tsx`

### Archivos modificados
- `src/app/hub/story/page.tsx`
- `src/components/hub/story/StoryScene.tsx`
- `src/components/hub/story/StoryCircuitMap.tsx`
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx`

### Validación (TDD)
- Test de parser de transición (`story-post-duel-transition.test.ts`).
- Re-ejecución de test de escena Story para validar compatibilidad.
