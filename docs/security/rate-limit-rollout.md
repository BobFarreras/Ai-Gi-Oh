<!-- docs/security/rate-limit-rollout.md - Matriz operativa para activar rate limiting estricto por entorno sin fricción de jugador. -->
# Rollout de Rate Limit Estricto (Auth/Admin)

## Objetivo

Activar endurecimiento de `auth` y `admin` de forma progresiva, minimizando falsos bloqueos en jugadores.

## Variables implicadas

1. `UPSTASH_REDIS_REST_URL`
2. `UPSTASH_REDIS_REST_TOKEN`
3. `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS`
4. `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED`
5. `AUTH_RATE_LIMIT_FAIL_CLOSED`
6. `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED`
7. `ADMIN_RATE_LIMIT_FAIL_CLOSED`

## Matriz recomendada por entorno

### Desarrollo local

1. `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=false`
2. `AUTH_RATE_LIMIT_FAIL_CLOSED=false`
3. `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=false`
4. `ADMIN_RATE_LIMIT_FAIL_CLOSED=false`
5. `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS=1200`

Motivo:
1. Prioriza productividad local y evita bloquear al equipo por ausencia de Redis.

### Staging

1. `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=true`
2. `AUTH_RATE_LIMIT_FAIL_CLOSED=false`
3. `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=true`
4. `ADMIN_RATE_LIMIT_FAIL_CLOSED=true`
5. `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS=900`

Motivo:
1. Endurece admin desde el inicio y valida comportamiento de auth con menor riesgo de fricción.

### Producción (fase final)

1. `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=true`
2. `AUTH_RATE_LIMIT_FAIL_CLOSED=true`
3. `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=true`
4. `ADMIN_RATE_LIMIT_FAIL_CLOSED=true`
5. `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS=700-1000` (ajustar según latencia real)

Motivo:
1. Máxima protección ante bypass y abuso en entorno público multi-instancia.

## Plan de activación profesional

1. Fase A:
   - activar modo estricto completo solo en admin.
   - monitorizar errores de backend distribuido y tiempos de respuesta.
2. Fase B:
   - activar `require distributed` en auth con `fail closed=false`.
   - vigilar tasa de `429` y picos de errores en login/register.
3. Fase C:
   - activar `fail closed=true` en auth cuando la estabilidad del backend sea consistente.

## Comprobación automática antes de deploy

1. Validación genérica del entorno actual:
   - `pnpm security:rate-limit:check`
2. Validación de plantilla de staging:
   - `pnpm security:rate-limit:check:staging`
3. Validación de plantilla de producción:
   - `pnpm security:rate-limit:check:production`
4. Validación de un archivo concreto:
   - `node scripts/security/check-rate-limit-env.mjs --target=production --env-file=.env.production`

## Métricas mínimas de control

1. Ratio de `429` en `/api/auth/login` y `/api/auth/register`.
2. Ratio de `403` por validación de origen en mutaciones.
3. Latencia p95/p99 de endpoints de auth.
4. Errores de conexión/timeouts hacia Upstash.

## Señales de rollback inmediato

1. Aumento anómalo de fallos de login en usuarios legítimos.
2. Tasa de `429` significativamente superior al baseline histórico.
3. Degradación sostenida de latencia en auth/admin por dependencia externa.

## Rollback rápido (sin redeploy de código)

1. Mantener `*_REQUIRE_DISTRIBUTED=true`.
2. Cambiar temporalmente:
   - `AUTH_RATE_LIMIT_FAIL_CLOSED=false`
   - `ADMIN_RATE_LIMIT_FAIL_CLOSED=false` (solo si hay impacto operativo severo)
3. Ajustar `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS` a `1200-1500` mientras se estabiliza el proveedor.

## Checklist de cierre para TFM

1. Variables de producción definidas y verificadas.
2. Evidencia de métricas pre/post activación archivada.
3. Simulación de rollback probada en staging.
4. Documento de decisión guardado en Engram con fecha y resultado.
