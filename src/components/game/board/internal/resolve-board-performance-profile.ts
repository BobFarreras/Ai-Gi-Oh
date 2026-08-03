// src/components/game/board/internal/resolve-board-performance-profile.ts - Resuelve el perfil de rendimiento del tablero a partir de señales del dispositivo.
import { CombatEffectsOverride } from "@/services/performance/combat-effects-override";

export type { CombatEffectsOverride } from "@/services/performance/combat-effects-override";
export type CombatEffectsBudget = "FULL" | "BALANCED" | "REDUCED";

/** Señales de capacidad del dispositivo ya recolectadas por el hook cliente. */
export interface IBoardPerformanceSignals {
  isMobileViewport: boolean;
  prefersReducedMotion: boolean;
  hardwareConcurrency: number;
  deviceMemory: number;
  isSlowCpu: boolean;
  effectsOverride: CombatEffectsOverride;
}

export interface IBoardPerformanceProfile {
  isMobileViewport: boolean;
  shouldReduceCombatEffects: boolean;
  combatEffectsBudget: CombatEffectsBudget;
}

/**
 * Decide si degradar efectos de combate. El override manual del jugador
 * tiene prioridad absoluta sobre la auto-detección (escape hatch en ambos sentidos).
 */
export function resolveBoardPerformanceProfile(signals: IBoardPerformanceSignals): IBoardPerformanceProfile {
  const isConstrainedDevice =
    signals.hardwareConcurrency <= 4 || signals.deviceMemory <= 4 || signals.isSlowCpu;
  const combatEffectsBudget: CombatEffectsBudget =
    signals.effectsOverride === "full"
      ? "FULL"
      : signals.effectsOverride === "reduced" || signals.prefersReducedMotion || isConstrainedDevice
        ? "REDUCED"
        : signals.isMobileViewport
          ? "BALANCED"
          : "FULL";

  return {
    isMobileViewport: signals.isMobileViewport,
    shouldReduceCombatEffects: combatEffectsBudget !== "FULL",
    combatEffectsBudget,
  };
}
