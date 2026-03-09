// src/components/hub/internal/useVirtualGridWindow.ts - Sincroniza scroll/resize del contenedor y expone la ventana virtual visible.
"use client";

import { RefObject, useEffect, useState } from "react";
import { computeVirtualGridWindow, IVirtualGridWindowResult } from "@/components/hub/internal/virtual-grid-window";

interface IUseVirtualGridWindowInput {
  containerRef: RefObject<HTMLElement | null>;
  itemCount: number;
  itemMinWidth: number;
  itemHeight: number;
  gap: number;
  overscanRows?: number;
}

const EMPTY_WINDOW: IVirtualGridWindowResult = {
  columns: 1,
  startIndex: 0,
  endIndex: 0,
  offsetTop: 0,
  totalHeight: 0,
};

function buildInitialWindow(input: IUseVirtualGridWindowInput): IVirtualGridWindowResult {
  return computeVirtualGridWindow({
    itemCount: input.itemCount,
    containerWidth: 412,
    containerHeight: 760,
    scrollTop: 0,
    itemMinWidth: input.itemMinWidth,
    itemHeight: input.itemHeight,
    gap: input.gap,
    overscanRows: input.overscanRows,
  });
}

export function useVirtualGridWindow(input: IUseVirtualGridWindowInput): IVirtualGridWindowResult {
  const [windowState, setWindowState] = useState<IVirtualGridWindowResult>(() => {
    if (input.itemCount < 1) return EMPTY_WINDOW;
    return buildInitialWindow(input);
  });

  useEffect(() => {
    const element = input.containerRef.current;
    if (!element) return;

    const updateWindow = () => {
      setWindowState(
        computeVirtualGridWindow({
          itemCount: input.itemCount,
          containerWidth: element.clientWidth,
          containerHeight: element.clientHeight,
          scrollTop: element.scrollTop,
          itemMinWidth: input.itemMinWidth,
          itemHeight: input.itemHeight,
          gap: input.gap,
          overscanRows: input.overscanRows,
        }),
      );
    };

    updateWindow();
    element.addEventListener("scroll", updateWindow, { passive: true });
    const resizeObserver = new ResizeObserver(updateWindow);
    resizeObserver.observe(element);
    return () => {
      element.removeEventListener("scroll", updateWindow);
      resizeObserver.disconnect();
    };
  }, [input.containerRef, input.gap, input.itemCount, input.itemHeight, input.itemMinWidth, input.overscanRows]);

  return windowState;
}
