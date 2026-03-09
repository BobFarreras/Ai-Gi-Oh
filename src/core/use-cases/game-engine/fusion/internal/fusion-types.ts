// src/core/use-cases/game-engine/fusion/internal/fusion-types.ts - Descripción breve del módulo.
import { BattleMode, IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { IFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

export interface IFusionContext {
  player: IPlayer;
  opponent: IPlayer;
  fusionCard: ICard;
  recipe: IFusionRecipe;
  materials: [IBoardEntity, IBoardEntity];
  mode: Extract<BattleMode, "ATTACK" | "DEFENSE">;
}

export interface IResolvedFusionState {
  updatedPlayer: IPlayer;
  materialCardIds: [string, string];
  fusionCardId: string;
}

