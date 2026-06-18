// src/core/hooks/multiplayer/useOutgoingInvitationDeclines.ts - Notifica cuando una invitación enviada es rechazada o expira, para reactivar el botón de invitar.
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IOutgoingInvitationRow {
  to_id: string;
  status: string;
}

const INACTIVE_STATUSES = new Set(["DECLINED", "EXPIRED", "CANCELLED"]);

/**
 * Llama a onDeclined(toId) cada vez que una invitación saliente cambia a un
 * estado inactivo (rechazada, expirada o cancelada). Usa callback en lugar de
 * state para garantizar que se dispare aunque el mismo to_id aparezca dos veces
 * seguidas (ej. CANCELLED previo + DECLINED nuevo del mismo jugador).
 */
export function useOutgoingInvitationDeclines(
  localPlayerId: string,
  onDeclined: (toId: string) => void,
): void {
  const onDeclinedRef = useRef(onDeclined);
  useLayoutEffect(() => { onDeclinedRef.current = onDeclined; });

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
            onDeclinedRef.current(row.to_id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [localPlayerId]);
}
