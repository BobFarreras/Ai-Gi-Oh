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
        StoryMapZoomControls.tsx
      hooks/
        use-story-avatar-travel.ts
        use-story-map-zoom.ts
        use-story-avatar-travel.test.tsx
      layout/
        story-circuit-layout.ts
        story-circuit-layout.test.ts
      constants/
        story-map-geometry.ts
    scene/
      dialog/
        StoryNodeInteractionDialog.tsx
        use-story-node-interaction-dialog.ts
      panels/
        StorySidebar.tsx
        StoryBriefingPanel.tsx
        StoryHistoryPanel.tsx
      state/
        story-scene-store.ts
```

## Responsabilidades por capa
- `StoryScene.tsx`: composición de escena, acciones de UI y coordinación con API.
- `StoryCircuitMap.tsx`: render del canvas de mapa, nodos, caminos, plataformas y avatar.
- `internal/map/layout/*`: cálculo de posiciones/segmentos del circuito.
- `internal/map/components/*`: piezas visuales puras del mapa.
- `internal/map/hooks/*`: comportamiento de zoom y travel del avatar.
- `internal/scene/state/*`: estado local (Zustand) de la escena Story.
- `internal/scene/dialog/*`: flujo de diálogo narrativo.
- `internal/scene/panels/*`: panel lateral e información contextual.

## Reglas de mantenimiento
- Mantener SRP: un archivo = un motivo de cambio.
- Si un archivo supera complejidad visual/estado, extraer submódulos en `internal/`.
- No mover lógica de negocio a componentes; usar servicios/rutas.
- Actualizar este README cuando se cambie la estructura del módulo.

## Flujo de interacción actual
1. El jugador selecciona un nodo en el mapa.
2. `StorySidebar` habilita `Moverse` o `Interactuar` según contexto.
3. `POST /api/story/world/move` valida y persiste movimiento.
4. Si aplica, `POST /api/story/world/interact` registra evento narrativo.
5. En duelos, la ruta de resultado (`/api/story/duels/complete`) actualiza progreso.
