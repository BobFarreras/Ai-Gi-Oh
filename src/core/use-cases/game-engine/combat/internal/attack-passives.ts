// src/core/use-cases/game-engine/combat/internal/attack-passives.ts - Reglas puras de pasivas mastery aplicadas durante combate.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";

/** Carga Letal: bonus de daño cuando el atacante golpea directo al rival. */
export function resolveDirectHitBonus(attackerEntity: IBoardEntity): number {
  return attackerEntity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.DIRECT_HIT ? 200 : 0;
}

/** Drenaje de ATK: el defensor reduce 200 ATK del atacante al ser atacado. */
export function applyAttackDrainByDefenderPassive(attackerAttack: number, defenderEntity: IBoardEntity): number {
  if (defenderEntity.card.masteryPassiveSkillId !== MASTERY_PASSIVE_IDS.ATK_DRAIN) return attackerAttack;
  return Math.max(0, attackerAttack - 200);
}

/** Sobrecarga: +300 ATK efímero cuando el atacante embiste a una entity rival. */
export function resolveEntityAttackBonus(attackerEntity: IBoardEntity): number {
  return attackerEntity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.ENTITY_ATTACK_BONUS ? 300 : 0;
}

/** Cortafuegos Reactivo: el defensor refleja 200 de daño directo al jugador atacante. */
export function resolveDefenderReflectDamage(defenderEntity: IBoardEntity): number {
  return defenderEntity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.REFLECT_DAMAGE ? 200 : 0;
}

/** Autoguardado: devuelve 1 energía a su dueño cuando la entity es destruida. */
export function resolveEnergyRefundOnDeath(entity: IBoardEntity): number {
  return entity.card.masteryPassiveSkillId === MASTERY_PASSIVE_IDS.ENERGY_ON_DEATH ? 1 : 0;
}
