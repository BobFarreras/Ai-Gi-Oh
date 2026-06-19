<!-- CONTRIBUTING.md - Guía oficial para contribuir en AI-GI-OH sin usar credenciales privadas del mantenedor. -->
# Contribuir a AI-GI-OH

Gracias por contribuir. Este proyecto está preparado para ejecutarse en local sin exponer claves privadas del entorno de producción.

## Requisitos

1. **Node.js 20+** ([descargar](https://nodejs.org))
2. **pnpm** ([instalación](https://pnpm.io/installation))
3. **Docker Desktop** levantado ([descargar](https://www.docker.com/products/docker-desktop))

## Setup rápido (recomendado)

Ejecuta el asistente interactivo que verifica prerrequisitos y guía cada paso:

```bash
pnpm setup
```

Esto ejecuta automáticamente:
1. `pnpm install`
2. `pnpm approve-builds` (necesario para supabase CLI y playwright)
3. `pnpm supabase:bootstrap:local`
4. `pnpm supabase:env:apply`

## Flujo manual (paso a paso)

Si prefieres hacerlo manualmente:

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Aprobar builds de paquetes nativos

pnpm v10+ bloquea scripts de instalación por defecto. Debes aprobar los paquetes necesarios:

```bash
pnpm approve-builds
```

En el selector, elige:
- **supabase** — necesario para el CLI de Supabase local
- **@playwright/test** — si vas a usar tests e2e
- **@swc/\*** — si aparecen, necesario para build

### 3. Levantar Supabase local

```bash
pnpm supabase:bootstrap:local
```

Esto genera migraciones, levanta contenedores Docker, aplica el esquema y crea `.env.local.supabase`.

**Requisitos:** Docker Desktop corriendo. Puerto 54323 disponible.

### 4. Aplicar variables de entorno

```bash
pnpm supabase:env:apply
```

Esto aplica `.env.local.supabase` sobre `.env.local` (guarda backup automático).

### 5. Arrancar la app

```bash
pnpm dev
```

### URLs locales

| Servicio | URL |
|---|---|
| App | `http://localhost:3000` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Inbucket (emails auth) | `http://127.0.0.1:54324` |

## Troubleshooting

### `pnpm install` falla con `ERR_PNPM_IGNORED_BUILDS`

Ejecuta `pnpm approve-builds` y selecciona los paquetes necesarios. Luego re-ejecuta `pnpm install`.

### `supabase` command not found

El CLI de Supabase no se descargó. Causas posibles:
- No ejecutaste `pnpm approve-builds`
- Sin conexión a internet durante la instalación
- Docker Desktop no está corriendo

Solución: `pnpm approve-builds` → `pnpm install` → reintenta bootstrap.

### Contenedor `supabase_storage` unhealthy

- Verifica que Docker Desktop tiene suficientes recursos (Settings → Resources).
- Verifica que los puertos 54321-54324 no están en uso.
- Reinicia Docker Desktop y reintenta.

### `.env.local.supabase` no existe

El bootstrap falló. Ejecuta: `pnpm supabase:bootstrap:local`

## Flujo manual (debug paso a paso)

```bash
pnpm supabase:prepare:migrations
pnpm supabase:start
pnpm supabase:db:reset:local
pnpm supabase:env:local
pnpm supabase:env:apply
pnpm dev
```

## Qué hace cada comando

| Comando | Descripción |
|---|---|
| `supabase:prepare:migrations` | Transforma `docs/supabase/sql/*.sql` en migraciones ejecutables |
| `supabase:start` | Levanta contenedores Docker de Supabase |
| `supabase:db:reset:local` | Recrea la DB local y aplica migraciones |
| `supabase:env:local` | Genera `.env.local.supabase` con keys locales |
| `supabase:env:apply` | Aplica `.env.local.supabase` sobre `.env.local` (con backup) |
| `supabase:env:restore` | Restaura `.env.local` original |

## Seguridad de secretos

1. Nunca subas `.env.local`.
2. Nunca uses keys de producción en PR.
3. Usa únicamente credenciales locales generadas por Supabase CLI.

## Calidad obligatoria antes de PR

```bash
pnpm lint
pnpm typecheck
pnpm test:coverage
pnpm build
```

## Notas para cambios de base de datos

1. SQL canónico del proyecto: `docs/supabase/sql`.
2. Si añades una nueva fase SQL, usa prefijo incremental (`049_...sql`, `050_...sql`, etc.). El último archivo existente es `048_phase_player_profiles_public_read.sql`.
3. Ejecuta de nuevo `pnpm supabase:prepare:migrations` para validar que el bootstrap local sigue siendo reproducible.
