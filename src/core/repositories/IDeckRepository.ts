// src/core/repositories/IDeckRepository.ts - Contrato de lectura y guardado del deck y colección del jugador.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";

export interface IDeckRepository {
  getDeck(playerId: string): Promise<IDeck>;
  saveDeck(deck: IDeck): Promise<void>;
  getCollection(playerId: string): Promise<ICollectionCard[]>;
}
