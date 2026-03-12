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

## 3. Hallazgos priorizados

### Alto
- Validaciones de precondición duplicadas entre acciones de juego de carta:
  - `play-card.ts` valida `pendingTurnAction`, turno activo y fase (`MAIN_1`).
  - `play-card-with-zone-replacement.ts` repite las mismas validaciones.
  - Riesgo: divergencia de reglas en futuras modificaciones.

### Medio
- Generación de IDs no determinista en dominio:
  - `play-card.ts` crea `instanceId` con `Date.now()` y `Math.random()`.
  - `logging/combat-log.ts` crea `event.id` con `Date.now()` y `Math.random()`.
  - Riesgo: tests menos deterministas y menor trazabilidad reproducible.

- Archivos de test de integración con alta densidad de escenarios:
  - `actions/play-and-execution.integration.test.ts` (~182 líneas).
  - `combat/combat-and-phase.integration.test.ts` (~184 líneas).
  - `effects/trap-triggers.integration.test.ts` (~251 líneas).
  - Riesgo: mantenimiento costoso y diagnóstico lento cuando falla un bloque grande.

### Bajo
- Cabeceras con descripción genérica en algunos módulos (`Descripción breve del módulo`) reducen contexto rápido de PR.

## 4. Plan incremental recomendado (sin big-bang)
1. Extraer un guard reutilizable de precondiciones de acción (`assertMainPhaseActionAllowed`) y aplicarlo en `play-card*`.
2. Introducir fábrica de IDs inyectable para `instanceId` y `combatLog` (por defecto aleatoria, en tests determinista).
3. Dividir tests de integración largos en suites por comportamiento (turno, combate, trampas, transición de fase).
4. Ejecutar `pnpm lint`, `pnpm test`, `pnpm build` al cerrar cada subfase.
