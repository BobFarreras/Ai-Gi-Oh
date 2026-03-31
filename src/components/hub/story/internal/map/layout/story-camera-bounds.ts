// src/components/hub/story/internal/map/layout/story-camera-bounds.ts - Calcula y aplica límites de cámara para evitar zonas vacías fuera del mapa.
export interface IStoryCameraBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function resolveStoryCameraBounds(input: {
  containerWidth: number;
  containerHeight: number;
  canvasWidth: number;
  canvasHeight: number;
  scale: number;
}): IStoryCameraBounds {
  const scaledWidth = input.canvasWidth * input.scale;
  const scaledHeight = input.canvasHeight * input.scale;
  if (scaledWidth <= input.containerWidth) {
    const centeredX = (input.containerWidth - scaledWidth) / 2;
    if (scaledHeight <= input.containerHeight) {
      const centeredY = (input.containerHeight - scaledHeight) / 2;
      return { minX: centeredX, maxX: centeredX, minY: centeredY, maxY: centeredY };
    }
    return { minX: centeredX, maxX: centeredX, minY: input.containerHeight - scaledHeight, maxY: 0 };
  }
  if (scaledHeight <= input.containerHeight) {
    const centeredY = (input.containerHeight - scaledHeight) / 2;
    return { minX: input.containerWidth - scaledWidth, maxX: 0, minY: centeredY, maxY: centeredY };
  }
  return { minX: input.containerWidth - scaledWidth, maxX: 0, minY: input.containerHeight - scaledHeight, maxY: 0 };
}

export function clampStoryCameraPosition(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
