// src/services/hub/get-hub-runtime-data.ts - Orquesta carga de sesión, perfil y progreso real para renderizar el hub.
import { HubService } from "@/core/services/hub/HubService";
import { GetHubMapUseCase } from "@/core/use-cases/hub/GetHubMapUseCase";
import { GetOrCreatePlayerProfileUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProfileUseCase";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { createSupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-profile-repository";
import { createSupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-progress-repository";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { SupabaseHubRepository } from "@/infrastructure/repositories/SupabaseHubRepository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { applyCombatReadinessLock } from "@/services/hub/internal/apply-combat-readiness-lock";

interface IHubRuntimeData {
  playerLabel: string;
  hubMap: Awaited<ReturnType<GetHubMapUseCase["execute"]>>;
}

function resolveDefaultNickname(email: string | null): string {
  if (!email) return "Operador";
  const candidate = email.split("@")[0]?.trim();
  return candidate && candidate.length >= 3 ? candidate : "Operador";
}

export async function getHubRuntimeData(): Promise<IHubRuntimeData> {
  const session = await getCurrentUserSession();
  if (!session) {
    const fallbackService = new HubService(new InMemoryHubRepository());
    const fallbackMap = await new GetHubMapUseCase(fallbackService).execute("local-player");
    return { playerLabel: "Operador local", hubMap: fallbackMap };
  }

  const profileRepository = await createSupabasePlayerProfileRepository();
  const progressRepository = await createSupabasePlayerProgressRepository();
  const profile = await new GetOrCreatePlayerProfileUseCase(profileRepository).execute({
    playerId: session.user.id,
    defaultNickname: resolveDefaultNickname(session.user.email),
  });
  await new GetOrCreatePlayerProgressUseCase(progressRepository).execute({ playerId: session.user.id });

  const hubService = new HubService(new SupabaseHubRepository(progressRepository));
  const [hubMap, loadout] = await Promise.all([
    new GetHubMapUseCase(hubService).execute(session.user.id),
    getPlayerBoardLoadout(),
  ]);
  return {
    playerLabel: profile.nickname || session.user.email || "Operador",
    hubMap: { ...hubMap, sections: applyCombatReadinessLock(hubMap.sections, loadout) },
  };
}
