// src/components/game/board/internal/use-delayed-duel-result.ts - Retrasa la apertura del resultado final y emite banner explícito al cerrarse el duelo.
import { useEffect, useRef, useState } from "react";
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { IBattleBannerMessage } from "@/components/game/board/ui/internal/banner/banner-message-policy";

const RESULT_OVERLAY_DELAY_MS = 2000;
const RESULT_MAX_TURN_LIMIT = 30;

interface IUseDelayedDuelResultParams {
  board: ReturnType<typeof useBoard>;
  playerId: string;
  playerName: string;
  opponentName: string;
  setBannerSignal: (value: IBattleBannerMessage | null) => void;
  /**
   * Ganador comunicado externamente (Realtime multijugador). Se usa solo si
   * board.winnerPlayerId es null, para mostrar el overlay al perdedor cuando
   * su motor local no detectó el fin (latencia/pérdida de la acción final).
   */
  externalWinnerPlayerId?: string | "DRAW" | null;
}

function resolveWinnerDisplayName(
  winnerPlayerId: string | "DRAW",
  playerId: string,
  playerName: string,
  opponentName: string,
): string {
  if (winnerPlayerId === "DRAW") return "EMPATE";
  return winnerPlayerId === playerId ? playerName : opponentName;
}

/** Retrasa el overlay final y publica un banner de cierre para mejorar legibilidad del fin de duelo. */
export function useDelayedDuelResult({
  board,
  playerId,
  playerName,
  opponentName,
  setBannerSignal,
  externalWinnerPlayerId,
}: IUseDelayedDuelResultParams): string | "DRAW" | null {
  // Ganador efectivo: el motor local tiene prioridad; si no detectó fin, usa
  // el externo (notificación Realtime) para garantizar overlay al perdedor.
  const effectiveWinnerPlayerId = board.winnerPlayerId ?? externalWinnerPlayerId ?? null;
  const [resultWinnerPlayerId, setResultWinnerPlayerId] = useState<string | "DRAW" | null>(null);
  const resultDelayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!effectiveWinnerPlayerId) {
      if (resultDelayTimerRef.current) {
        window.clearTimeout(resultDelayTimerRef.current);
        resultDelayTimerRef.current = null;
      }
      const clearTimerId = window.setTimeout(() => {
        setResultWinnerPlayerId(null);
      }, 0);
      return () => window.clearTimeout(clearTimerId);
    }
    if (resultWinnerPlayerId === effectiveWinnerPlayerId) return;
    const isTurnLimitWin =
      board.gameState.turn >= RESULT_MAX_TURN_LIMIT &&
      board.gameState.playerA.healthPoints > 0 &&
      board.gameState.playerB.healthPoints > 0;
    const winnerDisplayName = resolveWinnerDisplayName(effectiveWinnerPlayerId, playerId, playerName, opponentName);
    const isPlayerWinner = effectiveWinnerPlayerId === playerId;
    const variant: IBattleBannerMessage["variant"] =
      effectiveWinnerPlayerId === "DRAW" ? "TURN_LIMIT" : isPlayerWinner ? "VICTORY" : "DEFEAT";
    const leftText = isTurnLimitWin
      ? `Turnos agotados · ${isPlayerWinner ? "Victoria" : effectiveWinnerPlayerId === "DRAW" ? "Empate" : "Derrota"}`
      : isPlayerWinner
        ? "Victoria"
        : effectiveWinnerPlayerId === "DRAW"
          ? "Empate"
          : "Derrota";
    const rightText = effectiveWinnerPlayerId === "DRAW" ? "Resultado: empate" : `Gana ${winnerDisplayName}`;
    setBannerSignal({
      id: `duel-end-${board.matchSeed}-${effectiveWinnerPlayerId}-${Date.now()}`,
      left: leftText,
      right: rightText,
      variant,
    });
    if (resultDelayTimerRef.current) window.clearTimeout(resultDelayTimerRef.current);
    resultDelayTimerRef.current = window.setTimeout(() => {
      setResultWinnerPlayerId(effectiveWinnerPlayerId);
      resultDelayTimerRef.current = null;
    }, RESULT_OVERLAY_DELAY_MS);
  }, [
    board.gameState.playerA.healthPoints,
    board.gameState.playerB.healthPoints,
    board.gameState.turn,
    board.matchSeed,
    effectiveWinnerPlayerId,
    opponentName,
    playerId,
    playerName,
    resultWinnerPlayerId,
    setBannerSignal,
  ]);

  useEffect(
    () => () => {
      if (resultDelayTimerRef.current) window.clearTimeout(resultDelayTimerRef.current);
    },
    [],
  );

  return resultWinnerPlayerId;
}
