// src/core/hooks/multiplayer/useHubPresence.ts - Canal único de presencia del hub: publica al jugador local y lee la lista de conectados.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

/**
 * Hook de presencia hub-wide. Se monta UNA sola vez (en MultiplayerPresenceProvider)
 * porque `createSupabaseBrowserClient` es un singleton en navegador: abrir un segundo
 * canal con el mismo topic sobre el mismo socket entra en conflicto (Supabase Realtime
 * solo admite un canal por topic y socket) y rompe la lectura de presencia.
 *
 * Por eso este hook hace AMBAS cosas sobre un único canal:
 *  - `track()` publica al jugador local (aparece conectado en cualquier sección).
 *  - lee `presenceState()` en cada `sync` para exponer la lista de conectados.
 *
 * Re-publica al cambiar nick o estado (p. ej. entrar a una partida → IN_MATCH).
 */
export function useHubPresence(localPlayer: IOnlinePlayer): IOnlinePlayer[] {
  const [onlinePlayers, setOnlinePlayers] = useState<IOnlinePlayer[]>([]);

  // Patrón "latest ref": el effect de suscripción se monta una vez pero siempre
  // debe ver el valor más reciente del jugador local. Actualizado en effect, no
  // en render, para cumplir react-hooks/refs.
  const localPlayerRef = useRef(localPlayer);
  useEffect(() => {
    localPlayerRef.current = localPlayer;
  });

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("hub:multiplayer:presence", {
      config: { presence: { key: localPlayerRef.current.playerId } },
    });
    channelRef.current = channel;

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
        isSubscribedRef.current = true;
        await channel.track(localPlayerRef.current);
      });

    return () => {
      isSubscribedRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-publica la presencia al cambiar nick o estado, sin recrear el canal.
  const trackKey = `${localPlayer.playerId}|${localPlayer.nickname}|${localPlayer.status}`;
  useEffect(() => {
    if (!isSubscribedRef.current || !channelRef.current) return;
    void channelRef.current.track(localPlayerRef.current);
  }, [trackKey]);

  return onlinePlayers;
}
