// src/components/game/board/hooks/internal/opponent-turn/types.ts - Descripción breve del módulo.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";

export interface IOpponentTurnContext {
  gameState: GameState;
  strategy: IOpponentStrategy;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
  setIsAnimating: (value: boolean) => void;
  setActiveAttackerId: (value: string | null) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  setSelectedCard: (card: ICard | null) => void;
  requestTrapActivationDecision: (
    trapCard: ICard,
    trigger: "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED",
  ) => Promise<boolean>;
}

export interface IOpponentStepTimings {
  stepDelayMs: number;
  attackWindupMs: number;
  postResolutionMs: number;
  trapPreviewMs: number;
}

export interface IOpponentAutoPick {
  chooseCardToDiscard: (hand: ICard[]) => ICard | null;
  chooseEntityToSacrifice: (entities: IBoardEntity[]) => IBoardEntity | null;
}

