// src/components/hub/home/internal/hooks/use-home-deck-builder-actions.ts - Agrupa acciones principales del builder de Home sobre un set de dependencias.
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";
import { handleHomeInsertSelectedCard } from "@/components/hub/home/internal/actions/handle-home-insert-selected-card";
import { handleHomeRemoveSelectedCard } from "@/components/hub/home/internal/actions/handle-home-remove-selected-card";
import { handleHomeEvolveSelectedCard } from "@/components/hub/home/internal/actions/handle-home-evolve-selected-card";
import { IHomeActionDeps } from "@/components/hub/home/internal/actions/home-action-deps";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";

interface IUseHomeDeckBuilderActionsInput extends IHomeActionDeps {
  selectedCollectionCardId: string | null;
  selectedCollectionCardType: string | null;
  targetFusionSlotIndex: number | null;
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
  selectedCardId: string | null;
  canEvolveSelectedCard: boolean;
  copiesRequiredToEvolve: number | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardProgress: IPlayerCardProgress | null;
}

/**
 * Orquesta acciones de alto nivel del builder reutilizando casos de uso UI desacoplados.
 */
export function useHomeDeckBuilderActions(input: IUseHomeDeckBuilderActionsInput) {
  const handleInsertSelectedCard = async (): Promise<IHomeActionResult> =>
    handleHomeInsertSelectedCard({
      ...input,
      selectedCollectionCardId: input.selectedCollectionCardId,
      selectedCollectionCardType: input.selectedCollectionCardType,
      targetFusionSlotIndex: input.targetFusionSlotIndex,
    });
  const handleRemoveSelectedCard = async (): Promise<IHomeActionResult> =>
    handleHomeRemoveSelectedCard({
      ...input,
      selectedSlotIndex: input.selectedSlotIndex,
      selectedFusionSlotIndex: input.selectedFusionSlotIndex,
    });
  const handleEvolveSelectedCard = async (): Promise<IHomeActionResult> =>
    handleHomeEvolveSelectedCard({
      ...input,
      selectedCardId: input.selectedCardId,
      canEvolveSelectedCard: input.canEvolveSelectedCard,
      copiesRequiredToEvolve: input.copiesRequiredToEvolve,
      selectedCardVersionTier: input.selectedCardVersionTier,
      selectedCardLevel: input.selectedCardLevel,
      selectedCardProgress: input.selectedCardProgress,
    });
  return { handleInsertSelectedCard, handleRemoveSelectedCard, handleEvolveSelectedCard };
}
