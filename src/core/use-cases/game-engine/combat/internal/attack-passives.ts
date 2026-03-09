// src/core/use-cases/game-engine/combat/internal/attack-passives.ts - Reglas puras de pasivas mastery aplicadas durante combate.
import { IBoardEntity } from "@/core/entities/IPlayer";

export function resolveDirectHitBonus(attackerEntity: IBoardEntity): number {
  return attackerEntity.card.masteryPassiveSkillId === "passive-direct-hit-plus-200" ? 200 : 0;
}

export function applyAttackDrainByDefenderPassive(attackerAttack: number, defenderEntity: IBoardEntity): number {
  if (defenderEntity.card.masteryPassiveSkillId !== "passive-atk-drain-200") return attackerAttack;
  return Math.max(0, attackerAttack - 200);
}
