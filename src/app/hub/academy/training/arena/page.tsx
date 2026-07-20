// src/app/hub/academy/training/arena/page.tsx - Entry server-side de arena training con tier validado y runtime listo para UI cliente.
import { cookies } from "next/headers";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingDeckReadyGate } from "@/components/hub/academy/training/TrainingDeckReadyGate";
import { TrainingArenaClient } from "@/components/hub/academy/training/modes/arena/TrainingArenaClient";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { getTrainingArenaRuntimeData } from "@/services/training/get-training-arena-runtime-data";
import { resolveArenaLadderRoster, resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";
import { issueTrainingCompletionTicket } from "@/services/security/duel-completion-ticket";

interface TrainingArenaPageProps {
  searchParams?: Promise<{ tier?: string }>;
}

export default async function TrainingArenaPage({ searchParams }: TrainingArenaPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  // Sin ?tier explícito se recupera el último nivel que eligió el jugador (cookie). El use-case lo
  // re-valida contra el progreso (clampa si ya no está desbloqueado), así que es seguro.
  const persistedTier = (await cookies()).get("arena_tier")?.value;
  const requestedTier = Number.parseInt(resolvedSearchParams?.tier ?? persistedTier ?? "1", 10);
  const selectedTier = Number.isFinite(requestedTier) && requestedTier > 0 ? requestedTier : 1;
  const runtime = await getTrainingArenaRuntimeData(selectedTier);
  const currentTier = runtime.tiers.find((tier) => tier.tier === runtime.effectiveTier) ?? runtime.tiers[0];
  const currentTierStats = runtime.progress.tierStats.find((tierStats) => tierStats.tier === (currentTier?.tier ?? 1));
  // Escalado de cartas propio del tier (editable); null = el resolver usa el escalado por dificultad.
  const tierScaling = currentTier?.defaultLevel != null
    ? { versionTier: currentTier.defaultVersionTier ?? 0, level: currentTier.defaultLevel, xp: currentTier.defaultXp ?? 0 }
    : null;
  const opponentLoadout = resolveTrainingOpponentLoadout({
    tier: currentTier?.tier ?? 1,
    aiDifficulty: currentTier?.aiDifficulty ?? "EASY",
    // Roster FIJO de 6 rivales en orden, igual en todos los niveles; te enfrentas al Nº = victorias
    // del nivel (ganas a uno para pasar al siguiente). La fuerza sube por nivel vía `defaultScaling`.
    tierWins: currentTierStats?.wins ?? 0,
    tierMatches: currentTierStats?.matches ?? 0,
    // Oponentes y cartas desde BD si existen; si no, presets/catálogo en código (fallback robusto).
    opponents: runtime.arenaOpponents ?? undefined,
    cardCatalog: runtime.arenaCardCatalog ?? undefined,
    defaultScaling: tierScaling,
  });
  // Ladder del nivel: los 6 rivales en orden + cuántos llevas ganados (para las "monedas" del lobby).
  const ladder = resolveArenaLadderRoster(runtime.arenaOpponents ?? undefined).map((entry) => ({
    displayName: entry.displayName,
    avatarUrl: entry.avatarUrl,
  }));
  const ladderWins = currentTierStats?.wins ?? 0;
  const narrationPack = buildStoryOpponentNarrationPack({
    opponentId: opponentLoadout.storyOpponentId,
    opponentName: opponentLoadout.displayName,
    duelDescription: `Duelo de entrenamiento contra ${opponentLoadout.displayName}.`,
  });
  const loadout = runtime.loadout;
  const isDeckReady = Boolean(loadout.deck && loadout.deck.length === HOME_DECK_SIZE);
  const completionBattleId = crypto.randomUUID();
  const completionTicket = issueTrainingCompletionTicket({
    playerId: runtime.playerId,
    tier: runtime.effectiveTier,
    battleId: completionBattleId,
  });
  if (!isDeckReady) {
    return (
      <>
        <HubSectionEntryBurst />
        <TrainingDeckReadyGate />
      </>
    );
  }
  return (
    <main className="min-h-dvh bg-zinc-950">
      <HubSectionEntryBurst />
      <TrainingArenaClient
        deck={loadout.deck!}
        fusionDeck={loadout.fusionDeck ?? []}
        opponentDeck={opponentLoadout.deck}
        opponentFusionDeck={opponentLoadout.fusionDeck}
        opponentName={opponentLoadout.displayName}
        playerName={runtime.playerDisplayName}
        opponentAvatarUrl={opponentLoadout.avatarUrl}
        opponentDifficulty={opponentLoadout.difficulty}
        ladder={ladder}
        ladderWins={ladderWins}
        narrationPack={narrationPack}
        completionTicket={completionTicket}
        completionBattleId={completionBattleId}
        playerStartingLpBonus={runtime.combatModifiers.startingLpBonus}
        playerMaxEnergyBonus={runtime.combatModifiers.maxEnergyBonus}
        playerTurn1EnergyBonus={runtime.combatModifiers.turn1EnergyBonus}
        playerOpeningMulligan={runtime.combatModifiers.openingMulligan}
        selectedTier={runtime.effectiveTier}
        tiers={runtime.tiers.map((tier) => ({
          tier: tier.tier,
          code: tier.code,
          aiDifficulty: tier.aiDifficulty,
          rewardMultiplier: tier.rewardMultiplier,
          requiredWinsInPreviousTier: tier.requiredWinsInPreviousTier,
          winsInPreviousTier: tier.winsInPreviousTier,
          isUnlocked: tier.isUnlocked,
          missingWins: tier.missingWins,
        }))}
      />
    </main>
  );
}
