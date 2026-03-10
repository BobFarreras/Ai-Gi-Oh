<!-- docs/story/02-use-cases.md - Documenta los casos de uso de aplicación del modo Story y su contrato de entrada/salida. -->
# Story Use Cases

## Ubicación

`src/core/use-cases/story/`

## Casos de uso implementados

1. `GetStoryWorldStateUseCase`
- Entrada: `playerId`.
- Salida: `graph` + `progress`.
- Responsabilidad: proyectar el estado del mundo Story desde repositorios.

2. `MoveToStoryNodeUseCase`
- Entrada: `graph`, `progress`, `toNodeId`, `nowIso`.
- Salida: `progress` actualizado.
- Responsabilidad: permitir solo movimientos válidos (nodo desbloqueado y conectado).

3. `ResolveStoryNodeUseCase`
- Entrada: `graph`, `progress`, `nodeId`, `nowIso`.
- Salida: `progress` actualizado + recompensa.
- Responsabilidad: marcar nodo completado, registrar eventos de historial y recalcular desbloqueos.

4. `CommitStoryProgressUseCase`
- Entrada: `playerId`, `progress`.
- Salida: `void`.
- Responsabilidad: persistir nodo actual e historial Story en repositorio de infraestructura.
