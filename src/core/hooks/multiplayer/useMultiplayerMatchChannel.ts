// src/core/hooks/multiplayer/useMultiplayerMatchChannel.ts - Gestiona el canal Realtime de partida: broadcast de acciones y presencia del rival.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { createRivalAbandonTracker, IRivalAbandonTracker } from "./internal/rival-abandon-tracker";

export type ChannelStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";
export type OpponentConnectionStatus = "CONNECTED" | "DISCONNECTED" | "ABANDONED";

const ABANDON_TIMEOUT_MS = 60_000;

interface IUseMultiplayerMatchChannelParams {
  matchId: string;
  localPlayerId: string;
  opponentId: string;
}

interface IUseMultiplayerMatchChannelResult {
  channelStatus: ChannelStatus;
  opponentConnectionStatus: OpponentConnectionStatus;
  disconnectedForMs: number;
  dispatchAction: (action: IMatchActionPayload) => Promise<{ ok: boolean; error?: string }>;
}

export function useMultiplayerMatchChannel({
  matchId,
  localPlayerId,
  opponentId,
}: IUseMultiplayerMatchChannelParams): IUseMultiplayerMatchChannelResult {
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>("CONNECTING");
  const [opponentConnectionStatus, setOpponentConnectionStatus] = useState<OpponentConnectionStatus>("CONNECTED");
  const [disconnectedForMs, setDisconnectedForMs] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const trackerRef = useRef<IRivalAbandonTracker | null>(null);
  const dispatchQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const tracker = createRivalAbandonTracker(ABANDON_TIMEOUT_MS);
    trackerRef.current = tracker;

    const ch = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false }, presence: { key: localPlayerId } },
    });

    const handleOpponentBack = () => {
      setOpponentConnectionStatus("CONNECTED");
      setDisconnectedForMs(0);
      tracker.markConnected();
    };

    ch
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ playerId: string }>();
        const opponentOnline = Object.values(state)
          .flat()
          .some((p) => p.playerId === opponentId);
        if (opponentOnline) handleOpponentBack();
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const opponentJoined = (newPresences as unknown as Array<{ playerId: string }>).some(
          (p) => p.playerId === opponentId,
        );
        if (opponentJoined) handleOpponentBack();
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const opponentLeft = (leftPresences as unknown as Array<{ playerId: string }>).some(
          (p) => p.playerId === opponentId,
        );
        if (!opponentLeft) return;
        setOpponentConnectionStatus("DISCONNECTED");
        tracker.markDisconnected(
          (elapsed) => setDisconnectedForMs(elapsed),
          () => setOpponentConnectionStatus("ABANDONED"),
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setChannelStatus("CONNECTED");
          await ch.track({ playerId: localPlayerId, matchId });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setChannelStatus("DISCONNECTED");
        }
      });

    channelRef.current = ch;

    const handleOffline = () => setChannelStatus("DISCONNECTED");
    const handleOnline = () => setChannelStatus("CONNECTING");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      tracker.dispose();
      trackerRef.current = null;
      supabase.removeChannel(ch);
      channelRef.current = null;
    };
  }, [matchId, localPlayerId, opponentId]);

  async function sendActionToServer(action: IMatchActionPayload): Promise<{ ok: boolean; error?: string }> {
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

  // Serializa los envíos: cada acción espera a que termine la anterior. Sin esto,
  // dos acciones rápidas llegarían a la vez y el servidor calcularía el mismo
  // sequence con un count() no atómico → viola unique (match_id, sequence).
  function dispatchAction(action: IMatchActionPayload): Promise<{ ok: boolean; error?: string }> {
    const result = dispatchQueueRef.current.then(() => sendActionToServer(action));
    dispatchQueueRef.current = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return { channelStatus, opponentConnectionStatus, disconnectedForMs, dispatchAction };
}
