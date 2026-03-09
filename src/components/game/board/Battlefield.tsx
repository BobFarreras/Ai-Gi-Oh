// src/components/game/board/Battlefield.tsx - Fachada memoizada del campo de batalla con zoom, ajuste móvil y vista desacoplada.
"use client";

import { memo, useState } from "react";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { BattlefieldView } from "@/components/game/board/battlefield/internal/BattlefieldView";
import { BattlefieldProps } from "@/components/game/board/battlefield/internal/battlefield-types";
import { useBattlefieldMobileFit } from "@/components/game/board/battlefield/internal/use-battlefield-mobile-fit";
import { areEqualBattlefieldProps } from "@/components/game/board/battlefield/internal/battlefield-props-equality";

function BattlefieldComponent(props: BattlefieldProps) {
  countRender("Battlefield");
  const [zoom, setZoom] = useState(1);
  const isMobileLayout = props.isMobileLayout ?? false;
  const viewportBoardScale = props.viewportBoardScale ?? 1;
  const { mobileFitScale, mobileBoardOffsetY } = useBattlefieldMobileFit(isMobileLayout);
  const effectiveBoardScale = isMobileLayout ? viewportBoardScale * 0.82 * mobileFitScale : viewportBoardScale;
  const onWheel = (event: React.WheelEvent) => {
    if (isMobileLayout) return;
    setZoom((previous) => Math.min(Math.max(previous - event.deltaY * 0.001, 0.6), 1.6));
  };
  return (
    <BattlefieldView
      {...props}
      isMobileLayout={isMobileLayout}
      viewportBoardScale={viewportBoardScale}
      zoom={zoom}
      effectiveBoardScale={effectiveBoardScale}
      mobileBoardOffsetY={mobileBoardOffsetY}
      onWheel={onWheel}
    />
  );
}

export const Battlefield = memo(BattlefieldComponent, areEqualBattlefieldProps);
