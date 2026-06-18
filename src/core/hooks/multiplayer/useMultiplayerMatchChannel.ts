// src/core/hooks/multiplayer/useMultiplayerMatchChannel.ts - Gestiona el canal Realtime de partida: broadcast de acciones y presencia del rival.
"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

export type ChannelStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";
export type OpponentConnectionStatus = "CONNECTED" | "DISCONNECTED" | "ABANDONED";

const ABANDON_TIMEOUT_MS = 60_000;

interface IUseMultiplayerMatchChannelParams {
  matchId: string;
  localPlayerId: string;
  opponentId: string;
}

interface IUseMultiplayerMatchChannelResult {
  channel: RealtimeChannel | null;
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
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [channelStatus, setChannelStatus] = useState<ChannelStatus>("CONNECTING");
  const [opponentConnectionStatus, setOpponentConnectionStatus] = useState<OpponentConnectionStatus>("CONNECTED");
  const [disconnectedForMs, setDisconnectedForMs] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const disconnectedAtRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dispatchQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const ch = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false }, presence: { key: localPlayerId } },
    });

    // Presencia — registrar ANTES de subscribe para recibir el SYNC inicial
    ch
      .on("presence", { event: "sync" }, () => {
        const state = ch.presenceState<{ playerId: string }>();
        const opponentOnline = Object.values(state)
          .flat()
          .some((p) => p.playerId === opponentId);
        if (opponentOnline) {
          setOpponentConnectionStatus("CONNECTED");
          setDisconnectedForMs(0);
          disconnectedAtRef.current = null;
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      })
      .on("presence", { event: "join" }, ({ newPresences }) => {
        const opponentJoined = (newPresences as unknown as Array<{ playerId: string }>).some(
          (p) => p.playerId === opponentId,
        );
        if (!opponentJoined) return;
        setOpponentConnectionStatus("CONNECTED");
        setDisconnectedForMs(0);
        disconnectedAtRef.current = null;
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      })
      .on("presence", { event: "leave" }, ({ leftPresences }) => {
        const opponentLeft = (leftPresences as unknown as Array<{ playerId: string }>).some(
          (p) => p.playerId === opponentId,
        );
        if (!opponentLeft) return;
        disconnectedAtRef.current = Date.now();
        setOpponentConnectionStatus("DISCONNECTED");
        timerRef.current = setInterval(() => {
          const elapsed = Date.now() - (disconnectedAtRef.current ?? Date.now());
          setDisconnectedForMs(elapsed);
          if (elapsed >= ABANDON_TIMEOUT_MS) {
            setOpponentConnectionStatus("ABANDONED");
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, 1_000);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setChannelStatus("CONNECTED");
          // Anunciar presencia propia al canal de partida
          await ch.track({ playerId: localPlayerId, matchId });
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setChannelStatus("DISCONNECTED");
        }
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      supabase.removeChannel(ch);
      channelRef.current = null;
      setChannel(null);
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
  // dos acciones rápidas (p. ej. timer expira y auto-avance encadena MAIN_1→BATTLE
  // →cambio de turno) llegan a la vez y el servidor calcula el mismo `sequence`
  // con un count() no atómico → viola la unique (match_id, sequence) → se pierde
  // una acción → el turno no avanza (deadlock).
  function dispatchAction(action: IMatchActionPayload): Promise<{ ok: boolean; error?: string }> {
    const result = dispatchQueueRef.current.then(() => sendActionToServer(action));
    dispatchQueueRef.current = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  return { channel, channelStatus, opponentConnectionStatus, disconnectedForMs, dispatchAction };
}
