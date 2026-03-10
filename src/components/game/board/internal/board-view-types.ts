// src/components/game/board/internal/board-view-types.ts - Tipos compartidos para las secciones visuales del tablero.
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { IBoardScreenState } from "@/components/game/board/internal/use-board-screen-state";

export type IBoardController = ReturnType<typeof useBoard>;
export type IBoardPlayerState = IBoardController["gameState"]["playerA"];

export interface IBoardViewSectionProps {
  board: IBoardController;
  screen: IBoardScreenState;
  isMobile: boolean;
  player: IBoardPlayerState;
  opponent: IBoardPlayerState;
  playerAvatarUrl: string | null;
  opponentAvatarUrl: string | null;
}
