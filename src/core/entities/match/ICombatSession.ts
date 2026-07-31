// src/core/entities/match/ICombatSession.ts - Describe la sesión autoritativa vinculada a un snapshot inmutable de combate.
import { IMatchMode } from "./IMatchMode";

// v3: el journal es exclusivamente del jugador; el rival lo deriva el servidor.
export const COMBAT_PROOF_PROTOCOL_VERSION = 3 as const;
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
