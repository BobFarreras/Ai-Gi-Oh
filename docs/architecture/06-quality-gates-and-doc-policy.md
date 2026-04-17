<!-- docs/architecture/06-quality-gates-and-doc-policy.md - Define gates de calidad y política de mantenimiento documental. -->
# Quality Gates y Política de Documentación

## Gates obligatorios

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:coverage`
4. `pnpm security:audit:prod`
5. `pnpm build`
6. Escaneo de secretos con `gitleaks` (en CI)

Sin estos seis en verde no se considera listo para merge.

## Flujo CI actual (`.github/workflows/quality-gates.yml`)

1. Ejecuta en `pull_request`, `push` a ramas protegidas (`main`, `develop`) y `workflow_dispatch`.
2. Usa permisos mínimos por defecto:
   - `permissions: contents: read`
3. Usa `concurrency` para cancelar ejecuciones antiguas de la misma PR/rama.
4. Configura Node `24` e instala `pnpm@10` global en el runner.
5. Aplica cache del store de `pnpm` (`actions/cache`) por `pnpm-lock.yaml`.
6. Instala dependencias con `pnpm install --frozen-lockfile`.
7. Ejecuta `gitleaks` como gate de seguridad.
8. Ejecuta `pnpm quality:check` como gate de calidad funcional/técnica (`lint + typecheck + test:coverage + audit + build`).

## Por qué fallaba `pnpm` en Actions

1. `actions/setup-node` con `cache: pnpm` requiere que `pnpm` ya exista en `PATH`.
2. Si `pnpm` no está disponible en `PATH` al arrancar el job, puede fallar con:
   - `Unable to locate executable file: pnpm`
3. Solución aplicada:
   - quitar `cache: pnpm` de `setup-node`,
   - inicializar `pnpm` primero,
   - cachear el store con `actions/cache`.

## Reglas recomendadas en GitHub Rulesets (fuera del YAML)

1. Exigir PR obligatoria (sin push directo).
2. Exigir branch actualizada antes de merge (`Require branches to be up to date`).
3. Exigir checks concretos:
   - `quality / quality`
   - `vercel` (producción/preview según estrategia del repo)
4. Exigir historial lineal (`Require linear history`).
5. Bloquear bypass salvo administradores autorizados.

## Reglas de mantenibilidad

1. Sin “GOD files”: dividir por submódulos cohesivos.
2. Comentarios y JSDoc de intención en piezas no triviales.
3. Cabecera de ruta+descripción en primera línea de cada archivo.
4. Docs afectadas deben actualizarse en el mismo commit.

## Política para arquitectura

1. `Architecture.md` es índice corto.
2. El detalle vive en `docs/architecture/*`.
3. Cualquier cambio estructural debe reflejar:
   - bloque funcional afectado,
   - dependencias permitidas,
   - criterio de validación técnica.
