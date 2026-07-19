// src/core/services/opponent/select-opponent-play.ts - Construye decisiones jugables del bot con contexto táctico de tablero y efectos.
import { BattleMode, IPlayer } from "@/core/entities/IPlayer";
import { ICard } from "@/core/entities/ICard";
import { IOpponentDifficultyProfile } from "@/core/services/opponent/difficulty/types";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { scoreEntity, scoreExecution, scoreFusion, scoreTrap } from "@/core/services/opponent/heuristic-score";
import { canActivateFusionExecutionNow } from "@/core/services/opponent/opponent-fusion-execution";
import { resolveTacticalCardBonus } from "@/core/services/opponent/opponent-tactical-context";
import { resolveSynergyBonus } from "@/core/services/opponent/opponent-synergy";

export interface IPlayableCardDecision {
  card: ICard;
  score: number;
  mode: BattleMode;
}

function resolveEntityMode(
  card: ICard,
  opponent: IPlayer,
  target: IPlayer,
  profile: IOpponentDifficultyProfile,
  aiProfile: IStoryAiProfile,
): BattleMode {
  const attack = card.attack ?? 0;
  const defense = card.defense ?? 0;
  const rivalBestAttack = target.activeEntities.reduce((best, entity) => Math.max(best, entity.card.attack ?? 0), 0);
  // Amenaza REAL a una recién invocada: el mayor ATK entre rivales EN ATAQUE (los que pueden golpearla el
  // próximo turno). Una entity en DEFENSA/SET no ataca, así que no cuenta como amenaza inmediata.
  const rivalAttackThreat = target.activeEntities.reduce(
    (best, entity) => (entity.mode === "ATTACK" ? Math.max(best, entity.card.attack ?? 0) : best), 0);
  const hasOwnAttacker = opponent.activeEntities.some((entity) => entity.mode === "ATTACK" && !entity.isNewlySummoned);
  const hasHiddenTarget = target.activeEntities.some((entity) => entity.mode === "SET");
  const shouldForcePressure =
    !hasOwnAttacker &&
    (aiProfile.style === "aggressive" || aiProfile.style === "combo" || aiProfile.aggression >= 0.58) &&
    attack >= Math.max(1200, Math.trunc(defense * 0.85));
  if (shouldForcePressure) return "ATTACK";
  if (hasHiddenTarget && attack >= 1700 && aiProfile.aggression >= 0.5) return "ATTACK";
  // Ficha 5 fase 2 (TODOS los perfiles): la recién invocada no ataca este turno. Si NO gana el intercambio
  // contra el mejor atacante rival, en ATAQUE solo se expone al trample (daño directo al perderlo); en
  // DEFENSA no hay daño penetrante y su DEF puede rebotar. La promoción a ataque llega luego, cuando compensa.
  if (rivalAttackThreat > 0 && attack < rivalAttackThreat) return "DEFENSE";
  if (defense > attack && defense >= rivalBestAttack) return "DEFENSE";
  return attack >= defense ? "ATTACK" : "DEFENSE";
}

function hasOwnCardRequiringProgress(opponent: IPlayer, targetCardId: string, level: number, versionTier: number): boolean {
  const allCards = [...opponent.hand, ...opponent.deck, ...opponent.graveyard, ...(opponent.destroyedPile ?? []), ...opponent.activeEntities.map((entity) => entity.card)];
  return allCards.some((card) =>
    card.id === targetCardId && ((card.level ?? 1) < level || (card.versionTier ?? 1) < versionTier));
}

function hasArchetypeEntity(opponent: IPlayer, archetype?: ICard["archetype"]): boolean {
  if (!archetype) return false;
  return opponent.activeEntities.some((entity) => entity.card.archetype === archetype);
}

function totalAttack(player: IPlayer): number {
  return player.activeEntities.reduce((sum, entity) => sum + (entity.card.attack ?? 0), 0);
}

/** Heurística de la IA para las magias del lote nuevo (robos, intercambios, control...). */
function canActivateNewBatchExecutionNow(effect: NonNullable<ICard["effect"]>, opponent: IPlayer, target: IPlayer): boolean {
  if (effect.action === "BOOST_ATTACK_BY_CARD_ID") return opponent.activeEntities.some((entity) => entity.card.id === effect.targetCardId);
  if (effect.action === "DAMAGE_IF_ALLY_ON_BOARD") return opponent.activeEntities.some((entity) => entity.card.id === effect.requiredCardId);
  if (effect.action === "APPLY_NO_DIRECT_ATTACKS") return true;
  // Atacar en defensa: activar solo si hay muros en defensa que se beneficien (si no, se setea/espera).
  if (effect.action === "ALLOW_DEFENSE_MODE_ATTACK") {
    return opponent.activeEntities.some((entity) => (entity.mode === "DEFENSE" || entity.mode === "SET") && (entity.card.defense ?? 0) >= 1200);
  }
  if (effect.action === "DESTROY_OPPONENT_ENTITY" || effect.action === "FLIP_OPPONENT_ENTITY_TO_DEFENSE") return target.activeEntities.length > 0;
  if (effect.action === "SACRIFICE_ALLY_ENTITY_FOR_ENERGY") return opponent.activeEntities.length > 0;
  if (effect.action === "GRANT_EXTRA_SUMMON") return opponent.hand.filter((card) => card.type === "ENTITY").length >= 2 && opponent.activeEntities.length <= 1;
  if (effect.action === "SWAP_HANDS") return opponent.hand.length < target.hand.length;
  if (effect.action === "SWAP_BOARD_ENTITIES") return totalAttack(target) > totalAttack(opponent);
  if (effect.action === "STEAL_OPPONENT_ENTITY") return target.activeEntities.length > 0 && opponent.activeEntities.length < 3;
  if (effect.action === "STEAL_OPPONENT_EXECUTION") return target.activeExecutions.length > 0;
  return false;
}

export function canActivateExecutionNow(card: ICard, opponent: IPlayer, target: IPlayer): boolean {
  if (card.type !== "EXECUTION") return false;
  const effect = card.effect;
  if (!effect) return false;
  if (canActivateNewBatchExecutionNow(effect, opponent, target)) return true;
  if (effect.action === "DAMAGE" || effect.action === "DRAW_CARD" || effect.action === "RESTORE_ENERGY" || effect.action === "DRAIN_OPPONENT_ENERGY") return true;
  if (effect.action === "REDUCE_OPPONENT_ATTACK" || effect.action === "REDUCE_OPPONENT_DEFENSE") return target.activeEntities.length > 0;
  if (effect.action === "DESTROY_ALL_TRAPS") return target.activeExecutions.some((entity) => entity.card.type === "TRAP");
  if (effect.action === "DISCARD_OPPONENT_HAND_CARD") return target.hand.length > 0;
  if (effect.action === "LOCK_OPPONENT_ENTITY") return target.activeEntities.length > 0;
  if (effect.action === "HEAL") return opponent.healthPoints < opponent.maxHealthPoints;
  if (effect.action === "BOOST_ATTACK_ALLIED_ENTITY") return opponent.activeEntities.length > 0;
  if (effect.action === "BOOST_DEFENSE_BY_ARCHETYPE" || effect.action === "BOOST_ATTACK_BY_ARCHETYPE") return hasArchetypeEntity(opponent, effect.archetype);
  if (effect.action === "SET_DEFENSE_BY_CARD_ID" || effect.action === "BOOST_DEFENSE_BY_CARD_ID") {
    return opponent.activeEntities.some((entity) => entity.card.id === effect.targetCardId);
  }
  if (effect.action === "SET_CARD_DUEL_PROGRESS") {
    return hasOwnCardRequiringProgress(opponent, effect.targetCardId, effect.level, effect.versionTier);
  }
  if (effect.action === "RETURN_GRAVEYARD_CARD_TO_HAND" || effect.action === "RETURN_GRAVEYARD_CARD_TO_FIELD") {
    return opponent.graveyard.some((graveCard) => !effect.cardType || graveCard.type === effect.cardType);
  }
  if (effect.action === "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND") {
    return target.graveyard.some((graveCard) => !effect.cardType || graveCard.type === effect.cardType);
  }
  if (effect.action === "REVEAL_OPPONENT_SET_CARD") {
    const setEntities = effect.zone !== "EXECUTIONS" && target.activeEntities.some((entity) => entity.mode === "SET");
    const setExecutions = effect.zone !== "ENTITIES" && target.activeExecutions.some((entity) => entity.mode === "SET");
    return setEntities || setExecutions;
  }
  if (effect.action === "DIRECT_ATTACK_ENERGY_DRAIN_AND_SET_SELF_TO_TEN") return target.activeEntities.length === 0;
  if (effect.action === "FUSION_SUMMON") return canActivateFusionExecutionNow(opponent, card);
  return false;
}

function resolveExecutionMode(card: ICard, opponent: IPlayer, target: IPlayer): BattleMode {
  return canActivateExecutionNow(card, opponent, target) ? "ACTIVATE" : "SET";
}

function scoreCardWithContext(
  card: ICard,
  opponent: IPlayer,
  target: IPlayer,
  profile: IOpponentDifficultyProfile,
  aiProfile: IStoryAiProfile,
): number {
  const base =
    card.type === "ENTITY"
      ? scoreEntity(card, profile)
      : card.type === "FUSION"
        ? scoreFusion(card, profile)
        : card.type === "TRAP"
          ? scoreTrap(card)
          : scoreExecution(card, profile);
  // Gating escalonado (ficha 5): solo los tiers con skill `combos` (HARD+) reconocen sinergias de combo;
  // EASY/NORMAL juegan las piezas "a ciegas" (más simples/peores), sin priorizar montarlas ni evitar quemarlas.
  const synergy = profile.skill.combos ? resolveSynergyBonus(card, opponent) : 0;
  if (card.type === "TRAP") return (aiProfile.style === "control" ? base + 220 : base) + synergy;
  if (card.type !== "EXECUTION") return base + synergy;
  const mode = resolveExecutionMode(card, opponent, target);
  const effect = card.effect;
  // La sinergia se suma vía activateBonus, que entra en TODOS los returns de la rama de ejecución.
  const activateBonus = (mode === "ACTIVATE" ? 460 : -220) + synergy;
  if (!effect) return base + activateBonus;
  if (effect.action === "DAMAGE" && effect.target === "OPPONENT") {
    const lethalBonus = effect.value >= target.healthPoints ? 9000 : 0;
    return base + activateBonus + lethalBonus;
  }
  if (effect.action === "HEAL") {
    const lowHpBonus = opponent.healthPoints <= Math.floor(opponent.maxHealthPoints * 0.45) ? 650 : 0;
    return base + activateBonus + lowHpBonus;
  }
  if (effect.action === "REVEAL_OPPONENT_SET_CARD") {
    const hasTargets = target.activeEntities.some((entity) => entity.mode === "SET") || target.activeExecutions.some((entity) => entity.mode === "SET");
    return base + activateBonus + (hasTargets ? 720 : -280);
  }
  if (effect.action === "REDUCE_OPPONENT_ATTACK") {
    const hasAttackers = target.activeEntities.some((entity) => (entity.card.attack ?? 0) > 0);
    return base + activateBonus + (hasAttackers ? 220 : -260);
  }
  if (effect.action === "DESTROY_ALL_TRAPS") {
    const hasTraps = target.activeExecutions.some((entity) => entity.card.type === "TRAP");
    return base + activateBonus + (hasTraps ? 680 : -320);
  }
  if (effect.action === "DISCARD_OPPONENT_HAND_CARD") {
    return base + activateBonus + (target.hand.length > 0 ? 240 : -320);
  }
  if (effect.action === "LOCK_OPPONENT_ENTITY") {
    return base + activateBonus + (target.activeEntities.length > 0 ? 380 : -320);
  }
  return base + activateBonus;
}

/** Construye y ordena opciones jugables según coste, contexto y estilo IA del duelo. */
export function buildPlayableCardDecisions(input: {
  opponent: IPlayer;
  target: IPlayer;
  profile: IOpponentDifficultyProfile;
  aiProfile: IStoryAiProfile;
}): IPlayableCardDecision[] {
  const playableCards = input.opponent.hand.filter((card) => card.cost <= input.opponent.currentEnergy);
  return playableCards
    .map((card) => {
      const mode = card.type === "ENTITY" || card.type === "FUSION"
        ? resolveEntityMode(card, input.opponent, input.target, input.profile, input.aiProfile)
        : card.type === "EXECUTION"
          ? resolveExecutionMode(card, input.opponent, input.target)
          : "SET";
      return {
        card,
        mode,
        score: scoreCardWithContext(card, input.opponent, input.target, input.profile, input.aiProfile)
          + resolveTacticalCardBonus({ card, mode, opponent: input.opponent, target: input.target, aiProfile: input.aiProfile }),
      };
    })
    .sort((a, b) => b.score - a.score);
}
