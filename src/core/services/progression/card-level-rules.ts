// src/core/services/progression/card-level-rules.ts - Reglas puras para progresión de nivel y cálculo de barra EXP por carta.
const MAX_CARD_LEVEL = 100;
const EARLY_LEVEL_XP = [40, 60, 80, 100, 120] as const;

export interface ICardLevelProgressMetrics {
  clampedLevel: number;
  xpIntoCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressRatio: number;
}

export function getMaxCardLevel(): number {
  return MAX_CARD_LEVEL;
}

/**
 * XP para pasar del nivel `level` al siguiente.
 *
 * Los tramos hasta el 30 son los ORIGINALES y no se tocan: la progresión ya ganada por los jugadores sigue
 * valiendo exactamente lo mismo. Del 30 en adelante la curva se aplana a propósito: si se mantuviera el ritmo
 * de los tramos bajos (+70 XP por nivel), el nivel 100 costaría cientos de miles de XP y sería decorativo.
 * Aquí crece poco a poco (nunca baja: el nivel 30→31 sigue costando más que el 29→30) y el 100 queda como meta
 * de largo recorrido, con los caramelos como acelerador.
 */
export function getXpRequiredForNextLevel(level: number): number {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  if (safeLevel >= MAX_CARD_LEVEL) return 0;
  if (safeLevel <= 4) return EARLY_LEVEL_XP[safeLevel];
  if (safeLevel <= 9) return 145 + (safeLevel - 5) * 25;
  if (safeLevel <= 19) return 290 + (safeLevel - 10) * 45;
  if (safeLevel <= 29) return 760 + (safeLevel - 20) * 70;
  if (safeLevel <= 49) return 1450 + (safeLevel - 30) * 10;
  if (safeLevel <= 74) return 1700 + (safeLevel - 50) * 12;
  return 2050 + (safeLevel - 75) * 15;
}

export function getTotalXpRequiredToReachLevel(level: number): number {
  const safeLevel = Number.isFinite(level) ? Math.max(0, Math.floor(level)) : 0;
  const targetLevel = Math.min(safeLevel, MAX_CARD_LEVEL);
  let total = 0;
  for (let cursor = 0; cursor < targetLevel; cursor += 1) {
    total += getXpRequiredForNextLevel(cursor);
  }
  return total;
}

export function getMaxTotalXpForCardLeveling(): number {
  return getTotalXpRequiredToReachLevel(MAX_CARD_LEVEL);
}

export function clampCardTotalXp(totalXp: number): number {
  const safeXp = Number.isFinite(totalXp) ? Math.max(0, Math.floor(totalXp)) : 0;
  return Math.min(safeXp, getMaxTotalXpForCardLeveling());
}

export function resolveCardLevelFromTotalXp(totalXp: number): number {
  const clampedXp = clampCardTotalXp(totalXp);
  let level = 0;
  while (level < MAX_CARD_LEVEL && getTotalXpRequiredToReachLevel(level + 1) <= clampedXp) {
    level += 1;
  }
  return level;
}

export function getCardLevelProgressMetrics(level: number, xp: number): ICardLevelProgressMetrics {
  const clampedLevel = Math.min(Math.max(0, Math.floor(level)), MAX_CARD_LEVEL);
  if (clampedLevel >= MAX_CARD_LEVEL) {
    return { clampedLevel, xpIntoCurrentLevel: 0, xpRequiredForNextLevel: 0, progressRatio: 1 };
  }
  const safeXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const totalXpAtCurrentLevelStart = getTotalXpRequiredToReachLevel(clampedLevel);
  const xpRequiredForNextLevel = getXpRequiredForNextLevel(clampedLevel);
  const xpIntoCurrentLevel = Math.min(
    Math.max(0, safeXp - totalXpAtCurrentLevelStart),
    xpRequiredForNextLevel,
  );
  const progressRatio = xpRequiredForNextLevel > 0 ? xpIntoCurrentLevel / xpRequiredForNextLevel : 1;
  return { clampedLevel, xpIntoCurrentLevel, xpRequiredForNextLevel, progressRatio };
}
