// src/services/player-profile/get-player-display-name.ts - Resuelve nombre visible del jugador priorizando nickname persistido.
import { IAuthSession } from "@/core/repositories/IAuthRepository";
import { createSupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-profile-repository";
import { resolvePlayerLabel } from "@/services/player-profile/resolve-player-label";

/**
 * Resuelve display name de jugador usando perfil persistido y fallback seguro.
 */
export async function getPlayerDisplayName(session: IAuthSession | null, fallback = "Operador"): Promise<string> {
  if (!session?.user.id) return fallback;
  let profileNickname: string | null = null;
  try {
    const profileRepository = await createSupabasePlayerProfileRepository();
    const profile = await profileRepository.getByPlayerId(session.user.id);
    profileNickname = profile?.nickname ?? null;
  } catch {
    // Si falla lectura de perfil, degradamos a fallback de sesión.
  }
  return resolvePlayerLabel({
    profileNickname,
    sessionDisplayName: session.user.displayName,
    sessionEmail: session.user.email,
    fallback,
  });
}
