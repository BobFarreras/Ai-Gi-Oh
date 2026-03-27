// src/services/security/api/request-client-ip.ts - Resuelve IP cliente desde cabeceras proxy confiables para límites de seguridad.
import { NextRequest } from "next/server";

/**
 * Prioriza `x-forwarded-for` y cae a `x-real-ip` para un fingerprint consistente.
 */
export function resolveRequestClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip") ?? "unknown-ip";
}

