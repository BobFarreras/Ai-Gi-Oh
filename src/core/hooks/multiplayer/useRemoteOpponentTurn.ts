// src/core/hooks/multiplayer/useRemoteOpponentTurn.ts - Escucha las acciones del rival (Postgres Changes sobre match_actions) y las aplica al estado de partida.
"use client";

import { useEffect, useRef } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { applyMatchAction } from "@/core/services/multiplayer/apply-match-action";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IRemoteOpponentTurnParams {
  matchId: string;
  opponentId: string;
  winnerPlayerId: string | null;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

interface IMatchActionRow {
  player_id: string;
  payload: IMatchActionPayload;
}

export function useRemoteOpponentTurn({ matchId, opponentId, winnerPlayerId, applyTransition }: IRemoteOpponentTurnParams) {
  const applyTransitionRef = useRef(applyTransition);
  applyTransitionRef.current = applyTransition;

  useEffect(() => {
    if (winnerPlayerId) return;
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`match-actions:${matchId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "match_actions", filter: `match_id=eq.${matchId}` },
        (payload) => {
          const row = payload.new as IMatchActionRow;
          // Ignorar las acciones propias: solo aplicamos las del rival.
          if (row.player_id !== opponentId) return;
          applyTransitionRef.current((state) => {
            try {
              return applyMatchAction(state, opponentId, row.payload);
            } catch {
              // Acción inválida (desfase puntual): ignorar; el servidor ya validó la autoría.
              return state;
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, opponentId, winnerPlayerId]);
}
