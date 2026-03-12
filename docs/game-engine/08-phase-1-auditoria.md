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

## 3. Hallazgos priorizados

### Medio
- Archivos de test de integración con alta densidad de escenarios:
  - `actions/play-and-execution.integration.test.ts` (~182 líneas).
  - `combat/combat-and-phase.integration.test.ts` (~184 líneas).
  - Riesgo: mantenimiento costoso y diagnóstico lento cuando falla un bloque grande.

### Bajo
- Cabeceras con descripción genérica en algunos módulos (`Descripción breve del módulo`) reducen contexto rápido de PR.

## 4. Plan incremental recomendado (sin big-bang)
1. Introducir fábrica de IDs inyectable para `instanceId` y `combatLog` (por defecto aleatoria, en tests determinista).
2. Dividir tests de integración largos restantes en suites por comportamiento (turno, combate, transición de fase).
3. Reemplazar cabeceras genéricas por descripciones de responsabilidad real en módulos de `state/` y `combat/internal`.
4. Ejecutar `pnpm lint`, `pnpm test`, `pnpm build` al cerrar cada subfase.
