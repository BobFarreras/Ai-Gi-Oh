// src/services/multiplayer/get-multiplayer-lobby-data.ts - Carga server-side de datos mínimos para el lobby multijugador.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import { createSupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-profile-repository";
import { GetOrCreatePlayerProfileUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProfileUseCase";
import { resolveDefaultNicknameFromEmail } from "@/services/player-profile/resolve-default-nickname-from-email";

export interface IMultiplayerLobbyData {
  playerId: string;
  nickname: string;
  activeDeckIds: string[];
}

export async function getMultiplayerLobbyData(): Promise<IMultiplayerLobbyData | null> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return null;

  const playerId = session.user.id;

  const [profileRepository, repositories] = await Promise.all([
    createSupabasePlayerProfileRepository(),
    createPlayerRuntimeRepositories(),
  ]);

  const [profile, deck] = await Promise.all([
    new GetOrCreatePlayerProfileUseCase(profileRepository).execute({
      playerId,
      defaultNickname: resolveDefaultNicknameFromEmail(session.user.email),
    }),
    repositories.deckRepository.getDeck(playerId),
  ]);

  const activeDeckIds = deck.slots.map((slot) => slot.cardId).filter((id): id is string => id !== null);

  return {
    playerId,
    nickname: profile.nickname,
    activeDeckIds,
  };
}
