// src/core/use-cases/home/EvolveCardVersionUseCase.ts - Evoluciona versión de carta consumiendo copias del almacén y actualizando progreso persistente.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { IPlayerCardProgressRepository } from "@/core/repositories/IPlayerCardProgressRepository";
import { countDeckCopies } from "@/core/services/home/deck-rules";
import { getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";
import { assertValidCardId, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IEvolveCardVersionInput {
  playerId: string;
  cardId: string;
}

export interface IEvolveCardVersionResult {
  progress: IPlayerCardProgress;
  collection: ICollectionCard[];
  consumedCopies: number;
}

export class EvolveCardVersionUseCase {
  constructor(
    private readonly collectionRepository: ICardCollectionRepository,
    private readonly deckRepository: IDeckRepository,
    private readonly playerCardProgressRepository: IPlayerCardProgressRepository,
  ) {}

  async execute(input: IEvolveCardVersionInput): Promise<IEvolveCardVersionResult> {
    assertValidPlayerId(input.playerId);
    assertValidCardId(input.cardId);
    const [collection, deck, progress] = await Promise.all([
      this.collectionRepository.getCollection(input.playerId),
      this.deckRepository.getDeck(input.playerId),
      this.playerCardProgressRepository.getByPlayerAndCard(input.playerId, input.cardId),
    ]);
    const currentVersionTier = progress?.versionTier ?? 0;
    const neededCopies = getCopiesNeededForNextVersion(currentVersionTier);
    if (neededCopies === null) throw new GameRuleError("La carta ya está en la versión máxima.");
    const collectionEntry = collection.find((entry) => entry.card.id === input.cardId);
    const deckCopies = countDeckCopies(deck, input.cardId);
    const availableStorageCopies = (collectionEntry?.ownedCopies ?? 0) - deckCopies;
    if (!collectionEntry || availableStorageCopies < neededCopies) {
      throw new GameRuleError(
        `Se necesitan ${neededCopies} copias libres en almacén para evolucionar esta carta. Almacén: ${collectionEntry?.ownedCopies ?? 0}, deck: ${deckCopies}, libres: ${Math.max(0, availableStorageCopies)}.`,
      );
    }
    await this.collectionRepository.consumeCards(input.playerId, input.cardId, neededCopies);
    const updatedProgress = await this.playerCardProgressRepository.upsert({
      playerId: input.playerId,
      cardId: input.cardId,
      versionTier: currentVersionTier + 1,
      level: progress?.level ?? 0,
      xp: progress?.xp ?? 0,
      masteryPassiveSkillId: progress?.masteryPassiveSkillId ?? null,
    });
    const updatedCollection = await this.collectionRepository.getCollection(input.playerId);
    return { progress: updatedProgress, collection: updatedCollection, consumedCopies: neededCopies };
  }
}
