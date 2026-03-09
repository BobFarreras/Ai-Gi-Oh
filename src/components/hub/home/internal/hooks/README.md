<!-- src/components/hub/home/internal/hooks/README.md - Índice de hooks internos del módulo Home para estado, acciones y handlers de interacción. -->
# Hooks Internos de Home

## Objetivo

Concentrar lógica de estado/orquestación en hooks reutilizables y mantener `HomeDeckBuilderScene` como fachada ligera.

## Hooks disponibles

1. `use-home-deck-builder-state.ts`: estado local + derivados de selección.
2. `use-home-deck-builder-actions.ts`: fachada de acciones principales (`insert/remove/evolve`).
3. `use-home-workspace-handlers.ts`: handlers de selección y DnD del workspace.
4. `use-home-selection-view.ts`: cálculo derivado de disponibilidad y evolución.
5. `use-deck-mutation-guard.ts`: guard de concurrencia para mutaciones optimistas.
6. `create-home-drop-handlers.ts`: factoría de handlers `drop` para reducir complejidad del hook principal.

