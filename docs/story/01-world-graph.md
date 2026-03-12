<!-- docs/story/01-world-graph.md - Especifica el modelo de grafo para navegación y desbloqueo del modo Story. -->
# Story World Graph

## Módulo

`src/core/services/story/world/`

## Responsabilidades

1. Representar nodos Story (duelo, boss y extensibles a evento/recompensa).
2. Construir aristas de navegación desde requisitos explícitos y fallback secuencial.
3. Resolver qué nodos están desbloqueados en función de nodos completados.
4. Validar navegación directa entre nodos conectados y desbloqueados.

## Contratos principales

1. `IStoryWorldNode`, `IStoryWorldEdge`, `IStoryWorldGraph`.
2. `buildStoryWorldGraph(seedNodes)`.
3. `resolveStoryUnlockedNodeIds(graph, completedNodeIds)`.
4. `canMoveBetweenStoryNodes({ graph, fromNodeId, toNodeId, unlockedNodeIds })`.

## Integración con runtime

`src/services/story/get-story-map-runtime-data.ts` usa este grafo como única fuente de desbloqueo del mapa Story.
