// src/core/hooks/multiplayer/useMatchFinishListener.ts - Escucha el cierre de partida vía postgres_changes en match_sessions y notifica al cliente remoto.
"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

/** Resultado de fin de partida recibido del servidor (canonical winner_id o null si empate). */
export interface IRemoteMatchFinish {
  winnerId: string | null;
  status: "FINISHED" | "ABANDONED";
}

interface IUseMatchFinishListenerParams {
  matchId: string;
  /** Se invoca una única vez al recibir el primer UPDATE que cierra la partida. */
  onMatchFinished: (finish: IRemoteMatchFinish) => void;
  /** Si true, no se suscribe (el cliente ya sabe que terminó localmente). */
  disabled?: boolean;
}

interface IMatchSessionChangeRow {
  id: string;
  status: string;
  winner_id: string | null;
}

/**
 * Suscripción Postgres Changes a UPDATE de match_sessions. Garantiza que el
 * cliente remoto reciba el fin de partida aunque se pierda el INSERT de la
 * acción final o el motor local no detecte el fin (latencia/reconexión).
 * Es el canal robusto complementario al flujo de match_actions.
 */
export function useMatchFinishListener({ matchId, onMatchFinished, disabled }: IUseMatchFinishListenerParams): void {
  const onMatchFinishedRef = useRef(onMatchFinished);
  useEffect(() => {
    onMatchFinishedRef.current = onMatchFinished;
  });

  useEffect(() => {
    if (disabled) return;
    const supabase = createSupabaseBrowserClient();
    let handled = false;

    const channel = supabase
      .channel(`match-finish:${matchId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "match_sessions", filter: `id=eq.${matchId}` },
        (payload) => {
          if (handled) return;
          const row = payload.new as IMatchSessionChangeRow;
          if (row.status !== "FINISHED" && row.status !== "ABANDONED") return;
          handled = true;
          onMatchFinishedRef.current({ winnerId: row.winner_id, status: row.status as "FINISHED" | "ABANDONED" });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, disabled]);
}
