// src/app/hub/academy/training/arena/page.tsx - Entry server-side de arena training con tier validado y runtime listo para UI cliente.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingDeckReadyGate } from "@/components/hub/academy/training/TrainingDeckReadyGate";
import { TrainingArenaClient } from "@/app/hub/academy/training/arena/TrainingArenaClient";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { getTrainingArenaRuntimeData } from "@/services/training/get-training-arena-runtime-data";

interface TrainingArenaPageProps {
  searchParams?: Promise<{ tier?: string }>;
}

export default async function TrainingArenaPage({ searchParams }: TrainingArenaPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const selectedTier = Number.parseInt(resolvedSearchParams?.tier ?? "1", 10);
  const runtime = await getTrainingArenaRuntimeData(selectedTier);
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
        selectedTier={runtime.effectiveTier}
        highestUnlockedTier={runtime.highestUnlockedTier}
        tiers={runtime.tiers.map((tier) => ({ tier: tier.tier, isUnlocked: tier.isUnlocked, missingWins: tier.missingWins }))}
      />
    </main>
  );
}
