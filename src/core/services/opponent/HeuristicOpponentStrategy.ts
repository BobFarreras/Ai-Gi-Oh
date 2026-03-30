// src/core/services/opponent/HeuristicOpponentStrategy.ts - Estrategia heurística principal del bot para decidir jugadas y ataques.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentAttackDecision, IOpponentPlayDecision, IOpponentStrategy } from "./types";
import { resolveOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/resolve-opponent-difficulty-profile";
import { IOpponentDifficultyProfile, OpponentDifficulty } from "./difficulty/types";
import { chooseBestAttack } from "./attackEvaluator";
import { chooseFusionMaterials } from "@/core/services/opponent/heuristic-fusion-materials";
import { IStoryAiProfile, normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { buildPlayableCardDecisions } from "@/core/services/opponent/select-opponent-play";

function getPlayers(state: GameState, opponentId: string): { opponent: IPlayer; target: IPlayer } {
  if (state.playerA.id === opponentId) {
    return { opponent: state.playerA, target: state.playerB };
  }

  return { opponent: state.playerB, target: state.playerA };
}

interface IHeuristicOpponentStrategyConfig {
  difficulty?: OpponentDifficulty;
  aiProfile?: unknown;
}

export class HeuristicOpponentStrategy implements IOpponentStrategy {
  private readonly profile: IOpponentDifficultyProfile;
  private readonly aiProfile: IStoryAiProfile;

  public constructor(config?: IHeuristicOpponentStrategyConfig) {
    this.profile = resolveOpponentDifficultyProfile({ difficulty: config?.difficulty ?? "NORMAL", aiProfile: config?.aiProfile });
    this.aiProfile = config?.aiProfile ? normalizeStoryAiProfile(config.aiProfile, "STANDARD") : { style: "balanced", aggression: 0.5 };
  }

  public choosePlay(state: GameState, opponentId: string): IOpponentPlayDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    const playable = buildPlayableCardDecisions({ opponent, target, profile: this.profile, aiProfile: this.aiProfile });
    for (const decision of playable) {
      const { card, mode } = decision;
      if (card.type === "FUSION") {
        const fusionMaterials = chooseFusionMaterials(opponent, card);
        if (!fusionMaterials || state.hasNormalSummonedThisTurn) {
          continue;
        }
        return { cardId: card.id, mode, fusionMaterialInstanceIds: fusionMaterials };
      }

      if (card.type === "ENTITY") {
        if (state.hasNormalSummonedThisTurn || opponent.activeEntities.length >= 3) {
          continue;
        }
        return { cardId: card.id, mode };
      }

      if (card.type === "EXECUTION") {
        if (opponent.activeExecutions.length >= 3) {
          continue;
        }
        return { cardId: card.id, mode };
      }

      if (card.type === "TRAP") {
        if (opponent.activeExecutions.length >= 3) {
          continue;
        }

        return { cardId: card.id, mode: "SET" };
      }
    }

    return null;
  }

  public chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    const normalizedOpponent: IPlayer = {
      ...opponent,
      activeEntities: opponent.activeEntities.map((entity) =>
        entity.isNewlySummoned ? { ...entity, isNewlySummoned: false } : entity,
      ),
    };

    return chooseBestAttack(normalizedOpponent, target, this.profile);
  }
}
