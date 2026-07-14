// src/core/services/progression/level-candy-rules.ts - Reglas puras de los caramelos de nivel (USB Raro).
//
// REGLA DE ORO: un caramelo NO otorga niveles, otorga la XP EXACTA que hacen falta para subirlos desde el nivel
// actual de esa carta. Es la única forma de que el nivel siga saliendo siempre de la XP acumulada
// (`resolveCardLevelFromTotalXp`); si se regalaran niveles "a pelo" habría dos fuentes de verdad —la XP y los
// niveles regalados— y acabaríamos con cartas en estados imposibles.
//
// Consecuencia buscada: subir 2 niveles a una carta de nivel 10 cuesta mucha menos XP que subírselos a una de
// nivel 80, así que el MISMO caramelo vale más cuanto más alta esté la carta. Si se definiera en XP fija sería
// inservible en el tramo alto.
import {
  clampCardTotalXp,
  getMaxCardLevel,
  getTotalXpRequiredToReachLevel,
  resolveCardLevelFromTotalXp,
} from "@/core/services/progression/card-level-rules";

export const MIN_CANDY_LEVELS = 1;
export const MAX_CANDY_LEVELS = 5;

export interface ICandyGrant {
  /** Nivel de la carta tras consumir el caramelo. */
  newLevel: number;
  /** XP total tras consumir el caramelo. */
  newXp: number;
  /** XP concedida por el caramelo (lo que "cuesta" el salto desde el nivel actual). */
  grantedXp: number;
  /** Niveles que se pierden por chocar con el nivel máximo (p. ej. usar un +5 estando a 98). */
  wastedLevels: number;
}

/** ¿Tiene sentido gastar un caramelo aquí? (una carta ya al máximo no puede subir más). */
export function canConsumeCandy(currentLevel: number): boolean {
  return currentLevel < getMaxCardLevel();
}

/**
 * Calcula el resultado de darle `levels` niveles a una carta que está en `currentLevel` con `currentXp` de XP
 * acumulada. Conserva el progreso parcial dentro del nivel en curso: si la carta iba a mitad de camino del
 * siguiente nivel, ese medio nivel no se tira, se mantiene por encima.
 */
export function resolveCandyGrant(currentLevel: number, currentXp: number, levels: number): ICandyGrant {
  const maxLevel = getMaxCardLevel();
  const safeLevels = Math.max(MIN_CANDY_LEVELS, Math.min(MAX_CANDY_LEVELS, Math.floor(levels)));
  const safeLevel = Math.max(0, Math.min(maxLevel, Math.floor(currentLevel)));
  const safeXp = clampCardTotalXp(currentXp);

  const targetLevel = Math.min(safeLevel + safeLevels, maxLevel);
  const wastedLevels = safeLevel + safeLevels - targetLevel;

  // La XP concedida es la DISTANCIA entre los dos niveles, no un número fijo: por eso el mismo caramelo cuesta
  // (y vale) mucho más arriba que abajo.
  const grantedXp = getTotalXpRequiredToReachLevel(targetLevel) - getTotalXpRequiredToReachLevel(safeLevel);
  const newXp = clampCardTotalXp(safeXp + grantedXp);

  return {
    newLevel: resolveCardLevelFromTotalXp(newXp),
    newXp,
    grantedXp,
    wastedLevels,
  };
}
