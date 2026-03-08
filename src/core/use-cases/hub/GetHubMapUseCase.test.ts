// src/core/use-cases/hub/GetHubMapUseCase.test.ts - Valida estructura de mapa y bloqueos del mundo central.
import { describe, expect, it } from "vitest";
import { HubService } from "@/core/services/hub/HubService";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { GetHubMapUseCase } from "./GetHubMapUseCase";

describe("GetHubMapUseCase", () => {
  it("devuelve nodos del mapa y secciones del hub", async () => {
    const repository = new InMemoryHubRepository();
    const useCase = new GetHubMapUseCase(new HubService(repository));

    const map = await useCase.execute("player-a");

    expect(map.nodes.length).toBe(5);
    expect(map.sections.length).toBe(5);
  });

  it("mantiene historia disponible aunque no se completó el tutorial", async () => {
    const repository = new InMemoryHubRepository({
      playerId: "player-a",
      medals: 0,
      storyChapter: 1,
      hasCompletedTutorial: false,
    });
    const useCase = new GetHubMapUseCase(new HubService(repository));

    const map = await useCase.execute("player-a");
    const storySection = map.sections.find((section) => section.type === "STORY");

    expect(storySection?.isLocked).toBe(false);
  });
});
