// src/core/use-cases/hub/GetAvailableSectionsUseCase.test.ts - Verifica el filtrado de secciones desbloqueadas del hub.
import { describe, expect, it } from "vitest";
import { HubService } from "@/core/services/hub/HubService";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { GetAvailableSectionsUseCase } from "./GetAvailableSectionsUseCase";

describe("GetAvailableSectionsUseCase", () => {
  it("incluye multijugador cuando el tutorial está completado", async () => {
    const repository = new InMemoryHubRepository({
      playerId: "player-a",
      medals: 0,
      storyChapter: 2,
      hasCompletedTutorial: true,
    });
    const useCase = new GetAvailableSectionsUseCase(new HubService(repository));

    const sections = await useCase.execute("player-a");
    const hasMultiplayer = sections.some((section) => section.type === "MULTIPLAYER");

    expect(hasMultiplayer).toBe(true);
  });

  it("incluye multijugador independientemente de las medallas del jugador", async () => {
    const repository = new InMemoryHubRepository({
      playerId: "player-a",
      medals: 2,
      storyChapter: 3,
      hasCompletedTutorial: true,
    });
    const useCase = new GetAvailableSectionsUseCase(new HubService(repository));

    const sections = await useCase.execute("player-a");
    const hasMultiplayer = sections.some((section) => section.type === "MULTIPLAYER");

    expect(hasMultiplayer).toBe(true);
  });
});
