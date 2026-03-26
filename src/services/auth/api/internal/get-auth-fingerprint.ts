// src/services/auth/api/internal/get-auth-fingerprint.ts - Genera huella de cliente (IP + email) para rate limiting de auth.
import { NextRequest } from "next/server";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";

export interface IAuthFingerprint {
  ip: string;
  emailKey: string;
}

export function getAuthFingerprint(request: NextRequest, email: string): IAuthFingerprint {
  return {
    ip: resolveRequestClientIp(request),
    emailKey: email.trim().toLowerCase(),
  };
}
