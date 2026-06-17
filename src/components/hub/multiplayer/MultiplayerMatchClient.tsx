// src/components/hub/multiplayer/MultiplayerMatchClient.tsx - Sala de partida multijugador: conecta Board con el motor Realtime.
"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { useMultiplayerMatchChannel } from "@/core/hooks/multiplayer/useMultiplayerMatchChannel";
import { useRemoteOpponentTurn } from "@/core/hooks/multiplayer/useRemoteOpponentTurn";

interface MultiplayerMatchClientProps {
  matchId: string;
  seed: string;
  localPlayerId: string;
  opponentId: string;
  localNickname: string;
  opponentNickname: string;
  localDeck: ICard[];
  opponentDeck: ICard[];
  isPlayerA: boolean;
}

type ConnectionStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  CONNECTING: "bg-amber-400",
  CONNECTED: "bg-emerald-400",
  DISCONNECTED: "bg-red-400",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  CONNECTING: "Conectando...",
  CONNECTED: "En línea",
  DISCONNECTED: "Sin conexión",
};

export function MultiplayerMatchClient({
  matchId,
  seed,
  localPlayerId,
  opponentId,
  localDeck,
  opponentDeck,
  localNickname,
  opponentNickname,
  isPlayerA,
}: MultiplayerMatchClientProps) {
  const router = useRouter();
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | null>(null);
  const applyTransitionRef = useRef<((transition: (state: GameState) => GameState) => GameState | null) | null>(null);

  const { channel, channelStatus, dispatchAction } = useMultiplayerMatchChannel(matchId);

  useRemoteOpponentTurn({
    channel,
    opponentId,
    winnerPlayerId,
    applyTransition: useCallback(
      (transition: (state: GameState) => GameState) => applyTransitionRef.current?.(transition) ?? null,
      [],
    ),
  });

  const handleMatchResolved = useCallback(
    (result: { winnerPlayerId: string | "DRAW" }) => {
      setWinnerPlayerId(result.winnerPlayerId === "DRAW" ? "DRAW" : result.winnerPlayerId);
    },
    [],
  );

  const handleDispatchAction = useCallback(
    async (action: IMatchActionPayload) => {
      await dispatchAction(action);
    },
    [dispatchAction],
  );

  return (
    <div className="relative h-screen w-full">
      {/* Indicador de conexión */}
      <div className="absolute left-2 top-2 z-50 flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-950/80 px-2.5 py-1 backdrop-blur-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[channelStatus]}`} aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          {STATUS_LABELS[channelStatus]}
        </span>
      </div>

      {/* Indicadores de jugadores */}
      <div className="absolute left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/50 bg-slate-950/70 px-3 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-bold text-cyan-200">{localNickname}</span>
        <span className="text-[10px] text-slate-500">vs</span>
        <span className="text-[10px] font-bold text-red-300">{opponentNickname}</span>
      </div>

      <Board
        mode="MULTIPLAYER"
        initialConfig={{
          // playerA es siempre el jugador local en su propio cliente.
          // El seed compartido garantiza instanceIds idénticos en ambos clientes.
          playerId: localPlayerId,
          playerName: localNickname,
          opponentId,
          opponentName: opponentNickname,
          playerDeck: localDeck,
          opponentDeck,
          seed,
          // El jugador A (quien inició) empieza siempre primero
          starterPlayerId: isPlayerA ? localPlayerId : opponentId,
        }}
        disableOpponentAutomation
        applyTransitionRef={applyTransitionRef}
        onMatchResolved={handleMatchResolved}
        onExitMatch={() => router.push("/hub/multiplayer")}
        isTurnTimerEnabled={false}
      />
    </div>
  );
}
