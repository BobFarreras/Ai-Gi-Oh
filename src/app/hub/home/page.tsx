// src/app/hub/home/page.tsx - Renderiza Mi Home con constructor de deck y fallback bloqueado según progreso.

import { HomeDeckBuilderScene } from "@/components/hub/home/HomeDeckBuilderScene";
import { GetHomeDeckBuilderDataUseCase } from "@/core/use-cases/home/GetHomeDeckBuilderDataUseCase";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";

export default async function HomeModulePage() {
  const playerId = "local-player";

 

  const repository = new InMemoryDeckRepository();
  const getHomeDeckBuilderDataUseCase = new GetHomeDeckBuilderDataUseCase(repository);
  const data = await getHomeDeckBuilderDataUseCase.execute(playerId);

  return <HomeDeckBuilderScene playerId={playerId} initialDeck={data.deck} collection={data.collection} />;
}
