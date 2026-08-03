// src/components/hub/academy/training/modes/classic/TrainingArenaClient.tsx - Orquesta la Arena clásica y su cierre remoto.
"use client";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { ACADEMY_HOME_ROUTE, ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE } from "@/core/constants/routes/academy-routes";
import { postTrainingMatchCompletion } from "./training-match-completion-client";
import { TrainingArenaLobby } from "@/components/hub/academy/training/modes/classic/internal/TrainingArenaLobby";
import { resolveTrainingResultAction } from "@/components/hub/academy/training/modes/classic/internal/resolve-training-result-action";
import { ITrainingArenaClientProps, TrainingRewardSummary } from "@/components/hub/academy/training/modes/classic/internal/training-arena-client.types";
import { resolveTrainingTierReward } from "@/core/services/training/resolve-training-tier-reward";
import { track } from "@/services/analytics/client/analytics-buffer";

function resolveOutcome(result: { winnerPlayerId: string | "DRAW"; playerId: string }): IMatchOutcome {
  if (result.winnerPlayerId === "DRAW") return "DRAW";
  return result.winnerPlayerId === result.playerId ? "WIN" : "LOSE";
}

export function TrainingArenaClient(props: ITrainingArenaClientProps) {
  const router = useRouter();
  const [isBattleStarted, setIsBattleStarted] = useState(false);
  const [rewardSummary, setRewardSummary] = useState<TrainingRewardSummary>(null);
  const [resultAction, setResultAction] = useState(() => ({ label: "Volver a selección", href: ACADEMY_HOME_ROUTE }));
  const [isTierSwitching, startTierTransition] = useTransition();
  const hasPostedRef = useRef(false);
  // Clave de idempotencia de la Recaudación: UNA por instancia de duelo (los reintentos la reutilizan).
  const passiveNexusOperationIdRef = useRef<string>(crypto.randomUUID());
  const selectedTierMeta = props.tiers.find((tier) => tier.tier === props.selectedTier) ?? props.tiers[0];
  // Recuerda el último nivel elegido: al volver a Arena sin ?tier, el server lo lee de esta cookie.
  useEffect(() => {
    document.cookie = `arena_tier=${props.selectedTier}; path=/; max-age=31536000; samesite=lax`;
  }, [props.selectedTier]);
  // Precarga los niveles desbloqueados para que el cambio de nivel (soft-nav) sea casi instantáneo.
  useEffect(() => {
    for (const tier of props.tiers) {
      if (tier.isUnlocked) router.prefetch(`${ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE}?tier=${tier.tier}`);
    }
  }, [props.tiers, router]);
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
    if (nextTier.winsInPreviousTier >= nextTier.requiredWinsInPreviousTier) {
      return `Nivel ${nextTier.tier} desbloqueado. Puedes cambiarlo desde la selección de nivel.`;
    }
    const winsMissing = nextTier.requiredWinsInPreviousTier - nextTier.winsInPreviousTier;
    return `Te faltan ${winsMissing} victorias para desbloquear Nivel ${nextTier.tier}.`;
  }, [props.tiers, selectedTierMeta]);

  /**
   * Sincroniza cierre de duelo una única vez para mantener idempotencia por `matchSeed`.
   */
  async function handleMatchResolved(result: { winnerPlayerId: string | "DRAW"; playerId: string; matchSeed: string; flawless?: boolean; passiveNexusEarned?: number }) {
    if (hasPostedRef.current) return;
    hasPostedRef.current = true;
    const outcome = resolveOutcome(result);
    track("duel_ended", "gameplay", { mode: "TRAINING", tier: props.selectedTier, outcome, matchSeed: result.matchSeed });
    try {
      const payload = await postTrainingMatchCompletion({
        battleId: props.completionBattleId,
        tier: props.selectedTier,
        outcome: resolveOutcome(result),
        completionTicket: props.completionTicket,
        flawless: result.flawless ?? false,
        // Recaudación (ficha 3): reporte del motor; el servidor topa y acredita. Clave estable por duelo.
        passiveNexusEarned: result.passiveNexusEarned ?? 0,
        passiveNexusOperationId: passiveNexusOperationIdRef.current,
      });
      setRewardSummary({
        // El Nexus de la Recaudación acreditado se suma al total mostrado: es Nexus recibido en este cierre.
        rewardNexus: payload.reward.nexus + payload.passiveNexusCredited,
        rewardPlayerExperience: payload.reward.playerExperience,
        rewardCards: [],
      });
      setResultAction(resolveTrainingResultAction({ selectedTier: props.selectedTier, newlyUnlockedTiers: payload.newlyUnlockedTiers }));
    } catch {
      hasPostedRef.current = false;
    }
  }

  return (
    <div className="relative min-h-dvh bg-zinc-950">
      {!isBattleStarted ? (
        <TrainingArenaLobby
          level={props.selectedTier}
          tierCode={selectedTierMeta?.code ?? "LVL"}
          tierDifficultyLabel={selectedTierMeta?.aiDifficulty ?? "EASY"}
          tierRewardPreview={tierRewardPreview}
          nextTierRequirementLabel={nextTierRequirementLabel}
          tierOptions={props.tiers.map((tier) => ({
            tier: tier.tier,
            isUnlocked: tier.isUnlocked,
            isSelected: tier.tier === props.selectedTier,
          }))}
          onSelectTier={(tier) => startTierTransition(() => router.push(`${ACADEMY_TRAINING_ARENA_CLASSIC_ROUTE}?tier=${tier}`, { scroll: false }))}
          isTierSwitching={isTierSwitching}
          ladder={props.ladder}
          ladderWins={props.ladderWins}
          opponentName={props.opponentName}
          playerAvatarUrl="/assets/story/player/bob.webp"
          opponentAvatarUrl={props.opponentAvatarUrl}
          onStart={() => {
            setIsBattleStarted(true);
            track("duel_started", "gameplay", { mode: "TRAINING", tier: props.selectedTier, difficulty: props.opponentDifficulty });
          }}
          onBack={() => router.push(ACADEMY_HOME_ROUTE)}
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
            playerStartingLpBonus: props.playerStartingLpBonus,
            playerMaxEnergyBonus: props.playerMaxEnergyBonus,
            playerTurn1EnergyBonus: props.playerTurn1EnergyBonus,
            opponentStartingLpBonus: props.opponentStartingLpBonus,
            opponentMaxEnergyBonus: props.opponentMaxEnergyBonus,
            opponentTurn1EnergyBonus: props.opponentTurn1EnergyBonus,
          }}
          playerAvatarUrl="/assets/story/player/bob.webp"
          opponentAvatarUrl={props.opponentAvatarUrl}
          opponentStrategyOverride={opponentStrategy}
          narrationPack={props.narrationPack}
          duelResultRewardSummary={rewardSummary}
          resultActionLabel={resultAction.label}
          onResultAction={() => window.location.replace(resultAction.href)}
          onExitMatch={() => window.location.replace(ACADEMY_HOME_ROUTE)}
          onMatchResolved={handleMatchResolved}
          enableOpeningMulligan={props.playerOpeningMulligan}
        />
      ) : null}
    </div>
  );
}
