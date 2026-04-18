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
const NICKNAME_ALLOWED_PATTERN = /^[A-Za-z0-9 _-]+$/;
const RESERVED_NICKNAMES = new Set([
  "admin",
  "administrator",
  "root",
  "system",
  "support",
  "moderator",
  "mod",
  "null",
  "undefined",
  "operador",
  "operator",
]);

function ensureNicknameEdgeCharacters(nickname: string): void {
  const startsValid = /^[A-Za-z0-9]/.test(nickname);
  const endsValid = /[A-Za-z0-9]$/.test(nickname);
  if (!startsValid || !endsValid) {
    throw new ValidationError("El nickname debe empezar y terminar con letra o número.");
  }
}

/**
 * Lee y valida payload de update de nickname en API de perfil.
 */
export function readPlayerProfileUpdatePayload(payload: JsonObject): IPlayerProfileUpdatePayload {
  const nickname = readRequiredStringField(payload, "nickname", "El nickname es obligatorio.").trim();
  if (nickname.length < NICKNAME_MIN_LENGTH || nickname.length > NICKNAME_MAX_LENGTH) {
    throw new ValidationError("El nickname debe tener entre 3 y 24 caracteres.");
  }
  if (!NICKNAME_ALLOWED_PATTERN.test(nickname)) {
    throw new ValidationError("El nickname solo puede contener letras, números, espacios, guion y guion bajo.");
  }
  ensureNicknameEdgeCharacters(nickname);
  if (RESERVED_NICKNAMES.has(nickname.toLowerCase())) {
    throw new ValidationError("Ese nickname está reservado, elige otro nombre.");
  }
  const strategyCandidate = payload.strategy;
  if (strategyCandidate === undefined) return { nickname, strategy: "force" };
  if (strategyCandidate === "force" || strategyCandidate === "bootstrap_if_default") {
    return { nickname, strategy: strategyCandidate };
  }
  throw new ValidationError("La estrategia de actualización de perfil es inválida.");
}
