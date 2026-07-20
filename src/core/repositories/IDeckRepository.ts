// src/core/repositories/IDeckRepository.ts - Contrato de lectura y guardado del deck y colección del jugador.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck, IDeckSwapResult } from "@/core/entities/home/IDeck";

export interface ISwapActiveDeckCommand {
  playerId: string;
  /** Clave de idempotencia (una por intento de swap). */
  operationId: string;
}

export interface IDeckRepository {
  getDeck(playerId: string): Promise<IDeck>;
  saveDeck(deck: IDeck): Promise<void>;
  getCollection(playerId: string): Promise<ICollectionCard[]>;
  /** Doble Arsenal: lee el 2º mazo (banco); si nunca se inicializó, lo siembra como copia del activo. */
  getBankDeck(playerId: string): Promise<IDeck>;
  /** Doble Arsenal: intercambia activo <-> banco vía RPC service-role (atómico, idempotente, gateado por el nodo). */
  swapActiveDeck(command: ISwapActiveDeckCommand): Promise<IDeckSwapResult>;
}
