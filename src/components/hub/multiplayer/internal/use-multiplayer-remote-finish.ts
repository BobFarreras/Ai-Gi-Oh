// src/components/hub/multiplayer/internal/use-multiplayer-remote-finish.ts - Orquesta la notificación remota de fin de partida y el forfeit al cerrar pestaña.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  useMatchFinishListener,
  IRemoteMatchFinish,
} from "@/core/hooks/multiplayer/useMatchFinishListener";
import { useForfeitOnUnload } from "@/core/hooks/multiplayer/useForfeitOnUnload";

type MatchOutcome = "WIN" | "LOSE" | "DRAW";

interface IUseMultiplayerRemoteFinishParams {
  matchId: string;
  localPlayerId: string;
  /**
   * Suprime el beacon de forfeit. Combinación recomendada en el caller:
   * `matchFinished || Boolean(winnerPlayerId) || isOpponentGone`.
   */
  suppressForfeit: boolean;
  /** Estado de conexión del rival; si ABANDONED, auto-dispara victoria local. */
  opponentConnectionStatus: "CONNECTED" | "DISCONNECTED" | "ABANDONED";
  /** Se invoca al recibir fin remoto con el outcome desde la perspectiva local. */
  onRemoteFinish: (outcome: MatchOutcome, winnerId: string | "DRAW") => void;
}

interface IUseMultiplayerRemoteFinishResult {
  /** Ganador comunicado por el servidor; se pasa a Board como externalWinnerPlayerId. */
  remoteWinnerPlayerId: string | "DRAW" | null;
}

/**
 * Traduce el winner_id canonical del servidor al outcome del jugador local.
 * Extraída para mantener SRP y permitir tests puros.
 */
export function resolveRemoteOutcome(winnerId: string | null, localPlayerId: string): MatchOutcome {
  if (winnerId === null) return "DRAW";
  return winnerId === localPlayerId ? "WIN" : "LOSE";
}

/**
 * Conecta el cliente multijugador con el listener de fin de partida (postgres_changes
 * en match_sessions) y el beacon de forfeit al cerrar pestaña. Mantiene el estado
 * del ganador remoto para que Board muestre el overlay aunque el motor local no
 * haya detectado el fin.
 */
export function useMultiplayerRemoteFinish({
  matchId,
  localPlayerId,
  suppressForfeit,
  opponentConnectionStatus,
  onRemoteFinish,
}: IUseMultiplayerRemoteFinishParams): IUseMultiplayerRemoteFinishResult {
  // Estado del ganador notificado vía postgres_changes (fuente externa, no effect).
  const [notifiedWinnerId, setNotifiedWinnerId] = useState<string | "DRAW" | null>(null);
  const onRemoteFinishRef = useRef(onRemoteFinish);
  useEffect(() => {
    onRemoteFinishRef.current = onRemoteFinish;
  });

  const handleRemoteMatchFinished = useCallback(
    (finish: IRemoteMatchFinish) => {
      const outcome = resolveRemoteOutcome(finish.winnerId, localPlayerId);
      const winnerDisplay = finish.winnerId ?? "DRAW";
      setNotifiedWinnerId(winnerDisplay);
      onRemoteFinishRef.current(outcome, winnerDisplay);
    },
    [localPlayerId],
  );

  // Ganador derivado: notificación Realtime tiene prioridad; si no hay, y el
  // rival está abandonado, el local gana automáticamente. Derivar (no effect)
  // evita setState síncrono en effect y cascadas de render.
  const autoForfeitWinner = opponentConnectionStatus === "ABANDONED" ? localPlayerId : null;
  const remoteWinnerPlayerId = notifiedWinnerId ?? autoForfeitWinner;

  // Effect solo orquesta la notificación al padre cuando se confirma abandono.
  // No llama a setState del propio hook: respeta react-hooks/set-state-in-effect.
  const abandonHandledRef = useRef(false);
  useEffect(() => {
    if (abandonHandledRef.current) return;
    if (autoForfeitWinner === null || notifiedWinnerId !== null) return;
    abandonHandledRef.current = true;
    onRemoteFinishRef.current("WIN", localPlayerId);
  }, [autoForfeitWinner, notifiedWinnerId, localPlayerId]);

  // Deshabilita el listener si ya hay ganador notificado para evitar duplicados.
  useMatchFinishListener({ matchId, onMatchFinished: handleRemoteMatchFinished, disabled: notifiedWinnerId !== null });
  useForfeitOnUnload({ matchId, suppressForfeit });

  return { remoteWinnerPlayerId };
}
