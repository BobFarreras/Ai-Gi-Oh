// src/core/services/progression/mastery-passive-ids.ts - Catálogo central de identificadores de pasivas mastery V5 (evita strings mágicos en motor y UI).

/** Identificadores canónicos de las pasivas de maestría (deben coincidir con `card_passive_skills` en BD). */
export const MASTERY_PASSIVE_IDS = {
  /** Al ser atacada, reduce 200 ATK del atacante (permanente). */
  ATK_DRAIN: "passive-atk-drain-200",
  /** En defensa, +1 energía al inicio del turno propio. */
  DEFENSE_ENERGY: "passive-defense-energy-plus-1",
  /** Los golpes directos infligen +200 daño. */
  DIRECT_HIT: "passive-direct-hit-plus-200",
  /** En ataque, +1 energía al inicio del turno propio. */
  ATTACK_ENERGY: "passive-attack-energy-plus-1",
  /** Al invocarse, su dueño roba 1 carta. */
  DRAW_ON_SUMMON: "passive-draw-on-summon",
  /** +100 ATK permanente al inicio de cada turno propio (tope +500). */
  ATK_GROWTH: "passive-atk-growth-100",
  /** Al ser destruida, devuelve 1 energía a su dueño. */
  ENERGY_ON_DEATH: "passive-energy-on-death",
  /** Al ser atacada, refleja 200 de daño directo al rival. */
  REFLECT_DAMAGE: "passive-reflect-damage-200",
  /** Al inicio de cada turno propio, el dueño cura 200 HP. */
  HEAL_ON_TURN: "passive-heal-200-on-turn",
  /** Al atacar a una entity rival, +300 ATK en ese ataque. */
  ENTITY_ATTACK_BONUS: "passive-entity-attack-plus-300",
} as const;

export type MasteryPassiveId = (typeof MASTERY_PASSIVE_IDS)[keyof typeof MASTERY_PASSIVE_IDS];
