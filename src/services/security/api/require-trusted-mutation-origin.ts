// src/services/security/api/require-trusted-mutation-origin.ts - Aplica guardia común de origen confiable para endpoints mutables protegidos.
import { NextRequest, NextResponse } from "next/server";
import { hasTrustedRequestOrigin } from "@/services/security/api/validate-request-origin";

/**
 * Devuelve una respuesta 403 si el origen no es confiable; `null` en caso válido.
 */
export function requireTrustedMutationOrigin(request: NextRequest): NextResponse | null {
  if (hasTrustedRequestOrigin(request)) return null;
  return NextResponse.json({ message: "Origen de petición no confiable." }, { status: 403 });
}
