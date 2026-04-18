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
2. Validar gates:
   - `pnpm quality:check`
3. Actualizar `CHANGELOG.md`:
   - mover notas de `Unreleased` a nueva versión.
4. Crear commit de release:
   - `chore(release): vX.Y.Z`
5. Crear tag:
   - `git tag -a vX.Y.Z -m "Release vX.Y.Z"`
6. Push branch + tags:
   - `git push origin main --follow-tags`
7. Crear GitHub Release desde el tag y pegar resumen del changelog.

## Convención de decisión rápida (qué número subo)

1. Solo fixes y ajustes no disruptivos: subir `PATCH`.
2. Funcionalidad nueva compatible: subir `MINOR`.
3. Ruptura de compatibilidad o migración obligatoria: subir `MAJOR`.

## Nota práctica

No usar carpeta manual `release/` para copiar archivos. El histórico de releases vive en:

1. tags Git (`vX.Y.Z`),
2. `CHANGELOG.md`,
3. GitHub Releases.
