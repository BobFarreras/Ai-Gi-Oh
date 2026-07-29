// src/core/entities/match/index.ts - Punto de entrada de contratos del subdominio Match para desacoplar modos de combate.
export type { IMatchMode } from "@/core/entities/match/IMatchMode";
export type { IMatchActionRequest } from "@/core/entities/match/IMatchActionRequest";
export type { IMatchConfig } from "@/core/entities/match/IMatchConfig";
export type { IMatchController } from "@/core/entities/match/IMatchController";
export type { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
export type { IMatchReward } from "@/core/entities/match/IMatchReward";
export type { IMatchActionPayload } from "@/core/entities/match/IMatchActionPayload";
export { MATCH_ACTION_TYPES } from "@/core/entities/match/IMatchActionPayload";
export type { ICombatSession } from "@/core/entities/match/ICombatSession";
export { COMBAT_PROOF_PROTOCOL_VERSION } from "@/core/entities/match/ICombatSession";
export type { ICombatProof, ICombatJournalEntry } from "@/core/entities/match/ICombatProof";
