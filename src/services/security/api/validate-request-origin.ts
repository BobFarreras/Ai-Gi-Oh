// src/services/security/api/validate-request-origin.ts - Valida de forma homogénea que el Origin de peticiones mutables coincida con el host esperado.
import { NextRequest } from "next/server";

interface ITrustedRequestOriginOptions {
  allowMissingOrigin?: boolean;
}

function resolveRequestHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

/**
 * Verifica una política CSRF básica basada en coincidencia Origin-Host.
 * Por defecto exige `Origin` en mutaciones de navegador para evitar bypass CSRF silencioso.
 */
export function hasTrustedRequestOrigin(request: NextRequest, options: ITrustedRequestOriginOptions = {}): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return options.allowMissingOrigin === true;
  const expectedHost = resolveRequestHost(request);
  if (!expectedHost) return false;
  try {
    return new URL(originHeader).host === expectedHost;
  } catch {
    return false;
  }
}
