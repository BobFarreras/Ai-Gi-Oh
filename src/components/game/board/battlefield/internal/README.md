<!-- src/components/game/board/battlefield/internal/README.md - Submódulos internos de Battlefield para tipos, vista, memoization y ajuste móvil. -->
# Battlefield Interno

## Qué contiene

1. `battlefield-types.ts`: contratos de props para fachada y vista.
2. `BattlefieldView.tsx`: render del tablero 3D desacoplado.
3. `use-battlefield-mobile-fit.ts`: ajuste móvil de escala y offset vertical.
4. `battlefield-props-equality.ts`: comparator memoizado de props.
5. Otros submódulos históricos:
`BattlefieldLanes`, `BattlefieldPiles`, `SlotCell`, `SlotCellEntity`, `slot-cell-*`, utilidades de visibilidad y motion.

