// src/app/hub/home/page.tsx - Renderiza Mi Home con constructor de deck y fallback bloqueado según progreso.
import { HomeDeckBuilderScene } from "@/components/hub/home/HomeDeckBuilderScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { GetHomeDeckBuilderDataUseCase } from "@/core/use-cases/home/GetHomeDeckBuilderDataUseCase";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import { sharedDeckRepository } from "@/infrastructure/repositories/singletons";

export default async function HomeModulePage() {
  const session = await getCurrentUserSession();
  const playerId = session?.user.id ?? "local-player";
  const runtimeRepositories = session ? await createPlayerRuntimeRepositories() : null;
  const deckRepository = runtimeRepositories?.deckRepository ?? sharedDeckRepository;
  const getHomeDeckBuilderDataUseCase = new GetHomeDeckBuilderDataUseCase(deckRepository);
  const [data, cardProgress] = await Promise.all([
    getHomeDeckBuilderDataUseCase.execute(playerId),
    runtimeRepositories?.playerCardProgressRepository.listByPlayer(playerId) ?? Promise.resolve([]),
  ]);

  return (
    <>
      <HubSectionEntryBurst />
      <HomeDeckBuilderScene
        playerId={playerId}
        initialDeck={data.deck}
        collection={data.collection}
        initialCardProgress={cardProgress}
      />
    </>
  );
}
