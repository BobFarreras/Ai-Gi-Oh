// src/core/entities/match/ICombatSession.ts - Describe la sesión autoritativa vinculada a un snapshot inmutable de combate.
import { IMatchMode } from "./IMatchMode";

export const COMBAT_PROOF_PROTOCOL_VERSION = 1 as const;
export type CombatProofProtocolVersion = typeof COMBAT_PROOF_PROTOCOL_VERSION;

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
