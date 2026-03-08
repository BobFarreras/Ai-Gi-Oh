<!-- docs/adr/2026-03-08-turn-mode-guards.md - ADR del modo automático de turno y guardas de avance para UX de combate. -->
# ADR: Auto Mode + Guardas de Avance de Fase

## Contexto

El flujo de turnos necesitaba dos mejoras de UX:

1. Auto-pase inteligente sin cortar acciones disponibles.
2. Confirmaciones cuando el jugador intenta saltar fase con acciones aún posibles.

## Decisión

1. Se introduce `core/services/turn/turn-decision.ts` como módulo puro de reglas.
2. Se activa `Auto Mode` configurable desde HUD (`board-auto-phase` en `localStorage`).
3. Se introduce ayuda de avance (`board-turn-help` en `localStorage`) con diálogo de confirmación y opción "no volver a mostrar".
4. Se desacopla la lógica en hooks:
   - `useAutoAdvanceBattle`
   - `useAdvancePhaseGuard`

## Consecuencias

1. Se reduce ambigüedad del turno para el usuario.
2. El comportamiento es predecible y testeable (unit + integración).
3. El tablero mantiene SRP y evita crecer como módulo GOD.
