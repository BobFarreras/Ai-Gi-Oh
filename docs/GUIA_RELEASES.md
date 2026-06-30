<!-- docs/GUIA_RELEASES.md - Política de versionado y flujo operativo de releases para AI-GI-OH. -->
# Guía de Releases y Versionado

## Objetivo

Definir un proceso simple, repetible y profesional para crear versiones del proyecto sin fricción.

## Regla de versionado (SemVer)

Formato: `MAJOR.MINOR.PATCH`

1. `PATCH` (`x.y.Z`):
   - Bugfixes.
   - Ajustes visuales.
   - Cambios internos sin romper comportamiento esperado.
2. `MINOR` (`x.Y.z`):
   - Features nuevas compatibles con lo anterior.
   - Nuevos módulos o mejoras funcionales sin ruptura de flujos existentes.
3. `MAJOR` (`X.y.z`):
   - Cambios incompatibles o que requieren migraciones/manual steps para seguir funcionando igual.
   - Ejemplo: ruptura de contratos API, cambios de persistencia no backward-compatible.

## Cadencia recomendada para este proyecto

1. Crear release cuando se cierra un bloque funcional relevante (no por cada commit).
2. Agrupar cambios por fase/objetivo (ej. seguridad, story, presentación TFM).
3. Publicar siempre con:
   - tag,
   - changelog actualizado,
   - checks en verde.

## Primera versión estable

1. `v1.0.0` = primera entrega estable y defendible del TFM.

## Flujo operativo (checklist)

1. Sincronizar rama:
   - `main` actualizado con `origin/main`.
2. Documentar cambios:
   - ir añadiendo las notas bajo `## [Unreleased]` del `CHANGELOG.md` durante el desarrollo.
3. Subir la versión en **todos los sitios a la vez** (package.json + README + CHANGELOG):
   - `pnpm release:prepare <patch|minor|major>` (o una versión explícita `X.Y.Z`).
   - Previsualiza con `--dry-run` antes de escribir.
   - Promueve `## [Unreleased]` a `## [X.Y.Z] - fecha`, añade los enlaces de comparación del
     pie y actualiza el badge/subtítulo del README. Falla si `[Unreleased]` está vacío
     (usa `--allow-empty` solo si de verdad no hay notas).
4. Validar gates:
   - `pnpm quality:check`
5. Crear commit de release:
   - `chore(release): vX.Y.Z`
6. Crear y publicar tag (lee la versión de `package.json`):
   - `pnpm release:tag:push`
7. La **GitHub Release se crea/actualiza automáticamente** al pushear el tag (workflow
   `.github/workflows/release-on-tag.yml`): toma las notas de la sección del `CHANGELOG`
   del tag y la marca como `Latest`. **No hay que crearla a mano.**
   - Comprobar que en `Releases` aparece la versión recién publicada como `Latest`.
   - Si por lo que sea no apareciera: `gh release create vX.Y.Z --notes-file - --latest`
     (o re-lanzar el workflow `release-on-tag` con `workflow_dispatch`).

## Convención de decisión rápida (qué número subo)

1. Solo fixes y ajustes no disruptivos: subir `PATCH`.
2. Funcionalidad nueva compatible: subir `MINOR`.
3. Ruptura de compatibilidad o migración obligatoria: subir `MAJOR`.

## Automatización disponible

1. `pnpm release:prepare <patch|minor|major|X.Y.Z>`:
   - Sube la versión en `package.json`, `README.md` (comentario, subtítulo y badge) y `CHANGELOG.md`.
   - En el `CHANGELOG`: promueve `## [Unreleased]` a la nueva versión con fecha y añade los enlaces
     de comparación del pie (`[X.Y.Z]: .../compare/...` y `[Unreleased]: .../compare/vX.Y.Z...HEAD`).
   - Acepta `--dry-run` (previsualiza) y `--allow-empty` (permite versión sin notas).
   - No commitea ni crea el tag: revisa el diff y continúa con `release:tag:push`.
2. `pnpm release:tag`:
   - Lee la versión de `package.json`.
   - Crea `vX.Y.Z`.
   - Falla si hay cambios sin commit o si el tag ya existe.
2. `pnpm release:tag:push`:
   - Hace lo mismo y además sube el tag a `origin`.
3. Workflow `release-on-tag` (`.github/workflows/release-on-tag.yml`):
   - Se dispara con cada push de un tag `v*` (y por `workflow_dispatch`).
   - Crea o actualiza la **GitHub Release** con las notas del `CHANGELOG` y la marca `Latest`.
   - Garantiza que un tag de git **siempre** se traduzca en una Release publicada
     (un tag por sí solo NO aparece en la página de Releases).

## Nota práctica

No usar carpeta manual `release/` para copiar archivos. El histórico de releases vive en:

1. tags Git (`vX.Y.Z`),
2. `CHANGELOG.md`,
3. GitHub Releases.
