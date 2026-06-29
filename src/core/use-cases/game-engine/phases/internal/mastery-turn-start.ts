// src/core/use-cases/game-engine/phases/internal/mastery-turn-start.ts - Efectos de pasiva mastery al iniciar el turno propio (crecimiento de ATK y curación).
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";

/** Tope de crecimiento acumulado de ATK (evita bola de nieve) y paso por turno. */
const ATTACK_GROWTH_CAP = 500;
const ATTACK_GROWTH_STEP = 100;
const TURN_START_HEAL = 200;

/** Aprendizaje Continuo: +100 ATK permanente por turno hasta el tope de +500 acumulado. */
export function applyMasteryAttackGrowth(entities: IBoardEntity[]): IBoardEntity[] {
  return entities.map((entity) => {
    if (entity.card.masteryPassiveSkillId !== MASTERY_PASSIVE_IDS.ATK_GROWTH) return entity;
    const currentGrowth = entity.masteryAttackGrowth ?? 0;
    if (currentGrowth >= ATTACK_GROWTH_CAP) return entity;
    return {
      ...entity,
      masteryAttackGrowth: currentGrowth + ATTACK_GROWTH_STEP,
      card: { ...entity.card, attack: (entity.card.attack ?? 0) + ATTACK_GROWTH_STEP },
    };
  });
}

/** Regeneración: 200 HP si el jugador controla al menos una entity con la pasiva. */
export function resolveMasteryTurnStartHeal(player: IPlayer): number {
  const hasHealer = player.activeEntities.some(
    (entity) => entity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.HEAL_ON_TURN,
  );
  return hasHealer ? TURN_START_HEAL : 0;
}

/** Devuelve el jugador con el crecimiento de ATK y la curación de inicio de turno aplicados. */
export function applyMasteryTurnStart(player: IPlayer): IPlayer {
  const healAmount = resolveMasteryTurnStartHeal(player);
  return {
    ...player,
    healthPoints: Math.min(player.maxHealthPoints, player.healthPoints + healAmount),
    activeEntities: applyMasteryAttackGrowth(player.activeEntities),
  };
}
