// src/infrastructure/repositories/SupabaseHubRepository.ts - Adaptador de hub que combina catálogo estático con progreso persistido en Supabase.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { IHubRepository } from "@/core/repositories/IHubRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { HUB_MAP_NODES, HUB_SECTIONS } from "@/infrastructure/repositories/internal/hub-static-data";

export class SupabaseHubRepository implements IHubRepository {
  constructor(private readonly progressRepository: IPlayerProgressRepository) {}

  async getPlayerProgress(playerId: string): Promise<IPlayerHubProgress> {
    const progress = await this.progressRepository.getByPlayerId(playerId);
    return {
      playerId,
      hasCompletedTutorial: progress?.hasCompletedTutorial ?? false,
      hasSeenAcademyIntro: progress?.hasSeenAcademyIntro ?? false,
      hasSkippedTutorial: progress?.hasSkippedTutorial ?? false,
      medals: progress?.medals ?? 0,
      storyChapter: progress?.storyChapter ?? 1,
    };
  }

  async getSections(playerId: string): Promise<IHubSection[]> {
    void playerId;
    return HUB_SECTIONS.map((section) => ({ ...section, isLocked: false, lockReason: null }));
  }

  async getMapNodes(playerId: string): Promise<IHubMapNode[]> {
    void playerId;
    return HUB_MAP_NODES.map((node) => ({ ...node }));
  }
}
