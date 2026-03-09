// src/components/game/board/battlefield/internal/battlefield-types.ts - Tipos compartidos del componente Battlefield y su vista interna.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";

export interface BattlefieldProps {
  playerActiveEntities: IBoardEntity[];
  playerActiveExecutions: IBoardEntity[];
  opponentActiveEntities: IBoardEntity[];
  opponentActiveExecutions: IBoardEntity[];
  playerDeckCount: number;
  playerFusionDeckCount: number;
  opponentDeckCount: number;
  opponentFusionDeckCount: number;
  playerTopGraveCard: ICard | null;
  opponentTopGraveCard: ICard | null;
  playerGraveyardCount: number;
  opponentGraveyardCount: number;
  playerDestroyedCount: number;
  opponentDestroyedCount: number;
  activeAttackerId: string | null;
  selectedCard: ICard | null;
  selectedBoardEntityInstanceId: string | null;
  revealedEntities?: string[];
  highlightedPlayerEntityIds?: string[];
  selectedFusionMaterialIds?: string[];
  damagedPlayerId?: string | null;
  damageEventId?: string | null;
  buffedEntityIds?: string[];
  buffStat?: "ATTACK" | "DEFENSE" | null;
  buffAmount?: number | null;
  buffEventId?: string | null;
  cardXpCardId?: string | null;
  cardXpAmount?: number | null;
  cardXpEventId?: string | null;
  cardXpActorPlayerId?: string | null;
  playerId: string;
  opponentId: string;
  canActivateSelectedExecution: boolean;
  viewportBoardScale?: number;
  isMobileLayout?: boolean;
  onActivateSelectedExecution: () => void;
  onGraveyardClick: (side: "player" | "opponent") => void;
  onDestroyedClick?: (side: "player" | "opponent") => void;
  onEntityClick: (entity: IBoardEntity | null, isOpponentSide: boolean, event: React.MouseEvent) => void;
}

export interface BattlefieldViewProps extends BattlefieldProps {
  zoom: number;
  effectiveBoardScale: number;
  mobileBoardOffsetY: number;
  onWheel: (event: React.WheelEvent) => void;
}
