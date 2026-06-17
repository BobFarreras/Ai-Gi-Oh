// src/core/hooks/multiplayer/usePendingInvitations.ts - Escucha invitaciones entrantes en tiempo real y expone acción de respuesta.
"use client";

import { useEffect, useRef, useState } from "react";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

interface IInvitationRow {
  id: string;
  from_id: string;
  to_id: string;
  status: string;
  match_id: string | null;
  deck_ids: string[];
  expires_at: string;
  created_at: string;
  from_profile: { nickname: string } | null;
}

function mapInvitationRow(row: IInvitationRow): IPlayerInvitation {
  return {
    id: row.id,
    fromId: row.from_id,
    fromNickname: row.from_profile?.nickname ?? "Duelista",
    toId: row.to_id,
    status: row.status as IPlayerInvitation["status"],
    matchId: row.match_id,
    deckIds: row.deck_ids,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function usePendingInvitations(playerId: string) {
  const [pendingInvitations, setPendingInvitations] = useState<IPlayerInvitation[]>([]);
  const playerIdRef = useRef(playerId);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase
      .from("player_invitations")
      .select("*, from_profile:player_profiles!from_id(nickname)")
      .eq("to_id", playerIdRef.current)
      .eq("status", "PENDING")
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => {
        if (data) setPendingInvitations((data as IInvitationRow[]).map(mapInvitationRow));
      });

    const channel = supabase
      .channel(`invitations:${playerIdRef.current}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "player_invitations", filter: `to_id=eq.${playerIdRef.current}` },
        (payload) => {
          const row = payload.new as IInvitationRow;
          if (row.status !== "PENDING") return;
          supabase
            .from("player_profiles")
            .select("nickname")
            .eq("player_id", row.from_id)
            .single()
            .then(({ data: profile }) => {
              setPendingInvitations((prev) => [
                ...prev,
                mapInvitationRow({ ...row, from_profile: profile ? { nickname: profile.nickname } : null }),
              ]);
            });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "player_invitations", filter: `to_id=eq.${playerIdRef.current}` },
        (payload) => {
          const updated = payload.new as IInvitationRow;
          if (updated.status !== "PENDING") {
            setPendingInvitations((prev) => prev.filter((inv) => inv.id !== updated.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { pendingInvitations };
}
