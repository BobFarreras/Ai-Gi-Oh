// src/components/hub/home/layout/home-workspace-types.ts - Contratos compartidos para layouts responsive del módulo Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICard } from "@/core/entities/ICard";
import { HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { DragEvent } from "react";

export interface IHomeActionResult {
  ok: boolean;
  message?: string;
}

export interface IHomeWorkspaceProps {
  deck: IDeck;
  collectionState: ICollectionCard[];
  filteredCollection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  evolvableCardIds: Set<string>;
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
  selectedCardId: string | null;
  selectedCollectionCardId: string | null;
  selectedCard: ICard | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardXp: number;
  selectedCardMasteryPassiveSkillId: string | null;
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
  canInsertSelectedCard: boolean;
  canRemoveSelectedCard: boolean;
  canEvolveSelectedCard: boolean;
  evolveCostForSelectedCard: number | null;
  onInsertSelectedCard: () => Promise<IHomeActionResult>;
  onRemoveSelectedCard: () => Promise<IHomeActionResult>;
  onEvolveSelectedCard: () => Promise<IHomeActionResult>;
  onSelectSlot: (slotIndex: number) => void;
  onSelectFusionSlot: (slotIndex: number) => void;
  onSelectCollectionCard: (cardId: string) => void;
  onStartDragCollectionCard: (cardId: string, event: DragEvent<HTMLElement>) => void;
  onStartDragDeckSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onStartDragFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnDeckSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnFusionSlot: (slotIndex: number, event: DragEvent<HTMLElement>) => void;
  onDropOnCollectionArea: (event: DragEvent<HTMLElement>) => void;
  onClearError: () => void;
}
