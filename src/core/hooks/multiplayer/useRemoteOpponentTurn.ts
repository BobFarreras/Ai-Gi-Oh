// src/core/hooks/multiplayer/useRemoteOpponentTurn.ts - Escucha acciones del jugador rival en Realtime y las aplica al estado de partida.
"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";

interface IRemoteOpponentTurnParams {
  channel: RealtimeChannel | null;
  opponentId: string;
  winnerPlayerId: string | null;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

interface IOpponentActionBroadcast {
  playerId: string;
  action: IMatchActionPayload;
}

export function useRemoteOpponentTurn({ channel, opponentId, winnerPlayerId, applyTransition }: IRemoteOpponentTurnParams) {
  const applyTransitionRef = useRef(applyTransition);
  applyTransitionRef.current = applyTransition;

  useEffect(() => {
    if (!channel || winnerPlayerId) return;

    const subscription = channel.on(
      "broadcast",
      { event: "match:action" },
      ({ payload }: { payload: IOpponentActionBroadcast }) => {
        if (payload.playerId !== opponentId) return;
        applyTransitionRef.current((state) => {
          try {
            return applyMatchAction(state, opponentId, payload.action);
          } catch {
            // Acción inválida del oponente: ignorar (el servidor ya la validó antes de retransmitir)
            return state;
          }
        });
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [channel, opponentId, winnerPlayerId]);
}
