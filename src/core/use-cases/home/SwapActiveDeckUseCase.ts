// src/core/use-cases/home/SwapActiveDeckUseCase.ts - Doble Arsenal (ficha 8): intercambia el mazo activo con el
// del banco (2º mazo). No aporta datos del cliente salvo el operationId; la RPC service-role valida la llave
// (nodo UNLOCK_SECOND_DECK) y aplica el swap de forma atómica e idempotente.
import { ValidationError } from "@/core/errors/ValidationError";
import { IDeckSwapResult } from "@/core/entities/home/IDeck";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";

export interface ISwapActiveDeckInput {
  playerId: string;
  operationId: string;
}

export class SwapActiveDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: ISwapActiveDeckInput): Promise<IDeckSwapResult> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    if (!input.operationId.trim()) throw new ValidationError("La operación de cambio de mazo es obligatoria.");

    return this.deckRepository.swapActiveDeck({ playerId: input.playerId, operationId: input.operationId });
  }
}
