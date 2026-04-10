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
import { shouldHoldFragileFrontline } from "@/core/services/opponent/opponent-tactical-context";
import { IOpponentModeChangeDecision } from "@/core/services/opponent/types";
import { shouldSkipPlayForEnergy } from "@/core/services/opponent/opponent-energy-plan";
import { chooseFusionSetupPlay } from "@/core/services/opponent/opponent-fusion-plan";

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
    const fusionSetupPlay = chooseFusionSetupPlay(state, opponent, playable);
    if (fusionSetupPlay) {
      return fusionSetupPlay;
    }
    if (shouldSkipPlayForEnergy({ opponent, target, profile: this.profile, aiProfile: this.aiProfile, playableDecisions: playable })) {
      return null;
    }
    for (const decision of playable) {
      const { card, mode } = decision;
      if (shouldHoldFragileFrontline({ card, mode, opponent, target, profile: this.profile, aiProfile: this.aiProfile })) {
        continue;
      }
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

  public chooseModeChange(state: GameState, opponentId: string): IOpponentModeChangeDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    const defenders = opponent.activeEntities.filter((entity) =>
      (entity.mode === "DEFENSE" || entity.mode === "SET") &&
      !entity.hasAttackedThisTurn &&
      !entity.isNewlySummoned &&
      (!entity.modeLock || entity.modeLock === "ATTACK"),
    );
    if (defenders.length === 0) return null;
    const targetStats = target.activeEntities.map((entity) =>
      entity.mode === "DEFENSE" || entity.mode === "SET" ? (entity.card.defense ?? 0) : (entity.card.attack ?? 0));
    const canPressureSet = target.activeEntities.some((entity) => entity.mode === "SET");
    const bestRivalStat = targetStats.length > 0 ? Math.max(...targetStats) : 0;
    const orderedDefenders = [...defenders].sort((left, right) => (right.card.attack ?? 0) - (left.card.attack ?? 0));
    for (const defender of orderedDefenders) {
      const attack = defender.card.attack ?? 0;
      const canWinTrade = targetStats.some((stat) => attack >= stat);
      if (canWinTrade) return { instanceId: defender.instanceId, newMode: "ATTACK" };
      if (target.activeEntities.length === 0 && attack >= 1200) return { instanceId: defender.instanceId, newMode: "ATTACK" };
      if ((this.profile.key === "MASTER" || this.profile.key === "MYTHIC") && canPressureSet && attack >= 1700) {
        return { instanceId: defender.instanceId, newMode: "ATTACK" };
      }
      const controlHold = this.aiProfile.style === "control" && this.aiProfile.aggression < 0.5 && attack < bestRivalStat;
      if (controlHold) continue;
    }
    return null;
  }
}
