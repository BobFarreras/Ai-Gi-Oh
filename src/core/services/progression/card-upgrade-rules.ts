// src/core/services/progression/card-upgrade-rules.ts - Reglas puras de los objetos de mejora permanente de
// ATK/DEF (Núcleo Overclock / Placa Blindada).
//
// Modelo de topes (decidido en el paquete v1.15):
//   techo(stat) = base + 750 (bonus máximo de niveles) + presupuesto_de_objetos(coste_base)
// El nivel siempre paga hasta +750; los objetos aportan HASTA `presupuesto`, de forma plana e independiente del
// nivel. Así "cartas baratas con valores altos" es una estrategia real (la carta de coste 2 admite +600 de
// objetos; la de coste 6 solo +200, porque ya nace fuerte) pero con un techo conocido, y el multijugador no
// explota. El presupuesto se calcula sobre el COSTE BASE de la carta (nunca el coste efectivo, que baja con el
// nivel 50).

/** El atributo que mejora un objeto (misma convención que el motor de efectos). */
export type CardUpgradeStat = "ATTACK" | "DEFENSE";

/** Presupuesto de objetos por stat, según el coste base de la carta. Decreciente: la carta cara gana menos. */
const UPGRADE_BUDGET_BY_COST: Record<number, number> = {
  2: 600,
  3: 500,
  4: 400,
  5: 300,
  6: 200,
};

/** Presupuesto para costes fuera de la tabla: nunca más que el mínimo tabulado (defensivo ante datos raros). */
export function resolveCardUpgradeBudget(baseCost: number): number {
  const cost = Number.isFinite(baseCost) ? Math.round(baseCost) : 0;
  if (cost in UPGRADE_BUDGET_BY_COST) return UPGRADE_BUDGET_BY_COST[cost];
  // Coste < 2 hereda el tope más generoso; coste > 6, el más ajustado.
  return cost <= 2 ? UPGRADE_BUDGET_BY_COST[2] : UPGRADE_BUDGET_BY_COST[6];
}

export interface ICardUpgradeBonuses {
  attackBonus: number;
  defenseBonus: number;
}

export const EMPTY_CARD_UPGRADE_BONUSES: ICardUpgradeBonuses = { attackBonus: 0, defenseBonus: 0 };

/**
 * ¿Se puede aplicar `value` de mejora al `stat` sin pasar del presupuesto? El servidor es quien manda: esta
 * comprobación se hace tanto en la BD (al aplicar) como aquí para la UI.
 */
export function canApplyCardUpgrade(baseCost: number, stat: CardUpgradeStat, current: ICardUpgradeBonuses, value: number): boolean {
  const budget = resolveCardUpgradeBudget(baseCost);
  const currentForStat = stat === "ATTACK" ? current.attackBonus : current.defenseBonus;
  return value > 0 && currentForStat + value <= budget;
}

/** Cuánto margen de mejora queda para cada stat (para pintarlo en la UI). */
export function resolveRemainingUpgradeBudget(baseCost: number, current: ICardUpgradeBonuses): ICardUpgradeBonuses {
  const budget = resolveCardUpgradeBudget(baseCost);
  return {
    attackBonus: Math.max(0, budget - current.attackBonus),
    defenseBonus: Math.max(0, budget - current.defenseBonus),
  };
}
