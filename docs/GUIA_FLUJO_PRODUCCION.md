<!-- docs/GUIA_FLUJO_PRODUCCION.md - Protocolo operativo para publicar cambios de develop a main sin conflictos ni bloqueos de reglas. -->
# Guía de Flujo a Producción

## Objetivo

Estandarizar cómo pasar cambios a producción sin fricción de ramas protegidas.

## Reglas del repositorio (resumen)

1. No se hace push directo a `develop` ni `main`.
2. Todo entra por Pull Request.
3. El check `quality` debe estar en verde.
4. `develop` no admite merge commits.

## Flujo normal (sin conflictos)

1. Trabajar en `features/<tema>`.
2. Abrir PR `features/<tema> -> develop`.
3. Esperar checks y mergear PR.
4. Abrir PR `develop -> main`.
5. Esperar checks y mergear PR.

## Si `develop -> main` dice "Can't automatically merge"

1. Crear rama temporal desde `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b features/merge-main-into-develop
   ```
2. Traer `main`:
   ```bash
   git fetch origin
   git merge origin/main
   ```
3. Resolver archivos con conflicto (`<<<<<<<`, `=======`, `>>>>>>>`).
4. Confirmar resolución:
   ```bash
   git add -A
   git commit -m "chore(merge): resolve develop-main conflicts"
   ```
5. Subir rama y abrir PR a `main`:
   ```bash
   git push -u origin features/merge-main-into-develop
   ```
   PR: `features/merge-main-into-develop -> main`

## Checklist antes de merge a `main`

1. `pnpm lint` en verde.
2. `pnpm test` en verde.
3. `pnpm build` en verde.
4. No hay conflictos pendientes (`git status` limpio).
5. Configuración de producción validada (Supabase/Vercel/envs).

## Antipatrones a evitar

1. Resolver conflictos directo en `develop` con push directo.
2. Hacer merge local a `develop` si la rama está protegida.
3. Dejar ramas temporales abiertas tras merge.

## Limpieza post-merge

1. Borrar rama remota del PR mergeado.
2. Borrar rama local:
   ```bash
   git branch -D <rama>
   ```
