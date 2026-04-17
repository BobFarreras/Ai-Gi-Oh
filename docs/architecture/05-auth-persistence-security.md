<!-- docs/architecture/05-auth-persistence-security.md - Fronteras de auth/persistencia y decisiones de hardening de seguridad. -->
# Auth, Persistencia y Seguridad

## Frontera de autenticación

1. Contrato de auth en `core/repositories/IAuthRepository`.
2. Implementación Supabase en `infrastructure/persistence/supabase`.
3. La UI consume cliente HTTP (`services/auth/auth-http-client`) y casos de uso, no SDK directo.
4. Recuperación de contraseña en dos pasos:
   - `POST /api/auth/recover` para emitir enlace.
   - `GET /auth/callback` para canjear `code` y fijar sesión antes de `/reset-password`.

## Persistencia

1. Repositorios por subdominio (perfil, progreso, deck, colección, wallet, transacciones).
2. Endpoints de `app/api/*` finos, sin lógica de dominio incrustada.
3. Supabase + RLS como backend principal, con adaptadores desacoplados.

## Hardening aplicado

1. Validaciones de seguridad en APIs de auth (origen/rate-limit, según módulo).
2. En lectura de sesión actual se prioriza `auth.getUser()` para datos de usuario autenticados.
3. Errores tipados y mensajes controlados en capa de aplicación.
4. Endpoints `api/admin/*` con autorización server-side sobre `admin_users`, mutaciones con rate-limit por usuario/IP y auditoría en `admin_audit_log`.
5. Portal admin con `robots noindex` y respuestas API `no-store` para reducir exposición accidental.
6. Observabilidad admin vía `GET /api/admin/audit` y panel read-only de auditoría con filtros/paginación.
7. `GET /auth/callback` sanitiza `next` y bloquea rutas protocol-relative (`//`), barras invertidas y saltos de línea para evitar open redirect.
8. Cierre de duelos `Story/Training` protegido con `completionTicket` firmado en servidor y validado en API para impedir payloads arbitrarios de recompensa.
9. Mutaciones de saldo Nexus migradas a RPC atómicas (`wallet_debit_nexus`, `wallet_credit_nexus`) para reducir carreras en compras/recompensas concurrentes.
10. Registro de resultado Story endurecido con RPC atómica (`story_register_duel_result`) para evitar doble recompensa de primera victoria en concurrencia.
11. Claim final tutorial endurecido con RPC atómica (`tutorial_claim_final_reward_nexus`) para evitar estado parcial (claim persistido sin crédito aplicado).

## Referencias

1. `docs/security/auth-hardening.md`
2. `docs/adr/ADR-0001-auth-persistence-boundary.md`
3. `docs/supabase/README.md`
