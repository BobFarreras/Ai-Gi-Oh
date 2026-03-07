<!-- docs/DEUDA_TECNICA.md - Registro activo de deuda técnica priorizada y plan de reducción por fases. -->
# Deuda Técnica Activa

## Estado actual (2026-03-07)

### Combate / Match Runtime

1. `useBoard.ts` concentra demasiadas responsabilidades (estado UI, orquestación de turno, progresión post-duelo y errores).
2. `boardInitialState.ts` tenía hardcodes de jugadores/decks; ahora se resuelve por `createBoardMatchConfig` (pendiente conectar repositorio de historia real en fase 5).
3. `initialDeckFactory.ts` mantiene catálogos/decks mock acoplados al entrenamiento.
4. La persistencia de EXP de cartas se dispara desde hook de UI (`apply-battle-card-experience-action`) en lugar de capa de aplicación de match.
5. El control de rival IA está acoplado al runtime del board y no entra por contrato de modo.

## Plan de mitigación

1. **Fase 0 (completada)**: contratos de match desacoplado + fábrica inicial.
2. **Fase 1 (parcial completada)**: política de recompensas por modo desacoplada en `core/services/match/rewards`.
3. **Fase 1 (completada)**: runtime extraído de `useBoard` a `useMatchRuntime` + `useMatchUiState` + `useMatchProgression` + `useMatchAudio`.
4. **Fase 2 (completada)**: controllers por modo (`Training`, `Story`, `Tutorial`, `Multiplayer`) con misma interfaz.
5. **Fase 3 (completada)**: persistencia post-duelo movida a servicio de aplicación por modo.
6. **Fase 4 (completada)**: hardcodes de jugadores/decks retirados del board y resueltos por configuración de match.
7. **Fase 5 (completada)**: `IOpponentRepository` conectado a tablas Story y mapa/duelos operativos sin hardcode en UI.
8. **Fase 6**: añadir flujo de capítulo/cinemáticas y tuning de IA por oponente (`ai_profile`) en runtime de combate.

## Criterios de salida de deuda (combate)

1. `Board` solo renderiza y delega eventos a un controller.
2. Ningún modo de combate depende de hardcodes de rival/nombres/deck en UI.
3. `GameEngine` permanece puro y reusable en todos los modos.
4. Pruebas por modo (`training/story/tutorial/multiplayer`) con contrato común de match.
