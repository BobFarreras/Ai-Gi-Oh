// src/core/entities/home/IDeck.ts - Define el mazo principal y los slots dedicados de fusión del constructor de mazos.
export interface IDeckCardSlot {
  index: number;
  cardId: string | null;
}

export interface IDeck {
  playerId: string;
  slots: IDeckCardSlot[];
  fusionSlots: IDeckCardSlot[];
}

/** Resultado de `swap_active_deck` (Doble Arsenal). `reason='no_second_deck'` = el jugador no tiene la llave. */
export interface IDeckSwapResult {
  ok: boolean;
  reason?: "bad_args" | "no_second_deck";
  duplicate?: boolean;
}
