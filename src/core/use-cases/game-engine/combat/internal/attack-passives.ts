// src/core/use-cases/game-engine/combat/internal/attack-passives.ts - Reglas puras de pasivas mastery aplicadas durante combate (magnitud escalada por versión).
import { IBoardEntity } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { resolvePassiveMagnitude } from "@/core/services/progression/mastery-passive-magnitude";

/** Magnitud de una pasiva concreta para esta entity (0 si no la tiene). */
function magnitudeFor(entity: IBoardEntity, passiveId: string): number {
  if (entity.card.masteryPassiveSkillId !== passiveId) return 0;
  return resolvePassiveMagnitude(passiveId, entity.card.versionTier);
}

/** Carga Letal: bonus de daño cuando el atacante golpea directo al rival. */
export function resolveDirectHitBonus(attackerEntity: IBoardEntity): number {
  return magnitudeFor(attackerEntity, MASTERY_PASSIVE_IDS.DIRECT_HIT);
}

/** Drenaje de ATK: el defensor reduce el ATK del atacante al ser atacado. */
export function applyAttackDrainByDefenderPassive(attackerAttack: number, defenderEntity: IBoardEntity): number {
  return Math.max(0, attackerAttack - magnitudeFor(defenderEntity, MASTERY_PASSIVE_IDS.ATK_DRAIN));
}

/** Sobrecarga: bonus de ATK efímero cuando el atacante embiste a una entity rival. */
export function resolveEntityAttackBonus(attackerEntity: IBoardEntity): number {
  return magnitudeFor(attackerEntity, MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS);
}

/** Cortafuegos Reactivo: el defensor refleja daño directo al jugador atacante. */
export function resolveDefenderReflectDamage(defenderEntity: IBoardEntity): number {
  return magnitudeFor(defenderEntity, MASTERY_PASSIVE_IDS.REFLECT_DAMAGE);
}

/** Autoguardado: devuelve energía a su dueño cuando la entity es destruida. */
export function resolveEnergyRefundOnDeath(entity: IBoardEntity): number {
  return magnitudeFor(entity, MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH);
}
