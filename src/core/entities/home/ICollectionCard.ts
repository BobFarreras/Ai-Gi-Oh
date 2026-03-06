// src/core/entities/home/ICollectionCard.ts - Define una carta del almacén del jugador con cantidad disponible.
import { ICard } from "@/core/entities/ICard";

export interface ICollectionCard {
  card: ICard;
  ownedCopies: number;
}
