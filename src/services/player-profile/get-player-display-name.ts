// src/services/player-profile/get-player-display-name.ts - Resuelve nombre visible del jugador priorizando nickname persistido.
import { IAuthSession } from "@/core/repositories/IAuthRepository";
import { createSupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-profile-repository";
import { resolveDefaultNicknameFromEmail } from "@/services/player-profile/resolve-default-nickname-from-email";

/**
 * Resuelve display name de jugador usando perfil persistido y fallback seguro.
 */
export async function getPlayerDisplayName(session: IAuthSession | null, fallback = "Operador"): Promise<string> {
  if (!session?.user.id) return fallback;
  try {
    const profileRepository = await createSupabasePlayerProfileRepository();
    const profile = await profileRepository.getByPlayerId(session.user.id);
    if (profile?.nickname?.trim()) return profile.nickname;
  } catch {
    // Si falla lectura de perfil, degradamos a fallback de sesión.
  }
  return session.user.displayName?.trim()
    || resolveDefaultNicknameFromEmail(session.user.email, fallback);
}

