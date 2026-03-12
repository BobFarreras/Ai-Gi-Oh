// src/core/use-cases/game-engine/fusion/internal/fusion-types.ts - Contratos tipados para contexto y resultado de resolución de fusión.
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { IFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";
import type { IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export interface IFusionContext {
  player: IPlayer;
  opponent: IPlayer;
  fusionCard: ICard;
  recipe: IFusionRecipe;
  materials: [IBoardEntity, IBoardEntity];
  mode: Extract<BattleMode, "ATTACK" | "DEFENSE">;
  idFactory?: IGameEngineIdFactory;
}

export interface IResolvedFusionState {
  updatedPlayer: IPlayer;
  materialCardIds: [string, string];
  fusionCardId: string;
}

