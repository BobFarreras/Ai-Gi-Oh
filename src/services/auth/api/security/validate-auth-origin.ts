// src/services/auth/api/security/validate-auth-origin.ts - Validación CSRF básica verificando coincidencia entre Origin y Host.
import { NextRequest } from "next/server";

function resolveHost(request: NextRequest): string | null {
  return request.headers.get("x-forwarded-host") ?? request.headers.get("host");
}

export function hasTrustedAuthOrigin(request: NextRequest): boolean {
  const originHeader = request.headers.get("origin");
  if (!originHeader) return true;
  const expectedHost = resolveHost(request);
  if (!expectedHost) return false;
  try {
    return new URL(originHeader).host === expectedHost;
  } catch {
    return false;
  }
}
