<!-- docs/game-engine/08-phase-1-auditoria.md - Auditoría inicial de Fase 1 del game-engine con hallazgos y plan incremental de refactor. -->
# Auditoría Fase 1 - game-engine

## 1. Alcance auditado
- `src/core/use-cases/game-engine/actions`
- `src/core/use-cases/game-engine/phases`
- `src/core/use-cases/game-engine/combat`
- `src/core/use-cases/game-engine/effects`
- `src/core/use-cases/game-engine/logging`

## 2. Cambio aplicado en esta fase
- Se eliminó duplicación del flujo de robo de carta extrayendo `drawTopDeckCard` en `state/player-utils.ts`.
- Se reemplazó el fallback silencioso de `resolve-pending-turn-action` por error explícito para tipos no soportados.
- Se extrajo guard reutilizable `assertMainPhaseActionAllowed` para centralizar precondiciones de `play-card*`.
- Se dividió `effects/trap-triggers.integration.test.ts` en suites separadas de ataque y ejecución con fixtures compartidas.
- Se introdujo `idFactory` opcional en `GameState` para generar IDs/timestamps deterministas en `play-card`, `combat-log`, fusión y revive.
- Se dividió `combat/combat-and-phase.integration.test.ts` en suites de combate y transición de fase con fixtures compartidas.
- Se reemplazaron cabeceras genéricas por descripciones específicas en módulos de `game-engine`.
- Se dividió `actions/play-and-execution.integration.test.ts` en suites específicas de reglas de juego, ejecución/trampas y cambio de modo.
- Se extrajeron fixtures transversales para `effects/` y `phases/` y se añadieron pruebas de error para `resolveExecution` y `resolvePendingTurnAction`.
- Se consolidaron validaciones repetidas de turno/fase para flujos de fusión y se simplificó `resolve-pending-turn-action` mediante resolvers internos por tipo.
- Se unificó la construcción de `pendingTurnAction` con fábrica dedicada para descartar, seleccionar materiales y selección de cementerio.
- Se añadieron pruebas negativas de límites de fase/turno para `start-fusion-summon` y `start-fusion-summon-from-execution`.
- Se extrajeron handlers internos de acciones especiales en `resolve-execution` para reducir branching y centralizar la orquestación.
- Se consolidaron fixtures base de `IPlayer`/`GameState` en `test-support/state-fixtures.ts` y se reutilizaron en suites de `combat`, `fusion`, `effects`, `phases` y `logging`.

## 3. Hallazgos priorizados

### Medio
- Persisten algunos estados inline en pruebas puntuales fuera de los dominios ya consolidados.

## 4. Plan incremental recomendado (sin big-bang)
1. Extender `test-support/state-fixtures.ts` a suites aisladas con estado inline restante para terminar de homogeneizar pruebas.
2. Ejecutar `pnpm lint`, `pnpm test`, `pnpm build` al cerrar cada subfase.
