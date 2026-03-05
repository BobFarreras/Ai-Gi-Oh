<!-- docs/security/auth-hardening.md - Medidas de seguridad implementadas en autenticación para fase 1.2. -->
# Auth Hardening (Fase 1.2)

## Objetivo

Reducir superficie de ataque en login/registro/logout antes de integrar base de datos de dominio y progreso.

## Medidas aplicadas

1. Endpoints dedicados:
   - `POST /api/auth/login`
   - `POST /api/auth/register`
   - `POST /api/auth/logout`
2. Validación de origen:
   - Se compara `Origin` con `Host`/`x-forwarded-host`.
   - Si no coincide, se responde `403`.
3. Rate limiting:
   - Login: límite por IP y por email.
   - Register: límite por IP y por email.
   - Logout: límite por IP.
4. Manejo de errores:
   - Mensajes controlados para cliente.
   - Evita filtrar detalles internos del proveedor.

## Notas de producción

1. En desarrollo local puede usarse `http://localhost`.
2. En producción se exige HTTPS (TLS) para cifrado de credenciales en tránsito.
3. El rate limiter actual es en memoria y debe sustituirse por almacenamiento distribuido (Redis) en despliegues multi-instancia.
