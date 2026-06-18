// src/core/hooks/multiplayer/useRemoteOpponentTurn.ts - Escucha las acciones del rival (Postgres Changes) y las aplica con su coreografía visual.
"use client";

import { useEffect, useRef } from "react";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IRemoteOpponentTurnParams {
  matchId: string;
  opponentId: string;
  winnerPlayerId: string | null;
  applyRemoteAction: (action: IMatchActionPayload) => Promise<void>;
}

interface IMatchActionRow {
  player_id: string;
  payload: IMatchActionPayload;
}

export function useRemoteOpponentTurn({ matchId, opponentId, winnerPlayerId, applyRemoteAction }: IRemoteOpponentTurnParams) {
  const applyRemoteActionRef = useRef(applyRemoteAction);
  applyRemoteActionRef.current = applyRemoteAction;

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
          // Solo aplicamos las acciones del rival (las propias ya se aplicaron en local).
          if (row.player_id !== opponentId) return;
          void applyRemoteActionRef.current(row.payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, opponentId, winnerPlayerId]);
}
