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

/**
 * Pasiva INNATA-only (no mastery) de "Reactivación" (Antigrabity): al ir al cementerio, revive en el
 * siguiente turno de su dueño. Sin magnitud. Se mantiene FUERA de MASTERY_PASSIVE_IDS para no inflar el
 * catálogo de las 10 pasivas de maestría (ni el mapeo de arquetipos a V5).
 */
export const REVIVE_NEXT_TURN_PASSIVE_ID = "passive-revive-next-turn";

/**
 * Pasiva INNATA-only "Recaudación" (ficha 3 v1.17): cuando ESTA entity gana un combate a una entity rival
 * (la destruye y sobrevive), su dueño gana Nexus de moneda. El motor solo CUENTA en el GameState; el
 * servidor acredita al cerrar el duelo (idempotente, con topes por duelo y diarios). Va en una entity floja
 * para que farmearlo cueste. Fuera de MASTERY_PASSIVE_IDS (igual que Reactivación).
 */
export const NEXUS_ON_BATTLE_WIN_PASSIVE_ID = "passive-nexus-on-battle-win";

/** Nexus que otorga la pasiva de Recaudación por cada combate ganado (el servidor aplica los topes). */
export const NEXUS_PER_BATTLE_WIN = 200;

/**
 * Pasiva INNATA-only "Sobrecarga Energética" (ficha 1 v1.17): cuando ESTA entity gana un combate a una
 * entity rival (la destruye y sobrevive), su dueño gana +1 energía al empezar su SIGUIENTE turno. Es motor
 * puro (no toca economía): se cuenta en el GameState y se concede al inicio del turno. Fuera de
 * MASTERY_PASSIVE_IDS (igual que Reactivación / Recaudación).
 */
export const ENERGY_ON_BATTLE_WIN_PASSIVE_ID = "passive-energy-on-battle-win";

/** Energía que concede la pasiva de Sobrecarga Energética por cada combate ganado (respeta maxEnergy). */
export const ENERGY_PER_BATTLE_WIN = 1;
