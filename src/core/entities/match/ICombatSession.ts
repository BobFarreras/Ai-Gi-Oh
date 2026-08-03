// src/core/entities/match/ICombatSession.ts - Describe la sesión autoritativa vinculada a un snapshot inmutable de combate.
import { IMatchMode } from "./IMatchMode";

// v3: el journal es exclusivamente del jugador; el rival lo deriva el servidor.
export const COMBAT_PROOF_PROTOCOL_VERSION = 3 as const;

/**
 * Margen para liquidar un combate que se alargó más que la ventana de la sesión. La sesión caduca para
 * decidir si el jugador abandonó; liquidar un duelo ya terminado necesita más holgura, o un combate
 * lento se ganaría en pantalla y se rechazaría al enviarlo.
 */
export const COMBAT_SETTLEMENT_GRACE_MS = 30 * 60 * 1000;
export type CombatProofProtocolVersion = number;

export interface ICombatSession {
  id: string;
  battleId: string;
  mode: Extract<IMatchMode, "SURVIVAL" | "OLYMPUS">;
  playerId: string;
  opponentId: string;
  seed: string;
  snapshotHash: string;
  protocolVersion: CombatProofProtocolVersion;
  issuedAtIso: string;
  expiresAtIso: string;
}
