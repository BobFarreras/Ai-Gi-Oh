// src/components/hub/home/internal/types/home-deck-builder-types.ts - Tipos compartidos del contenedor principal de Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

export interface IHomeDeckBuilderSceneProps {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
}

export interface IHomeEvolutionOverlayState {
  cardId: string;
  fromVersionTier: number;
  toVersionTier: number;
  level: number;
  consumedCopies: number;
}

export interface IHomeDraggedCardState {
  cardId: string;
  source: "COLLECTION" | "DECK" | "FUSION";
  slotIndex?: number;
}
