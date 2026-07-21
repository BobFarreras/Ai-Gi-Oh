// src/infrastructure/persistence/supabase/BankDeckRepositoryAdapter.ts - Adaptador de IDeckRepository que
// redirige getDeck/saveDeck al 2º mazo (banco). Permite REUTILIZAR todos los use-cases del builder (añadir,
// quitar, mover, fusión, guardar) para editar el 2º mazo sin duplicar lógica ni validación: se construye el
// use-case con este adaptador cuando el jugador está editando el mazo secundario. getCollection y el resto
// delegan al repositorio base (la colección es única; el swap/bank real vive en el base).
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck, IDeckSwapResult } from "@/core/entities/home/IDeck";
import { IDeckRepository, ISwapActiveDeckCommand } from "@/core/repositories/IDeckRepository";

export class BankDeckRepositoryAdapter implements IDeckRepository {
  constructor(private readonly base: IDeckRepository) {}

  // El "deck activo" para el builder ES el banco cuando se usa este adaptador.
  getDeck(playerId: string): Promise<IDeck> {
    return this.base.getBankDeck(playerId);
  }
  saveDeck(deck: IDeck): Promise<void> {
    return this.base.saveBankDeck(deck);
  }
  getCollection(playerId: string): Promise<ICollectionCard[]> {
    return this.base.getCollection(playerId);
  }

  // El banco real y el swap se resuelven contra el base (no se anidan).
  getBankDeck(playerId: string): Promise<IDeck> {
    return this.base.getBankDeck(playerId);
  }
  saveBankDeck(deck: IDeck): Promise<void> {
    return this.base.saveBankDeck(deck);
  }
  swapActiveDeck(command: ISwapActiveDeckCommand): Promise<IDeckSwapResult> {
    return this.base.swapActiveDeck(command);
  }
}
