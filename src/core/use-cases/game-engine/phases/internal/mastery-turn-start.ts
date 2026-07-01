// src/core/use-cases/game-engine/phases/internal/mastery-turn-start.ts - Efectos de pasiva mastery al iniciar el turno propio (crecimiento de ATK y curación), con magnitud escalada por versión.
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { resolveAttackGrowthCap, resolvePassiveMagnitude } from "@/core/services/progression/mastery-passive-magnitude";

/** Crecimiento de ATK aplicado a una entity este turno (para emitir su VFX de buff). */
export interface IMasteryAttackGrowthEvent {
  instanceId: string;
  step: number;
}

export interface IMasteryAttackGrowthResult {
  entities: IBoardEntity[];
  growths: IMasteryAttackGrowthEvent[];
}

export interface IMasteryTurnStartResult {
  player: IPlayer;
  healAmount: number;
  attackGrowths: IMasteryAttackGrowthEvent[];
}

/** Aprendizaje Continuo: suma ATK por turno (escalado por versión) hasta el tope acumulado. */
export function applyMasteryAttackGrowth(entities: IBoardEntity[]): IMasteryAttackGrowthResult {
  const growths: IMasteryAttackGrowthEvent[] = [];
  const nextEntities = entities.map((entity) => {
    if (entity.card.masteryPassiveSkillId !== MASTERY_PASSIVE_IDS.ATK_GROWTH) return entity;
    const step = resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.ATK_GROWTH, entity.card.versionTier);
    const cap = resolveAttackGrowthCap(entity.card.versionTier);
    const currentGrowth = entity.masteryAttackGrowth ?? 0;
    if (currentGrowth >= cap) return entity;
    growths.push({ instanceId: entity.instanceId, step });
    return {
      ...entity,
      masteryAttackGrowth: currentGrowth + step,
      card: { ...entity.card, attack: (entity.card.attack ?? 0) + step },
    };
  });
  return { entities: nextEntities, growths };
}

/** Regeneración: curación de inicio de turno (escalada) si el jugador controla la pasiva. */
export function resolveMasteryTurnStartHeal(player: IPlayer): number {
  const healer = player.activeEntities.find(
    (entity) => entity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.HEAL_ON_TURN,
  );
  return healer ? resolvePassiveMagnitude(MASTERY_PASSIVE_IDS.HEAL_ON_TURN, healer.card.versionTier) : 0;
}

/**
 * Devuelve el jugador con el crecimiento de ATK y la curación de inicio de turno aplicados, más los
 * datos necesarios para emitir sus eventos de VFX (curación y buff de ATK por entity).
 */
export function applyMasteryTurnStart(player: IPlayer): IMasteryTurnStartResult {
  const healAmount = resolveMasteryTurnStartHeal(player);
  const { entities, growths } = applyMasteryAttackGrowth(player.activeEntities);
  return {
    player: {
      ...player,
      healthPoints: Math.min(player.maxHealthPoints, player.healthPoints + healAmount),
      activeEntities: entities,
    },
    healAmount,
    attackGrowths: growths,
  };
}
