// src/services/security/api/parse-combat-proof.ts - Valida la forma externa del journal antes del replay.
import { ICombatProof, IMatchActionPayload, MATCH_ACTION_TYPES } from "@/core/entities/match";
import { ValidationError } from "@/core/errors/ValidationError";

function readString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) throw new ValidationError(`${label} inválido.`);
  return value;
}

/** Aplica validación estructural y deja las reglas específicas de cada acción al motor determinista. */
export function parseCombatProof(value: unknown): ICombatProof {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError("La prueba de combate es obligatoria.");
  }
  const proof = value as Record<string, unknown>;
  if (proof.mode !== "SURVIVAL" && proof.mode !== "OLYMPUS") {
    throw new ValidationError("El modo de la prueba es inválido.");
  }
  if (!Number.isInteger(proof.protocolVersion) || !Array.isArray(proof.entries)) {
    throw new ValidationError("La prueba de combate tiene un protocolo inválido.");
  }
  const entries = proof.entries.map((rawEntry) => {
    if (!rawEntry || typeof rawEntry !== "object" || Array.isArray(rawEntry)) {
      throw new ValidationError("Una entrada del journal es inválida.");
    }
    const entry = rawEntry as Record<string, unknown>;
    const action = entry.action as Record<string, unknown> | null;
    if (!action || !MATCH_ACTION_TYPES.includes(action.type as IMatchActionPayload["type"])) {
      throw new ValidationError("El journal contiene una acción desconocida.");
    }
    if (!action.payload || typeof action.payload !== "object" || Array.isArray(action.payload)) {
      throw new ValidationError("El payload de una acción es inválido.");
    }
    if (!Number.isInteger(entry.sequence)) throw new ValidationError("La secuencia del journal es inválida.");
    return {
      sequence: Number(entry.sequence),
      actorPlayerId: readString(entry.actorPlayerId, "Actor"),
      action: action as unknown as IMatchActionPayload,
    };
  });
  return {
    sessionId: readString(proof.sessionId, "sessionId"),
    battleId: readString(proof.battleId, "battleId"),
    mode: proof.mode,
    snapshotHash: readString(proof.snapshotHash, "snapshotHash"),
    protocolVersion: proof.protocolVersion as ICombatProof["protocolVersion"],
    entries,
  };
}
