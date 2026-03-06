// src/core/use-cases/home/SaveDeckUseCase.ts - Valida reglas finales y persiste el deck completo del jugador.
import { IDeck } from "@/core/entities/home/IDeck";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { assertDeckReadyToSave } from "@/core/services/home/deck-rules";
import { assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

export class SaveDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(playerId: string): Promise<IDeck> {
    assertValidPlayerId(playerId);
    const deck = await this.deckRepository.getDeck(playerId);
    assertDeckReadyToSave(deck);
    await this.deckRepository.saveDeck(deck);
    return deck;
  }
}
