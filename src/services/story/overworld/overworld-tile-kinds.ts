// src/services/story/overworld/overworld-tile-kinds.ts - Índices semánticos de tile compartidos entre el generador de mapas y el render procedural.

/** Capa `ground`: qué pisas. 0 = vacío. */
export const GROUND_TILE = {
  GRASS: 1,
  PATH: 2,
  WATER: 3,
  SAND: 4,
  FLOWER: 5,
} as const;

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
