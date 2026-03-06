// src/core/entities/home/IDeck.ts - Define el modelo de deck de 20 slots para el constructor de mazos.
export interface IDeckCardSlot {
  index: number;
  cardId: string | null;
}

export interface IDeck {
  playerId: string;
  slots: IDeckCardSlot[];
}
