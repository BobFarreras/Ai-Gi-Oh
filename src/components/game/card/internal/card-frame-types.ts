// src/components/game/card/internal/card-frame-types.ts - Tipos compartidos del frame visual de carta.
import { ICard } from "@/core/entities/ICard";

export interface ICardFrameProps {
  card: ICard;
  factionStyles: { wrapper: string; inner: string };
  isSelected: boolean;
  isOnBoard: boolean;
  disableHoverEffects?: boolean;
  disableDefaultShadow?: boolean;
  isPerformanceMode?: boolean;
  showBackgroundInPerformanceMode?: boolean;
  onClick?: (card: ICard) => void;
  versionTier: number;
  level: number;
  xp: number;
  masteryPassiveLabel?: string | null;
}

