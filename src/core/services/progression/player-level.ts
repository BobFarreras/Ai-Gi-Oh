// src/core/services/progression/player-level.ts - Deriva el nivel de Operador y los puntos de habilidad desde
// la XP de jugador (`playerExperience`). Fuente ÚNICA de la curva: el nivel NO se persiste (evita el bug de
// "columna desincronizada del XP"), se calcula siempre desde la XP. Los puntos de habilidad del árbol
// (ficha 8) se derivan del nivel. Función pura, sin efectos ni persistencia.

/** XP para pasar de nivel 1 → 2. */
const FIRST_LEVEL_UP_COST = 750;
/** Cada nivel siguiente cuesta este incremento más que el anterior (curva creciente). */
const LEVEL_UP_COST_STEP = 400;

export interface IPlayerLevelState {
  /** Nivel actual (>= 1). */
  level: number;
  /** XP acumulada DENTRO del nivel actual (para la barra de progreso). */
  xpIntoLevel: number;
  /** XP necesaria para pasar del nivel actual al siguiente. */
  xpForNext: number;
  /** Puntos de habilidad totales que otorga el nivel (1 por nivel a partir del 2). */
  totalSkillPoints: number;
}

/** XP necesaria para pasar de `level` a `level + 1`. */
export function xpToReachNextLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return FIRST_LEVEL_UP_COST + LEVEL_UP_COST_STEP * (safeLevel - 1);
}

/** XP total acumulada necesaria para ESTAR en `level` (nivel 1 = 0). Cerrada, O(1). */
export function cumulativeXpForLevel(level: number): number {
  const steps = Math.max(0, Math.floor(level) - 1);
  return FIRST_LEVEL_UP_COST * steps + (LEVEL_UP_COST_STEP * steps * (steps - 1)) / 2;
}

/**
 * Nivel y puntos a partir de la XP. Se calcula con una estimación cerrada de la cuádratica (O(1)) y se
 * corrige con aritmética entera exacta en los bordes (evita el off-by-one del `sqrt`). Robusta ante XP
 * inválida (negativa/NaN → nivel 1) y ante ajustes futuros de las constantes de la curva.
 */
export function resolvePlayerLevel(experience: number): IPlayerLevelState {
  const xp = Number.isFinite(experience) ? Math.max(0, Math.floor(experience)) : 0;

  // Semilla: cumulative(L) = a·s² + b·s con s = L−1. Resolvemos a·s² + b·s − xp = 0 para s.
  const a = LEVEL_UP_COST_STEP / 2;
  const b = FIRST_LEVEL_UP_COST - LEVEL_UP_COST_STEP / 2;
  const seedSteps = a > 0 ? (-b + Math.sqrt(b * b + 4 * a * xp)) / (2 * a) : xp / FIRST_LEVEL_UP_COST;
  let level = Math.max(1, Math.floor(seedSteps) + 1);

  // Corrección entera exacta (normalmente 0-2 iteraciones): el nivel real es el mayor L con cumulative(L) <= xp.
  while (cumulativeXpForLevel(level + 1) <= xp) level += 1;
  while (level > 1 && cumulativeXpForLevel(level) > xp) level -= 1;

  return {
    level,
    xpIntoLevel: xp - cumulativeXpForLevel(level),
    xpForNext: xpToReachNextLevel(level),
    totalSkillPoints: level - 1,
  };
}
