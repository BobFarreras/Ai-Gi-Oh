// src/infrastructure/repositories/InMemoryHubRepository.ts - Repositorio temporal en memoria para poblar el dashboard central.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { IHubRepository } from "@/core/repositories/IHubRepository";
import { HUB_MAP_NODES, HUB_SECTIONS } from "@/infrastructure/repositories/internal/hub-static-data";

const DEFAULT_PROGRESS: IPlayerHubProgress = {
  playerId: "local-player",
  medals: 0,
  storyChapter: 1,
  hasCompletedTutorial: false,
  hasSeenAcademyIntro: false,
  hasSkippedTutorial: false,
};

export class InMemoryHubRepository implements IHubRepository {
  constructor(private readonly progress: IPlayerHubProgress = DEFAULT_PROGRESS) {}

  async getPlayerProgress(playerId: string): Promise<IPlayerHubProgress> {
    return {
      ...this.progress,
      playerId,
    };
  }

  async getSections(playerId: string): Promise<IHubSection[]> {
    void playerId;
    return HUB_SECTIONS.map((section) => ({
      ...section,
      isLocked: false,
      lockReason: null,
    }));
  }

  async getMapNodes(playerId: string): Promise<IHubMapNode[]> {
    void playerId;
    return HUB_MAP_NODES.map((node) => ({ ...node }));
  }
}
