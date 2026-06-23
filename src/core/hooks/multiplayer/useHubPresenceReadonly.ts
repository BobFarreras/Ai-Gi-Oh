// src/core/hooks/multiplayer/useHubPresenceReadonly.ts - Observador read-only del canal de presencia del hub (para el panel admin). No publica al observador.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

/**
 * Lee la lista de jugadores conectados del canal único de presencia del hub.
 *
 * A diferencia de `useHubPresence`, este hook NO llama a `track()`: solo observa.
 * Lo usa el panel admin para listar conectados en tiempo real sin aparecer él mismo
 * como jugador en los lobbies reales. Como la presencia es efímera (Realtime, no BD),
 * cuando un usuario se desconecta desaparece de la lista automáticamente en el `sync`.
 */
export function useHubPresenceReadonly(): IOnlinePlayer[] {
  const [onlinePlayers, setOnlinePlayers] = useState<IOnlinePlayer[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("hub:multiplayer:presence", {
      config: { presence: { key: "admin-observer" } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<IOnlinePlayer>();
        setOnlinePlayers(Object.values(state).flat());
      })
      .subscribe();

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, []);

  return onlinePlayers;
}
