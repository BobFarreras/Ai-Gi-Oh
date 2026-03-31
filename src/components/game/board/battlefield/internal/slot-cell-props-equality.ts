// src/components/game/board/battlefield/internal/slot-cell-props-equality.ts - Comparator memoizado para evitar re-renders innecesarios en SlotCell.
import { SlotCellProps } from "@/components/game/board/battlefield/internal/slot-cell-types";

export function areEqualSlotCellProps(previous: SlotCellProps, next: SlotCellProps): boolean {
  return (
    previous.laneType === next.laneType &&
    previous.index === next.index &&
    previous.entity === next.entity &&
    previous.isOpponentSide === next.isOpponentSide &&
    previous.activeAttackerId === next.activeAttackerId &&
    previous.selectedCardId === next.selectedCardId &&
    previous.selectedBoardEntityInstanceId === next.selectedBoardEntityInstanceId &&
    previous.isSelectedByCard === next.isSelectedByCard &&
    previous.isRevealed === next.isRevealed &&
    previous.isHighlighted === next.isHighlighted &&
    previous.isSelectedMaterial === next.isSelectedMaterial &&
    previous.isBuffed === next.isBuffed &&
    previous.buffStat === next.buffStat &&
    previous.buffAmount === next.buffAmount &&
    previous.buffEventId === next.buffEventId &&
    previous.cardXpCardId === next.cardXpCardId &&
    previous.cardXpAmount === next.cardXpAmount &&
    previous.cardXpEventId === next.cardXpEventId &&
    previous.isMobileLayout === next.isMobileLayout &&
    previous.onEntityClick === next.onEntityClick
  );
}
