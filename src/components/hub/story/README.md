<!-- src/components/hub/story/README.md - Guía de arquitectura del módulo Story (UI + mapa + estado local). -->
# Módulo Story (`src/components/hub/story`)

## Objetivo
Este módulo renderiza la experiencia del mapa Story y orquesta las acciones de UI del jugador:
- selección de nodo,
- movimiento visual del avatar,
- interacción narrativa,
- navegación a duelos.

La lógica de negocio real (desbloqueos, persistencia, validación de movimiento) se resuelve en `src/services/story` y en las rutas API de `src/app/api/story`.

## Estructura
```text
story/
  StoryScene.tsx
  StoryCircuitMap.tsx
  StoryScene.test.tsx
  internal/
    map/
      components/
        StoryMapNode.tsx
        StoryNodePlatform.tsx
        StoryRewardCollectEffect.tsx
        StoryRewardFloatingText.tsx
        StoryNodeRetreatEffect.tsx
        StoryMapZoomControls.tsx
      hooks/
        use-story-avatar-travel.ts
        use-story-map-zoom.ts
        use-story-avatar-travel.test.tsx
      layout/
        resolve-story-retreat-trail.ts
        resolve-story-retreat-trail.test.ts
        story-circuit-layout.ts
        story-circuit-layout.test.ts
      constants/
        story-map-geometry.ts
    scene/
      view/
        StorySceneDesktopLayout.tsx
        StorySceneMobileLayout.tsx
        StoryMobileSidebarSheet.tsx
        story-scene-view-props.ts
        use-story-scene-mobile-mode.ts
      audio/
        use-story-scene-sfx.ts
      dialog/
        StoryNodeInteractionDialog.tsx
        StoryNodeInteractionDialog.test.tsx
        use-story-node-interaction-dialog.ts
      panels/
        StorySidebar.tsx
        StoryBriefingPanel.tsx
        internal/
          StorySidebarHeader.tsx
          StorySidebarNodeContent.tsx
          StorySidebarEmptyState.tsx
          story-sidebar-motion.ts
          story-sidebar-view-model.ts
      state/
        resolve-story-scene-can-move.ts
        resolve-story-scene-can-move.test.ts
        story-scene-store.ts
      transitions/
        use-story-act-entry-sequence.ts
        use-story-post-duel-transition.ts
        use-story-post-duel-transition.test.tsx
```

## Responsabilidades por capa
- `StoryScene.tsx`: composición de escena, acciones de UI y coordinación con API.
  Implementa CTA único inteligente (`smart action`) para mover/interactuar con un solo botón.
  Selecciona layout desktop/mobile sin duplicar la lógica de estado.
- `StoryCircuitMap.tsx`: render del canvas de mapa, nodos, caminos, plataformas y avatar.
- `internal/map/layout/*`: cálculo de posiciones/segmentos del circuito.
  `resolve-story-retreat-trail.ts` calcula la ruta de retirada rival siguiendo el grafo.
- `internal/map/components/*`: piezas visuales puras del mapa.
  `StoryRewardCollectEffect.tsx` anima la absorción visual de recompensas.
- `internal/map/hooks/*`: comportamiento de zoom y travel del avatar.
- `internal/scene/state/*`: estado local (Zustand) de la escena Story.
  `resolve-story-scene-can-move.ts` centraliza la política del botón de movimiento.
- `internal/scene/audio/*`: reproducción de SFX del mapa Story.
- `internal/scene/dialog/*`: flujo de diálogo narrativo.
  Incluye autoavance temporal por línea, avance manual por botón flotante y cierre explícito de interacción.
- `internal/scene/panels/*`: panel lateral e información contextual con acción única (sin doble botón).
- `internal/scene/transitions/*`: transición visual post-duelo al volver desde combate.
  Incluye entrada por portal al cambiar de acto (spawn pequeño -> crecer -> desplazamiento al nodo destino del acto).
- `internal/scene/view/*`: layouts de presentación Story.
  En mobile se usa sidebar desplegable y proyección visual vertical del mapa con el mismo motor.

## Reglas de mantenimiento
- Mantener SRP: un archivo = un motivo de cambio.
- Si un archivo supera complejidad visual/estado, extraer submódulos en `internal/`.
- No mover lógica de negocio a componentes; usar servicios/rutas.
- Actualizar este README cuando se cambie la estructura del módulo.

## Flujo de interacción actual
1. El jugador selecciona un nodo en el mapa.
2. `StorySidebar` resuelve un único botón inteligente (`mover`, `interactuar` o `mover + interactuar`).
3. `POST /api/story/world/move` valida y persiste movimiento.
4. Si aplica, `POST /api/story/world/interact` registra interacción narrativa.
5. En duelos, la ruta de resultado (`/api/story/duels/complete`) actualiza progreso.
6. Al volver de duelo, `StoryScene` consume query de transición (`duelOutcome`, `duelNodeId`, `returnNodeId`).
7. Si el duelo se gana, el nodo rival se retira visualmente recorriendo nodos/plataformas del flujo.
8. En recompensas de carta, nodo + animación usan visual real según `rewardCardId` (servicio `resolve-story-reward-card-visual`).
9. Persistencia Story usa estado compacto: `currentNodeId + visitedNodeIds + interactedNodeIds`.
10. Antes de iniciar combate Story se ejecuta coin toss y su resultado define `starterPlayerId`.
11. En nodos `EVENT`, la escena reproduce `soundtrack` del evento durante el diálogo y, al cerrar, dispara SFX de finalización (`finish-event`).
12. En transición entre actos, el avatar aparece en el nodo portal del acto, hace animación de escala y luego se mueve al nodo objetivo (inicio al avanzar, último progreso al retroceder).

## Herramientas de depuración
- `POST /api/story/world/reset`: reinicia cursor Story al nodo inicial y limpia estado compacto (visitados/interacciones) para reproducir pruebas del mapa.
