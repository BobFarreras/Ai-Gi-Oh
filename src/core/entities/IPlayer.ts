// src/core/entities/IPlayer.ts - Contratos del jugador en combate con zonas de deck, campo, cementerio y destrucción.
import { ICard } from "./ICard";

// Ampliamos los modos para soportar magias (ACTIVATE)
export type BattleMode = 'ATTACK' | 'DEFENSE' | 'SET' | 'ACTIVATE';

export interface IBoardEntity {
  instanceId: string;
  card: ICard;
  mode: BattleMode;
  modeLock?: Extract<BattleMode, "ATTACK" | "DEFENSE"> | null;
  hasAttackedThisTurn: boolean;
  isNewlySummoned: boolean;
}

export interface IPlayer {
  id: string;
  name: string;
  healthPoints: number;
  maxHealthPoints: number;
  currentEnergy: number;
  maxEnergy: number;
  deck: ICard[];
  fusionDeck?: ICard[];
  hand: ICard[];
  graveyard: ICard[];
  destroyedPile?: ICard[];
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[];
}
