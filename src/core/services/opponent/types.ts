// src/core/services/opponent/types.ts - Contratos de decisión del rival compartidos por tablero y replay.
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
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

export interface IOpponentAutoPick {
  chooseCardToDiscard: (hand: ICard[]) => ICard | null;
  chooseEntityToSacrifice: (entities: IBoardEntity[]) => IBoardEntity | null;
}
