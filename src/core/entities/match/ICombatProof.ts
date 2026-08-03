// src/core/entities/match/ICombatProof.ts - Contrata el diario ordenado que permite reproducir una batalla en servidor.
import { IMatchActionPayload } from "./IMatchActionPayload";
import { CombatProofProtocolVersion, ICombatSession } from "./ICombatSession";

export interface ICombatJournalEntry {
  sequence: number;
  actorPlayerId: string;
  action: IMatchActionPayload;
}

export interface ICombatProof {
  sessionId: string;
  battleId: string;
  mode: ICombatSession["mode"];
  snapshotHash: string;
  protocolVersion: CombatProofProtocolVersion;
  entries: ICombatJournalEntry[];
}
