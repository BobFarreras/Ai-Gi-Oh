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
  opponentAvatarObjectPosition?: string;
  onExitMatch?: () => void;
  /** Solo Story: Nexus perdido al abandonar el combate (aviso del menú de pausa). */
  abandonPenaltyNexus?: number;
  isTurnTimerEnabled?: boolean;
  suppressCombatBanners?: boolean;
  /** Multijugador: la pausa NO detiene el reloj de turno (evita congelar la partida al rival indefinidamente). */
  isMultiplayer?: boolean;
  /** Handler del timeout de turno (lo construye Board: incluye la lógica anti-AFK de pausa en multi). */
  onTurnTimeout?: () => void;
  /** Multi: turnos propios ya consumidos en pausa (para el aviso "X/N" del menú de pausa). */
  pausedTurnsUsed?: number;
}
