// src/app/hub/home/page.tsx - Renderiza Mi Home con constructor de deck y fallback bloqueado según progreso.

import { HomeDeckBuilderScene } from "@/components/hub/home/HomeDeckBuilderScene";
import { GetHomeDeckBuilderDataUseCase } from "@/core/use-cases/home/GetHomeDeckBuilderDataUseCase";
import { sharedDeckRepository } from "@/infrastructure/repositories/singletons";

export default async function HomeModulePage() {
  const playerId = "local-player";

 

  const getHomeDeckBuilderDataUseCase = new GetHomeDeckBuilderDataUseCase(sharedDeckRepository);
  const data = await getHomeDeckBuilderDataUseCase.execute(playerId);

  return <HomeDeckBuilderScene playerId={playerId} initialDeck={data.deck} collection={data.collection} />;
}
