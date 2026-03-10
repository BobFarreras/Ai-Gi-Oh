<!-- docs/refactor/PHASE-1-BACKLOG.md - Backlog priorizado de refactor derivado de la auditoría técnica de Fase 1. -->
# Fase 1 - Backlog Priorizado de Refactor

## Prioridad P0 (bloqueantes)

1. Hardening de sesión Supabase.
Objetivo: evitar confiar en `user` proveniente de storage sin revalidación.
Acción: actualizar `SupabaseAuthRepository` para validar identidad con `auth.getUser()` y mapear sesión de forma segura.
Validación: tests auth + `pnpm lint && pnpm test && pnpm build`.

2. Descomposición de `HomeDeckBuilderScene`.
Objetivo: bajar de 673 líneas a módulos SRP <=150.
Acción: extraer subhooks (`useHomeDeckMutations`, `useHomeDeckDragAndDrop`, `useHomeDeckSelection`) y contenedores de vista.
Validación: tests de mutaciones optimistas y DnD sin regresiones funcionales.

3. Plan de corte de `Board` en capas más pequeñas.
Objetivo: reducir acoplamiento de `board/index.tsx` y `BoardInteractiveLayer.tsx`.
Acción: separar capa de layout, capa de controles de turno y capa de interacción por zona.
Validación: test de integración `useBoard` y smoke test de flujo de combate.

## Prioridad P1 (alta)

1. Normalizar regla de cabecera obligatoria.
Objetivo: 100% de archivos modificables con cabecera de ruta + descripción.
Acción: introducir pasada incremental por carpetas (`app`, `components`, `core`, `docs`).
Validación: script/check de primera línea en CI.

2. Quitar acoplamiento directo `app -> infrastructure/singletons`.
Objetivo: entradas Next.js consumen composición desde `services`/factories, no singletons concretos.
Acción: crear factories de runtime por módulo (`home`, `market`) y usarlas desde `app`.
Validación: sin imports `@/infrastructure/*` en páginas de `app/hub/*` salvo adaptadores explícitos justificados.

3. Actualizar documentación fuente de verdad.
Objetivo: alinear `README.md` y `Architecture.md` con estado real Supabase + Zustand + estrategia de performance.
Acción: eliminar texto obsoleto y añadir flujos actuales.
Validación: revisión cruzada contra estructura actual de `src/`.

## Prioridad P2 (media)

1. Revisar archivo candidato no usado `control-room-layout.ts`.
Objetivo: eliminar código muerto o reintegrar su uso real.
Acción: decidir en PR si se borra o se usa explícitamente.
Validación: búsqueda de referencias + tests/hub smoke.

2. Corregir naming inconsistente `CombatSercice.test.ts`.
Objetivo: nomenclatura limpia y buscable.
Acción: renombrar a `CombatService.test.ts`.
Validación: suite de tests en verde.

3. Matriz de `use client` por necesidad real.
Objetivo: reducir JS cliente en pantallas sin interacción.
Acción: auditar componentes que solo presentan datos y migrar a server component cuando aplique.
Validación: bundle JS y LCP comparables o mejores.

## Orden recomendado de ejecución

1. P0.1 Seguridad auth.
2. P0.2 Home GOD component.
3. P0.3 Board desacoplado.
4. P1.1 Cabeceras obligatorias.
5. P1.2 Frontera app-infra.
6. P1.3 Documentación actualizada.
7. P2 completo.

## Criterio de cierre Fase 1

1. Hallazgos auditados y documentados.
2. Backlog priorizado con validaciones concretas por tarea.
3. Quality gates en verde tras los cambios de documentación.