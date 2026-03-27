// src/app/hub/academy/training/arena/page.tsx - Entry server-side de arena training con tier validado y runtime listo para UI cliente.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingDeckReadyGate } from "@/components/hub/academy/training/TrainingDeckReadyGate";
import { TrainingArenaClient } from "@/components/hub/academy/training/modes/arena/TrainingArenaClient";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { getTrainingArenaRuntimeData } from "@/services/training/get-training-arena-runtime-data";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";
import { buildStoryOpponentNarrationPack } from "@/services/story/build-story-opponent-narration-pack";

interface TrainingArenaPageProps {
  searchParams?: Promise<{ tier?: string }>;
}

export default async function TrainingArenaPage({ searchParams }: TrainingArenaPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedTier = Number.parseInt(resolvedSearchParams?.tier ?? "1", 10);
  const runtime = await getTrainingArenaRuntimeData(selectedTier);
  const currentTier = runtime.tiers.find((tier) => tier.tier === runtime.effectiveTier) ?? runtime.tiers[0];
  const currentTierStats = runtime.progress.tierStats.find((tierStats) => tierStats.tier === (currentTier?.tier ?? 1));
  const opponentLoadout = resolveTrainingOpponentLoadout({
    tier: currentTier?.tier ?? 1,
    aiDifficulty: currentTier?.aiDifficulty ?? "EASY",
    deckTemplateId: currentTier?.deckTemplateId ?? "training-tier-1",
    tierWins: currentTierStats?.wins ?? 0,
    tierMatches: currentTierStats?.matches ?? 0,
  });
  const narrationPack = buildStoryOpponentNarrationPack({
    opponentId: opponentLoadout.storyOpponentId,
    opponentName: opponentLoadout.displayName,
    duelDescription: `Duelo de entrenamiento contra ${opponentLoadout.displayName}.`,
  });
  const loadout = runtime.loadout;
  const isDeckReady = Boolean(loadout.deck && loadout.deck.length === HOME_DECK_SIZE);
  if (!isDeckReady) {
    return (
      <>
        <HubSectionEntryBurst />
        <TrainingDeckReadyGate />
      </>
    );
  }
  return (
    <main className="min-h-screen bg-zinc-950">
      <HubSectionEntryBurst />
      <TrainingArenaClient
        deck={loadout.deck!}
        fusionDeck={loadout.fusionDeck ?? []}
        opponentDeck={opponentLoadout.deck}
        opponentFusionDeck={opponentLoadout.fusionDeck}
        opponentName={opponentLoadout.displayName}
        opponentAvatarUrl={opponentLoadout.avatarUrl}
        opponentDifficulty={opponentLoadout.difficulty}
        narrationPack={narrationPack}
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
