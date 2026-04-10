// src/services/auth/api/internal/resolve-password-recovery-redirect.ts - Construye redirectTo de recuperación hacia callback autenticado del proyecto.
import { NextRequest } from "next/server";

/**
 * Centraliza la URL de callback para mantener un único punto de cambio en flujos de recuperación.
 */
export function resolvePasswordRecoveryRedirect(request: NextRequest): string {
  const callbackUrl = new URL("/auth/callback", request.nextUrl.origin);
  callbackUrl.searchParams.set("next", "/reset-password");
  return callbackUrl.toString();
}
