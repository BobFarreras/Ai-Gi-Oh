// src/components/game/board/hooks/internal/layout/board-layout-metrics.ts - Calcula escalas responsivas del tablero y mano para desktop sin alterar la UX base.
export interface IBoardViewportInput {
  width: number;
  height: number;
  hasLeftPanel: boolean;
  hasRightPanel: boolean;
}

export interface IBoardViewportMetrics {
  boardScale: number;
  handCardScale: number;
  handOverlapPx: number;
  handYOffsetPx: number;
  handContainerHeightPx: number;
  handHoverLiftPx: number;
  handCenterOffsetPx: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computePanelPenalty(input: IBoardViewportInput): number {
  if (input.hasLeftPanel || input.hasRightPanel) return 0.07;
  return 0;
}

export function resolveBoardViewportMetrics(input: IBoardViewportInput): IBoardViewportMetrics {
  const widthFactor = clamp((input.width - 1180) / 520, 0, 1);
  const heightFactor = clamp((input.height - 760) / 260, 0, 1);
  const panelPenalty = computePanelPenalty(input);
  const baseScale = 0.76 + widthFactor * 0.14 + heightFactor * 0.09 - panelPenalty;
  const boardScale = clamp(baseScale, 0.62, 1);
  const compactness = clamp((1 - boardScale) / 0.34, 0, 1);

  const smallDesktopFactor = clamp((1480 - input.width) / 460, 0, 1);
  return {
    boardScale,
    handCardScale: clamp(0.84 - compactness * 0.3, 0.54, 0.84),
    handOverlapPx: Math.round(26 + compactness * 34),
    handYOffsetPx: Math.round(132 + compactness * 42),
    handContainerHeightPx: Math.round(470 - compactness * 140),
    handHoverLiftPx: Math.round(34 + compactness * 44),
    handCenterOffsetPx: Math.round(smallDesktopFactor * 76),
  };
}
