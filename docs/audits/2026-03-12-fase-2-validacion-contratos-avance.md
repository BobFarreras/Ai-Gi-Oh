<!-- docs/audits/2026-03-12-fase-2-validacion-contratos-avance.md - Registro de avance de la Fase 2 para validación de contratos HTTP en APIs mutables. -->
# Fase 2 - Validación de contratos HTTP (avance)

## Objetivo
- Reducir casts directos de `request.json()` y centralizar validación de payloads en endpoints mutables.

## Cambios implementados
- Nuevo parser común de body JSON:
  - `src/services/security/api/request-body-parser.ts`
  - utilidades: objeto raíz, string obligatorio, integer obligatorio, array obligatorio.
- Aplicación de parser en rutas con payload:
  - `src/app/api/home/collection/evolve/route.ts`
  - `src/app/api/home/deck/add/route.ts`
  - `src/app/api/home/deck/add-slot/route.ts`
  - `src/app/api/home/deck/remove/route.ts`
  - `src/app/api/home/deck/fusion/add/route.ts`
  - `src/app/api/home/deck/fusion/remove/route.ts`
  - `src/app/api/market/buy-card/route.ts`
  - `src/app/api/market/buy-pack/route.ts`
  - `src/app/api/game/progression/apply-battle-exp/route.ts`
  - `src/app/api/story/world/interact/route.ts`
  - `src/app/api/story/world/move/route.ts`
  - `src/app/api/story/duels/complete/route.ts`

## Tests añadidos
- `src/services/security/api/request-body-parser.test.ts`

## Validación ejecutada
- `pnpm eslint src/app/api src/services/security src/services/auth`
- `pnpm vitest run src/services/security/api src/app/api/auth`
- `pnpm build`

## Estado de Fase 2
- Completado en este avance:
  - parser centralizado y aplicado en los principales endpoints de mutación con payload.
- Pendiente para cierre total:
  - añadir tests de contrato por endpoint (payload vacío/tipo inválido/campo faltante) en `home`, `market`, `story`, `game/progression`.
  - unificar status code de validación (`422`) si se decide política semántica diferenciada.
