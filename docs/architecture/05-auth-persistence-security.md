<!-- docs/architecture/05-auth-persistence-security.md - Fronteras de auth/persistencia y decisiones de hardening de seguridad. -->
# Auth, Persistencia y Seguridad

## Frontera de autenticación

1. Contrato de auth en `core/repositories/IAuthRepository`.
2. Implementación Supabase en `infrastructure/persistence/supabase`.
3. La UI consume acciones/casos de uso, no SDK directo.

## Persistencia

1. Repositorios por subdominio (perfil, progreso, deck, colección, wallet, transacciones).
2. Endpoints de `app/api/*` finos, sin lógica de dominio incrustada.
3. Supabase + RLS como backend principal, con adaptadores desacoplados.

## Hardening aplicado

1. Validaciones de seguridad en APIs de auth (origen/rate-limit, según módulo).
2. En lectura de sesión actual se prioriza `auth.getUser()` para datos de usuario autenticados.
3. Errores tipados y mensajes controlados en capa de aplicación.

## Referencias

1. `docs/security/auth-hardening.md`
2. `docs/adr/ADR-0001-auth-persistence-boundary.md`
3. `docs/supabase/README.md`
