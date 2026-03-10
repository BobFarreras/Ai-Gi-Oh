// src/components/hub/home/internal/view/create-home-deck-builder-view-props.ts - Construye props de vista y workspace para mantener el orquestador de Home compacto.
import { Dispatch, SetStateAction } from "react";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICard } from "@/core/entities/ICard";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { IHomeActionResult, IHomeWorkspaceProps } from "@/components/hub/home/layout/home-workspace-types";
import { IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { IHomeDeckBuilderSceneViewProps } from "@/components/hub/home/internal/view/HomeDeckBuilderSceneView";

interface ICreateHomeDeckBuilderViewPropsInput {
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
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  canInsertSelectedCard: boolean;
  canRemoveSelectedCard: boolean;
  canEvolveSelectedCard: boolean;
  copiesRequiredToEvolve: number | null;
  deckCardCount: number;
  deckSize: number;
  errorMessage: string | null;
  evolutionOverlay: IHomeEvolutionOverlayState | null;
  evolutionCard: ICard | null;
  onNameQueryChange: Dispatch<SetStateAction<string>>;
  onChangeTypeFilter: Dispatch<SetStateAction<HomeCollectionTypeFilter>>;
  onChangeOrderField: Dispatch<SetStateAction<HomeCollectionOrderField>>;
  onToggleOrderDirection: () => void;
  onInsertSelectedCard: () => Promise<IHomeActionResult>;
  onRemoveSelectedCard: () => Promise<IHomeActionResult>;
  onEvolveSelectedCard: () => Promise<IHomeActionResult>;
  onBackToHub: () => void;
  onClearError: () => void;
  onSelectSlot: (slotIndex: number) => void;
  onSelectFusionSlot: (slotIndex: number) => void;
  onSelectCollectionCard: (cardId: string) => void;
  onStartDragCollectionCard: IHomeWorkspaceProps["onStartDragCollectionCard"];
  onStartDragDeckSlot: IHomeWorkspaceProps["onStartDragDeckSlot"];
  onStartDragFusionSlot: IHomeWorkspaceProps["onStartDragFusionSlot"];
  onDropOnDeckSlot: IHomeWorkspaceProps["onDropOnDeckSlot"];
  onDropOnFusionSlot: IHomeWorkspaceProps["onDropOnFusionSlot"];
  onDropOnCollectionArea: IHomeWorkspaceProps["onDropOnCollectionArea"];
}

export function createHomeDeckBuilderViewProps(input: ICreateHomeDeckBuilderViewPropsInput): IHomeDeckBuilderSceneViewProps {
  const workspaceProps: IHomeWorkspaceProps = {
    deck: input.deck,
    collectionState: input.collectionState,
    filteredCollection: input.filteredCollection,
    cardProgressById: input.cardProgressById,
    evolvableCardIds: input.evolvableCardIds,
    selectedSlotIndex: input.selectedSlotIndex,
    selectedFusionSlotIndex: input.selectedFusionSlotIndex,
    selectedCardId: input.selectedCardId,
    selectedCollectionCardId: input.selectedCollectionCardId,
    selectedCard: input.selectedCard,
    selectedCardVersionTier: input.selectedCardVersionTier,
    selectedCardLevel: input.selectedCardLevel,
    selectedCardXp: input.selectedCardXp,
    selectedCardMasteryPassiveSkillId: input.selectedCardMasteryPassiveSkillId,
    nameQuery: input.nameQuery,
    typeFilter: input.typeFilter,
    canInsertSelectedCard: input.canInsertSelectedCard,
    canRemoveSelectedCard: input.canRemoveSelectedCard,
    canEvolveSelectedCard: input.canEvolveSelectedCard,
    evolveCostForSelectedCard: input.copiesRequiredToEvolve,
    onInsertSelectedCard: input.onInsertSelectedCard,
    onRemoveSelectedCard: input.onRemoveSelectedCard,
    onEvolveSelectedCard: input.onEvolveSelectedCard,
    onSelectSlot: input.onSelectSlot,
    onSelectFusionSlot: input.onSelectFusionSlot,
    onSelectCollectionCard: input.onSelectCollectionCard,
    onStartDragCollectionCard: input.onStartDragCollectionCard,
    onStartDragDeckSlot: input.onStartDragDeckSlot,
    onStartDragFusionSlot: input.onStartDragFusionSlot,
    onDropOnDeckSlot: input.onDropOnDeckSlot,
    onDropOnFusionSlot: input.onDropOnFusionSlot,
    onDropOnCollectionArea: input.onDropOnCollectionArea,
    onClearError: input.onClearError,
  };
  return {
    deckCardCount: input.deckCardCount,
    deckSize: input.deckSize,
    canInsertSelectedCard: input.canInsertSelectedCard,
    canRemoveSelectedCard: input.canRemoveSelectedCard,
    canEvolveSelectedCard: input.canEvolveSelectedCard,
    copiesRequiredToEvolve: input.copiesRequiredToEvolve,
    typeFilter: input.typeFilter,
    orderField: input.orderField,
    orderDirection: input.orderDirection,
    nameQuery: input.nameQuery,
    workspaceProps,
    evolutionOverlay: input.evolutionOverlay,
    evolutionCard: input.evolutionCard,
    errorMessage: input.errorMessage,
    onNameQueryChange: input.onNameQueryChange,
    onChangeTypeFilter: input.onChangeTypeFilter,
    onChangeOrderField: input.onChangeOrderField,
    onToggleOrderDirection: input.onToggleOrderDirection,
    onInsertSelectedCard: input.onInsertSelectedCard,
    onRemoveSelectedCard: input.onRemoveSelectedCard,
    onEvolveSelectedCard: input.onEvolveSelectedCard,
    onBackToHub: input.onBackToHub,
    onClearError: input.onClearError,
  };
}
