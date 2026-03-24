// src/components/internal/layout-breakpoints.ts - Reglas compartidas para decidir layout desktop/móvil sin divergencias entre módulos.
export const DESKTOP_LAYOUT_MIN_WIDTH_PX = 900;

/**
 * Define si una pantalla debe entrar en layout móvil.
 */
export function isMobileLayoutViewport(viewportWidth: number): boolean {
  return viewportWidth < DESKTOP_LAYOUT_MIN_WIDTH_PX;
}

/**
 * Define si una pantalla debe usar layout desktop.
 */
export function isDesktopLayoutViewport(viewportWidth: number): boolean {
  return viewportWidth >= DESKTOP_LAYOUT_MIN_WIDTH_PX;
}
