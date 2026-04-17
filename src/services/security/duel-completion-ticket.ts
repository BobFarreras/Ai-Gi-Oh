// src/services/security/duel-completion-ticket.ts - Emite y valida tickets firmados para limitar el cierre de duelos al contexto server-side activo.
import { createHmac, timingSafeEqual } from "node:crypto";
import { ValidationError } from "@/core/errors/ValidationError";

type DuelCompletionMode = "TRAINING" | "STORY";

interface IBaseClaims {
  mode: DuelCompletionMode;
  playerId: string;
  issuedAtMs: number;
  expiresAtMs: number;
}

interface ITrainingClaims extends IBaseClaims {
  mode: "TRAINING";
  tier: number;
  battleId: string;
}

interface IStoryClaims extends IBaseClaims {
  mode: "STORY";
  chapter: number;
  duelIndex: number;
}

type DuelCompletionClaims = ITrainingClaims | IStoryClaims;

const DEFAULT_TTL_MS = 1000 * 60 * 30;
const DEV_FALLBACK_SECRET = "dev-only-duel-completion-secret-change-me";

function resolveTicketSecret(): string {
  const value = process.env.DUEL_COMPLETION_TOKEN_SECRET?.trim();
  if (value) return value;
  if (process.env.NODE_ENV !== "production") return DEV_FALLBACK_SECRET;
  throw new ValidationError("Falta DUEL_COMPLETION_TOKEN_SECRET para validar cierres de duelo.");
}

function signPayload(encodedPayload: string): string {
  return createHmac("sha256", resolveTicketSecret()).update(encodedPayload).digest("base64url");
}

function encodeClaims(claims: DuelCompletionClaims): string {
  const encodedPayload = Buffer.from(JSON.stringify(claims), "utf-8").toString("base64url");
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function decodeAndVerifyClaims(ticket: string): DuelCompletionClaims {
  const [encodedPayload, signature] = ticket.trim().split(".");
  if (!encodedPayload || !signature) throw new ValidationError("Ticket de cierre de duelo inválido.");
  const expected = signPayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "utf-8");
  const expectedBuffer = Buffer.from(expected, "utf-8");
  if (signatureBuffer.length !== expectedBuffer.length) throw new ValidationError("Firma de ticket inválida.");
  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) throw new ValidationError("Firma de ticket inválida.");
  const parsed = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf-8")) as Partial<DuelCompletionClaims>;
  if (typeof parsed.playerId !== "string" || !parsed.playerId.trim()) {
    throw new ValidationError("Ticket de cierre sin playerId válido.");
  }
  if (typeof parsed.issuedAtMs !== "number" || typeof parsed.expiresAtMs !== "number") {
    throw new ValidationError("Ticket de cierre sin ventana temporal válida.");
  }
  const nowMs = Date.now();
  if (nowMs > parsed.expiresAtMs) throw new ValidationError("El ticket de cierre ha expirado.");
  if (parsed.mode !== "TRAINING" && parsed.mode !== "STORY") throw new ValidationError("Modo de ticket inválido.");
  return parsed as DuelCompletionClaims;
}

export function issueTrainingCompletionTicket(input: { playerId: string; tier: number; battleId: string; ttlMs?: number }): string {
  return encodeClaims({
    mode: "TRAINING",
    playerId: input.playerId,
    tier: input.tier,
    battleId: input.battleId,
    issuedAtMs: Date.now(),
    expiresAtMs: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
  });
}

export function issueStoryCompletionTicket(input: { playerId: string; chapter: number; duelIndex: number; ttlMs?: number }): string {
  return encodeClaims({
    mode: "STORY",
    playerId: input.playerId,
    chapter: input.chapter,
    duelIndex: input.duelIndex,
    issuedAtMs: Date.now(),
    expiresAtMs: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
  });
}

export function verifyTrainingCompletionTicket(ticket: string, playerId: string): { tier: number; battleId: string } {
  const claims = decodeAndVerifyClaims(ticket);
  if (claims.mode !== "TRAINING") throw new ValidationError("El ticket no corresponde a un cierre Training.");
  if (claims.playerId !== playerId) throw new ValidationError("El ticket no pertenece al jugador autenticado.");
  if (!Number.isInteger(claims.tier) || claims.tier <= 0) throw new ValidationError("Tier inválido en ticket Training.");
  if (!claims.battleId.trim()) throw new ValidationError("battleId inválido en ticket Training.");
  return { tier: claims.tier, battleId: claims.battleId };
}

export function verifyStoryCompletionTicket(ticket: string, playerId: string): { chapter: number; duelIndex: number } {
  const claims = decodeAndVerifyClaims(ticket);
  if (claims.mode !== "STORY") throw new ValidationError("El ticket no corresponde a un cierre Story.");
  if (claims.playerId !== playerId) throw new ValidationError("El ticket no pertenece al jugador autenticado.");
  if (!Number.isInteger(claims.chapter) || claims.chapter <= 0) throw new ValidationError("Capítulo inválido en ticket Story.");
  if (!Number.isInteger(claims.duelIndex) || claims.duelIndex <= 0) throw new ValidationError("Índice de duelo inválido en ticket Story.");
  return { chapter: claims.chapter, duelIndex: claims.duelIndex };
}
