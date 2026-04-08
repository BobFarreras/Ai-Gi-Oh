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

## Fase 3 - Cobertura de tipos de nodo faltantes

### Objetivo
Disponer de un circuito de prueba que cubra tipos Story aún no ejercitados en el acto activo.

### Cambios aplicados
1. Acto 1 ahora incluye nodos de prueba secuenciales para `EVENT` y `BOSS` virtual.
2. Se añadieron plataformas de soporte para la nueva secuencia lineal.
3. Se agregó test de intención primaria para `BOSS` virtual (sin navegación directa).

### Archivos modificados
- `src/services/story/map-definitions/act-1-map-definition.ts`
- `src/services/story/resolve-story-primary-action.test.ts`

### Validación (TDD)
- Test actualizado de `resolveStoryPrimaryAction` para `BOSS` virtual.

## Fase 4 - Coin Toss previo al combate Story

### Objetivo
Decidir de forma explícita y visible quién inicia el turno antes del combate, con base 50/50 y soporte futuro para modificadores.

### Cambios aplicados
1. Se implementó servicio puro `resolveStoryCoinToss` con:
   - probabilidad base 50/50,
   - modificadores de inicio (`playerStartBonusPercent`, `opponentStartBonusPercent`),
   - opción de `randomValue` inyectable para pruebas.
2. `StoryDuelClient` usa el resultado del coin toss para `starterPlayerId`.
3. Se añadió overlay visual `StoryDuelCoinTossOverlay` al entrar al duelo.

### Archivos creados
- `src/services/story/duel-flow/resolve-story-coin-toss.ts`
- `src/services/story/duel-flow/resolve-story-coin-toss.test.ts`
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelCoinTossOverlay.tsx`

### Archivos modificados
- `src/app/hub/story/chapter/[chapter]/duel/[duelIndex]/StoryDuelClient.tsx`

### Validación (TDD)
- Test unitario de `resolveStoryCoinToss` para:
  - base 50/50
  - aplicación de bonus de probabilidad.

## Fase 5 - Hardening de transiciones Story

### Objetivo
Blindar las animaciones de retorno Story con tests de comportamiento para evitar regresiones en victoria/derrota/salida.

### Cambios aplicados
1. Se añadió test del hook `useStoryPostDuelTransition` para:
   - retirada de nodo rival (`WON`),
   - desplazamiento visual de retorno (`LOST`).

### Archivos creados
- `src/components/hub/story/internal/scene/transitions/use-story-post-duel-transition.test.tsx`

### Validación (TDD)
- Pruebas con timers fake para validar secuencia temporal de animaciones.

## Fase 6 - Documentación y cierre de calidad

### Objetivo
Dejar trazabilidad completa de arquitectura y flujo Story/Duel para mantenimiento y revisión de TFM.

### Cambios aplicados
1. Se actualizó `docs/story/README.md` con:
   - índice del registro por fases,
   - estado actual de implementación de flujo duelo.
2. Se actualizó `src/components/hub/story/README.md` con:
   - nuevos submódulos (`transitions`, efectos de mapa),
   - flujo actualizado de retorno post-duelo y coin toss.

### Archivos modificados
- `docs/story/README.md`
- `src/components/hub/story/README.md`

### Validación
- Verificación final de `pnpm lint`, `pnpm test` (target Story) y `pnpm build`.

## Fase 7 - Acto 1 BigLog + cinemática de evento + escalado Soldado

### Objetivo
Alinear Acto 1 con `MODO-HISTORIA.md`: ruta principal + rama secundaria real, evento con vídeo full-screen y boss final reutilizando `opp-ch1-soldier-act01` con dificultad progresiva.

### Cambios aplicados
1. Se rediseñó el mapa visual del Acto 1 con nodos de briefing, señal especial, rama lateral y transición final al Acto 2.
2. Se añadió soporte de `cinematicVideo` en diálogo Story y overlay full-screen con botón flotante para interrumpir la cinemática.
3. Se actualizó catálogo narrativo de Acto 1 (BigLog) y media de retratos por línea.
4. Se aplicó migración SQL para escalar duelos del mismo oponente (`ROOKIE -> STANDARD -> ELITE -> BOSS`) y overrides de deck por duelo.

### Archivos creados
- `src/services/story/story-node-interaction-dialogue-types.ts`
- `src/services/story/story-node-interaction-dialogue-catalog.ts`
- `src/components/hub/story/internal/scene/dialog/StoryInteractionVideoOverlay.tsx`
- `docs/supabase/sql/034_phase_story_act1_biglog_video_soldier_scaling.sql`

### Archivos modificados
- `src/services/story/map-definitions/act-1-map-definition.ts`
- `src/services/story/resolve-story-node-interaction-dialogue.ts`
- `src/services/story/story-node-dialogue-media.ts`
- `src/components/hub/story/StoryScene.tsx`
- `src/components/hub/story/internal/scene/dialog/use-story-node-interaction-dialog.ts`
- `src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.tsx`
- `src/components/hub/story/internal/scene/view/StorySceneMapPane.tsx`
- `src/components/hub/story/internal/scene/view/story-scene-view-props.ts`
- `src/services/story/merge-story-map-visual-definition.test.ts`
- `src/services/story/resolve-story-world-move-mode.test.ts`
- `src/services/story/resolve-story-world-traversal-path.test.ts`
- `src/services/story/resolve-story-node-interaction-dialogue.test.ts`
- `src/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog.test.tsx`

### Validación
- `pnpm lint` en verde.
- `pnpm build` en verde.
- Tests Story focalizados en verde (`map`, `move-mode`, `traversal`, `dialog` y `video overlay`).

## Fase 8 - Hardening de retorno post-duelo y consistencia canónica de duelos

### Objetivo
Eliminar desvíos de retorno a nodos de actos anteriores al cerrar combate y blindar resolución de duelos frente a datos legacy en BD.

### Cambios aplicados
1. `resolveStoryDuelReturnNode` ya no usa `unlockRequirementNodeId` como fallback en `LOST/ABANDONED`; retorna al mismo nodo de duelo cerrado.
2. Se añadió test de regresión para evitar retorno incorrecto a `story-ch1-duel-5` en duelos del Acto 2.
3. Se endureció `SupabaseOpponentRepository` con identidad canónica por `id` (`story-chX-duel-Y`):
   - canonicalización de `chapter/duelIndex` en listados,
   - fallback de lectura por `id` canónico si falla consulta por `chapter/duel_index`.
4. Se robusteció `POST /api/story/world/move` para resolver `currentNodeId` efectivo cuando el estado compacto está desincronizado.
5. Se añadió excepción explícita en traversal para transición entre actos desde nodo `*-transition-to-act*` sin exigir `interacted`.

### Archivos creados
- `src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.test.ts`

### Archivos modificados
- `src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.ts`
- `src/infrastructure/persistence/supabase/SupabaseOpponentRepository.ts`
- `src/app/api/story/world/move/route.ts`
- `src/services/story/resolve-story-world-traversal-path.ts`
- `src/services/story/resolve-story-world-traversal-path.test.ts`
- `src/components/hub/story/README.md`

### Validación
- `pnpm vitest src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.test.ts src/services/story/resolve-story-world-traversal-path.test.ts` en verde.
- `pnpm lint` en verde.
