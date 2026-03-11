<!-- docs/story/STORY-DUEL-IMPLEMENTATION-LOG.md - Registro por fases de la implementación del flujo Story/Duelo y sus archivos afectados. -->
# Story Duel - Registro de Implementación por Fases

## Fase 0 - Contrato de cierre de duelo

### Objetivo
Definir un contrato canónico de resultado de duelo Story y mantener compatibilidad con el payload legado.

### Cambios aplicados
1. Se introdujo el tipo `StoryDuelOutcome` (`WON`, `LOST`, `ABANDONED`).
2. Se agregó normalización de payload para aceptar:
   - contrato nuevo: `outcome`
   - contrato legacy: `didWin`
3. `POST /api/story/duels/complete` ahora devuelve metadatos de retorno:
   - `outcome`
   - `duelNodeId`
   - `returnNodeId`

### Archivos creados
- `src/services/story/duel-flow/story-duel-outcome.ts`
- `src/services/story/duel-flow/story-duel-outcome.test.ts`
- `src/services/story/duel-flow/resolve-story-duel-completion-input.ts`
- `src/services/story/duel-flow/resolve-story-duel-completion-input.test.ts`

### Archivos modificados
- `src/app/api/story/duels/complete/route.ts`

### Validación (TDD)
- Tests unitarios del nuevo contrato y parser.
- Compatibilidad backward validada en test (`didWin -> outcome`).
