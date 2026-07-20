// src/components/game/board/hooks/internal/player-actions/types.ts - Define contratos tipados para acciones del jugador dentro del hook de tablero.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";
import { IPendingZoneReplacement } from "../board-state/pending-replacement";
import { ITrapActivationDecision, ITrapEligibleOption, TrapDecisionTrigger } from "../board-state/useBoardUiState";

/**
 * Solicita al jugador decidir qué trampa reactiva activar (ficha 4): recibe TODAS las elegibles y resuelve
 * con la elegida (o "pasar"). Para un único candidato (contra-trampa) se pasa una lista de un elemento.
 */
export type RequestTrapActivationDecision = (
  traps: ITrapEligibleOption[],
  trigger: TrapDecisionTrigger,
  options?: { autoPassAfterMs?: number },
) => Promise<ITrapActivationDecision>;

export interface IUsePlayerActionsParams {
  gameState: GameState;
  /** Ficha 4: en multijugador el ataque DEFIERE la trampa reactiva para que el defensor elija en su cliente. */
  isMultiplayer: boolean;
  isAnimating: boolean;
  playingCard: ICard | null;
  activeAttackerId: string | null;
  pendingEntityReplacement: IPendingZoneReplacement | null;
  pendingEntityReplacementTargetId: string | null;
  pendingFusionSummon: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  requestTrapActivationDecision: RequestTrapActivationDecision;
  clearSelection: () => void;
  clearError: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  setSelectedCard: (card: ICard | null) => void;
  setSelectedBoardEntityInstanceId: (value: string | null) => void;
  setPlayingCard: (card: ICard | null) => void;
  setActiveAttackerId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setIsAnimating: (value: boolean) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  setPendingEntityReplacement: (value: IPendingZoneReplacement | null) => void;
  setPendingEntityReplacementTargetId: (value: string | null) => void;
  setPendingFusionSummon: (value: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null) => void;
  setStagedCardId: (value: string | null) => void;
  setLastError: (value: IBoardUiError | null) => void;
}

export interface IPlayerActions {
  toggleCardSelection: (card: ICard, event?: React.MouseEvent) => void;
  executePlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => Promise<void>;
}
