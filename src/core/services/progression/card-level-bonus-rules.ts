// src/core/services/progression/card-level-bonus-rules.ts - Reglas de bonus por nivel según tipo de carta.
//
// La curva vive como TABLA DE DATOS, no como cadena de `if`: son 20 hitos (uno cada 5 niveles hasta el 100) y
// en forma de condicionales sería ilegible e imposible de cuadrar. Cada hito se lee de un vistazo y se testea
// contra los totales.
//
// Ciclo de 4 hitos que se repite 5 veces: +50 ATK → +100 ATK → +50 DEF → +100 DEF.
// Al llegar a 100 eso suma exactamente +750 ATK y +750 DEF. Además: nivel 50 → -1 de energía; nivel 100 →
// imagen alternativa de la carta (eso no es un bonus de stats: lo resuelve el render, ver MAX_LEVEL_ART).
import { CardType } from "@/core/entities/ICard";

export interface ICardLevelBonuses {
  attackBonus: number;
  defenseBonus: number;
  energyCostReduction: number;
}

interface ICardLevelMilestone {
  level: number;
  attack: number;
  defense: number;
}

/** Nivel al que la carta cuesta 1 de energía menos. */
export const ENERGY_DISCOUNT_LEVEL = 50;

/** Nivel al que la carta estrena arte alternativo (si el catálogo tiene imagen para ella). */
export const MAX_LEVEL_ART_LEVEL = 100;

const MILESTONE_CYCLE: ReadonlyArray<Omit<ICardLevelMilestone, "level">> = [
  { attack: 50, defense: 0 },
  { attack: 100, defense: 0 },
  { attack: 0, defense: 50 },
  { attack: 0, defense: 100 },
];

/** Los 20 hitos (5, 10, 15 … 100), generados por el ciclo. */
export const CARD_LEVEL_MILESTONES: ReadonlyArray<ICardLevelMilestone> = Array.from({ length: 20 }, (_, index) => ({
  level: (index + 1) * 5,
  ...MILESTONE_CYCLE[index % MILESTONE_CYCLE.length],
}));

function resolveEntityBonuses(level: number): ICardLevelBonuses {
  let attackBonus = 0;
  let defenseBonus = 0;
  for (const milestone of CARD_LEVEL_MILESTONES) {
    if (level < milestone.level) break;
    attackBonus += milestone.attack;
    defenseBonus += milestone.defense;
  }
  return { attackBonus, defenseBonus, energyCostReduction: level >= ENERGY_DISCOUNT_LEVEL ? 1 : 0 };
}

export function resolveCardLevelBonuses(cardType: CardType, level: number): ICardLevelBonuses {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  if (cardType === "ENTITY") return resolveEntityBonuses(safeLevel);
  // Magias/trampas no tienen ATK/DEF que subir, pero sí se abaratan al alcanzar el hito de energía.
  return { attackBonus: 0, defenseBonus: 0, energyCostReduction: safeLevel >= ENERGY_DISCOUNT_LEVEL ? 1 : 0 };
}

/** ¿La carta ha alcanzado el nivel que desbloquea su arte alternativo? */
export function hasMaxLevelArt(level: number): boolean {
  return (Number.isFinite(level) ? level : 0) >= MAX_LEVEL_ART_LEVEL;
}
