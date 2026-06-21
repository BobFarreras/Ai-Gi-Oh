<!-- CONTRIBUTING.md - Guía oficial para contribuir en AI-GI-OH sin usar credenciales privadas del mantenedor. -->
# Contribuir a AI-GI-OH

Gracias por contribuir. Este proyecto está preparado para ejecutarse en local sin exponer claves privadas del entorno de producción.

## Requisitos

1. **Node.js 20+** ([descargar](https://nodejs.org))
2. **pnpm** ([instalación](https://pnpm.io/installation))
3. **Docker Desktop** levantado ([descargar](https://www.docker.com/products/docker-desktop))
4. **Supabase CLI** instalado en el sistema (ver paso 2 más abajo)

> **¿Por qué el CLI aparte?** El paquete npm de Supabase descarga su binario en un postinstall que
> falla con frecuencia en Windows (errores de certificado, red, `.EXE` no encontrado) y eso tumbaba
> `pnpm install` entero. Para que el setup sea reproducible, instalamos el CLI de forma estándar y
> NO lo gestionamos por npm.

## Setup rápido (recomendado)

Ejecuta el asistente interactivo. Verifica prerrequisitos (incluido si Docker está corriendo) y guía cada paso con explicaciones:

```bash
node scripts/setup.mjs
```

> **Ojo:** usa `node scripts/setup.mjs`, **no** `pnpm setup`. `pnpm setup` es un comando interno de
> pnpm (configura el PATH de pnpm), no ejecuta nuestro script. Ejecutarlo directamente con Node
> también evita que pnpm intente un auto-install que falla en un clone recién hecho.

Esto te acompaña por:
1. `pnpm install` (las compilaciones nativas se aprueban solas vía `.npmrc`)
2. Detección del CLI de Supabase (te da el comando de instalación si falta)
3. `pnpm supabase:bootstrap:local`
4. `pnpm supabase:env:apply`

## Flujo manual (paso a paso)

Si prefieres hacerlo manualmente:

### 1. Instalar dependencias

```bash
pnpm install
pnpm rebuild esbuild sharp unrs-resolver
```

El segundo comando **compila los binarios nativos**. Es necesario porque, según la versión de pnpm,
`pnpm install` a veces ignora los build scripts (aunque estén pre-aprobados en `.npmrc`) y aborta con
`ERR_PNPM_IGNORED_BUILDS`. `pnpm rebuild` los fuerza sin necesidad de `pnpm approve-builds`.
El asistente `node scripts/setup.mjs` ya hace esto por ti.

### 2. Instalar el CLI de Supabase

**Windows (scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**macOS / Linux (Homebrew):**
```bash
brew install supabase/tap/supabase
```

Alternativa sin gestor de paquetes: descarga el binario desde [releases](https://github.com/supabase/cli/releases) y añádelo al `PATH`.

Verifica con:
```bash
supabase --version
```

### 3. Levantar Supabase local

```bash
pnpm supabase:bootstrap:local
```

Esto genera migraciones, levanta contenedores Docker, aplica el esquema y crea `.env.local.supabase`.

**Requisitos:** Docker Desktop corriendo. Puertos 54321-54324 disponibles.

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

Estos puertos son fijos (definidos en `supabase/config.toml`), iguales para todo el mundo:

| Servicio | URL | Para qué sirve |
|---|---|---|
| App | `http://localhost:3000` | La aplicación Next.js |
| Supabase Studio | `http://127.0.0.1:54323` | UI web para inspeccionar y editar la base de datos |
| API Supabase | `http://127.0.0.1:54321` | Endpoint REST/Auth local |
| Inbucket (emails auth) | `http://127.0.0.1:54324` | Bandeja de correos de autenticación |

## Troubleshooting

### `ERR_PNPM_IGNORED_BUILDS` (Ignored build scripts: esbuild, sharp, unrs-resolver)

Según la versión de pnpm/Node, `pnpm install` puede ignorar los build scripts y abortar. Compílalos a mano:
```bash
pnpm rebuild esbuild sharp unrs-resolver
```
No uses `pnpm approve-builds` (es interactivo y depende de la versión). El asistente `node scripts/setup.mjs` ya hace este rebuild automáticamente.

### `supabase` command not found

El CLI de Supabase no está instalado en el sistema. Instálalo (ver [paso 2](#2-instalar-el-cli-de-supabase)) y verifica con `supabase --version`. El asistente `node scripts/setup.mjs` también te muestra el comando exacto para tu sistema operativo.

### Contenedor `supabase_db` unhealthy / `database files are incompatible`

Tienes un volumen Docker antiguo con una versión de Postgres distinta. Límpialo y reintenta:
```bash
supabase stop --no-backup
pnpm supabase:bootstrap:local
```

### Contenedor `supabase_studio` / `supabase_storage` unhealthy

El bootstrap arranca con `--ignore-health-check` precisamente porque en Windows el chequeo de salud da falsos negativos (el contenedor arranca pero el CLI expira esperándolo). Si lo ves al ejecutar `supabase start` a mano, añade ese flag: `supabase start --ignore-health-check`.

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
2. Si añades una nueva fase SQL, usa prefijo incremental (`051_...sql`, `052_...sql`, etc.). El último archivo existente es `050_phase_grant_api_roles_table_privileges.sql`.
3. **Evita funciones de auth dependientes de versión en políticas RLS** (`auth.role()`, `auth.email()`): cambian entre versiones de Supabase y pueden hacer fallar el SELECT. Para "cualquier usuario autenticado" usa `to authenticated using (true)`; para "el dueño" usa `auth.uid() = <columna>`.
4. Ejecuta de nuevo `pnpm supabase:prepare:migrations` para validar que el bootstrap local sigue siendo reproducible.
