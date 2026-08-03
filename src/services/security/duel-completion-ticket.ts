// src/services/security/duel-completion-ticket.ts - Emite y valida tickets firmados para limitar el cierre de duelos al contexto server-side activo.
import { ValidationError } from "@/core/errors/ValidationError";
import { decodeSignedDuelToken, encodeSignedDuelToken } from "@/services/security/internal/signed-duel-token";

type DuelCompletionMode = "TRAINING" | "STORY" | "SURVIVAL" | "OLYMPUS";

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

interface ICombatSessionClaims extends IBaseClaims {
  mode: "SURVIVAL" | "OLYMPUS";
  sessionId: string;
  battleId: string;
  snapshotHash: string;
  protocolVersion: number;
}

type DuelCompletionClaims = ITrainingClaims | IStoryClaims | ICombatSessionClaims;

const DEFAULT_TTL_MS = 1000 * 60 * 30;
function encodeClaims(claims: DuelCompletionClaims): string {
  return encodeSignedDuelToken(claims);
}

function decodeAndVerifyClaims(ticket: string): DuelCompletionClaims {
  const parsed = decodeSignedDuelToken(ticket);
  if (typeof parsed.playerId !== "string" || !parsed.playerId.trim()) {
    throw new ValidationError("Ticket de cierre sin playerId válido.");
  }
  if (typeof parsed.issuedAtMs !== "number" || typeof parsed.expiresAtMs !== "number") {
    throw new ValidationError("Ticket de cierre sin ventana temporal válida.");
  }
  const nowMs = Date.now();
  if (nowMs > parsed.expiresAtMs) throw new ValidationError("El ticket de cierre ha expirado.");
  if (typeof parsed.mode !== "string" || !["TRAINING", "STORY", "SURVIVAL", "OLYMPUS"].includes(parsed.mode)) {
    throw new ValidationError("Modo de ticket inválido.");
  }
  return parsed as unknown as DuelCompletionClaims;
}

export function issueTrainingCompletionTicket(
  input: { playerId: string; tier: number; battleId: string; ttlMs?: number },
): string {
  return encodeClaims({
    mode: "TRAINING",
    playerId: input.playerId,
    tier: input.tier,
    battleId: input.battleId,
    issuedAtMs: Date.now(),
    expiresAtMs: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
  });
}

export function issueStoryCompletionTicket(
  input: { playerId: string; chapter: number; duelIndex: number; ttlMs?: number },
): string {
  return encodeClaims({
    mode: "STORY",
    playerId: input.playerId,
    chapter: input.chapter,
    duelIndex: input.duelIndex,
    issuedAtMs: Date.now(),
    expiresAtMs: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
  });
}

export function issueCombatSessionTicket(input: {
  playerId: string;
  mode: "SURVIVAL" | "OLYMPUS";
  sessionId: string;
  battleId: string;
  snapshotHash: string;
  protocolVersion: number;
  ttlMs?: number;
}): string {
  return encodeClaims({
    ...input,
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

export function verifyCombatSessionTicket(
  ticket: string,
  playerId: string,
  expectedMode: "SURVIVAL" | "OLYMPUS",
): { sessionId: string; battleId: string; snapshotHash: string; protocolVersion: number } {
  const claims = decodeAndVerifyClaims(ticket);
  if (claims.mode !== expectedMode) throw new ValidationError("El ticket no corresponde al modo de combate.");
  if (claims.playerId !== playerId) throw new ValidationError("El ticket no pertenece al jugador autenticado.");
  if (!claims.sessionId.trim() || !claims.battleId.trim() || !claims.snapshotHash.trim()) {
    throw new ValidationError("El ticket de sesión contiene identificadores inválidos.");
  }
  if (!Number.isInteger(claims.protocolVersion) || claims.protocolVersion < 1) {
    throw new ValidationError("El ticket de sesión contiene una versión inválida.");
  }
  return {
    sessionId: claims.sessionId,
    battleId: claims.battleId,
    snapshotHash: claims.snapshotHash,
    protocolVersion: claims.protocolVersion,
  };
}
