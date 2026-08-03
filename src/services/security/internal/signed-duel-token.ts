// src/services/security/internal/signed-duel-token.ts - Firma y verifica la envoltura HMAC compartida por tickets de combate.
import { createHmac, timingSafeEqual } from "node:crypto";
import { ValidationError } from "@/core/errors/ValidationError";

const DEV_FALLBACK_SECRET = "dev-only-duel-completion-secret-change-me";

function resolveTicketSecret(): string {
  const value = process.env.DUEL_COMPLETION_TOKEN_SECRET?.trim();
  if (value) return value;
  const serviceRoleFallback = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRoleFallback) return serviceRoleFallback;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_SECRET;
  throw new ValidationError("Falta DUEL_COMPLETION_TOKEN_SECRET para validar cierres de duelo.");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", resolveTicketSecret()).update(encodedPayload).digest("base64url");
}

/** Firma claims serializables sin exponer el secreto a las capas consumidoras. */
export function encodeSignedDuelToken(claims: object): string {
  const encodedPayload = Buffer.from(JSON.stringify(claims), "utf-8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

/** Verifica firma en tiempo constante y devuelve claims aún no confiables para su narrowing. */
export function decodeSignedDuelToken(ticket: string): Record<string, unknown> {
  const [encodedPayload, signature] = ticket.trim().split(".");
  if (!encodedPayload || !signature) throw new ValidationError("Ticket de cierre de duelo inválido.");
  const expected = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "utf-8");
  const expectedBuffer = Buffer.from(expected, "utf-8");
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new ValidationError("Firma de ticket inválida.");
  }
  const parsed: unknown = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new ValidationError("Claims de ticket inválidos.");
  return parsed as Record<string, unknown>;
}
