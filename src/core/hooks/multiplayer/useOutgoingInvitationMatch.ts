// src/core/hooks/multiplayer/useOutgoingInvitationMatch.ts - El invitador escucha cuándo su invitación es aceptada para entrar a la partida.
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IOutgoingInvitationRow {
  id: string;
  from_id: string;
  status: string;
  match_id: string | null;
}

/**
 * Devuelve el matchId cuando una invitación enviada por el jugador local es
 * aceptada. Sin esto, el invitador (jugador A) se quedaría en el lobby mientras
 * el invitado (jugador B) entra solo a la partida.
 */
export function useOutgoingInvitationMatch(localPlayerId: string): string | null {
  const [acceptedMatchId, setAcceptedMatchId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`outgoing-invitations:${localPlayerId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "player_invitations",
          filter: `from_id=eq.${localPlayerId}`,
        },
        (payload) => {
          const row = payload.new as IOutgoingInvitationRow;
          if (row.status === "ACCEPTED" && row.match_id) {
            setAcceptedMatchId(row.match_id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localPlayerId]);

  return acceptedMatchId;
}
