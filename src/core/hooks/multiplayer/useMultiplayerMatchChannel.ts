// src/core/hooks/multiplayer/useMultiplayerMatchChannel.ts - Gestiona el canal Realtime de partida y el dispatch autenticado de acciones al servidor.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

type ChannelStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

interface IUseMultiplayerMatchChannelResult {
  channel: RealtimeChannel | null;
  channelStatus: ChannelStatus;
  dispatchAction: (action: IMatchActionPayload) => Promise<{ ok: boolean; error?: string }>;
}

export function useMultiplayerMatchChannel(matchId: string): IUseMultiplayerMatchChannelResult {
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>("CONNECTING");
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const ch = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } },
    });

    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") setChannelStatus("CONNECTED");
      else if (status === "CLOSED" || status === "CHANNEL_ERROR") setChannelStatus("DISCONNECTED");
    });

    channelRef.current = ch;
    setChannel(ch);

    const handleOffline = () => setChannelStatus("DISCONNECTED");
    const handleOnline = () => setChannelStatus("CONNECTING");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      supabase.removeChannel(ch);
      channelRef.current = null;
      setChannel(null);
    };
  }, [matchId]);

  async function dispatchAction(action: IMatchActionPayload): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch("/api/multiplayer/match/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { ok: false, error: body.message ?? "Error al enviar la acción." };
      }
      return { ok: true };
    } catch {
      return { ok: false, error: "Sin conexión con el servidor." };
    }
  }

  return { channel, channelStatus, dispatchAction };
}
