<!-- docs/refactor/PHASE-1-AUDITORIA-TECNICA.md - Auditoría técnica integral de arquitectura, deuda técnica, seguridad y mantenibilidad. -->
# Fase 1 - Auditoría Técnica Completa

## Fecha y alcance

1. Fecha: 2026-03-09.
2. Alcance revisado: `home`, `market`, `board`, `core`, `services`, `infrastructure`, `docs`.
3. Objetivo: detectar deuda técnica, riesgos de arquitectura, seguridad, documentación desactualizada y candidatos de limpieza.

## Evidencia usada

1. Barrido de dependencias e imports (`rg`).
2. Inventario de tamaño por archivo (`Get-ChildItem` + conteo de líneas).
3. Revisión de seguridad auth (`getSession/getUser`) y dependencia (`pnpm audit`).
4. Revisión de convención documental (cabecera obligatoria por archivo).

## Hallazgos críticos

1. `HomeDeckBuilderScene` es un GOD component (673 líneas) con estado, orquestación async, DnD, mutaciones optimistas y render en el mismo módulo.
Ruta: `src/components/hub/home/HomeDeckBuilderScene.tsx`.
Riesgo: regresiones frecuentes, coste alto de cambios y re-renders innecesarios.

2. El board principal sigue muy acoplado en componentes grandes (447/291/250 líneas) y supera la regla de 150 líneas.
Rutas: `src/components/game/board/index.tsx`, `src/components/game/board/ui/layers/BoardInteractiveLayer.tsx`, `src/components/game/board/Battlefield.tsx`.
Riesgo: mantenimiento complejo, dificultad para aislar rendimiento y errores.

3. Riesgo de seguridad de sesión: uso directo de `auth.getSession()` para construir sesión de usuario autenticada.
Ruta: `src/infrastructure/persistence/supabase/SupabaseAuthRepository.ts`.
Riesgo: warning explícito de Supabase sobre autenticidad del `user` retornado desde storage sin revalidación servidor.

4. Violación amplia de la regla de cabecera obligatoria (ruta + descripción en primera línea).
Ejemplos: `src/app/layout.tsx`, `src/components/game/board/hooks/internal/audio/audioRuntime.ts`, `src/lib/utils.ts`, varios `README.md` internos.
Riesgo: incumplimiento de gate documental y trazabilidad baja en PR.

## Hallazgos medios

1. Dependencia de infraestructura desde `app` en páginas de módulo (acoplamiento directo a singletons de repositorios).
Rutas: `src/app/hub/market/page.tsx`, `src/app/hub/home/page.tsx`.
Riesgo: reduce testabilidad y dificulta cambiar estrategias de persistencia por entorno.

2. `services/*` combina casos de uso con selección concreta de adaptadores de infraestructura.
Ejemplos: `src/services/player-persistence/create-player-runtime-repositories.ts`, `src/services/hub/get-hub-runtime-data.ts`.
Riesgo: frontera de capas menos estricta; crece complejidad de composición.

3. Reglas de tamaño incumplidas en más de 10 archivos de runtime (no tests), afectando SRP.
Ejemplos adicionales: `SlotCell.tsx` (203), `MarketCardInspector.tsx` (175), `useBoard.ts` (165).

4. Documentación de arquitectura no refleja completamente el estado real.
Ejemplo: `README.md` menciona `infrastructure` como "reservado" mientras hay persistencia Supabase en producción local.
Riesgo: onboarding confuso y decisiones técnicas mal interpretadas.

## Hallazgos bajos

1. Archivo potencialmente no utilizado: `src/components/hub/control-room-layout.ts` (sin referencias detectadas por símbolo exportado).
Estado: candidato a eliminación o reintegración explícita.

2. Inconsistencia de naming en tests: `src/core/use-cases/CombatSercice.test.ts` (typo "Sercice").
Riesgo: deuda de legibilidad y búsqueda.

3. Distribución de `"use client"` muy alta en UI del hub/board; requiere revisión fina para mover al servidor donde no haya interacción.
Riesgo: coste de JS en cliente mayor del necesario.

## Seguridad

1. Dependencias: `pnpm audit --audit-level=high` sin vulnerabilidades conocidas.
2. Riesgo principal activo: autenticidad de sesión (ver hallazgo crítico #3).
3. Recomendación inmediata: hardening auth en fase de refactor (validación por `auth.getUser()` y mapeo seguro de sesión).

## Inventario de deuda por tamaño (runtime >150 líneas)

1. `src/components/hub/home/HomeDeckBuilderScene.tsx` - 673
2. `src/components/game/board/index.tsx` - 447
3. `src/components/game/board/ui/layers/BoardInteractiveLayer.tsx` - 291
4. `src/components/game/board/Battlefield.tsx` - 250
5. `src/components/game/board/ui/DuelResultOverlay.tsx` - 222
6. `src/components/hub/home/layout/HomeMobileWorkspace.tsx` - 204
7. `src/components/game/board/battlefield/internal/SlotCell.tsx` - 203
8. `src/components/game/board/internal/combatLogPresentation.ts` - 197
9. `src/core/use-cases/game-engine/combat/internal/attack-resolution.ts` - 182
10. `src/components/game/board/PlayerHand.tsx` - 177
11. `src/components/hub/market/MarketCardInspector.tsx` - 175
12. `src/components/game/board/hooks/useBoard.ts` - 165
13. `src/components/game/board/hooks/internal/match/useMatchRuntime.ts` - 158

## Candidatos de limpieza (fase 2)

1. Verificar eliminación o uso real de `src/components/hub/control-room-layout.ts`.
2. Corregir naming y normalizar archivos con typos (`CombatSercice.test.ts`).
3. Añadir cabecera obligatoria en archivos sin comentario de ruta/descripción.
4. Consolidar documentos legacy para evitar información duplicada o contradictoria (`README.md`, `Architecture.md`, docs de módulos).

## Conclusión Fase 1

1. El proyecto tiene base sólida en dominio y tests, pero mantiene deuda estructural alta en UI de `home` y `board`.
2. El riesgo más urgente no funcional es auth/session hardening.
3. Se requiere ejecutar Fase 2 y Fase 3 antes de declarar arquitectura "lista para TFM".
4. Backlog priorizado disponible en `docs/refactor/PHASE-1-BACKLOG.md`.