// src/core/hooks/multiplayer/useOnlinePlayers.ts - Presencia en tiempo real de jugadores conectados al hub multijugador.
"use client";

import { useEffect, useRef, useState } from "react";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

export function useOnlinePlayers(localPlayer: IOnlinePlayer) {
  const [onlinePlayers, setOnlinePlayers] = useState<IOnlinePlayer[]>([]);
  // Patrón "latest ref": localPlayer viene del servidor y es estable, pero lo
  // mantenemos en ref para que el effect de suscripción (que se monta una vez)
  // siempre vea el valor más reciente. Actualizado en effect, no en render,
  // para cumplir react-hooks/refs.
  const localPlayerRef = useRef(localPlayer);
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  });

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("hub:multiplayer:presence", {
      config: { presence: { key: localPlayerRef.current.playerId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<IOnlinePlayer>();
        const players = Object.values(state)
          .flat()
          .filter((p) => p.playerId !== localPlayerRef.current.playerId);
        setOnlinePlayers(players);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track(localPlayerRef.current);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { onlinePlayers };
}
