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
```

`pnpm install` **compila los binarios nativos** (esbuild, sharp, unrs-resolver) automáticamente:
están pre-aprobados en `package.json` (`pnpm.onlyBuiltDependencies`), así que **no** tienes que
ejecutar `pnpm approve-builds` ni ningún paso extra. El asistente `node scripts/setup.mjs` también
lo hace por ti.

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
El propio bootstrap ejecuta un smoke test local de compra, ranking e idempotencia antes de terminar.

**Requisitos:** Docker Desktop corriendo. Puertos 57320-57324 disponibles.

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
| Supabase Studio | `http://127.0.0.1:57323` | UI web para inspeccionar y editar la base de datos |
| API Supabase | `http://127.0.0.1:57321` | Endpoint REST/Auth local |
| Inbucket (emails auth) | `http://127.0.0.1:57324` | Bandeja de correos de autenticación |

## Acceder al panel de administración en local

El panel admin está protegido en dos capas: (1) vive en una ruta privada por slug
(`/admin-portal/<ADMIN_PORTAL_SLUG>`, en local `local-admin`) y (2) exige que tu usuario esté en la
tabla `admin_users` (whitelist por rol). **Por seguridad, la app no deja que un usuario se auto-conceda
admin** (solo el `service_role` escribe en esa tabla), así que hay que hacerlo una vez en local:

```bash
# 1) Regístrate primero en la app para crear tu usuario:
#    abre http://localhost:3000/register y crea una cuenta.

# 2) Concédete acceso admin en la BD local (usa la service-role key de tu .env):
pnpm db:make-admin --email=tu@email.com
#    (si solo hay un usuario en local, puedes omitir --email)
#    rol por defecto SUPER_ADMIN; para ADMIN normal: --role=ADMIN

# 3) Entra al panel:
#    http://localhost:3000/admin  (redirige al portal si eres admin)
```

El comando aborta si la URL de Supabase no es local (protección anti-producción; fuérzalo con `--force`
solo si sabes lo que haces). Alternativa manual: en Supabase Studio (`http://127.0.0.1:57323`) → SQL:

```sql
insert into admin_users (user_id, role, is_active)
values ((select id from auth.users where email = 'tu@email.com'), 'SUPER_ADMIN', true);
```

## Troubleshooting

### `ERR_PNPM_IGNORED_BUILDS` (Ignored build scripts: esbuild, sharp, unrs-resolver)

Ya **no debería aparecer**: los tres builds están pre-aprobados en `package.json`
(`pnpm.onlyBuiltDependencies`), así que `pnpm install` los compila solo. Si lo ves (p. ej. por un
`node_modules` de un clon antiguo), basta con reinstalar: `pnpm install`. No hace falta
`pnpm approve-builds` (es interactivo y depende de la versión).

### Docker: `no such host` / `unexpected EOF` al descargar imágenes de Supabase

Docker no tiene salida a internet (fallo de DNS/red), no es un problema de puertos ni de recursos
aunque el mensaje lo sugiera. **Reinicia Docker Desktop por completo** (icono de la bandeja → Quit →
abrir de nuevo) y pausa VPN/proxy/antivirus si los usas. Luego reintenta solo ese paso:
```bash
pnpm supabase:bootstrap:local
```

### `/register` o `/login` daban error 500 con "Invalid Refresh Token"

Ocurría con cookies de una sesión anterior en `localhost:3000` y una BD local recién creada. Ya está
**corregido** (la app trata ese caso como visitante). Si vienes de una versión antigua, borra los datos
del sitio del navegador (DevTools → Application → Clear site data) y recarga.

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
| `db:reset` | Regenera migraciones desde `docs/supabase/sql` + `supabase db reset --local`. Úsalo **tras cada `git pull`** para que tu BD quede igual al repo (borra datos locales de prueba). |
| `supabase:verify:local` | Crea un usuario efímero local y valida compra `BUY_ITEM`, ranking e idempotencia; lo elimina al terminar. |
| `db:seed:dump` | Regenera `supabase/seed.sql` desde la BD fuente (solo mantenedores). |
| `db:make-admin` | Te concede acceso al panel admin en la BD **local** (`--email=`, `--role=`). Ver [Acceder al panel de administración en local](#acceder-al-panel-de-administración-en-local). |

> **Tras `git pull` con cambios de BD:** ejecuta `pnpm db:reset`. `supabase start` solo aplica migraciones en el primer arranque, así que sin un reset tu Docker se queda desactualizado (faltan tablas/contenido nuevos).

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

1. **Estructura e historial** = SQL canónico en `docs/supabase/sql`. Si añades una fase, usa prefijo incremental continuando el último archivo existente (p. ej. tras `077_...` va `078_...`).
2. **Contenido editable del juego** (precios/rareza de mercado, sobres, eventos, misiones, promos, calendario de login) = `supabase/seed.sql`. Son UPSERTs idempotentes que corren **después** de las migraciones (capa que gana). No incluye `cards_catalog` (lo gobiernan las migraciones) ni datos de jugador. Edítalo a mano o regenéralo con `pnpm db:seed:dump`.
3. **Evita funciones de auth dependientes de versión en políticas RLS** (`auth.role()`, `auth.email()`): cambian entre versiones de Supabase y pueden hacer fallar el SELECT. Para "cualquier usuario autenticado" usa `to authenticated using (true)`; para "el dueño" usa `auth.uid() = <columna>`.
4. Ejecuta `pnpm db:reset` para validar que el bootstrap local (migraciones + seed) sigue siendo reproducible.
5. Ejecuta `pnpm supabase:env:local && pnpm supabase:verify:local` para validar los flujos críticos contra la BD local.
