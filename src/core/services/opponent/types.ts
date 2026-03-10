// src/core/services/opponent/types.ts - Descripción breve del módulo.
import { BattleMode } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

export interface IOpponentPlayDecision {
  cardId: string;
  mode: BattleMode;
  fusionMaterialInstanceIds?: [string, string];
}

export interface IOpponentAttackDecision {
  attackerInstanceId: string;
  defenderInstanceId?: string;
}

export interface IOpponentStrategy {
  choosePlay(state: GameState, opponentId: string): IOpponentPlayDecision | null;
  chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null;
}

