// src/components/hub/multiplayer/MultiplayerMatchClient.tsx - Sala de partida multijugador: conecta Board con el motor Realtime y gestiona reconexiones y fin de partida.
"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { useMultiplayerMatchChannel } from "@/core/hooks/multiplayer/useMultiplayerMatchChannel";
import { useRemoteOpponentTurn } from "@/core/hooks/multiplayer/useRemoteOpponentTurn";
import { IMatchReward } from "@/core/entities/match/IMatchReward";
import {
  prepareMultiplayerDeck,
  resolveMultiplayerCoinToss,
} from "@/core/services/multiplayer/prepare-multiplayer-match";
import { MultiplayerCoinTossOverlay } from "./MultiplayerCoinTossOverlay";

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

type ChannelStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

// Avatares de duelo: el jugador local usa bob-rojo, el rival bob.
const LOCAL_AVATAR_URL = "/assets/story/player/bob-rojo.webp";
const OPPONENT_AVATAR_URL = "/assets/story/player/bob.webp";

const CONNECTION_COLORS: Record<ChannelStatus, string> = {
  CONNECTING: "bg-amber-400",
  CONNECTED: "bg-emerald-400",
  DISCONNECTED: "bg-red-400",
};

const CONNECTION_LABELS: Record<ChannelStatus, string> = {
  CONNECTING: "Conectando...",
  CONNECTED: "En línea",
  DISCONNECTED: "Sin conexión",
};

async function callFinishMatch(
  matchId: string,
  outcome: "WIN" | "LOSE" | "DRAW",
): Promise<{ ok: boolean; reward?: IMatchReward; error?: string }> {
  try {
    const res = await fetch("/api/multiplayer/match/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, outcome }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body.message ?? "Error al cerrar la partida." };
    return { ok: true, reward: body.reward };
  } catch {
    return { ok: false, error: "Sin conexión con el servidor." };
  }
}

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
  const [reward, setReward] = useState<IMatchReward | null>(null);
  const [matchFinished, setMatchFinished] = useState(false);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const applyTransitionRef = useRef<((transition: (state: GameState) => GameState) => GameState | null) | null>(null);
  const finishCalledRef = useRef(false);

  // Identidades canónicas: el invitador (player_a de la sesión) es A en AMBOS clientes.
  const canonicalPlayerAId = isPlayerA ? localPlayerId : opponentId;
  const canonicalPlayerBId = isPlayerA ? opponentId : localPlayerId;

  // Mazos deterministas por propietario real: orden y runtimeId idénticos en ambos clientes.
  const preparedLocalDeck = useMemo(
    () => prepareMultiplayerDeck(localDeck, localPlayerId, seed),
    [localDeck, localPlayerId, seed],
  );
  const preparedOpponentDeck = useMemo(
    () => prepareMultiplayerDeck(opponentDeck, opponentId, seed),
    [opponentDeck, opponentId, seed],
  );

  // Sorteo compartido: mismo ganador en ambos clientes, traducido a la perspectiva local.
  const coinToss = useMemo(
    () => resolveMultiplayerCoinToss({ seed, canonicalPlayerAId, canonicalPlayerBId, localPlayerId }),
    [seed, canonicalPlayerAId, canonicalPlayerBId, localPlayerId],
  );

  const { channel, channelStatus, opponentConnectionStatus, disconnectedForMs } =
    useMultiplayerMatchChannel({ matchId, localPlayerId, opponentId });

  useRemoteOpponentTurn({
    channel,
    opponentId,
    winnerPlayerId,
    applyTransition: useCallback(
      (transition: (state: GameState) => GameState) => applyTransitionRef.current?.(transition) ?? null,
      [],
    ),
  });

  const finishMatch = useCallback(
    async (outcome: "WIN" | "LOSE" | "DRAW") => {
      if (finishCalledRef.current) return;
      finishCalledRef.current = true;
      const result = await callFinishMatch(matchId, outcome);
      if (result.reward) setReward(result.reward);
      setMatchFinished(true);
    },
    [matchId],
  );

  const handleMatchResolved = useCallback(
    (result: { winnerPlayerId: string | "DRAW" }) => {
      const winner = result.winnerPlayerId;
      setWinnerPlayerId(winner === "DRAW" ? "DRAW" : winner);
      if (winner === "DRAW") void finishMatch("DRAW");
      else if (winner === localPlayerId) void finishMatch("WIN");
      else void finishMatch("LOSE");
    },
    [localPlayerId, finishMatch],
  );

  const handleForfeitVictory = useCallback(() => {
    void finishMatch("WIN");
  }, [finishMatch]);

  const disconnectedSeconds = Math.floor(disconnectedForMs / 1000);
  const remainingSeconds = Math.max(0, 60 - disconnectedSeconds);
  const isOpponentGone = opponentConnectionStatus === "ABANDONED";
  const isOpponentDisconnected = opponentConnectionStatus === "DISCONNECTED";

  return (
    <div className="relative h-screen w-full">
      {/* Indicador de conexión propia */}
      <div className="absolute left-2 top-2 z-50 flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-950/80 px-2.5 py-1 backdrop-blur-sm">
        <span
          className={`h-1.5 w-1.5 rounded-full ${CONNECTION_COLORS[channelStatus]}`}
          aria-hidden
        />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          {CONNECTION_LABELS[channelStatus]}
        </span>
      </div>

      {/* Indicadores de jugadores */}
      <div className="absolute left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-700/50 bg-slate-950/70 px-3 py-1 backdrop-blur-sm">
        <span className="text-[10px] font-bold text-cyan-200">{localNickname}</span>
        <span className="text-[10px] text-slate-500">vs</span>
        <span className="text-[10px] font-bold text-red-300">{opponentNickname}</span>
      </div>

      {/* Overlay: rival desconectado */}
      {(isOpponentDisconnected || isOpponentGone) && !matchFinished && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-700/60 bg-slate-950/90 px-8 py-6 backdrop-blur-md">
            <span className="text-base font-bold text-amber-300">
              {opponentNickname} se ha desconectado
            </span>
            {isOpponentGone ? (
              <>
                <span className="text-sm text-slate-400">El rival ha abandonado la partida.</span>
                <button
                  onClick={handleForfeitVictory}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-bold text-white transition hover:bg-emerald-500 active:scale-95"
                >
                  Reclamar victoria
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-400">
                Reconexión automática en{" "}
                <span className="font-bold text-white">{remainingSeconds}s</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay: fin de partida + recompensas */}
      {matchFinished && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-5 rounded-2xl border border-slate-700/60 bg-slate-950/95 px-10 py-8 backdrop-blur-md">
            <span className="text-2xl font-black tracking-wide">
              {winnerPlayerId === localPlayerId
                ? "¡Victoria!"
                : winnerPlayerId === "DRAW"
                  ? "Empate"
                  : "Derrota"}
            </span>
            {reward && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm text-slate-400">Recompensas obtenidas</span>
                <div className="flex items-center gap-4">
                  <span className="text-base font-bold text-yellow-300">+{reward.nexus} Nexus</span>
                  <span className="text-base font-bold text-sky-300">+{reward.playerExperience} XP</span>
                </div>
              </div>
            )}
            <button
              onClick={() => router.push("/hub/multiplayer")}
              className="rounded-lg bg-slate-700 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-600 active:scale-95"
            >
              Volver al lobby
            </button>
          </div>
        </div>
      )}

      <Board
        mode="MULTIPLAYER"
        initialConfig={{
          playerId: localPlayerId,
          playerName: localNickname,
          opponentId,
          opponentName: opponentNickname,
          playerDeck: preparedLocalDeck,
          opponentDeck: preparedOpponentDeck,
          seed,
          // Orden y runtimeId ya son deterministas: no volver a barajar.
          preserveDeckOrder: true,
          starterPlayerId: coinToss.starterPlayerId,
        }}
        disableOpponentAutomation
        applyTransitionRef={applyTransitionRef}
        playerAvatarUrl={LOCAL_AVATAR_URL}
        opponentAvatarUrl={OPPONENT_AVATAR_URL}
        onMatchResolved={handleMatchResolved}
        onExitMatch={() => router.push("/hub/multiplayer")}
        isMatchStartLocked={isCoinTossVisible}
        isTurnTimerEnabled
      />

      <MultiplayerCoinTossOverlay
        isVisible={isCoinTossVisible}
        starterSide={coinToss.starterSide}
        playerName={localNickname}
        opponentName={opponentNickname}
        playerAvatarUrl={LOCAL_AVATAR_URL}
        opponentAvatarUrl={OPPONENT_AVATAR_URL}
        onComplete={() => setIsCoinTossVisible(false)}
      />
    </div>
  );
}
