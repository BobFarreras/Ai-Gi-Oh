// src/core/use-cases/progression/ApplyBattleCardExperienceUseCase.ts - Aplica en batch la EXP de cartas acumulada al finalizar un combate.
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerCardProgressRepository } from "@/core/repositories/IPlayerCardProgressRepository";
import { aggregateCardExperienceEvents, ICardExperienceEvent } from "@/core/services/progression/card-experience-rules";
import { clampCardTotalXp, resolveCardLevelFromTotalXp } from "@/core/services/progression/card-level-rules";

interface IApplyBattleCardExperienceInput {
  playerId: string;
  events: ICardExperienceEvent[];
}

export interface IAppliedCardExperienceResult {
  cardId: string;
  gainedXp: number;
  oldLevel: number;
  newLevel: number;
  progress: IPlayerCardProgress;
}

export class ApplyBattleCardExperienceUseCase {
  constructor(private readonly playerCardProgressRepository: IPlayerCardProgressRepository) {}

  async execute(input: IApplyBattleCardExperienceInput): Promise<IAppliedCardExperienceResult[]> {
    if (!input.playerId.trim()) throw new ValidationError("El playerId es obligatorio para aplicar experiencia.");
    if (input.events.length === 0) return [];
    const aggregatedEntries = aggregateCardExperienceEvents(input.events);
    const updatedEntries: IAppliedCardExperienceResult[] = [];

    for (const entry of aggregatedEntries) {
      const currentProgress = await this.playerCardProgressRepository.getByPlayerAndCard(input.playerId, entry.cardId);
      const currentLevel = currentProgress?.level ?? 0;
      const currentVersionTier = currentProgress?.versionTier ?? 0;
      const currentXp = currentProgress?.xp ?? 0;
      const nextTotalXp = clampCardTotalXp(currentXp + entry.gainedXp);
      const nextLevel = resolveCardLevelFromTotalXp(nextTotalXp);
      const updatedProgress = await this.playerCardProgressRepository.upsert({
        playerId: input.playerId,
        cardId: entry.cardId,
        versionTier: currentVersionTier,
        level: nextLevel,
        xp: nextTotalXp,
        masteryPassiveSkillId: currentProgress?.masteryPassiveSkillId ?? null,
      });
      updatedEntries.push({
        cardId: entry.cardId,
        gainedXp: entry.gainedXp,
        oldLevel: currentLevel,
        newLevel: updatedProgress.level,
        progress: updatedProgress,
      });
    }

    return updatedEntries;
  }
}

