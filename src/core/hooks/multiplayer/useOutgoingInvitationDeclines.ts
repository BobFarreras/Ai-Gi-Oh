// src/core/hooks/multiplayer/useOutgoingInvitationDeclines.ts - Notifica cuando una invitación enviada es rechazada o expira, para reactivar el botón de invitar.
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IOutgoingInvitationRow {
  to_id: string;
  status: string;
}

const INACTIVE_STATUSES = new Set(["DECLINED", "EXPIRED", "CANCELLED"]);

/**
 * Devuelve el to_id más reciente de una invitación saliente que ha sido rechazada,
 * expirada o cancelada. El lobby usa este valor para eliminar al jugador de
 * sentInvites y reactivar su botón de invitar.
 */
export function useOutgoingInvitationDeclines(localPlayerId: string): string | null {
  const [declinedPlayerId, setDeclinedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`outgoing-declines:${localPlayerId}`)
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
          if (INACTIVE_STATUSES.has(row.status)) {
            setDeclinedPlayerId(row.to_id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localPlayerId]);

  return declinedPlayerId;
}
