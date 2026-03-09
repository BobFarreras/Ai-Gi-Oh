// src/components/hub/internal/virtual-grid-window.ts - Calcula la ventana visible de un grid para virtualizar listas largas por viewport.
export interface IVirtualGridWindowInput {
  itemCount: number;
  containerWidth: number;
  containerHeight: number;
  scrollTop: number;
  itemMinWidth: number;
  itemHeight: number;
  gap: number;
  overscanRows?: number;
}

export interface IVirtualGridWindowResult {
  columns: number;
  startIndex: number;
  endIndex: number;
  offsetTop: number;
  totalHeight: number;
}

export function computeVirtualGridWindow(input: IVirtualGridWindowInput): IVirtualGridWindowResult {
  const safeCount = Math.max(0, input.itemCount);
  const safeGap = Math.max(0, input.gap);
  const safeItemWidth = Math.max(1, input.itemMinWidth);
  const safeItemHeight = Math.max(1, input.itemHeight);
  const safeContainerWidth = Math.max(1, input.containerWidth);
  const safeContainerHeight = Math.max(1, input.containerHeight);
  const safeScrollTop = Math.max(0, input.scrollTop);
  const overscan = Math.max(0, input.overscanRows ?? 2);
  const stepY = safeItemHeight + safeGap;
  const columns = Math.max(1, Math.floor((safeContainerWidth + safeGap) / (safeItemWidth + safeGap)));
  const rowCount = Math.ceil(safeCount / columns);
  const startRow = Math.max(0, Math.floor(safeScrollTop / stepY) - overscan);
  const endRow = Math.min(
    Math.max(0, rowCount - 1),
    Math.ceil((safeScrollTop + safeContainerHeight) / stepY) + overscan,
  );
  const startIndex = Math.min(safeCount, startRow * columns);
  const endIndex = Math.min(safeCount, (endRow + 1) * columns);
  const totalHeight = Math.max(0, rowCount * stepY - safeGap);
  return { columns, startIndex, endIndex, offsetTop: startRow * stepY, totalHeight };
}
