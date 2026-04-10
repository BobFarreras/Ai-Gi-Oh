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
}: IUseDelayedDuelResultParams): string | "DRAW" | null {
  const [resultWinnerPlayerId, setResultWinnerPlayerId] = useState<string | "DRAW" | null>(null);
  const resultDelayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!board.winnerPlayerId) {
      if (resultDelayTimerRef.current) {
        window.clearTimeout(resultDelayTimerRef.current);
        resultDelayTimerRef.current = null;
      }
      const clearTimerId = window.setTimeout(() => {
        setResultWinnerPlayerId(null);
      }, 0);
      return () => window.clearTimeout(clearTimerId);
    }
    if (resultWinnerPlayerId === board.winnerPlayerId) return;
    const isTurnLimitWin =
      board.gameState.turn >= RESULT_MAX_TURN_LIMIT &&
      board.gameState.playerA.healthPoints > 0 &&
      board.gameState.playerB.healthPoints > 0;
    const winnerDisplayName = resolveWinnerDisplayName(board.winnerPlayerId, playerId, playerName, opponentName);
    const isPlayerWinner = board.winnerPlayerId === playerId;
    const variant: IBattleBannerMessage["variant"] =
      board.winnerPlayerId === "DRAW" ? "TURN_LIMIT" : isPlayerWinner ? "VICTORY" : "DEFEAT";
    const leftText = isTurnLimitWin
      ? `Turnos agotados · ${isPlayerWinner ? "Victoria" : board.winnerPlayerId === "DRAW" ? "Empate" : "Derrota"}`
      : isPlayerWinner
        ? "Victoria"
        : board.winnerPlayerId === "DRAW"
          ? "Empate"
          : "Derrota";
    const rightText = board.winnerPlayerId === "DRAW" ? "Resultado: empate" : `Gana ${winnerDisplayName}`;
    setBannerSignal({
      id: `duel-end-${board.matchSeed}-${board.winnerPlayerId}-${Date.now()}`,
      left: leftText,
      right: rightText,
      variant,
    });
    if (resultDelayTimerRef.current) window.clearTimeout(resultDelayTimerRef.current);
    resultDelayTimerRef.current = window.setTimeout(() => {
      setResultWinnerPlayerId(board.winnerPlayerId);
      resultDelayTimerRef.current = null;
    }, RESULT_OVERLAY_DELAY_MS);
  }, [
    board.gameState.playerA.healthPoints,
    board.gameState.playerB.healthPoints,
    board.gameState.turn,
    board.matchSeed,
    board.winnerPlayerId,
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
