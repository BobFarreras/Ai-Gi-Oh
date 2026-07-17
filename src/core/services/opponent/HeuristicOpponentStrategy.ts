// src/core/services/opponent/HeuristicOpponentStrategy.ts - Estrategia heurística principal del bot para decidir jugadas y ataques.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentAttackDecision, IOpponentPlayDecision, IOpponentStrategy } from "./types";
import { resolveOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/resolve-opponent-difficulty-profile";
import { IOpponentDifficultyProfile, OpponentDifficulty } from "./difficulty/types";
import { chooseBestAttack } from "./attackEvaluator";
import { isDirectAttackBlocked } from "@/core/use-cases/game-engine/state/status-effects";
import { canNormalSummon } from "@/core/use-cases/game-engine/state/summon-rules";
import { chooseFusionMaterials } from "@/core/services/opponent/heuristic-fusion-materials";
import { IStoryAiProfile, normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { buildPlayableCardDecisions } from "@/core/services/opponent/select-opponent-play";
import { shouldHoldFragileFrontline, shouldHoldToBaitReactiveTrap } from "@/core/services/opponent/opponent-tactical-context";
import { IOpponentModeChangeDecision } from "@/core/services/opponent/types";
import { shouldSkipPlayForEnergy } from "@/core/services/opponent/opponent-energy-plan";
import { chooseFusionSetupPlay } from "@/core/services/opponent/opponent-fusion-plan";
import { isPendingFusionMaterial } from "@/core/services/opponent/opponent-fusion-execution";
import { chooseEntityZoneReplacement, chooseExecutionZoneReplacement } from "@/core/services/opponent/opponent-zone-replacement";

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
    // Planificar/completar fusiones es jugada BÁSICA universal (todos los tiers): montar la fusión si se tienen
    // las piezas. Un EASY también debe saber hacerla.
    const fusionSetupPlay = chooseFusionSetupPlay(state, opponent, target, playable);
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
      // Gating escalonado (ficha 5): cebar una trampa reactiva retrasando el desarrollo es skill de experto (MASTER+).
      if (this.profile.skill.baitReactiveTrap && shouldHoldToBaitReactiveTrap({ card, mode, opponent, target })) {
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
        if (!canNormalSummon(state)) {
          continue;
        }
        // Zona de entities llena: ficha 5 fase 3 — rotar la peor si la nueva es claramente mejor.
        if (opponent.activeEntities.length >= 3) {
          const replaceEntityInstanceId = chooseEntityZoneReplacement(opponent, card);
          if (!replaceEntityInstanceId) continue;
          return { cardId: card.id, mode, replaceEntityInstanceId };
        }
        return { cardId: card.id, mode };
      }

      if (card.type === "EXECUTION") {
        // Zona de magias/trampas llena: reemplazar la peor puesta si la nueva compensa.
        if (opponent.activeExecutions.length >= 3) {
          const replaceExecutionInstanceId = chooseExecutionZoneReplacement(opponent, card);
          if (!replaceExecutionInstanceId) continue;
          return { cardId: card.id, mode, replaceExecutionInstanceId };
        }
        return { cardId: card.id, mode };
      }

      if (card.type === "TRAP") {
        if (opponent.activeExecutions.length >= 3) {
          const replaceExecutionInstanceId = chooseExecutionZoneReplacement(opponent, card);
          if (!replaceExecutionInstanceId) continue;
          return { cardId: card.id, mode: "SET", replaceExecutionInstanceId };
        }

        return { cardId: card.id, mode: "SET" };
      }
    }

    return null;
  }

  public chooseAttack(state: GameState, opponentId: string): IOpponentAttackDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    // NO atacar con materiales de una fusión pendiente (universal): hay que conservarlos vivos hasta juntar el
    // par. Se marcan como "ya atacaron" en la copia local para excluirlos como atacantes, sin sacarlos del
    // tablero (siguen defendiendo). Ficha 5: fusión efectiva.
    const normalizedOpponent: IPlayer = {
      ...opponent,
      activeEntities: opponent.activeEntities.map((entity) => {
        if (isPendingFusionMaterial(entity.card, opponent)) return { ...entity, hasAttackedThisTurn: true };
        return entity.isNewlySummoned ? { ...entity, isNewlySummoned: false } : entity;
      }),
    };

    return chooseBestAttack(normalizedOpponent, target, this.profile, isDirectAttackBlocked(state.activeStatusEffects, opponentId));
  }

  public chooseModeChange(state: GameState, opponentId: string): IOpponentModeChangeDecision | null {
    const { opponent, target } = getPlayers(state, opponentId);
    // 1) Oportunidad ofensiva: pasar un defensor a ATAQUE si le compensa.
    const promote = this.chooseDefenderToAttack(opponent, target);
    if (promote) return promote;
    // 2) Repliegue defensivo: pasar a DEFENSA un tanque que está en ATAQUE y no aguantaría el turno.
    return this.chooseAttackerToDefend(opponent, target);
  }

  /** Stats rivales relevantes para intercambios: defensa si se defienden, ataque si atacan. */
  private resolveTargetStats(target: IPlayer): number[] {
    return target.activeEntities.map((entity) =>
      entity.mode === "DEFENSE" || entity.mode === "SET" ? (entity.card.defense ?? 0) : (entity.card.attack ?? 0));
  }

  /** Promueve un defensor a ATAQUE cuando puede ganar un intercambio o presionar (lógica previa). */
  private chooseDefenderToAttack(opponent: IPlayer, target: IPlayer): IOpponentModeChangeDecision | null {
    const defenders = opponent.activeEntities.filter((entity) =>
      (entity.mode === "DEFENSE" || entity.mode === "SET") &&
      !entity.hasAttackedThisTurn &&
      !entity.isNewlySummoned &&
      (!entity.modeLock || entity.modeLock === "ATTACK"),
    );
    if (defenders.length === 0) return null;
    const targetStats = this.resolveTargetStats(target);
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

  /**
   * Repliega a DEFENSA una entity en ATAQUE que va a PERDER el intercambio contra el mejor atacante rival.
   * Regla base del juego (CombatService) que TODOS los perfiles deben conocer: si la matan estando en
   * ATAQUE, además reparte "trample" (daño directo a su dueño); en DEFENSA, si la matan NO hay daño
   * penetrante, y su DEF puede incluso rebotar. Por eso, si `ataque < amenaza rival`, DEFENSA es SIEMPRE
   * mejor (sobreviva o no la defensa) — antes solo se replegaba si la defensa aguantaba, dejando morir en
   * ataque a las que no. Sólo se replega si NO puede ganar ningún intercambio atacando (anti-oscilación con
   * la fase de promoción: cada repliegue reduce de forma monótona los tanques en ATAQUE candidatos).
   */
  private chooseAttackerToDefend(opponent: IPlayer, target: IPlayer): IOpponentModeChangeDecision | null {
    const attackers = opponent.activeEntities.filter((entity) =>
      entity.mode === "ATTACK" &&
      !entity.hasAttackedThisTurn &&
      !entity.isNewlySummoned &&
      (!entity.modeLock || entity.modeLock === "DEFENSE"),
    );
    if (attackers.length === 0) return null;
    // Amenaza real = mayor ATAQUE entre las entidades rivales EN ATAQUE (las que pueden golpearnos).
    const rivalThreat = target.activeEntities.reduce(
      (best, entity) => (entity.mode === "ATTACK" ? Math.max(best, entity.card.attack ?? 0) : best), 0);
    if (rivalThreat === 0) return null; // Sin atacantes rivales no hay a quién temer: mantener presión.
    const targetStats = this.resolveTargetStats(target);
    const canPressureSet = target.activeEntities.some((entity) => entity.mode === "SET");
    // Replegar primero el tanque de mayor defensa (aguanta mejor y libera valor de tablero).
    const orderedTanks = [...attackers].sort((left, right) => (right.card.defense ?? 0) - (left.card.defense ?? 0));
    for (const tank of orderedTanks) {
      const attack = tank.card.attack ?? 0;
      // Guard anti-oscilación: si podría ganar un intercambio atacando, la promoción lo re-subiría.
      if (targetStats.some((stat) => attack >= stat)) continue;
      if ((this.profile.key === "MASTER" || this.profile.key === "MYTHIC") && canPressureSet && attack >= 1700) continue;
      // Pierde el intercambio contra el mayor atacante rival → en ataque muere Y regala trample. DEFENSA mejor.
      if (attack < rivalThreat) {
        return { instanceId: tank.instanceId, newMode: "DEFENSE" };
      }
    }
    return null;
  }
}
