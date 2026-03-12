// src/core/entities/story/IPlayerStoryWorldCompactState.ts - Estado compacto persistido de navegación Story por jugador.
export interface IPlayerStoryWorldCompactState {
  currentNodeId: string | null;
  visitedNodeIds: string[];
  interactedNodeIds: string[];
}
