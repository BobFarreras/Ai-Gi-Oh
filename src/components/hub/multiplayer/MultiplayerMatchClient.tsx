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
import { IMatchActionPayload } from "@/core/entities/multiplayer/IMatchAction";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { LocalActionEmitterProvider } from "@/components/game/board/multiplayer/local-action-emitter";
import {
  prepareMultiplayerDeck,
  resolveMultiplayerCoinToss,
} from "@/core/services/multiplayer/prepare-multiplayer-match";
import { createSeededGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
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
  localFusionDeck: ICard[];
  opponentFusionDeck: ICard[];
  isPlayerA: boolean;
}

type ChannelStatus = "CONNECTING" | "CONNECTED" | "DISCONNECTED";

// Avatares de duelo: cada jugador se ve a sí mismo como bob; el rival es siempre bob-rojo.
const LOCAL_AVATAR_URL = "/assets/story/player/bob.webp";
const OPPONENT_AVATAR_URL = "/assets/story/player/bob-rojo.webp";

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

type EloChange = { old: number; new: number };

async function callFinishMatch(
  matchId: string,
  outcome: "WIN" | "LOSE" | "DRAW",
): Promise<{ ok: boolean; reward?: IMatchReward; eloChange?: EloChange; error?: string }> {
  try {
    const res = await fetch("/api/multiplayer/match/finish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, outcome }),
    });
    const body = await res.json();
    if (!res.ok) return { ok: false, error: body.message ?? "Error al cerrar la partida." };
    return { ok: true, reward: body.reward, eloChange: body.eloChange };
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
  localFusionDeck,
  opponentFusionDeck,
  isPlayerA,
}: MultiplayerMatchClientProps) {
  const router = useRouter();
  const [winnerPlayerId, setWinnerPlayerId] = useState<string | null>(null);
  const [reward, setReward] = useState<IMatchReward | null>(null);
  const [eloChange, setEloChange] = useState<EloChange | null>(null);
  const [matchFinished, setMatchFinished] = useState(false);
  const [isCoinTossVisible, setIsCoinTossVisible] = useState(true);
  const applyTransitionRef = useRef<((transition: (state: GameState) => GameState) => GameState | null) | null>(null);
  const applyRemoteActionRef = useRef<((action: IMatchActionPayload) => Promise<void>) | null>(null);
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

  // Fábrica de ids determinista compartida: instanceId idénticos en ambos clientes.
  const idFactory = useMemo(() => createSeededGameEngineIdFactory(seed), [seed]);

  const { channelStatus, opponentConnectionStatus, disconnectedForMs, dispatchAction } =
    useMultiplayerMatchChannel({ matchId, localPlayerId, opponentId });

  // Emite cada acción del jugador local hacia el servidor, que la retransmite al rival.
  const emitLocalAction = useCallback(
    (action: IMatchActionPayload) => {
      void dispatchAction(action);
    },
    [dispatchAction],
  );

  useRemoteOpponentTurn({
    matchId,
    opponentId,
    winnerPlayerId,
    applyRemoteAction: useCallback(
      (action: IMatchActionPayload) => applyRemoteActionRef.current?.(action) ?? Promise.resolve(),
      [],
    ),
  });

  const finishMatch = useCallback(
    async (outcome: "WIN" | "LOSE" | "DRAW") => {
      if (finishCalledRef.current) return;
      finishCalledRef.current = true;
      const result = await callFinishMatch(matchId, outcome);
      if (result.reward) setReward(result.reward);
      if (result.eloChange) setEloChange(result.eloChange);
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

  // Construye el resumen de recompensas para el DuelResultOverlay del Board.
  // Se calcula cuando llega el reward del servidor; rewardCards vacío (sin drop en multijugador).
  // eloChange se incluye para mostrar animación de puntos ganados/perdidos en el overlay.
  const duelResultRewardSummary: IDuelResultRewardSummary | null = useMemo(() => {
    if (!reward) return null;
    return {
      rewardNexus: reward.nexus,
      rewardPlayerExperience: reward.playerExperience,
      rewardCards: [],
      eloChange: eloChange ? { delta: eloChange.new - eloChange.old, new: eloChange.new } : undefined,
    };
  }, [reward, eloChange]);

  // Acción del botón del overlay: volver al lobby multijugador (radar).
  const handleResultAction = useCallback(() => {
    router.push("/hub/multiplayer");
  }, [router]);

  const disconnectedSeconds = Math.floor(disconnectedForMs / 1000);
  const remainingSeconds = Math.max(0, 60 - disconnectedSeconds);
  const isOpponentGone = opponentConnectionStatus === "ABANDONED";
  const isOpponentDisconnected = opponentConnectionStatus === "DISCONNECTED";

  return (
    <LocalActionEmitterProvider value={emitLocalAction}>
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

      <Board
        mode="MULTIPLAYER"
        initialPlayerDeck={preparedLocalDeck}
        initialConfig={{
          playerId: localPlayerId,
          playerName: localNickname,
          opponentId,
          opponentName: opponentNickname,
          opponentDeck: preparedOpponentDeck,
          playerFusionDeck: localFusionDeck,
          opponentFusionDeck,
          seed,
          // Orden y runtimeId ya son deterministas: no volver a barajar.
          preserveDeckOrder: true,
          starterPlayerId: coinToss.starterPlayerId,
          idFactory,
        }}
        disableOpponentAutomation
        applyTransitionRef={applyTransitionRef}
        applyRemoteActionRef={applyRemoteActionRef}
        playerAvatarUrl={LOCAL_AVATAR_URL}
        opponentAvatarUrl={OPPONENT_AVATAR_URL}
        onMatchResolved={handleMatchResolved}
        onExitMatch={() => router.push("/hub/multiplayer")}
        isMatchStartLocked={isCoinTossVisible}
        isTurnTimerEnabled
        duelResultRewardSummary={duelResultRewardSummary}
        resultActionLabel="Volver al lobby"
        onResultAction={handleResultAction}
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
    </LocalActionEmitterProvider>
  );
}
