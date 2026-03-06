// src/components/game/board/hooks/internal/progression/build-projected-experience-summary.ts - Proyecta resultados de EXP por carta en cliente para feedback aunque falle la persistencia.
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { aggregateCardExperienceEvents, ICardExperienceEvent } from "@/core/services/progression/card-experience-rules";
import { clampCardTotalXp, resolveCardLevelFromTotalXp } from "@/core/services/progression/card-level-rules";
import { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";

function resolveCardRuntimeProgress(playerId: string, cardId: string, cards: Record<string, ICard>): IPlayerCardProgress {
  const card = cards[cardId];
  return {
    playerId,
    cardId,
    versionTier: card?.versionTier ?? 0,
    level: card?.level ?? 0,
    xp: card?.xp ?? 0,
    masteryPassiveSkillId: card?.masteryPassiveSkillId ?? null,
    updatedAtIso: new Date().toISOString(),
  };
}

export function buildProjectedExperienceSummary(
  playerId: string,
  cardLookup: Record<string, ICard>,
  events: ICardExperienceEvent[],
): IAppliedCardExperienceResult[] {
  const aggregatedEntries = aggregateCardExperienceEvents(events);
  return aggregatedEntries.map((entry) => {
    const current = resolveCardRuntimeProgress(playerId, entry.cardId, cardLookup);
    const nextXp = clampCardTotalXp(current.xp + entry.gainedXp);
    const nextLevel = resolveCardLevelFromTotalXp(nextXp);
    return {
      cardId: entry.cardId,
      gainedXp: entry.gainedXp,
      oldLevel: current.level,
      newLevel: nextLevel,
      progress: {
        ...current,
        level: nextLevel,
        xp: nextXp,
      },
    };
  });
}
