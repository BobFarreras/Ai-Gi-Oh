<!-- docs/GUIA_FLUJO_PRODUCCION.md - Flujo operativo de ramas, deploy y PRs tras el saneamiento de CI/CD de 2026-06. -->
# Guía de Flujo a Producción

## Modelo de ramas
- `main` = **producción**. Vercel despliega automáticamente con cada push.
- `develop` = **integración/staging**. Vercel genera un preview con cada push.
- Se mantienen **sincronizadas** con el flujo fast-forward de abajo.

## Dos roles, dos flujos

### 1) Mantenedor (propietario / admin) — push directo
Tienes **bypass** del ruleset: puedes hacer `git push` directo a `develop` y `main`, **sin PR**. Los Actions (`quality`) corren igual como red de seguridad, pero **no te bloquean**.

Flujo recomendado (mantiene `develop` y `main` siempre sincronizados):
```bash
# 1) Trabaja en develop (genera preview en Vercel)
git checkout develop
git pull --ff-only origin develop
# ...cambios...
git add -A && git commit -m "feat: <resumen>"
git push origin develop                 # -> preview

# 2) Cuando esté listo, publica a producción por FAST-FORWARD
git push origin develop:main            # -> producción (FF, sin conflictos)
```
Tras el paso 2, `develop` y `main` apuntan al **mismo commit** → siempre sincronizados.

> También puedes hacer `git push origin main` directo; en ese caso, resincroniza luego con `git push origin main:develop`.

### 2) Contribuidor externo — PR + tu validación
1. Hace fork, crea su rama y abre **Pull Request a `main`**.
2. El check **`quality`** debe pasar (lint, typecheck, test, build).
3. **Tú revisas y apruebas** — el ruleset exige **1 aprobación** del mantenedor.
4. Merge por **Squash** o **Rebase** (historia lineal; `Merge commit` está bloqueado).

## Publicar una versión (release)
```bash
git checkout develop
# subir "version" en package.json siguiendo SemVer (MAJOR.MINOR.PATCH)
git commit -am "chore(release): vX.Y.Z"
git push origin develop:main            # despliega a producción
gh release create vX.Y.Z --target main --title "vX.Y.Z — <resumen>" --notes "<changelog>"
```

## Checklist antes de publicar
`pnpm lint` · `pnpm typecheck` · `pnpm test` (o todo junto con `pnpm quality:check`) · `pnpm build` · `git status` limpio.

## Vercel (IMPORTANTE)
- Producción = rama `main`; cada push despliega.
- **"Require Verified Commits" debe estar DESACTIVADO** (Vercel → Settings → Git). Si está activado, Vercel **cancela al instante todo commit sin firma GPG/SSH** y producción deja de actualizarse (síntoma: deploys en estado `CANCELED`). Alternativa profesional: firmar los commits con GPG/SSH.

## CI / Dependencias
- `quality-gates`: corre en **PR y push** (no hay cron diario, que antes generaba fallos nocturnos).
- `e2e-story-resilience`: solo **bajo demanda** (botón *Run workflow*), por ser pesado.
- **Sin Dependabot**: la seguridad de dependencias se vigila con las **alertas pasivas de GitHub** (pestaña *Security*). Actualiza dependencias a mano con `pnpm update` cuando convenga; revisa vulnerabilidades con `pnpm security:audit:prod`.

## Antipatrones a evitar
1. Mezclar `main` dentro de `develop` con merge commits (rompe `Require linear history`). Usa el fast-forward de arriba.
2. Hacer **muchos push seguidos** a la misma rama esperando que Vercel los despliegue todos: cada push nuevo **cancela el deploy en vuelo** del anterior. Agrupa los cambios y haz un push.
3. Resolver conflictos de `develop -> main`: si aparecen, casi siempre es por divergencia de historia; reconcilia con `git push origin develop:main` (FF) tras mantener ambas ramas alineadas.
