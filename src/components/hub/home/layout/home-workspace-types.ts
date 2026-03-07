// src/components/hub/home/layout/home-workspace-types.ts - Contratos compartidos para layouts responsive del módulo Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICard } from "@/core/entities/ICard";
import { HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";

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
  onSelectCollectionCard: (cardId: string) => void;
  onClearError: () => void;
}
