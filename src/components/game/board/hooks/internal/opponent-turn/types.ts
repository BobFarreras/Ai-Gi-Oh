// src/components/game/board/hooks/internal/opponent-turn/types.ts - Contexto de presentación del turno rival (la decisión vive en core).
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { RequestTrapActivationDecision } from "../match/useMatchRuntime.builders";
import { IMatchActionPayload } from "@/core/entities/match";

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
  requestTrapActivationDecision: RequestTrapActivationDecision;
  emitCommittedAction?: (actorPlayerId: string, action: IMatchActionPayload) => void;
}

export interface IOpponentStepTimings {
  stepDelayMs: number;
  attackWindupMs: number;
  postResolutionMs: number;
  trapPreviewMs: number;
}

