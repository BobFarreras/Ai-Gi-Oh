<!-- CONTRIBUTING.md - Guía oficial para contribuir en AI-GI-OH sin usar credenciales privadas del mantenedor. -->
# Contribuir a AI-GI-OH

Gracias por contribuir. Este proyecto está preparado para ejecutarse en local sin exponer claves privadas del entorno de producción.

## Requisitos

1. Node.js 20+.
2. `pnpm`.
3. Docker Desktop levantado.

## Flujo recomendado (local completo)

1. Instala dependencias:

```bash
pnpm install
```

2. Genera migraciones locales, levanta Supabase local, aplica esquema y sincroniza `.env.local`:

```bash
pnpm supabase:bootstrap:local
```

3. Aplica entorno local de Supabase sobre `.env.local` (con backup automático):

```bash
pnpm supabase:env:apply
```

4. Arranca la app:

```bash
pnpm dev
```

5. Accede a:
   - App: `http://localhost:3000`
   - Supabase Studio: `http://127.0.0.1:54323`

## Flujo manual (si necesitas debug paso a paso)

```bash
pnpm supabase:prepare:migrations
pnpm supabase:start
pnpm supabase:db:reset:local
pnpm supabase:env:local
pnpm supabase:env:apply
pnpm dev
```

## Qué hace cada comando

1. `supabase:prepare:migrations`: transforma `docs/supabase/sql/*.sql` en migraciones locales ejecutables por CLI.
2. `supabase:start`: levanta contenedores locales de Supabase.
3. `supabase:db:reset:local`: recrea la DB local y aplica todas las migraciones.
4. `supabase:env:local`: genera `.env.local.supabase` con `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
5. `supabase:env:apply`: aplica `.env.local.supabase` sobre `.env.local` y guarda backup automático en `.env.local.backup`.
6. `supabase:env:restore`: restaura tu `.env.local` original tras pruebas locales.

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
2. Si añades una nueva fase SQL, usa prefijo incremental (`045_...sql`, `046_...sql`, etc.).
3. Ejecuta de nuevo `pnpm supabase:prepare:migrations` para validar que el bootstrap local sigue siendo reproducible.
