<!-- docs/audits/2026-03-12-auditoria-general-seguridad-calidad.md - Auditoría general del proyecto con hallazgos priorizados y plan profesional de remediación por fases. -->
# Auditoría general - Seguridad, deuda técnica y calidad

## 1. Alcance y método
- Fecha: 12 de marzo de 2026.
- Alcance: `src/`, `src/app/api/`, `src/services/auth/api/`, configuración de build y checks del proyecto.
- Método:
  - `pnpm audit --prod`
  - `pnpm lint`
  - `pnpm test`
  - búsqueda estática de patrones de riesgo (`eval`, `dangerouslySetInnerHTML`, secretos, TODO/FIXME, etc.)
  - revisión manual de rutas API, auth, rate limiting y manejo de errores.

## 2. Estado actual (snapshot)
- Dependencias: `pnpm audit --prod` sin vulnerabilidades conocidas.
- Calidad base:
  - `pnpm lint` en verde.
  - `pnpm test` en verde.
- Observación: existe base sólida de testing, pero hay riesgos arquitectónicos y de seguridad operacional en capa API/auth.

## 3. Hallazgos priorizados

### Alto - Rate limiting no distribuido y fácil de eludir
- Evidencia:
  - `src/services/auth/api/security/auth-rate-limiter.ts`
  - `src/services/auth/api/internal/get-auth-fingerprint.ts`
  - `src/services/auth/api/handle-logout-request.ts`
- Riesgo:
  - El limiter está en memoria local del proceso. En despliegues con múltiples instancias/serverless no comparte estado.
  - La IP se toma de cabeceras (`x-forwarded-for`, `x-real-ip`) sin normalización de proxy de confianza en app code.
  - Resultado: mitigación parcial de fuerza bruta y posible bypass de límites.

### Alto - Protección CSRF inconsistente en endpoints mutables
- Evidencia:
  - validación de origen implementada en auth:
    - `src/services/auth/api/security/validate-auth-origin.ts`
  - endpoints mutables de negocio (deck/market/story/progression) no usan el mismo control:
    - `src/app/api/home/deck/add/route.ts`
    - `src/app/api/market/buy-card/route.ts`
    - `src/app/api/story/duels/complete/route.ts`
    - `src/app/api/game/progression/apply-battle-exp/route.ts`
- Riesgo:
  - Acciones con estado dependen de cookies de sesión.
  - Sin política CSRF unificada (Origin/Referer + token), se aumenta superficie de ataque cross-site.

### Medio - Validación de payloads HTTP heterogénea
- Evidencia:
  - múltiples rutas hacen cast directo de `request.json()`:
    - `src/app/api/home/deck/add/route.ts`
    - `src/app/api/home/deck/add-slot/route.ts`
    - `src/app/api/market/buy-pack/route.ts`
    - `src/app/api/story/world/interact/route.ts`
- Riesgo:
  - Contratos de entrada no centralizados.
  - Mayor probabilidad de errores de runtime y comportamientos ambiguos ante payloads inválidos.

### Medio - Mapeo de errores HTTP demasiado plano (400 para casi todo)
- Evidencia:
  - patrón repetido en rutas API con fallback `400` ante errores inesperados.
  - ejemplo: `src/app/api/market/buy-card/route.ts`, `src/app/api/home/deck/save/route.ts`, `src/app/api/story/duels/complete/route.ts`.
- Riesgo:
  - Se pierde separación entre error de cliente (`4xx`) y fallo interno (`5xx`).
  - Dificulta observabilidad y triage de incidencias en producción.

### Medio - Deuda SRP/tamaño en módulos puntuales
- Evidencia:
  - `src/app/api/story/duels/complete/route.ts` (~169 líneas y varias responsabilidades).
  - `src/components/hub/story/StoryScene.tsx` (~180 líneas).
  - `src/components/hub/story/StoryCircuitMap.tsx` (~175 líneas).
- Riesgo:
  - Mantenibilidad más baja, mayor fricción de onboarding y mayor probabilidad de regresiones al tocar flujos complejos.

## 4. Guía paso a paso de remediación (profesional)

## Fase 0 - Preparación (1 día)
1. Crear checklist de hardening por PR:
   - seguridad API
   - contratos de entrada
   - errores/observabilidad
2. Añadir issue/epic por cada hallazgo con criterio de aceptación.
3. Mantener gates obligatorios: `lint`, `test`, `build`.

## Fase 1 - Seguridad API/Auth (prioridad máxima)
1. Sustituir rate limiter en memoria por almacenamiento compartido (Redis/Upstash o equivalente).
2. Introducir helper único de identidad cliente para rate limit:
   - normalizar IP desde headers confiables de plataforma
   - fallback seguro cuando no exista IP confiable
3. Aplicar protección CSRF homogénea en **todas** las rutas mutables:
   - política `Origin/Referer` obligatoria
   - opcional recomendado: token CSRF double-submit para operaciones sensibles
4. Añadir tests de seguridad para:
   - bloqueo por límite excedido (multi-intento)
   - rechazo por origen no confiable
   - aceptación por origen válido

Criterio de aceptación Fase 1:
- Sin limiter local en memoria para auth.
- Endpoints `POST` de negocio protegidos por política CSRF común.
- Tests específicos de seguridad en verde.

## Fase 2 - Contratos de entrada y validación (1-2 días)
1. Definir esquemas de request por endpoint (Zod o validadores equivalentes).
2. Eliminar casts directos de `request.json()` en rutas.
3. Crear utilitario común `parseRequestOrThrow` con errores de validación consistentes.
4. Añadir tests de contrato por endpoint:
   - payload vacío
   - tipos inválidos
   - campos desconocidos/opcionales

Criterio de aceptación Fase 2:
- Todos los payloads mutables validados por esquema.
- Error de contrato consistente (`422` recomendado para validación semántica).

## Fase 3 - Error handling y observabilidad (1 día)
1. Crear mapper central `AppError -> HTTP status`.
2. Unificar respuesta de error con `code`, `message`, `traceId`.
3. Reservar `500` para errores no controlados.
4. Integrar telemetría de errores (Sentry/OpenTelemetry o equivalente).

Criterio de aceptación Fase 3:
- Eliminados fallbacks genéricos a `400` para excepciones internas.
- Incidencias internas trazables con identificador.

## Fase 4 - Deuda técnica/SRP incremental (continuo)
1. Dividir `story/duels/complete/route.ts` en submódulos:
   - parser/validator
   - orquestación de progreso
   - rewards
   - respuesta HTTP
2. Dividir `StoryScene.tsx` y `StoryCircuitMap.tsx` en subcomponentes/hooks internos.
3. Aplicar regla de tamaño por archivo (<=150 líneas) salvo excepción documentada.

Criterio de aceptación Fase 4:
- Módulos críticos con una responsabilidad clara.
- PRs con menor tamaño y menor acoplamiento cruzado.

## 5. Orden recomendado de ejecución
1. Fase 1 (seguridad)  
2. Fase 2 (contratos)  
3. Fase 3 (errores/observabilidad)  
4. Fase 4 (SRP/UI debt)

## 6. Comandos de verificación al cerrar cada subfase
```bash
pnpm lint
pnpm test
pnpm build
pnpm audit --prod
```

## 7. Nota profesional
- Esta auditoría es estática/técnica sobre código y configuración; no sustituye pentest externo ni revisión de infraestructura (WAF, CDN, cabeceras edge, secretos en CI/CD, políticas RLS de Supabase).
