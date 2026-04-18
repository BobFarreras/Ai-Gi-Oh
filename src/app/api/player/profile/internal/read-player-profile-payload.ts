// src/app/api/player/profile/internal/read-player-profile-payload.ts - Valida payload de actualización de perfil con estrategia opcional.
import { ValidationError } from "@/core/errors/ValidationError";
import { JsonObject, readRequiredStringField } from "@/services/security/api/request-body-parser";

export type PlayerProfileUpdateStrategy = "force" | "bootstrap_if_default";

export interface IPlayerProfileUpdatePayload {
  nickname: string;
  strategy: PlayerProfileUpdateStrategy;
}

const NICKNAME_MIN_LENGTH = 3;
const NICKNAME_MAX_LENGTH = 24;

/**
 * Lee y valida payload de update de nickname en API de perfil.
 */
export function readPlayerProfileUpdatePayload(payload: JsonObject): IPlayerProfileUpdatePayload {
  const nickname = readRequiredStringField(payload, "nickname", "El nickname es obligatorio.");
  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    throw new ValidationError("El nickname debe tener entre 3 y 24 caracteres.");
  }
  const strategyCandidate = payload.strategy;
  if (strategyCandidate === undefined) return { nickname, strategy: "force" };
  if (strategyCandidate === "force" || strategyCandidate === "bootstrap_if_default") {
    return { nickname, strategy: strategyCandidate };
  }
  throw new ValidationError("La estrategia de actualización de perfil es inválida.");
}

