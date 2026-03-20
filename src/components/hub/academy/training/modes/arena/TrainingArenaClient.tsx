// src/components/hub/academy/training/modes/arena/TrainingArenaClient.tsx - Orquesta UI de arena training con selección de tier y cierre de partida remoto.
"use client";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ACADEMY_HOME_ROUTE, ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";
import { postTrainingMatchCompletion } from "./training-match-completion-client";
import { TrainingArenaLobby } from "@/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby";

interface ITrainingArenaClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  opponentName: string;
  opponentAvatarUrl: string;
  opponentIntroUrl: string;
  opponentDifficulty: OpponentDifficulty;
  selectedTier: number;
  highestUnlockedTier: number;
  tiers: Array<{ tier: number; isUnlocked: boolean; missingWins: number }>;
}

function resolveOutcome(result: { winnerPlayerId: string | "DRAW"; playerId: string }): IMatchOutcome {
  if (result.winnerPlayerId === "DRAW") return "DRAW";
  return result.winnerPlayerId === result.playerId ? "WIN" : "LOSE";
}

export function TrainingArenaClient(props: ITrainingArenaClientProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<IDuelResultRewardSummary | null>(null);
  const [highestUnlockedTier, setHighestUnlockedTier] = useState(props.highestUnlockedTier);
  const hasPostedRef = useRef(false);
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: props.opponentDifficulty }),
    [props.opponentDifficulty],
  );

  /**
   * Sincroniza cierre de duelo una única vez para mantener idempotencia por `matchSeed`.
   */
  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string; matchSeed: string }) {
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;
    setStatus("Registrando resultado de entrenamiento...");
    try {
      const payload = await postTrainingMatchCompletion({
        battleId: result.matchSeed,
        tier: props.selectedTier,
        outcome: resolveOutcome(result),
      });
      setRewardSummary({
        rewardNexus: payload.reward.nexus,
        rewardPlayerExperience: payload.reward.playerExperience,
        rewardCards: [],
      });
      setHighestUnlockedTier(payload.highestUnlockedTier);
      setStatus(payload.newlyUnlockedTiers.length > 0 ? `Nuevo tier desbloqueado: ${payload.newlyUnlockedTiers.join(", ")}` : "Resultado sincronizado.");
    } catch {
      setStatus("No se pudo sincronizar el resultado de entrenamiento.");
      hasPostedRef.current = false;
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950">
      {!isBattleStarted ? (
        <TrainingArenaLobby
          tier={props.selectedTier}
          opponentName={props.opponentName}
          playerIntroUrl="/assets/story/player/bob.png"
          opponentIntroUrl={props.opponentIntroUrl}
          onStart={() => setIsBattleStarted(true)}
        />
      ) : null}
      <div className={`pointer-events-none absolute left-3 top-3 z-[320] flex flex-wrap gap-2 ${isBattleStarted ? "" : "opacity-0"}`}>
        {props.tiers.map((tier) =>
          tier.isUnlocked ? (
            <Link
              key={tier.tier}
              href={`${ACADEMY_TRAINING_ARENA_ROUTE}?tier=${tier.tier}`}
              className={`pointer-events-auto rounded-md border px-2 py-1 text-[11px] font-black uppercase ${props.selectedTier === tier.tier ? "border-cyan-200 bg-cyan-500/25 text-cyan-100" : "border-cyan-300/45 bg-slate-900/70 text-cyan-200"}`}
            >
              Tier {tier.tier}
            </Link>
          ) : (
            <span key={tier.tier} className="rounded-md border border-slate-600/60 bg-slate-900/70 px-2 py-1 text-[11px] font-black uppercase text-slate-400">
              Tier {tier.tier} ({tier.missingWins})
            </span>
          ),
        )}
      </div>
      {isBattleStarted && status ? <p className="absolute left-3 top-12 z-[320] rounded-md bg-cyan-950/80 px-3 py-2 text-xs font-bold text-cyan-100">{status}</p> : null}
      {isBattleStarted ? <p className="absolute right-3 top-3 z-[320] rounded-md bg-slate-950/80 px-3 py-2 text-xs font-bold text-cyan-100">Máximo desbloqueado: T{highestUnlockedTier}</p> : null}
      {isBattleStarted ? (
        <Board
          mode="TRAINING"
          initialPlayerDeck={props.deck}
          initialConfig={{
            playerFusionDeck: props.fusionDeck,
            opponentDeck: props.opponentDeck,
            opponentFusionDeck: props.opponentFusionDeck,
            opponentName: props.opponentName,
          }}
          playerAvatarUrl="/assets/story/player/bob.png"
          opponentAvatarUrl={props.opponentAvatarUrl}
          opponentStrategyOverride={opponentStrategy}
          duelResultRewardSummary={rewardSummary}
          resultActionLabel="Volver a selección"
          onResultAction={() => window.location.replace(ACADEMY_HOME_ROUTE)}
          onExitMatch={() => window.location.replace(ACADEMY_HOME_ROUTE)}
          onMatchResolved={handleMatchResolved}
        />
      ) : null}
    </div>
  );
}
