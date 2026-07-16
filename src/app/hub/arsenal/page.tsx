// src/app/hub/arsenal/page.tsx - Renderiza Arsenal con constructor de deck y fallback bloqueado según progreso.
import { HomeDeckBuilderScene } from "@/components/hub/home/HomeDeckBuilderScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { GetHomeDeckBuilderDataUseCase } from "@/core/use-cases/home/GetHomeDeckBuilderDataUseCase";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import { getPlayerCardUpgrades } from "@/services/progression/get-player-card-upgrades";
import { sharedDeckRepository } from "@/infrastructure/repositories/singletons";

interface IArsenalModulePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ArsenalModulePage({ searchParams }: IArsenalModulePageProps) {
  const resolvedSearchParams = await searchParams;
  // "?seccion=objetos": el aviso de canje del evento enlaza directo a la sección Objetos.
  const initialSection = resolvedSearchParams.seccion === "objetos" ? ("OBJECTS" as const) : ("CARDS" as const);
  const session = await getCurrentUserSession();
  const playerId = session?.user.id ?? "local-player";
  const runtimeRepositories = session ? await createPlayerRuntimeRepositories() : null;
  const deckRepository = runtimeRepositories?.deckRepository ?? sharedDeckRepository;
  const getHomeDeckBuilderDataUseCase = new GetHomeDeckBuilderDataUseCase(deckRepository);
  // Mejoras de objetos (ATK/DEF) por carta: el arsenal debe mostrar las stats reales (nivel/versión + mejoras)
  // tanto en el almacén como en el deck.
  const [data, cardProgress, cardUpgrades] = await Promise.all([
    getHomeDeckBuilderDataUseCase.execute(playerId),
    runtimeRepositories?.playerCardProgressRepository.listByPlayer(playerId) ?? Promise.resolve([]),
    session ? getPlayerCardUpgrades() : Promise.resolve({}),
  ]);

  return (
    <>
      <HubSectionEntryBurst />
      <HomeDeckBuilderScene
        playerId={playerId}
        initialDeck={data.deck}
        collection={data.collection}
        initialCardProgress={cardProgress}
        initialCardUpgrades={cardUpgrades}
        initialSection={initialSection}
      />
    </>
  );
}
