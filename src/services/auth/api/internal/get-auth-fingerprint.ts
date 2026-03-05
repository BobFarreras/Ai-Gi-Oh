// src/services/auth/api/internal/get-auth-fingerprint.ts - Genera huella de cliente (IP + email) para rate limiting de auth.
import { NextRequest } from "next/server";

export interface IAuthFingerprint {
  ip: string;
  emailKey: string;
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }
  return request.headers.get("x-real-ip") ?? "unknown-ip";
}

export function getAuthFingerprint(request: NextRequest, email: string): IAuthFingerprint {
  return {
    ip: getClientIp(request),
    emailKey: email.trim().toLowerCase(),
  };
}
