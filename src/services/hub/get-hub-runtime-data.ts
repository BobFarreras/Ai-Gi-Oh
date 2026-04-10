// src/services/hub/get-hub-runtime-data.ts - Orquesta carga de sesión, perfil y progreso real para renderizar el hub.
import { HubService } from "@/core/services/hub/HubService";
import { GetHubMapUseCase } from "@/core/use-cases/hub/GetHubMapUseCase";
import { GetOrCreatePlayerProfileUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProfileUseCase";
import { GetOrCreateStarterDeckUseCase } from "@/core/use-cases/player/GetOrCreateStarterDeckUseCase";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { createSupabasePlayerProfileRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-profile-repository";
import { createSupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { createSupabaseStarterDeckTemplateRepository } from "@/infrastructure/persistence/supabase/create-supabase-starter-deck-template-repository";
import { createSupabaseTrainingProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-training-progress-repository";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { SupabaseHubRepository } from "@/infrastructure/repositories/SupabaseHubRepository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { applyCombatReadinessLock } from "@/services/hub/internal/apply-combat-readiness-lock";
import { resolveHubRuntimeProgress } from "@/services/hub/internal/resolve-hub-runtime-progress";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import { runPlayerRuntimeInitOnce } from "@/services/player-persistence/internal/player-runtime-init-gate";

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
  const runtimeRepositories = await createPlayerRuntimeRepositories();
  const starterDeckTemplateRepository = await createSupabaseStarterDeckTemplateRepository();
  await runPlayerRuntimeInitOnce(session.user.id, async () => {
    await new GetOrCreatePlayerProgressUseCase(progressRepository).execute({ playerId: session.user.id });
    await new GetOrCreateStarterDeckUseCase(
      runtimeRepositories.deckRepository,
      runtimeRepositories.collectionRepository,
      starterDeckTemplateRepository,
    ).execute({ playerId: session.user.id });
  });

  const hubService = new HubService(new SupabaseHubRepository(progressRepository));
  const [hubMap, loadout, storyWorldRepository, trainingProgressRepository] = await Promise.all([
    new GetHubMapUseCase(hubService).execute(session.user.id),
    getPlayerBoardLoadout(),
    createSupabasePlayerStoryWorldRepository(),
    createSupabaseTrainingProgressRepository(),
  ]);
  const [storyCurrentNodeId, trainingProgress] = await Promise.all([
    storyWorldRepository.getCurrentNodeIdByPlayerId(session.user.id),
    trainingProgressRepository.getByPlayerId(session.user.id),
  ]);
  const runtimeProgress = resolveHubRuntimeProgress({
    fallbackStoryChapter: hubMap.progress.storyChapter,
    fallbackMedals: hubMap.progress.medals,
    storyCurrentNodeId,
    trainingTotalWins: trainingProgress?.totalWins ?? null,
  });
  return {
    playerLabel: profile.nickname || session.user.email || "Operador",
    hubMap: {
      ...hubMap,
      progress: {
        ...hubMap.progress,
        storyChapter: runtimeProgress.storyChapter,
        medals: runtimeProgress.medals,
      },
      sections: applyCombatReadinessLock(hubMap.sections, loadout),
    },
  };
}
