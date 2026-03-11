<!-- src/core/use-cases/story/README.md - Describe casos de uso del mundo Story para navegación, progreso y resolución de nodos. -->
# Story Use Cases

## Objetivo

Orquestar estado y acciones del modo Story sin acoplar UI ni infraestructura.

## Casos de uso

1. `GetStoryWorldStateUseCase`: carga grafo + progreso desbloqueado/completado.
2. `MoveToStoryNodeUseCase`: valida movimiento entre nodos conectados.
3. `ResolveStoryNodeUseCase`: marca nodo resuelto y expande desbloqueos.
4. `CommitStoryProgressUseCase`: persiste nodo actual Story.

## Nota de arquitectura

La persistencia sigue en repositorios; estos casos de uso consumen contratos e implementan reglas de aplicación.
