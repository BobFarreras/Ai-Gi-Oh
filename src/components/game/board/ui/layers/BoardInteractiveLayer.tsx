// src/components/game/board/ui/layers/BoardInteractiveLayer.tsx - Orquesta capas interactivas del tablero con estado derivado y vista separada.
"use client";

import { memo } from "react";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { useBoardViewportScale } from "@/components/game/board/hooks/internal/layout/use-board-viewport-scale";
import { areEqualBoardInteractiveLayerProps } from "@/components/game/board/ui/layers/internal/board-interactive-equality";
import { resolveBoardSelectionState } from "@/components/game/board/ui/layers/internal/board-selection-state";
import { BoardInteractiveLayerView } from "@/components/game/board/ui/layers/internal/BoardInteractiveLayerView";
import { IBoardInteractiveLayerProps } from "@/components/game/board/ui/layers/internal/board-interactive-types";

function BoardInteractiveLayerComponent(props: IBoardInteractiveLayerProps) {
  countRender("BoardInteractiveLayer");
  const viewport = useBoardViewportScale({
    hasLeftPanel: !props.isMobileLayout && Boolean(props.selectedCard),
    hasRightPanel: !props.isMobileLayout && props.isHistoryOpen,
  });
  const selection = resolveBoardSelectionState(props);
  return <BoardInteractiveLayerView {...props} viewport={viewport} selection={selection} />;
}

export const BoardInteractiveLayer = memo(BoardInteractiveLayerComponent, areEqualBoardInteractiveLayerProps);
