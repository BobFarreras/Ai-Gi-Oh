// src/components/hub/home/layout/home-workspace-types.ts - Contratos compartidos para layouts responsive del módulo Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICard } from "@/core/entities/ICard";

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
  onSelectSlot: (slotIndex: number) => void;
  onSelectCollectionCard: (cardId: string) => void;
  onClearError: () => void;
}
