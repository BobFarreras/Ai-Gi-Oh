// src/core/entities/IPlayer.ts
import { ICard } from "./ICard";

// Ampliamos los modos para soportar magias (ACTIVATE)
export type BattleMode = 'ATTACK' | 'DEFENSE' | 'SET' | 'ACTIVATE';

export interface IBoardEntity {
  instanceId: string;
  card: ICard;
  mode: BattleMode;
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
  hand: ICard[];
  graveyard: ICard[]; 
  activeEntities: IBoardEntity[];
  activeExecutions: IBoardEntity[]; // <-- Aquí irán las magias/trampas
}
