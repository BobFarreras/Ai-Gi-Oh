// src/components/hub/story/internal/resolve-story-performance-profile.ts - Resuelve perfil de rendimiento visual Story según viewport.
export interface IStoryPerformanceProfile {
  isMobileViewport: boolean;
  isLowPowerMode: boolean;
  shouldReduceMapEffects: boolean;
}

/**
 * Centraliza umbrales de optimización visual Story para móvil/low-end.
 */
export function resolveStoryPerformanceProfile(viewportWidth: number): IStoryPerformanceProfile {
  const isMobileViewport = viewportWidth < 768;
  const isLowPowerMode = viewportWidth < 480;
  return {
    isMobileViewport,
    isLowPowerMode,
    shouldReduceMapEffects: isLowPowerMode,
  };
}
