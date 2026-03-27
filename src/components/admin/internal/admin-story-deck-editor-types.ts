// src/components/admin/internal/admin-story-deck-editor-types.ts - Tipos públicos del hook de edición Story Deck en panel admin.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
import { StoryAiStyle } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IUseAdminStoryDeckEditorResult {
  data: IAdminStoryDeckApiResponse;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  selectedCollectionCardId: string | null;
  setSelectedCollectionCardId: (cardId: string | null) => void;
  draftCardIds: Array<string | null>;
  selectedDuelId: string | null;
  setSelectedDuelId: (duelId: string | null) => void;
  selectedDuelDifficulty: StoryOpponentDifficulty;
  setSelectedDuelDifficulty: (difficulty: StoryOpponentDifficulty) => void;
  duelAiStyle: StoryAiStyle;
  setDuelAiStyle: (value: StoryAiStyle) => void;
  duelAiAggression: number;
  setDuelAiAggression: (value: number) => void;
  draftSlotLevels: IStorySlotLevelDraft[];
  setDraftSlotLevelByIndex: (slotIndex: number, key: "versionTier" | "level" | "xp", value: number) => void;
  applyMassSlotLevels: (input: { versionTier: number; level: number; xp: number }) => void;
  setDraftCardIdBySlot: (slotIndex: number, cardId: string) => void;
  clearSlotCardByIndex: (slotIndex: number) => void;
  swapSlots: (fromSlotIndex: number, toSlotIndex: number) => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  isBaseDeckMode: boolean;
  setIsBaseDeckMode: (value: boolean) => void;
  isBusy: boolean;
  feedback: string;
  canSave: boolean;
  onSelectOpponent: (opponentId: string) => Promise<void>;
  onSelectDeck: (deckListId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSave: () => Promise<void>;
}
