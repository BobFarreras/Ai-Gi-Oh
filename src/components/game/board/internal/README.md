<!-- src/components/game/board/internal/README.md - Documenta submódulos internos del shell Board. -->
# Internos del Board

Esta carpeta contiene submódulos de composición para mantener `Board` legible y cumplir SRP.

## Archivos

1. `use-board-screen-state.ts`
   - Agrupa estado de pantalla, efectos de cierre/resolución y handlers de interacción.
2. `board-view-types.ts`
   - Tipos compartidos para secciones de UI internas.
3. `BoardStatusAndTopBarSection.tsx`
   - Overlays de estado, narración y barra superior (mobile/desktop).
4. `BoardPlayersSection.tsx`
   - HUD de jugadores y controles de fase por viewport.
5. `BoardActionControlsSection.tsx`
   - Paneles de historial/detalle y botones de acción globales.

