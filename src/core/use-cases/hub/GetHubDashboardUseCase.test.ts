// src/core/use-cases/hub/GetHubDashboardUseCase.test.ts - Verifica validaciones y desbloqueos del dashboard central.
import { describe, expect, it } from "vitest";
import { HubService } from "@/core/services/hub/HubService";
import { InMemoryHubRepository } from "@/infrastructure/repositories/InMemoryHubRepository";
import { GetHubDashboardUseCase } from "./GetHubDashboardUseCase";

describe("GetHubDashboardUseCase", () => {
  it("bloquea multijugador si el jugador no tiene medallas", async () => {
    const repository = new InMemoryHubRepository({
      playerId: "player-a",
      medals: 0,
      storyChapter: 1,
      hasCompletedTutorial: false,
    });
    const service = new HubService(repository);
    const useCase = new GetHubDashboardUseCase(service);

    const dashboard = await useCase.execute("player-a");
    const multiplayer = dashboard.sections.find((section) => section.type === "MULTIPLAYER");

    expect(multiplayer).toBeDefined();
    expect(multiplayer?.isLocked).toBe(true);
  });

  it("lanza error si playerId está vacío", async () => {
    const repository = new InMemoryHubRepository();
    const service = new HubService(repository);
    const useCase = new GetHubDashboardUseCase(service);

    await expect(useCase.execute("")).rejects.toThrowError("El identificador de jugador es obligatorio.");
  });
});
