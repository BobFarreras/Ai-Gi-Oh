// src/core/services/opponent/types.ts - Descripción breve del módulo.
import { BattleMode } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

export interface IOpponentPlayDecision {
  cardId: string;
  mode: BattleMode;
  fusionMaterialInstanceIds?: [string, string];
  replaceEntityInstanceId?: string;
  replaceExecutionInstanceId?: string;
}

export interface IOpponentAttackDecision {
  attackerInstanceId: string;
  defenderInstanceId?: string;
}

export interface IOpponentModeChangeDecision {
  instanceId: string;
  newMode: "ATTACK" | "DEFENSE";
}

export interface IOpponentStrategy {
  choosePlay(state: GameState, opponentId: string): IOpponentPlayDecision | null;
  chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null;
  chooseModeChange?(state: GameState, opponentId: string): IOpponentModeChangeDecision | null;
}

