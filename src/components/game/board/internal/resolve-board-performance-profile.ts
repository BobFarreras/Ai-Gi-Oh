// src/components/game/board/internal/resolve-board-performance-profile.ts - Resuelve el perfil de rendimiento del tablero a partir de señales del dispositivo.
import { CombatEffectsOverride } from "@/services/performance/combat-effects-override";

export type { CombatEffectsOverride } from "@/services/performance/combat-effects-override";

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
}

/**
 * Decide si degradar efectos de combate. El override manual del jugador
 * tiene prioridad absoluta sobre la auto-detección (escape hatch en ambos sentidos).
 */
export function resolveBoardPerformanceProfile(signals: IBoardPerformanceSignals): IBoardPerformanceProfile {
  const isConstrainedDevice =
    signals.hardwareConcurrency <= 4 || signals.deviceMemory <= 4 || signals.isSlowCpu;
  const shouldReduceByAutoDetection =
    signals.prefersReducedMotion || signals.isMobileViewport || isConstrainedDevice;
  const shouldReduceCombatEffects =
    signals.effectsOverride === "full"
      ? false
      : signals.effectsOverride === "reduced"
        ? true
        : shouldReduceByAutoDetection;

  return {
    isMobileViewport: signals.isMobileViewport,
    shouldReduceCombatEffects,
  };
}
