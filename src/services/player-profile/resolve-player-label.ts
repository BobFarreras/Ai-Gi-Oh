// src/services/player-profile/resolve-player-label.ts - Centraliza la resolución del nombre visible de jugador sin exponer email completo.
import { resolveDefaultNicknameFromEmail } from "@/services/player-profile/resolve-default-nickname-from-email";

interface IResolvePlayerLabelInput {
  profileNickname?: string | null;
  sessionDisplayName?: string | null;
  sessionEmail?: string | null;
  fallback?: string;
}

/**
 * Prioriza nickname persistido y evita mostrar emails completos como nombre visible.
 */
export function resolvePlayerLabel(input: IResolvePlayerLabelInput): string {
  const fallback = input.fallback ?? "Operador";
  const profileNickname = input.profileNickname?.trim();
  if (profileNickname) return profileNickname;
  const sessionDisplayName = input.sessionDisplayName?.trim();
  if (sessionDisplayName && !sessionDisplayName.includes("@")) return sessionDisplayName;
  return resolveDefaultNicknameFromEmail(input.sessionEmail ?? null, fallback);
}
