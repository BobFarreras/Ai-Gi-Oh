// src/components/hub/academy/training/modes/arena/TrainingArenaClient.tsx - Orquesta UI de arena training con selección de tier y cierre de partida remoto.
"use client";
import { useMemo, useRef, useState } from "react";
import { Board } from "@/components/game/board";
import { ICard } from "@/core/entities/ICard";
import { IDuelResultRewardSummary } from "@/components/game/board/ui/internal/duel-result/duel-result-reward-summary";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { IMatchNarrationPack } from "@/components/game/board/narration/types";
import { postTrainingMatchCompletion } from "./training-match-completion-client";
import { TrainingArenaLobby } from "@/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby";
import { resolveTrainingResultAction } from "@/components/hub/academy/training/modes/arena/internal/resolve-training-result-action";
import { resolveTrainingTierReward } from "@/core/services/training/resolve-training-tier-reward";

interface ITrainingArenaClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  playerName: string;
  opponentName: string;
  opponentAvatarUrl: string;
  opponentDifficulty: OpponentDifficulty;
  narrationPack: IMatchNarrationPack;
  selectedTier: number;
  tiers: Array<{
    tier: number;
    code: string;
    aiDifficulty: OpponentDifficulty;
    rewardMultiplier: number;
    requiredWinsInPreviousTier: number;
    winsInPreviousTier: number;
    isUnlocked: boolean;
    missingWins: number;
  }>;
}

function resolveOutcome(result: { winnerPlayerId: string | "DRAW"; playerId: string }): IMatchOutcome {
  if (result.winnerPlayerId === "DRAW") return "DRAW";
  return result.winnerPlayerId === result.playerId ? "WIN" : "LOSE";
}

export function TrainingArenaClient(props: ITrainingArenaClientProps) {
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<IDuelResultRewardSummary | null>(null);
  const [resultAction, setResultAction] = useState(() => ({ label: "Volver a selección", href: ACADEMY_HOME_ROUTE }));
  const hasPostedRef = useRef(false);
  const selectedTierMeta = props.tiers.find((tier) => tier.tier === props.selectedTier) ?? props.tiers[0];
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: props.opponentDifficulty }),
    [props.opponentDifficulty],
  );
  const tierRewardPreview = useMemo(() => {
    return resolveTrainingTierReward("WIN", selectedTierMeta?.rewardMultiplier ?? 1);
  }, [selectedTierMeta?.rewardMultiplier]);
  const nextTierRequirementLabel = useMemo(() => {
    if (!selectedTierMeta) return "Sin datos de progreso";
    const nextTier = props.tiers.find((tier) => tier.tier === selectedTierMeta.tier + 1);
    if (!nextTier) return "Último nivel disponible";
    return `Siguiente nivel: ${nextTier.winsInPreviousTier}/${nextTier.requiredWinsInPreviousTier} victorias`;
  }, [props.tiers, selectedTierMeta]);

  /**
   * Sincroniza cierre de duelo una única vez para mantener idempotencia por `matchSeed`.
   */
  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string; matchSeed: string }) {
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;
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
      setResultAction(resolveTrainingResultAction({ selectedTier: props.selectedTier, newlyUnlockedTiers: payload.newlyUnlockedTiers }));
    } catch {
      hasPostedRef.current = false;
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950">
      {!isBattleStarted ? (
        <TrainingArenaLobby
          level={props.selectedTier}
          tierCode={selectedTierMeta?.code ?? "LVL"}
          tierDifficultyLabel={selectedTierMeta?.aiDifficulty ?? "EASY"}
          tierRewardPreview={tierRewardPreview}
          nextTierRequirementLabel={nextTierRequirementLabel}
          opponentName={props.opponentName}
          playerAvatarUrl="/assets/story/player/bob.png"
          opponentAvatarUrl={props.opponentAvatarUrl}
          onStart={() => setIsBattleStarted(true)}
          onBack={() => window.location.replace(ACADEMY_HOME_ROUTE)}
        />
      ) : null}
      {isBattleStarted ? (
        <Board
          mode="TRAINING"
          initialPlayerDeck={props.deck}
          initialConfig={{
            playerName: props.playerName,
            playerFusionDeck: props.fusionDeck,
            opponentDeck: props.opponentDeck,
            opponentFusionDeck: props.opponentFusionDeck,
            opponentName: props.opponentName,
          }}
          playerAvatarUrl="/assets/story/player/bob.png"
          opponentAvatarUrl={props.opponentAvatarUrl}
          opponentStrategyOverride={opponentStrategy}
          narrationPack={props.narrationPack}
          duelResultRewardSummary={rewardSummary}
          resultActionLabel={resultAction.label}
          onResultAction={() => window.location.replace(resultAction.href)}
          onExitMatch={() => window.location.replace(ACADEMY_HOME_ROUTE)}
          onMatchResolved={handleMatchResolved}
        />
      ) : null}
    </div>
  );
}
