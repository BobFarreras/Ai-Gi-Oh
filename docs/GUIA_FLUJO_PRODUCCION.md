<!-- docs/GUIA_FLUJO_PRODUCCION.md - Protocolo operativo para publicar cambios de develop a main sin conflictos ni bloqueos de reglas. -->
# Guía de Flujo a Producción

## Objetivo

Estandarizar un flujo simple para trabajar con `develop` y publicar a `main` sin conflictos recurrentes.

## Reglas del repositorio (resumen)

1. No se hace push directo a `develop` ni `main`.
2. Todo entra por Pull Request.
3. Revisión y checks obligatorios antes de merge.
4. Historial lineal (sin merge commits en ramas protegidas).

## Flujo diario recomendado

1. Actualizar `develop` local:
   ```bash
   git checkout develop
   git fetch origin --prune
   git pull --ff-only origin develop
   ```
2. Crear rama de trabajo:
   ```bash
   git checkout -b features/<tema>
   ```
3. Trabajar y subir cambios:
   ```bash
   git add -A
   git commit -m "feat: <resumen>"
   git push -u origin features/<tema>
   ```
4. Abrir PR: `features/<tema> -> develop`.
5. Mergear PR con método `Squash` o `Rebase` (no `Merge commit`).

## Publicación a producción (simple)

1. Asegurar `develop` actualizado:
   ```bash
   git checkout develop
   git pull --ff-only origin develop
   ```
2. Abrir PR: `develop -> main`.
3. Esperar checks obligatorios.
4. Mergear PR (`Squash` o `Rebase`).

## Si `develop -> main` da conflictos

No mezclar `main` dentro de `develop` en una rama protegida.

1. Crear rama de release desde `develop`:
   ```bash
   git checkout -b release/develop-to-main origin/develop
   git fetch origin
   ```
2. Rebasear sobre `main`:
   ```bash
   git rebase origin/main
   ```
3. Resolver conflictos y continuar:
   ```bash
   git add -A
   git rebase --continue
   ```
4. Subir rama y abrir PR:
   ```bash
   git push -u origin release/develop-to-main
   ```
   PR: `release/develop-to-main -> main`

## Configuración correcta de fork (`origin` + `upstream`)

Usar este bloque una sola vez por repositorio local:

```bash
git remote -v
git remote add upstream https://github.com/<owner-original>/<repo>.git
git fetch upstream --prune
```

`origin` debe apuntar a tu fork y `upstream` al repo principal.

## Cómo mantener tu fork sincronizado sin romper ramas

1. Sincronizar `develop`:
   ```bash
   git checkout develop
   git fetch upstream --prune
   git rebase upstream/develop
   git push origin develop
   ```
2. Sincronizar `main`:
   ```bash
   git checkout main
   git fetch upstream --prune
   git rebase upstream/main
   git push origin main
   ```

## Checklist antes de abrir PR a `main`

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`
5. `git status` limpio

## Antipatrones a evitar

1. Hacer `git pull main` y luego mezclar manualmente en `develop`.
2. Resolver conflictos en ramas protegidas con push directo.
3. Usar merge commits cuando hay `Require linear history`.
4. Trabajar directo en `develop` o `main`.

## Limpieza post-merge

1. Borrar rama remota del PR mergeado.
2. Borrar rama local:
   ```bash
   git branch -D <rama>
   ```
