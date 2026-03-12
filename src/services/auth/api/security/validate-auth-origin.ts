// src/services/auth/api/security/validate-auth-origin.ts - Validación CSRF básica verificando coincidencia entre Origin y Host.
import { NextRequest } from "next/server";
import { hasTrustedRequestOrigin } from "@/services/security/api/validate-request-origin";

export function hasTrustedAuthOrigin(request: NextRequest): boolean {
  return hasTrustedRequestOrigin(request);
}
