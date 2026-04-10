<!-- docs/security/auth-hardening.md - Medidas de seguridad implementadas en autenticación y política de rate limiting estricto por entorno. -->
# Auth Hardening (Fase 1.2 + Fase 2)

## Objetivo

Reducir superficie de ataque en login/registro/logout antes de integrar base de datos de dominio y progreso.

## Qué va en `next.config.ts` y qué no

1. `next.config.ts` sirve para políticas globales estáticas (ej. headers HTTP globales, redirects, configuración de build).
2. La validación CSRF por `Origin` y el rate limiting de login/register/logout deben ejecutarse en runtime de API porque dependen de cada request (IP, email, estado del backend distribuido, límites por ruta).
3. Conclusión práctica:
   - `next.config.ts`: endurecimiento global de cabeceras.
   - handlers/services API: lógica de seguridad contextual y anti-abuso.

## Medidas aplicadas

1. Endpoints dedicados:
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `POST /api/auth/logout`
   - `POST /api/auth/recover`
   - `POST /api/auth/update-password`
   - `GET /auth/callback` (canje server-side de código de recuperación)
2. Validación de origen:
   - Se compara `Origin` con `Host`/`x-forwarded-host`.
   - Si no coincide, se responde `403`.
   - `Origin` ausente se rechaza por defecto en mutaciones protegidas.
   - Solo se permite `Origin` ausente con excepción explícita (`allowMissingOrigin`) para integraciones internas controladas.
3. Rate limiting:
   - Login: límite por IP y por email.
   - Register: límite por IP y por email.
   - Logout: límite por IP.
   - Soporte de backend distribuido (Upstash Redis REST) con timeout configurable.
   - Modo estricto opcional por entorno (`require distributed` + `fail closed`).
4. Manejo de errores:
   - Mensajes controlados para cliente.
   - Evita filtrar detalles internos del proveedor.

## Notas de producción

1. En desarrollo local puede usarse `http://localhost`.
2. En producción se exige HTTPS (TLS) para cifrado de credenciales en tránsito.
3. Configurar callback de recuperación en Supabase Auth:
   - `http://localhost:3000/auth/callback`
   - `https://ai-gi-ho.vercel.app/auth/callback`
4. En despliegues multi-instancia debe configurarse backend distribuido:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Variables de endurecimiento:
   - `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED`
   - `AUTH_RATE_LIMIT_FAIL_CLOSED`
   - `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED`
   - `ADMIN_RATE_LIMIT_FAIL_CLOSED`
   - `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS`

## Riesgo de fricción y mitigación (jugador)

1. Sí, activar `fail-closed` puede provocar `429/403` falsos si el backend distribuido está degradado.
2. Mitigaciones aplicadas:
   - timeout corto configurable para cortar esperas largas (`SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS`).
   - activación por flags para desplegar por fases.
3. Estrategia recomendada de rollout:
   - fase A: activar estricto solo en `/api/admin/*`.
   - fase B: activar en auth de staging y monitorizar ratio de `429`.
   - fase C: activar auth en producción cuando latencia/error de Redis sea estable.
