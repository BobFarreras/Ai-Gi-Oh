// src/core/use-cases/home/GetHomeDeckBuilderDataUseCase.ts - Obtiene deck y almacén para renderizar Mi Home.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

export interface IHomeDeckBuilderData {
  deck: IDeck;
  collection: ICollectionCard[];
}

export class GetHomeDeckBuilderDataUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(playerId: string): Promise<IHomeDeckBuilderData> {
    assertValidPlayerId(playerId);
    const [deck, collection] = await Promise.all([
      this.deckRepository.getDeck(playerId),
      this.deckRepository.getCollection(playerId),
    ]);

    return { deck, collection };
  }
}
