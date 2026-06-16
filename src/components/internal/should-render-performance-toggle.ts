// src/components/internal/should-render-performance-toggle.ts - Decide si el toggle de FX debe renderizarse según el entorno.

/**
 * El botón de perfil de efectos es una herramienta de desarrollo.
 * En producción no debe montarse ni incluirse en el bundle.
 */
export function shouldRenderPerformanceToggle(nodeEnv: string | undefined): boolean {
  return nodeEnv !== "production";
}
