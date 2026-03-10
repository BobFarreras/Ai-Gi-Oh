// src/components/game/board/battlefield/internal/slot-cell-types.ts - Tipos compartidos del componente SlotCell.
import { MouseEvent } from "react";
import { IBoardEntity } from "@/core/entities/IPlayer";

export interface SlotCellProps {
  index: number;
  entity: IBoardEntity | null;
  isOpponentSide: boolean;
  activeAttackerId: string | null;
  selectedCardId: string | null;
  selectedBoardEntityInstanceId: string | null;
  isSelectedByCard: boolean;
  isRevealed: boolean;
  isHighlighted: boolean;
  isSelectedMaterial: boolean;
  isBuffed: boolean;
  buffStat: "ATTACK" | "DEFENSE" | null;
  buffAmount: number | null;
  buffEventId: string | null;
  cardXpCardId: string | null;
  cardXpAmount: number | null;
  cardXpEventId: string | null;
  canActivateSelectedExecution: boolean;
  isMobileLayout?: boolean;
  onActivateSelectedExecution: () => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: MouseEvent) => void;
}

interface IStatFloatingEvent {
  id: string;
  type: "STAT";
  amount: number;
  stat: "ATTACK" | "DEFENSE";
}

interface IXpFloatingEvent {
  id: string;
  type: "XP";
  amount: number;
}

export type FloatingEvent = IStatFloatingEvent | IXpFloatingEvent;
