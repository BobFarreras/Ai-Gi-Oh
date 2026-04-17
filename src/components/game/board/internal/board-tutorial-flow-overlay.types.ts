// src/components/game/board/internal/board-tutorial-flow-overlay.types.ts - Contrato de props para overlay tutorial del tablero.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export interface IBoardTutorialFlowOverlayProps {
  combatLog: ICombatLogEvent[];
  selectedCardId: string | null;
  hasPendingTrapPrompt: boolean;
  phase: string;
  isGraveyardOpen: boolean;
  isFusionCinematicActive: boolean;
  fusionSelectedCount: number;
  isFusionBrowserOpen: boolean;
  hasWinner: boolean;
  onFlowFinished?: () => void;
}
