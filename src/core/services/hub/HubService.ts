// src/core/services/hub/HubService.ts - Orquesta datos del dashboard central y aplica normalización de desbloqueos.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { IHubRepository } from "@/core/repositories/IHubRepository";
import { resolveHubSectionLock } from "@/core/services/hub/HubAccessPolicy";

export interface IHubDashboard {
  progress: IPlayerHubProgress;
  sections: IHubSection[];
}

export interface IHubMap {
  progress: IPlayerHubProgress;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export class HubService {
  constructor(private readonly hubRepository: IHubRepository) {}

  async getDashboard(playerId: string): Promise<IHubDashboard> {
    const sections = await this.getResolvedSections(playerId);
    const progress = await this.hubRepository.getPlayerProgress(playerId);

    return { progress, sections };
  }

  async getMap(playerId: string): Promise<IHubMap> {
    const [progress, sections, nodes] = await Promise.all([
      this.hubRepository.getPlayerProgress(playerId),
      this.getResolvedSections(playerId),
      this.hubRepository.getMapNodes(playerId),
    ]);

    return { progress, sections, nodes };
  }

  async getAvailableSections(playerId: string): Promise<IHubSection[]> {
    const sections = await this.getResolvedSections(playerId);
    return sections.filter((section) => !section.isLocked);
  }

  private async getResolvedSections(playerId: string): Promise<IHubSection[]> {
    const [progress, sections] = await Promise.all([
      this.hubRepository.getPlayerProgress(playerId),
      this.hubRepository.getSections(playerId),
    ]);
    return sections.map((section) => resolveHubSectionLock(section, progress));
  }
}
