<!-- e2e/README.md - Guía mínima para ejecutar la suite E2E de Playwright en local y en modo visual. -->
# E2E con Playwright

## Requisitos
- Dependencia `@playwright/test` instalada.
- Navegadores instalados con:
  - `pnpm exec playwright install`

## Comandos principales
- `pnpm test:e2e`: ejecuta la suite E2E en headless.
- `pnpm test:e2e:headed`: ejecuta en modo visible (ventana abierta).
- `pnpm test:e2e:ui`: abre el runner interactivo de Playwright.

## Flujos base implementados
- `e2e/auth/register-onboarding-tutorial.spec.ts`
  - abre landing y fuerza showcase,
  - registra usuario efímero nuevo,
  - valida acceso a `/hub`,
  - navega a `/hub/academy/tutorial`,
  - borra usuario efímero al finalizar.
- `e2e/auth/login-standard-user.spec.ts`
  - inicia sesión con usuario estándar reusable,
  - valida acceso a `/hub`.
- `e2e/combat/combat-arena-core-flow.spec.ts`
  - entra a `/hub/academy/training/arena`,
  - valida toggles de `pause`, `mute`, `auto` y apertura/cierre de `combat log`,
  - prueba invocación base y secuencia de ataque cuando el estado de partida lo permite.

## Credenciales y limpieza
- Usuario estándar (para market/home/combat):
  - `E2E_STANDARD_EMAIL` (default: `a@test.com`)
  - `E2E_STANDARD_PASSWORD` (default: `12345678`)
- Limpieza de usuario efímero de onboarding:
  - `E2E_SUPABASE_URL` (o `NEXT_PUBLIC_SUPABASE_URL`)
  - `E2E_SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SERVICE_ROLE_KEY`)

## Nota de entorno
- Por defecto Playwright levanta `pnpm dev` y prueba `http://127.0.0.1:3000`.
- Si quieres apuntar a un entorno ya levantado:
  - `E2E_BASE_URL=http://127.0.0.1:3000 pnpm test:e2e`
