// src/core/use-cases/progression/RedeemEventShopItemUseCase.ts - Canjea un item de la tienda de evento.
import { ValidationError } from "@/core/errors/ValidationError";
import { IEventRedeemResult } from "@/core/entities/progression/IEvent";
import { IEventRepository } from "@/core/repositories/progression/IEventRepository";

export class RedeemEventShopItemUseCase {
  constructor(private readonly repository: IEventRepository) {}

  async execute(itemId: string): Promise<IEventRedeemResult> {
    if (!itemId.trim()) throw new ValidationError("El item de evento es obligatorio.");
    return this.repository.redeem(itemId);
  }
}
