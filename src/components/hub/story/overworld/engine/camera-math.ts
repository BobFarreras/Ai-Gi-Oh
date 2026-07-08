// src/components/hub/story/overworld/engine/camera-math.ts - Matemática pura de cámara del overworld (follow + clamp).

export interface ICameraViewport {
  /** Tamaño del viewport en píxeles CSS (no físicos). */
  width: number;
  height: number;
}

export interface ICameraWorldSize {
  /** Tamaño total del mundo en píxeles (width = tiles * tileSize). */
  width: number;
  height: number;
}

export interface ICameraOffset {
  x: number;
  y: number;
}

/**
 * Calcula el desplazamiento de cámara para centrar el foco (posición del jugador en px),
 * sin enseñar jamás el vacío fuera del mapa. Si el mundo es más pequeño que el viewport
 * en un eje, se centra en ese eje.
 */
export function resolveCameraOffset(
  focus: ICameraOffset,
  viewport: ICameraViewport,
  world: ICameraWorldSize,
): ICameraOffset {
  return {
    x: resolveAxisOffset(focus.x, viewport.width, world.width),
    y: resolveAxisOffset(focus.y, viewport.height, world.height),
  };
}

function resolveAxisOffset(focus: number, viewportSize: number, worldSize: number): number {
  if (worldSize <= viewportSize) {
    // Mundo más pequeño que el viewport: centrado fijo.
    return (viewportSize - worldSize) / 2;
  }
  const centered = viewportSize / 2 - focus;
  const minOffset = viewportSize - worldSize;
  return Math.min(0, Math.max(minOffset, centered));
}

/**
 * Rango de tiles visibles para el culling del renderer (con 1 celda de margen).
 */
export function resolveVisibleTileRange(input: {
  cameraOffset: ICameraOffset;
  viewport: ICameraViewport;
  tileSize: number;
  mapWidth: number;
  mapHeight: number;
}): { minTileX: number; minTileY: number; maxTileX: number; maxTileY: number } {
  const { cameraOffset, viewport, tileSize, mapWidth, mapHeight } = input;
  const minTileX = Math.max(0, Math.floor(-cameraOffset.x / tileSize) - 1);
  const minTileY = Math.max(0, Math.floor(-cameraOffset.y / tileSize) - 1);
  const maxTileX = Math.min(mapWidth - 1, Math.ceil((viewport.width - cameraOffset.x) / tileSize) + 1);
  const maxTileY = Math.min(mapHeight - 1, Math.ceil((viewport.height - cameraOffset.y) / tileSize) + 1);
  return { minTileX, minTileY, maxTileX, maxTileY };
}
