// src/components/game/board/ui/layers/internal/board-selection-state.ts - Deriva estado de selección para overlays y comportamiento de interacción móvil.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { IBoardInteractiveLayerProps, IBoardSelectionState } from "@/components/game/board/ui/layers/internal/board-interactive-types";

function resolveSelectedBoardEntity(
  entities: IBoardEntity[],
  selectedCard: IBoardInteractiveLayerProps["selectedCard"],
  selectedBoardEntityInstanceId: string | null,
): IBoardEntity | null {
  const selectedById = selectedBoardEntityInstanceId
    ? entities.find((entity) => entity.instanceId === selectedBoardEntityInstanceId) ?? null
    : null;
  if (selectedById) return selectedById;
  if (!selectedCard) return null;
  return (
    entities.find((entity) => {
      if (selectedCard.runtimeId && entity.card.runtimeId) return selectedCard.runtimeId === entity.card.runtimeId;
      return selectedCard.id === entity.card.id;
    }) ?? null
  );
}

export function resolveBoardSelectionState(props: IBoardInteractiveLayerProps): IBoardSelectionState {
  const isBattlePhase = props.phase.toUpperCase().includes("BATTLE");
  const playerEntities = [...props.player.activeEntities, ...props.player.activeExecutions];
  const opponentEntities = [...props.opponent.activeEntities, ...props.opponent.activeExecutions];
  const selectedPlayerEntity = resolveSelectedBoardEntity(playerEntities, props.selectedCard, props.selectedBoardEntityInstanceId);
  const selectedOpponentEntity = resolveSelectedBoardEntity(opponentEntities, props.selectedCard, props.selectedBoardEntityInstanceId);
  const hasBoardSelection = !props.playingCard && Boolean(props.selectedBoardEntityInstanceId || selectedPlayerEntity || selectedOpponentEntity);
  const overlaySource: "BOARD" | "HAND" = hasBoardSelection ? "BOARD" : "HAND";
  const isOpponentBoardSelection = Boolean(selectedOpponentEntity);
  const selectedBoardEntity = selectedPlayerEntity ?? selectedOpponentEntity;
  const selectedOverlayCard = overlaySource === "BOARD" ? (selectedBoardEntity?.card ?? null) : (props.playingCard ?? null);
  const shouldHideOverlayForOwnBoardInBattle = overlaySource === "BOARD" && !isOpponentBoardSelection && isBattlePhase;
  const shouldHideOpponentSetInSummonPhase = overlaySource === "BOARD" && !isBattlePhase && Boolean(selectedOpponentEntity?.mode === "SET");
  return {
    isBattlePhase,
    overlaySource,
    isOpponentBoardSelection,
    selectedOverlayCard,
    shouldRenderMobileOverlay: Boolean(selectedOverlayCard) && !shouldHideOverlayForOwnBoardInBattle && !shouldHideOpponentSetInSummonPhase,
  };
}
