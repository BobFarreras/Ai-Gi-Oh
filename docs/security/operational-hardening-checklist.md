<!-- docs/security/operational-hardening-checklist.md - Checklist operativo de secretos y permisos para cierre de hardening en staging/producción. -->
# Checklist Operacional de Hardening (Fase 6)

## Objetivo

1. Cerrar riesgos de exposición de secretos y sobredimensionamiento de permisos antes de defensa TFM.

## Verificaciones ejecutables en repositorio

1. Confirmar que los `.env` locales no se versionan:
   - `git check-ignore .env.local`
2. Confirmar que solo existen plantillas versionadas:
   - `git ls-files ".env*"`
   - esperado: `.env.example`, `.env.staging.example`, `.env.production.example`.
3. Buscar posibles secretos hardcodeados en código y documentación:
   - `rg -n "SUPABASE_SERVICE_ROLE_KEY|UPSTASH_REDIS_REST_TOKEN|BEGIN PRIVATE KEY|ghp_|sk_live|sk_test" -S`
   - esperado: referencias a nombres de variable, sin valores reales.

## Variables requeridas en Vercel

1. `NEXT_PUBLIC_SUPABASE_URL`
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. `SUPABASE_SERVICE_ROLE_KEY`
4. `UPSTASH_REDIS_REST_URL`
5. `UPSTASH_REDIS_REST_TOKEN`
6. `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED`
7. `AUTH_RATE_LIMIT_FAIL_CLOSED`
8. `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED`
9. `ADMIN_RATE_LIMIT_FAIL_CLOSED`
10. `SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS`

## Rotación de `SUPABASE_SERVICE_ROLE_KEY` (operación manual)

1. Generar nueva clave `service_role` en Supabase.
2. Actualizar la variable en Vercel (`staging` y `production`).
3. Redeploy inmediato tras actualización.
4. Invalidar y retirar la clave anterior.
5. Registrar fecha/hora de rotación en bitácora técnica del proyecto.

## Revisión de permisos/RLS en Supabase

1. Validar que solo rutas/admin jobs usan `SUPABASE_SERVICE_ROLE_KEY`.
2. Confirmar que clientes de usuario usan `anon key` + políticas RLS.
3. Revisar tablas de dominio crítico (perfil, progreso, inventario, mercado, historia):
   - `SELECT`: solo filas del propietario o reglas explícitas de lectura pública.
   - `INSERT/UPDATE/DELETE`: negar por defecto y permitir por política mínima.
4. Verificar que no hay políticas `USING (true)` o `WITH CHECK (true)` en tablas sensibles.
5. Confirmar que funciones RPC sensibles no quedan expuestas a rol `anon`.

## Evidencia mínima para PR final

1. Captura/config export de variables en Vercel sin mostrar valores.
2. Resultado de `pnpm security:rate-limit:check:staging`.
3. Resultado de `pnpm security:rate-limit:check:production`.
4. Confirmación escrita de rotación de `SUPABASE_SERVICE_ROLE_KEY` (si aplica).
5. Resultado `lint`, `test`, `build`, `audit` en verde.
