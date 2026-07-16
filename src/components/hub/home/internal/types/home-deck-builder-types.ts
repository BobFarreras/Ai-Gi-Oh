// src/components/hub/home/internal/types/home-deck-builder-types.ts - Tipos compartidos del contenedor principal de Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";

export interface IHomeDeckBuilderSceneProps {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
  /** Bonus de objetos de mejora (ATK/DEF) por carta, para mostrar stats reales en almacén y deck. */
  initialCardUpgrades: Record<string, ICardUpgradeBonuses>;
  /** Sección con la que abre el arsenal ("?seccion=objetos" desde el aviso de canje del evento). */
  initialSection?: "CARDS" | "OBJECTS";
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
