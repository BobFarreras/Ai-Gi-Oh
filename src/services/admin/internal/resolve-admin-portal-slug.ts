// src/services/admin/internal/resolve-admin-portal-slug.ts - Resuelve el slug esperado del portal admin con fallback estable para desarrollo.
const DEFAULT_ADMIN_PORTAL_SLUG = "control-room";

/**
 * Define el slug válido del portal admin a partir de entorno server-side.
 */
export function resolveAdminPortalSlug(): string {
  const value = process.env.ADMIN_PORTAL_SLUG?.trim();
  return value && value.length > 0 ? value : DEFAULT_ADMIN_PORTAL_SLUG;
}
