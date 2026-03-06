// src/core/repositories/ICardCollectionRepository.ts - Contrato común para consultar y añadir cartas al almacén del jugador.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";

export interface ICardCollectionRepository {
  getCollection(playerId: string): Promise<ICollectionCard[]>;
  addCards(playerId: string, cardIds: string[]): Promise<void>;
  consumeCards(playerId: string, cardId: string, copies: number): Promise<void>;
}
