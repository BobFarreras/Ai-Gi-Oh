// src/components/game/board/hooks/internal/match/useMatchAudio.ts - Adapta el runtime de audio del duelo al contrato del hook principal del tablero.
import { useGameAudio } from "../useGameAudio";

interface IUseMatchAudioParams {
  combatLog: Parameters<typeof useGameAudio>[0]["combatLog"];
  winnerPlayerId: Parameters<typeof useGameAudio>[0]["winnerPlayerId"];
  playerId: string;
  isHistoryOpen: boolean;
  hasSelectedCard: boolean;
  lastErrorCode: string | null;
  isMuted: boolean;
  isPaused: boolean;
  disableBaseSoundtrack?: boolean;
}

export function useMatchAudio(params: IUseMatchAudioParams) {
  return useGameAudio(params);
}
