// src/components/admin/internal/admin-story-duel-draft.ts - Utilidades puras para resolver estado draft de duelo Story en el editor admin.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { IStoryAiProfile, normalizeStoryAiProfile, resolveDefaultStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStorySlotLevelDraft {
  versionTier: number;
  level: number;
  xp: number;
  /** Stats absolutas del rival por objetos equipados; null = usa el ATK/DEF base de la carta. */
  attackOverride: number | null;
  defenseOverride: number | null;
}

const STORY_DUEL_FUSION_SLOTS = 2;

export function resolveDraft(data: IAdminStoryDeckApiResponse): Array<string | null> {
  return data.deck?.slots.map((slot) => slot.cardId) ?? [];
}

/**
 * Overrides del duelo ORDENADOS por slot y expandidos por copias. Es la fuente única de la que salen tanto las
 * cartas de la parrilla como sus atributos: si cada uno se leyera a su manera (una empaquetando por orden y el
 * otro buscando por `slotIndex`), un hueco en el mazo los desincroniza y las cartas posteriores al hueco pierden
 * su nivel/ATK/DEF al recargar. Los datos antiguos con huecos se recolocan solos al leerse así.
 */
function resolveOrderedDuelOverrides(
  data: IAdminStoryDeckApiResponse,
  duelId: string,
): Array<{ cardId: string; levels: IStorySlotLevelDraft }> {
  return data.duelDeckOverrides
    .filter((row) => row.duelId === duelId)
    .sort((left, right) => left.slotIndex - right.slotIndex)
    .flatMap((row) =>
      Array.from({ length: row.copies }, () => ({
        cardId: row.cardId,
        levels: {
          versionTier: row.versionTier,
          level: row.level,
          xp: row.xp,
          attackOverride: row.attackOverride,
          defenseOverride: row.defenseOverride,
        },
      })),
    );
}

export function resolveDraftByDuel(data: IAdminStoryDeckApiResponse, duelId: string | null): Array<string | null> {
  const base = resolveDraft(data);
  if (!duelId) return base;
  const overrides = resolveOrderedDuelOverrides(data, duelId);
  if (overrides.length === 0) return base;
  return overrides.map((entry) => entry.cardId);
}

export function resolveSelectedDuelId(data: IAdminStoryDeckApiResponse): string | null {
  const deckListId = data.deck?.deckListId;
  if (!deckListId) return null;
  return data.duels.find((duel) => duel.deckListId === deckListId)?.duelId ?? null;
}

export function resolveDuelDifficulty(data: IAdminStoryDeckApiResponse, duelId: string | null): StoryOpponentDifficulty {
  if (!duelId) return "ROOKIE";
  return data.duelAiProfiles.find((profile) => profile.duelId === duelId)?.difficulty ?? "ROOKIE";
}

export function resolveDuelAiProfile(data: IAdminStoryDeckApiResponse, duelId: string | null, difficulty: StoryOpponentDifficulty): IStoryAiProfile {
  if (!duelId) return resolveDefaultStoryAiProfile(difficulty);
  const aiProfile = data.duelAiProfiles.find((profile) => profile.duelId === duelId)?.aiProfile;
  return normalizeStoryAiProfile(aiProfile, difficulty);
}

export const EMPTY_SLOT_LEVEL_DRAFT: IStorySlotLevelDraft = {
  versionTier: 0,
  level: 0,
  xp: 0,
  attackOverride: null,
  defenseOverride: null,
};

/**
 * Atributos por posición de la parrilla. Se recorren los MISMOS overrides ordenados que construyen las cartas
 * (no se busca por `slotIndex`), así la carta de la posición N y sus atributos son siempre la misma fila.
 */
export function resolveDraftSlotLevels(data: IAdminStoryDeckApiResponse, duelId: string | null): IStorySlotLevelDraft[] {
  const draftCardIds = resolveDraftByDuel(data, duelId);
  const overrides = duelId ? resolveOrderedDuelOverrides(data, duelId) : [];
  const size = Math.max(draftCardIds.length, overrides.length);
  return Array.from({ length: size }, (_, index) => overrides[index]?.levels ?? { ...EMPTY_SLOT_LEVEL_DRAFT });
}

export function resolveDraftFusionCardIds(data: IAdminStoryDeckApiResponse, duelId: string | null): string[] {
  if (!duelId) return [];
  const rows = data.duelFusionCards
    .filter((row) => row.duelId === duelId && row.isActive)
    .sort((left, right) => left.slotIndex - right.slotIndex);
  return Array.from({ length: STORY_DUEL_FUSION_SLOTS }, (_, index) => rows[index]?.cardId ?? "");
}

export function resolveDraftRewardCardIds(data: IAdminStoryDeckApiResponse, duelId: string | null): string[] {
  if (!duelId) return [];
  return data.duelRewardCards.filter((row) => row.duelId === duelId).map((row) => row.cardId);
}
