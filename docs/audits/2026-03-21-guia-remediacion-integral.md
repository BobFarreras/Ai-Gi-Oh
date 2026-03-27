<!-- docs/audits/2026-03-21-guia-remediacion-integral.md - Guía operativa para remediar hallazgos de auditoría en arquitectura, calidad, testing, seguridad y documentación. -->
# Guía de Remediación Integral (post-auditoría 2026-03-21)

## Objetivo

1. Cerrar vulnerabilidades funcionales detectadas.
2. Alinear todo el proyecto con `Agents.md` y `Architecture.md`.
3. Reducir deuda estructural y mejorar mantenibilidad para futuros developers.

## Fase 1 (bloqueante): estabilizar calidad de merge

1. Corregir los `7` tests fallidos en `training`, `hub` y `board`.
2. Reejecutar gates: `pnpm lint`, `pnpm test`, `pnpm build`.
3. No fusionar cambios mientras `pnpm test` siga en rojo.

## Fase 2 (arquitectura): cerrar contradicciones de dominio

1. Confirmar contrato canónico: Academy como entrada de tutorial/training.
2. Alinear `HubAccessPolicy` y tests de `GetHubMapUseCase` para que reflejen exactamente la regla de bloqueo real.
3. Mantener rutas legacy solo como redirect explícito o eliminar referencias históricas ambiguas.

## Fase 3 (SRP): reducir archivos GOD y límite 150 líneas

1. Particionar `StoryCircuitMap.tsx`, `MarketScene.tsx`, `BoardTutorialFlowOverlay.tsx` y `useBoard.ts`.
2. Extraer en submódulos cohesivos:
3. `internal/actions`, `internal/hooks`, `internal/view`, `internal/types`.
4. Mantener una responsabilidad por archivo y motivo de cambio único.

## Fase 4 (comentarios/JSDoc): mantenibilidad obligatoria

1. Priorizar módulos complejos de onboarding:
2. `src/components/game/board/**`
3. `src/components/hub/story/**`
4. `src/components/hub/market/**`
5. Añadir comentario de intención en español en funciones/hooks/variables no triviales.
6. Añadir JSDoc corto en contratos públicos, utilidades compartidas y hooks reutilizables.
7. Evitar comentarios obvios; documentar decisiones de diseño y por qué.

## Fase 5 (documentación): limpieza y consolidación

1. Mantener `docs/architecture/*` como fuente activa.
2. Evitar documentos raíz que dupliquen módulos vivos.
3. Revisar `docs/DEUDA_TECNICA.md`:
4. Si se mantiene: actualizar estado real y pendientes actuales.
5. Si se elimina: mover su contenido útil a `docs/audits/` o `docs/refactor/` y borrar enlaces en `README.md`.

## Fase 6 (performance): política de artefactos

1. Mantener en git solo `.gitkeep` y reportes curados relevantes.
2. Borrar resultados automáticos locales tras análisis (`docs/performance/results/*` temporales).
3. Repetir baseline cuando haya refactors grandes de `board`, `market` o `story`.

## Checklist operativo por PR

1. ¿El cambio respeta `components -> services/use-cases -> core`?
2. ¿No hay `any` ni acceso directo a DB desde UI/rutas sin repositorio?
3. ¿Se añadieron/actualizaron tests co-localizados?
4. ¿Ningún archivo nuevo supera 150 líneas sin excepción justificada?
5. ¿Cabecera de ruta + descripción en primera línea?
6. ¿Comentarios/JSDoc de intención en español en lo no trivial?
7. ¿`lint`, `test`, `build` en verde?

## Definición de “auditoría cerrada”

1. 0 tests fallidos.
2. 0 inconsistencias arquitectura-docs en rutas Academy/Tutorial/Training.
3. 0 archivos críticos fuera de límite SRP sin plan de partición.
4. Documentación limpia, sin duplicados obsoletos activos.
