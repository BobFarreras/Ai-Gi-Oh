// src/core/entities/story/IPlayerOverworldState.ts - Posición persistida del jugador en el overworld Story.
export interface IPlayerOverworldPosition {
  tileX: number;
  tileY: number;
}

export interface IPlayerOverworldState {
  mapId: string | null;
  position: IPlayerOverworldPosition | null;
}

export interface ISaveOverworldStateInput {
  /** Si se indica, fija el nodo actual (para que el duelo lanzado sea jugable). */
  currentNodeId?: string | null;
  mapId: string;
  position: IPlayerOverworldPosition;
}
