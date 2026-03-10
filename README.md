<!-- README.md - Guía principal del proyecto AI-GI-OH con arquitectura, calidad y rutas de documentación activas. -->
# AI-GI-OH!

<div align="center">

Juego táctico de cartas en **Next.js 16 + React 19 + TypeScript estricto**,
con motor desacoplado, reglas de dominio tipadas y foco en rendimiento móvil.

</div>

## Estado del proyecto

| Área | Estado actual | Fuente |
| --- | --- | --- |
| Arquitectura modular | Activa por capas (`components -> services/use-cases -> core`) | `docs/architecture/*` |
| Motor de juego | Documentación dividida por subdominios | `docs/game-engine/*` |
| Rendimiento móvil | Baseline automatizable (dev/prod) + fases iterativas | `docs/performance/*` |
| Seguridad auth/persistencia | Hardening aplicado en sesión/usuario | `docs/security/auth-hardening.md` |
| Calidad de merge | Gates obligatorios en CI/local | `Agents.md` |

## Stack técnico

1. Next.js 16 (App Router)
2. React 19
3. TypeScript estricto
4. Zustand (estado UI reactivo por slices)
5. Vitest + React Testing Library
6. ESLint
7. Supabase (`@supabase/ssr` + `@supabase/supabase-js`)

## Arranque rápido

```bash
pnpm install
pnpm dev
```

Aplicación local:

1. `http://localhost:3000/`
2. `http://localhost:3000/hub`

## Comandos de ingeniería

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm quality:check
```

## Comandos de baseline de rendimiento

```bash
pnpm perf:baseline:mobile
pnpm perf:baseline:mobile:realistic
pnpm perf:baseline:mobile:stress
pnpm perf:baseline:mobile:auto
pnpm perf:baseline:mobile:auto:prod
```

## Arquitectura en una vista

```text
src/components        -> UI y eventos
src/services          -> orquestación de aplicación
src/core/use-cases    -> flujos/reglas de aplicación
src/core/entities     -> contratos de dominio
src/infrastructure    -> adaptadores externos (Supabase, repositorios)
```

Regla de dependencia: `components -> services/use-cases -> core`.

## Mapa de documentación

### Núcleo de arquitectura

1. [Architecture.md](./Architecture.md)
2. [docs/architecture/README.md](./docs/architecture/README.md)

### Motor de juego (nuevo índice modular)

1. [MOTOR_JUEGO.md](./MOTOR_JUEGO.md)
2. [docs/game-engine/README.md](./docs/game-engine/README.md)

### Rendimiento

1. [docs/performance/README.md](./docs/performance/README.md)
2. [docs/performance/PHASE-1-BASELINE.md](./docs/performance/PHASE-1-BASELINE.md)

### Seguridad y persistencia

1. [docs/security/auth-hardening.md](./docs/security/auth-hardening.md)
2. [docs/supabase/README.md](./docs/supabase/README.md)

### Refactor y deuda técnica

1. [docs/refactor/GUIA-REFAC-STEP-BY-STEP.md](./docs/refactor/GUIA-REFAC-STEP-BY-STEP.md)
2. [docs/DEUDA_TECNICA.md](./docs/DEUDA_TECNICA.md)

### Guías por módulo en `src/`

1. [src/app/README.md](./src/app/README.md)
2. [src/components/hub/README.md](./src/components/hub/README.md)
3. [src/components/game/board/README.md](./src/components/game/board/README.md)
4. [src/core/use-cases/game-engine/README.md](./src/core/use-cases/game-engine/README.md)
5. [src/services/README.md](./src/services/README.md)
6. [src/infrastructure/README.md](./src/infrastructure/README.md)

## Criterios de merge

1. `pnpm lint` en verde.
2. `pnpm typecheck` en verde.
3. `pnpm test:coverage` en verde.
4. `pnpm build` en verde.
5. Sin warnings nuevos.
6. Documentación actualizada en español cuando cambie arquitectura o comportamiento.
