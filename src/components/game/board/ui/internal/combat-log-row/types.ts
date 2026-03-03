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
