<!-- docs/adr/ADR-0001-auth-persistence-boundary.md - Decisión arquitectónica para aislar Auth/BD del dominio y la UI. -->
# ADR-0001: Frontera de Auth y Persistencia

## Estado

Aprobado.

## Contexto

El proyecto está migrando de repositorios mock (`InMemory*`) a autenticación y base de datos reales.
Si la UI o los casos de uso se acoplan a Supabase, el cambio de proveedor en futuro será caro y riesgoso.

## Decisión

1. `core/` define contratos y entidades de Auth/Perfil/Progreso.
2. `app/` y `components/` no pueden importar SDKs de BD/Auth.
3. Adaptadores concretos de proveedor viven en infraestructura:
   - `src/infrastructure/persistence/supabase/`
   - `src/infrastructure/database/`
4. La aplicación consume solo interfaces (`core/repositories/*`) y casos de uso.
5. La configuración sensible se resuelve en servidor, nunca en cliente.

## Consecuencias

1. Cambiar proveedor (Supabase -> otro) requiere reemplazar adaptadores, no tocar UI ni dominio.
2. Se reduce deuda técnica y riesgo de fugas de credenciales en frontend.
3. Se incrementa el trabajo inicial de wiring/DI, pero mejora mantenibilidad.

## Reglas de implementación

1. No usar `service_role` fuera de entorno servidor.
2. RLS obligatoria para datos por jugador cuando se creen tablas.
3. Validación de entrada en casos de uso (no confiar en cliente).
