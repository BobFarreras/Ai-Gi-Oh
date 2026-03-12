<!-- docs/audits/2026-03-12-fase-3-error-handling-avance.md - Registro de avance de la Fase 3 para normalización de errores HTTP y trazabilidad. -->
# Fase 3 - Error handling y observabilidad (avance)

## Objetivo
- Normalizar respuestas de error API con contrato estable (`code`, `message`, `traceId`) y separar correctamente errores de negocio (`4xx`) de errores internos (`5xx`).

## Cambios implementados
- Nuevo mapper central de errores:
  - `src/services/security/api/create-api-error-response.ts`
  - mapeo actual:
    - `VALIDATION_ERROR` / `GAME_RULE_ERROR` -> `400`
    - `NOT_FOUND_ERROR` -> `404`
    - error inesperado -> `500` + `INTERNAL_ERROR`
- Test unitario del mapper:
  - `src/services/security/api/create-api-error-response.test.ts`
- Adopción del mapper en rutas mutables:
  - `src/app/api/home/collection/evolve/route.ts`
  - `src/app/api/home/deck/add/route.ts`
  - `src/app/api/home/deck/add-slot/route.ts`
  - `src/app/api/home/deck/remove/route.ts`
  - `src/app/api/home/deck/fusion/add/route.ts`
  - `src/app/api/home/deck/fusion/remove/route.ts`
  - `src/app/api/home/deck/save/route.ts`
  - `src/app/api/market/buy-card/route.ts`
  - `src/app/api/market/buy-pack/route.ts`
  - `src/app/api/game/progression/apply-battle-exp/route.ts`
  - `src/app/api/story/duels/complete/route.ts`
  - `src/app/api/story/world/interact/route.ts`
  - `src/app/api/story/world/move/route.ts`
  - `src/app/api/story/world/reset/route.ts`

## Validación ejecutada
- `pnpm eslint src/app/api src/services/security src/services/auth`
- `pnpm vitest run src/services/security/api src/app/api/auth`
- `pnpm build`

## Estado de Fase 3
- Completado en este avance:
  - contrato uniforme de error y diferenciación 4xx/5xx en endpoints de negocio principales.
- Pendiente para cierre total:
  - añadir integración de `traceId` con telemetría central (Sentry/OTel) para correlación automática.
  - extender la misma política a endpoints GET/lectura cuando aplique por consistencia total.
