// src/components/admin/internal/admin-story-deck-save-flow.ts - Orquesta guardado del draft Story y refresco manteniendo foco de oponente/duelo.
import { saveAdminStoryDeck } from "@/components/admin/admin-story-deck-api";
import { EMPTY_SLOT_LEVEL_DRAFT, IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
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
  // Las cartas se guardan COMPACTADAS (sin los huecos que haya dejado el editor), así que sus overrides tienen
  // que numerarse con esa misma posición compactada. Guardarlos con el índice original del hueco descoloca los
  // atributos en la siguiente carga: las cartas se corren y el nivel/ATK/DEF acaba en otra carta o se pierde.
  const filledSlots = input.draftCardIds.flatMap((cardId, draftIndex) =>
    typeof cardId === "string" && cardId.trim().length > 0 ? [{ cardId, draftIndex }] : [],
  );
  const compactCardIds = filledSlots.map((slot) => slot.cardId);
  await saveAdminStoryDeck({
    deckListId: input.deckListId,
    cardIds: compactCardIds,
    duelConfig: !input.isBaseDeckMode && input.selectedDuelId ? {
      duelId: input.selectedDuelId,
      difficulty: input.selectedDuelDifficulty,
      aiProfile: { style: input.duelAiStyle, aggression: input.duelAiAggression },
      fusionCardIds: input.draftFusionCardIds.filter((cardId) => cardId.trim().length > 0),
      rewardCardIds: input.draftRewardCardIds.filter((cardId) => cardId.trim().length > 0),
      slotOverrides: filledSlots.map(({ cardId, draftIndex }, slotIndex) => {
        const levels = input.draftSlotLevels[draftIndex] ?? EMPTY_SLOT_LEVEL_DRAFT;
        return { slotIndex, cardId, versionTier: levels.versionTier, level: levels.level, xp: levels.xp, attackOverride: levels.attackOverride, defenseOverride: levels.defenseOverride };
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
