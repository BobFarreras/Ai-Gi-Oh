// src/components/hub/home/layout/home-workspace-types.ts - Contratos compartidos para layouts responsive del módulo Arsenal.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { ICard } from "@/core/entities/ICard";
import { HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { DragEvent } from "react";

export interface IHomeActionResult {
  ok: boolean;
  message?: string;
}

/** Doble Arsenal (ficha 8): controles del 2º mazo, integrados en el header y el panel del deck. null = sin habilidad. */
export interface ISecondDeckControls {
  editingDeckSlot: "PRINCIPAL" | "SECONDARY";
  busy: boolean;
  onSwitch: (slot: "PRINCIPAL" | "SECONDARY") => void;
  onActivate: () => void;
}

export interface IHomeWorkspaceProps {
  /** Doble Arsenal: controles del 2º mazo para el panel del deck ("hacer principal" en móvil). null si no aplica. */
  secondDeck?: ISecondDeckControls | null;
  deck: IDeck;
  collectionState: ICollectionCard[];
  filteredCollection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  cardUpgradesById: Map<string, ICardUpgradeBonuses>;
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
  /** "Equipar objeto" (flujo A) o "Activar {objeto}" (flujo B): la etiqueta la decide equipPendingObjectLabel. */
  onEquipSelectedCard: () => void;
  /** Nombre del objeto pendiente de equipar (flujo B). null = botón "Equipar objeto" (flujo A). */
  equipPendingObjectLabel: string | null;
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
