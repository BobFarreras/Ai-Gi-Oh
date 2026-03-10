// src/components/game/board/ui/internal/combat-log-row/types.ts - Descripción breve del módulo.
import { ICard } from "@/core/entities/ICard";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export interface ICombatLogEventRowProps {
  event: ICombatLogEvent;
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  cardLookup: Record<string, ICard>;
  onCardClick?: (card: ICard) => void;
}

