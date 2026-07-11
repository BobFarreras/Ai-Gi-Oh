// src/services/story/overworld/overworld-tile-kinds.ts - Índices semánticos de tile compartidos entre el generador de mapas y el render procedural.

/** Capa `ground`: qué pisas. 0 = vacío. */
export const GROUND_TILE = {
  GRASS: 1,
  PATH: 2,
  WATER: 3,
  SAND: 4,
  FLOWER: 5,
  // v2 — cintas transportadoras: al aterrizar sobre ellas, arrastran al jugador una
  // celda en su dirección. Transitables como suelo de sala.
  BELT_UP: 6,
  BELT_DOWN: 7,
  BELT_LEFT: 8,
  BELT_RIGHT: 9,
} as const;

/** Dirección de arrastre de cada tile de cinta. `null` si el tile no es cinta. */
export function resolveBeltDirection(
  tileKind: number | undefined,
): "UP" | "DOWN" | "LEFT" | "RIGHT" | null {
  switch (tileKind) {
    case GROUND_TILE.BELT_UP:
      return "UP";
    case GROUND_TILE.BELT_DOWN:
      return "DOWN";
    case GROUND_TILE.BELT_LEFT:
      return "LEFT";
    case GROUND_TILE.BELT_RIGHT:
      return "RIGHT";
    default:
      return null;
  }
}

/** Capa `overlay`: decoración/estructura dibujada por encima del jugador. 0 = nada. */
export const OVERLAY_TILE = {
  TREE: 1, // pilar tech (legacy fixture)
  ROCK: 2, // roca (legacy fixture)
  SERVER_RACK: 3,
  HOLO_SCREEN: 4,
  CRATE: 5,
} as const;

export type GroundTileKind = (typeof GROUND_TILE)[keyof typeof GROUND_TILE];
export type OverlayTileKind = (typeof OVERLAY_TILE)[keyof typeof OVERLAY_TILE];
