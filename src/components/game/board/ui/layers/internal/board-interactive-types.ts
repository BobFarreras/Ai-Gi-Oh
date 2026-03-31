// src/components/game/board/ui/layers/internal/board-interactive-types.ts - Contratos compartidos del layer interactivo del tablero.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardViewportMetrics } from "@/components/game/board/hooks/internal/layout/board-layout-metrics";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

export interface IBoardLayerPlayerState {
  id: string;
  hand: ICard[];
  deck: ICard[];
  fusionDeck?: ICard[];
  graveyard: ICard[];
  destroyedPile?: ICard[];
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
}

export interface IBoardInteractiveLayerProps {
  gameState: GameState;
  player: IBoardLayerPlayerState;
  opponent: IBoardLayerPlayerState;
  phase: string;
  hasNormalSummonedThisTurn: boolean;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  playingCard: ICard | null;
  activeAttackerId: string | null;
  revealedEntities: string[];
  pendingEntitySelectionIds: string[];
  pendingFusionSelectedEntityIds: string[];
  pendingDiscardCardIds: string[];
  isHistoryOpen: boolean;
  isPlayerTurn: boolean;
  canActivateSelectedExecution: boolean;
  pendingTrapActivationPrompt?: ITrapActivationPrompt | null;
  canSetSelectedEntityToAttack?: boolean;
  lastDamageTargetPlayerId: string | null;
  lastDamageEventId: string | null;
  lastBuffTargetEntityIds: string[];
  lastBuffStat: string | null;
  lastBuffAmount: number | null;
  lastBuffEventId: string | null;
  lastCardXpCardId: string | null;
  lastCardXpAmount: number | null;
  lastCardXpEventId: string | null;
  lastCardXpActorPlayerId: string | null;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onFusionDeckClick?: (side: "player" | "opponent") => void;
  onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => Promise<void>;
  onMandatoryCardSelect: (cardId: string) => void;
  onCardClick: (card: ICard, event?: React.MouseEvent) => void;
  onPlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>;
  onActivateSelectedExecution: () => void;
  onActivatePendingTrap?: () => void;
  onSkipPendingTrap?: () => void;
  onSetSelectedEntityToAttack?: () => void;
  onSelectCard: (card: ICard) => void;
  onCloseCard: () => void;
  onCloseHistory: () => void;
  isMobileLayout?: boolean;
}

export interface IBoardSelectionState {
  isBattlePhase: boolean;
  overlaySource: "BOARD" | "HAND";
  isOpponentBoardSelection: boolean;
  selectedOverlayCard: ICard | null;
  shouldRenderMobileOverlay: boolean;
}

export interface IBoardInteractiveLayerViewProps extends IBoardInteractiveLayerProps {
  viewport: IBoardViewportMetrics;
  selection: IBoardSelectionState;
}
