<!-- docs/audits/2026-03-12-fase-4-srp-refactor-avance.md - Avance de Fase 4 de refactor SRP en API Story y UI de Hub/Board. -->
# Fase 4 - Avance de refactor SRP (2026-03-12)

## Objetivo
Reducir deuda técnica en módulos con señales de GOD file y mezcla de responsabilidades, manteniendo comportamiento funcional y quality gates en verde.

## Cambios implementados

1. API Story duel completion:
   - `src/app/api/story/duels/complete/route.ts` queda como adaptador HTTP.
   - Se extrae orquestación de dominio a:
     - `src/app/api/story/duels/complete/internal/process-story-duel-completion.ts`
     - `src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.ts`
2. Dock móvil de fases en board:
   - `src/components/game/board/ui/layout/BoardMobilePhaseControls.tsx` se reduce con extracción de:
     - `src/components/game/board/ui/layout/internal/BoardMobilePhaseButton.tsx`
     - `src/components/game/board/ui/layout/internal/use-board-mobile-phase-layout.ts`
     - `src/components/game/board/ui/layout/internal/resolve-board-mobile-phase-classes.ts`
3. Mapa Story:
   - `src/components/hub/story/StoryCircuitMap.tsx` pasa a orquestador de cámara/zoom.
   - Render pesado extraído a:
     - `src/components/hub/story/internal/map/components/StoryCircuitCanvas.tsx`
4. Escena Story:
   - `src/components/hub/story/StoryScene.tsx` se reduce a composición + wiring de estado.
   - Acciones de interacción/movimiento extraídas a:
     - `src/components/hub/story/internal/scene/actions/create-story-scene-actions.ts`
   - Composición visual separada en:
     - `src/components/hub/story/internal/scene/view/StorySceneSidebarPane.tsx`
     - `src/components/hub/story/internal/scene/view/StorySceneMapPane.tsx`

## Resultado de tamaño (regla <=150 líneas)

- `src/app/api/story/duels/complete/route.ts`: 37
- `src/app/api/story/duels/complete/internal/process-story-duel-completion.ts`: 85
- `src/app/api/story/duels/complete/internal/resolve-story-duel-return-node.ts`: 62
- `src/components/game/board/ui/layout/BoardMobilePhaseControls.tsx`: 142
- `src/components/hub/story/StoryCircuitMap.tsx`: 139
- `src/components/hub/story/StoryScene.tsx`: 133
- `src/components/hub/story/internal/scene/actions/create-story-scene-actions.ts`: 149

## Validación ejecutada

1. `pnpm eslint src/components/hub/story src/components/game/board/ui/layout src/app/api/story/duels/complete`
2. `pnpm vitest run src/components/hub/story/StoryScene.test.tsx src/components/game/board/internal/HudPhaseControls.test.tsx`
3. `pnpm build`

Estado: todo en verde.

## Riesgos y seguimiento

1. En tests Story aparece warning de Next Image por `quality=55` no listado en `images.qualities`; no bloquea build, pero conviene normalizar configuración para eliminar ruido.
2. Fase 4 puede continuar sobre otros candidatos cercanos al límite para mantener margen de crecimiento.
