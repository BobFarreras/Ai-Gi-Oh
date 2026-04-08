// src/components/admin/internal/admin-story-deck-save-flow.ts - Orquesta guardado del draft Story y refresco manteniendo foco de oponente/duelo.
import { saveAdminStoryDeck } from "@/components/admin/admin-story-deck-api";
import { IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
import { StoryAiStyle } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

interface IExecuteAdminStoryDeckSaveInput {
  deckListId: string;
  deckOpponentId: string;
  selectedOpponentId: string | null;
  selectedDuelId: string | null;
  selectedDuelDifficulty: StoryOpponentDifficulty;
  duelAiStyle: StoryAiStyle;
  duelAiAggression: number;
  draftCardIds: Array<string | null>;
  draftSlotLevels: IStorySlotLevelDraft[];
  draftFusionCardIds: string[];
  draftRewardCardIds: string[];
  isBaseDeckMode: boolean;
  load: (input: { opponentId?: string; deckListId?: string; preferredDuelId?: string | null }) => Promise<void>;
}

/**
 * Ejecuta persistencia de deck/config por duelo y recarga el editor sin perder contexto.
 */
export async function executeAdminStoryDeckSave(input: IExecuteAdminStoryDeckSaveInput): Promise<void> {
  const compactCardIds = input.draftCardIds.filter((cardId): cardId is string => typeof cardId === "string" && cardId.trim().length > 0);
  await saveAdminStoryDeck({
    deckListId: input.deckListId,
    cardIds: compactCardIds,
    duelConfig: !input.isBaseDeckMode && input.selectedDuelId ? {
      duelId: input.selectedDuelId,
      difficulty: input.selectedDuelDifficulty,
      aiProfile: { style: input.duelAiStyle, aggression: input.duelAiAggression },
      fusionCardIds: input.draftFusionCardIds.filter((cardId) => cardId.trim().length > 0),
      rewardCardIds: input.draftRewardCardIds.filter((cardId) => cardId.trim().length > 0),
      slotOverrides: input.draftCardIds.flatMap((cardId, slotIndex) => {
        if (!cardId) return [];
        const levels = input.draftSlotLevels[slotIndex] ?? { versionTier: 0, level: 0, xp: 0 };
        return [{ slotIndex, cardId, versionTier: levels.versionTier, level: levels.level, xp: levels.xp }];
      }),
    } : null,
    updateBaseDeck: input.isBaseDeckMode,
  });
  await input.load({
    opponentId: input.selectedOpponentId ?? input.deckOpponentId,
    deckListId: input.deckListId,
    preferredDuelId: input.selectedDuelId,
  });
}
