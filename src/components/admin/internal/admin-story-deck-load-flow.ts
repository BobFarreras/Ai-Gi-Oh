// src/components/admin/internal/admin-story-deck-load-flow.ts - Ejecuta recarga de datos del editor Story y aplica snapshot en estado local.
import { fetchAdminStoryDeckData, IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { buildStoryDeckLoadSnapshot } from "@/components/admin/internal/admin-story-deck-load-state";

interface IExecuteAdminStoryDeckLoadInput {
  input: { opponentId?: string; deckListId?: string; preferredDuelId?: string | null };
  setData: (next: IAdminStoryDeckApiResponse) => void;
  setSelectedOpponentId: (value: string | null) => void;
  setDraftCardIds: (value: Array<string | null>) => void;
  setSelectedDuelId: (value: string | null) => void;
  setSelectedDuelDifficulty: (value: "ROOKIE" | "STANDARD" | "ELITE" | "BOSS" | "MYTHIC") => void;
  setDuelAiStyle: (value: "balanced" | "aggressive" | "combo" | "control") => void;
  setDuelAiAggression: (value: number) => void;
  setDraftSlotLevels: (value: Array<{ versionTier: number; level: number; xp: number }>) => void;
  setDraftFusionCardIds: (value: string[]) => void;
  setDraftRewardCardIds: (value: string[]) => void;
  setIsBaseDeckMode: (value: boolean) => void;
  setSelectedSlotIndex: (value: number | null) => void;
  setSelectedCollectionCardId: (value: string | null) => void;
  setFeedback: (value: string) => void;
}

/**
 * Carga snapshot remoto y sincroniza el editor sin perder consistencia entre deck, duelo y oponente.
 */
export async function executeAdminStoryDeckLoad(input: IExecuteAdminStoryDeckLoadInput): Promise<void> {
  const nextData = await fetchAdminStoryDeckData(input.input);
  input.setData(nextData);
  const nextSelectedOpponentId = input.input.opponentId ?? nextData.deck?.opponentId ?? nextData.opponents[0]?.opponentId ?? null;
  input.setSelectedOpponentId(nextSelectedOpponentId);
  const snapshot = buildStoryDeckLoadSnapshot(nextData, input.input.preferredDuelId ?? null);
  input.setDraftCardIds(snapshot.draftCardIds);
  input.setSelectedDuelId(snapshot.selectedDuelId);
  input.setSelectedDuelDifficulty(snapshot.selectedDuelDifficulty);
  input.setDuelAiStyle(snapshot.duelAiProfile.style);
  input.setDuelAiAggression(snapshot.duelAiProfile.aggression);
  input.setDraftSlotLevels(snapshot.draftSlotLevels);
  input.setDraftFusionCardIds(snapshot.draftFusionCardIds);
  input.setDraftRewardCardIds(snapshot.draftRewardCardIds);
  input.setIsBaseDeckMode(snapshot.isBaseDeckMode);
  input.setSelectedSlotIndex(0);
  input.setSelectedCollectionCardId(null);
  input.setFeedback("");
}
