// src/core/hooks/multiplayer/useMatchmakingQueue.ts - Gestiona la cola de emparejamiento aleatorio y detecta cuándo se ha creado una partida.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

type MatchmakingStatus = "idle" | "waiting" | "matched";

interface IMatchSessionRow {
  id: string;
  player_a_id: string;
  player_b_id: string;
}

interface IUseMatchmakingQueueParams {
  localPlayerId: string;
  activeDeckIds: string[];
}

interface IUseMatchmakingQueueResult {
  status: MatchmakingStatus;
  joinQueue: () => Promise<void>;
  leaveQueue: () => Promise<void>;
  matchId: string | null;
}

async function callJoin(deckIds: string[]): Promise<{ matched: boolean; matchId: string | null }> {
  const res = await fetch("/api/multiplayer/matchmaking/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deckIds }),
  });
  if (!res.ok) throw new Error("Error al entrar en la cola.");
  const body = await res.json() as { matched: boolean; matchId: string | null };
  return body;
}

async function callLeave(): Promise<void> {
  await fetch("/api/multiplayer/matchmaking/leave", { method: "POST" });
}

export function useMatchmakingQueue({
  localPlayerId,
  activeDeckIds,
}: IUseMatchmakingQueueParams): IUseMatchmakingQueueResult {
  const [status, setStatus] = useState<MatchmakingStatus>("idle");
  const [matchId, setMatchId] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Jugador A (el que esperaba): escucha INSERT en match_sessions con su player_id.
  // Jugador B (el que encontró rival): recibe matchId directamente de la respuesta HTTP.
  useEffect(() => {
    if (status !== "waiting") return;

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`matchmaking-result:${localPlayerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_sessions",
          filter: `player_a_id=eq.${localPlayerId}`,
        },
        (payload) => {
          const row = payload.new as IMatchSessionRow;
          if (!isMountedRef.current) return;
          setMatchId(row.id);
          setStatus("matched");
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status, localPlayerId]);

  const joinQueue = useCallback(async () => {
    if (status !== "idle") return;
    setStatus("waiting");
    try {
      const result = await callJoin(activeDeckIds);
      if (!isMountedRef.current) return;
      if (result.matched && result.matchId) {
        setMatchId(result.matchId);
        setStatus("matched");
      }
      // Si no hay rival, status='waiting' y el Realtime subscription notificará.
    } catch {
      if (isMountedRef.current) setStatus("idle");
    }
  }, [status, activeDeckIds]);

  const leaveQueue = useCallback(async () => {
    setStatus("idle");
    setMatchId(null);
    await callLeave();
  }, []);

  return { status, joinQueue, leaveQueue, matchId };
}
