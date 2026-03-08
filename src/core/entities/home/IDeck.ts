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
