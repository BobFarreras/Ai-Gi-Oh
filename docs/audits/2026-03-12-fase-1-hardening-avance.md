<!-- docs/audits/2026-03-12-fase-1-hardening-avance.md - Registro de avance de la Fase 1 de hardening de seguridad API/auth. -->
# Fase 1 Hardening - Avance inicial

## Objetivo
- Iniciar remediación de seguridad en capa API/auth según la auditoría general.

## Cambios implementados
- Protección de origen homogénea para endpoints mutables:
  - helper común: `src/services/security/api/validate-request-origin.ts`
  - guard reusable: `src/services/security/api/require-trusted-mutation-origin.ts`
  - aplicado en rutas `POST` de `game/progression`, `home/*`, `market/buy-*`, `story/*`.
- Rate limiting preparado para entorno distribuido con fallback local:
  - `src/services/security/api/rate-limit/security-rate-limiter.ts`
  - adaptador auth: `src/services/auth/api/security/auth-rate-limiter.ts`
  - soporte opcional Upstash REST (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Reuso de política de origen en auth:
  - `src/services/auth/api/security/validate-auth-origin.ts` ahora delega en helper común.

## Tests añadidos
- `src/services/security/api/validate-request-origin.test.ts`
- `src/services/security/api/rate-limit/security-rate-limiter.test.ts`

## Validación ejecutada
- `pnpm eslint src/services/security src/services/auth src/app/api`
- `pnpm vitest run src/services/security/api src/app/api/auth`
- `pnpm build`

## Estado de Fase 1
- Completado en este avance:
  - protección de origen homogénea en mutaciones
  - base de rate limiting distribuido con degradación segura
- Pendiente para cerrar Fase 1 completa:
  - ampliar tests de origen/abuso para rutas mutables de negocio (`home`, `market`, `story`, `progression`)
  - definir política de despliegue de proxy confiable para identidad IP en producción (documentada por entorno)
