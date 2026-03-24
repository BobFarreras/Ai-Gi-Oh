// src/components/hub/story/internal/map/layout/story-circuit-map-geometry.ts - Centraliza transformaciones geométricas del mapa Story para mantener StoryCircuitMap liviano.
interface IPoint {
  x: number;
  y: number;
}

export interface IStoryCanvasSize {
  width: number;
  height: number;
}

/**
 * Rota el layout para flujo móvil vertical manteniendo separación consistente entre nodos.
 */
export function rotateStoryPositionMapForMobile(positionMap: Record<string, IPoint>): Record<string, IPoint> {
  const points = Object.values(positionMap);
  if (points.length === 0) return positionMap;
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const transformed: Record<string, IPoint> = {};
  for (const [nodeId, point] of Object.entries(positionMap)) {
    transformed[nodeId] = { x: point.y - minY + 420, y: maxX - point.x + 520 };
  }
  return transformed;
}

/**
 * Aplica margen de seguridad para evitar recorte visual en nodos/segmentos extremos.
 */
export function resolveStoryCanvasSize(positionMap: Record<string, IPoint>): IStoryCanvasSize {
  const points = Object.values(positionMap);
  if (points.length === 0) return { width: 4200, height: 2600 };
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  return { width: Math.max(4200, maxX + 640), height: Math.max(2600, maxY + 520) };
}

export function resolveStoryCameraCenterTarget(input: {
  containerWidth: number;
  containerHeight: number;
  nodePosition: IPoint;
  scale: number;
}): IPoint {
  return {
    x: input.containerWidth / 2 - input.nodePosition.x * input.scale,
    y: input.containerHeight / 2 - input.nodePosition.y * input.scale + 100,
  };
}
