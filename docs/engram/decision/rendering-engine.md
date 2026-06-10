---
topic_key: "architecture/rendering-engine"
date: "2026-06-10"
status: "active"
---

# Decisión: Arquitectura de renderizado — PixiJS v8 para combate, DOM optimizado para resto

## Contexto

El tablero de combate renderiza 100% con DOM + CSS 3D transforms + Framer Motion. Esto provoca FPS <20 en móviles low-end y ~25-30 en móviles mid-range. Los cuellos principales son:
- `preserve-3d` en 4+ niveles de nesting
- ~15 animaciones `repeat: Infinity` por carta V5 (MasteryAura)
- Estado monolítico `useState<GameState>` sin selectores
- `combatLog` scan completo en cada render

## Decisión

Se aprueba el Plan Maestro de Rendimiento (`docs/performance/PERFORMANCE-MASTERPLAN.md`) con 9 fases:

1. **Fases 1-5 (DOM optimization):** Assets WebP, CardThumbnail, memoización, Hub adaptativo, Story memo
2. **Fase 6 (Estado):** Migrar combate a Zustand con selectores granulares
3. **Fases 7-8 (PixiJS):** Reescribir capa visual del tablero con PixiJS v8 + @pixi/react
4. **Fase 9 (Polish):** Pulido final Hub/Story

**Se elige PixiJS v8 (no Three.js/R3F) para el combate** porque:
- El combate es 2D isométrico (perspective + rotateX), no 3D real
- Bundle size menor (~50 KB gzip tree-shakeado vs ~150 KB R3F+Three)
- `@pixi/react` mantiene el paradigma declarativo React
- El Hub ya usa R3F correctamente para su lobby 3D — no se migra

## Consecuencias

- Bundle size incrementa ~50 KB gzip con PixiJS v8 (tree-shakeado)
- Migración incremental DOM → PixiJS con bridge de coexistencia durante Fase 7
- El GameEngine puro no se modifica en ninguna fase
- Riesgo de regression visual mitigado con Playwright screenshot testing

## Archivos clave

- `docs/performance/PERFORMANCE-MASTERPLAN.md` — Plan completo
- `src/components/game/board/` — Capa visual a reescribir en Fase 7-8
- `src/core/use-cases/game-engine/` — Motor puro, NO se modifica