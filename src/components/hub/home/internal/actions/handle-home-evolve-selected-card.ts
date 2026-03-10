// src/components/hub/home/internal/actions/handle-home-evolve-selected-card.ts - Ejecuta evolución de versión de carta con actualización optimista y reconciliación.
import { evolveCardVersionAction } from "@/services/home/deck-builder/deck-builder-actions";
import { endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IHomeActionDeps } from "@/components/hub/home/internal/actions/home-action-deps";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";

interface IHandleHomeEvolveSelectedCardInput extends IHomeActionDeps {
  selectedCardId: string | null;
  canEvolveSelectedCard: boolean;
  copiesRequiredToEvolve: number | null;
  selectedCardVersionTier: number;
  selectedCardLevel: number;
  selectedCardProgress: IPlayerCardProgress | null;
}

export async function handleHomeEvolveSelectedCard(input: IHandleHomeEvolveSelectedCardInput): Promise<IHomeActionResult> {
  const {
    context,
    collectionState,
    cardProgressById,
    setCollectionState,
    setCardProgressById,
    setEvolutionOverlay,
    setErrorMessage,
    resolveActionErrorMessage,
    play,
    selectedCardId,
    canEvolveSelectedCard,
    copiesRequiredToEvolve,
    selectedCardVersionTier,
    selectedCardLevel,
    selectedCardProgress,
  } = input;
  if (!selectedCardId || !canEvolveSelectedCard || copiesRequiredToEvolve === null) {
    return { ok: false, message: "No hay copias libres suficientes en almacén para evolucionar esta carta." };
  }
  const telemetry = startInteraction("home.evolveCard");
  play("EVOLUTION_BUTTON");
  const previousVersionTier = selectedCardVersionTier;
  const previousCollection = collectionState;
  const previousProgressById = new Map(cardProgressById);
  const optimisticProgress: IPlayerCardProgress = {
    playerId: context.playerId,
    cardId: selectedCardId,
    versionTier: previousVersionTier + 1,
    level: selectedCardLevel,
    xp: selectedCardProgress?.xp ?? 0,
    masteryPassiveSkillId: selectedCardProgress?.masteryPassiveSkillId ?? null,
    updatedAtIso: new Date().toISOString(),
  };
  setEvolutionOverlay({
    cardId: selectedCardId,
    fromVersionTier: previousVersionTier,
    toVersionTier: optimisticProgress.versionTier,
    level: optimisticProgress.level,
    consumedCopies: copiesRequiredToEvolve,
  });
  setCollectionState((currentCollection) =>
    currentCollection
      .map((entry) =>
        entry.card.id === selectedCardId ? { ...entry, ownedCopies: Math.max(0, entry.ownedCopies - copiesRequiredToEvolve) } : entry,
      )
      .filter((entry) => entry.ownedCopies > 0),
  );
  setCardProgressById((current) => {
    const next = new Map(current);
    next.set(selectedCardId, optimisticProgress);
    return next;
  });
  try {
    const result = await evolveCardVersionAction(context.playerId, selectedCardId);
    setCollectionState(result.collection);
    setCardProgressById((current) => {
      const next = new Map(current);
      next.set(result.progress.cardId, result.progress);
      return next;
    });
    setEvolutionOverlay({
      cardId: selectedCardId,
      fromVersionTier: previousVersionTier,
      toVersionTier: result.progress.versionTier,
      level: result.progress.level,
      consumedCopies: result.consumedCopies,
    });
    setTimeout(() => setEvolutionOverlay(null), 2200);
    setErrorMessage(null);
    endInteraction(telemetry, "ok");
    return { ok: true };
  } catch (error) {
    setCollectionState(previousCollection);
    setCardProgressById(previousProgressById);
    setEvolutionOverlay(null);
    const message = resolveActionErrorMessage(error, "No se pudo evolucionar la carta seleccionada.");
    setErrorMessage(message);
    endInteraction(telemetry, "error");
    return { ok: false, message };
  }
}
