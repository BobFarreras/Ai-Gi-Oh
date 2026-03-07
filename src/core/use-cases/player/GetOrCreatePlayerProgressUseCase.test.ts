// src/core/use-cases/player/GetOrCreatePlayerProgressUseCase.test.ts - Verifica provisión inicial de progreso de jugador para hub/campaña.
import { describe, expect, it, vi } from "vitest";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";

describe("GetOrCreatePlayerProgressUseCase", () => {
  it("crea progreso cuando no existe", async () => {
    const repository: IPlayerProgressRepository = {
      getByPlayerId: vi.fn(async () => null),
      create: vi.fn(async (progress) => progress),
      update: vi.fn(),
    };
    const useCase = new GetOrCreatePlayerProgressUseCase(repository);
    const progress = await useCase.execute({ playerId: "user-1" });
    expect(progress.storyChapter).toBe(1);
    expect(progress.medals).toBe(0);
    expect(progress.playerExperience).toBe(0);
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("retorna progreso existente", async () => {
    const existing = {
      playerId: "user-1",
      hasCompletedTutorial: true,
      medals: 3,
      storyChapter: 2,
      playerExperience: 150,
      updatedAtIso: "2026-01-01T00:00:00.000Z",
    };
    const repository: IPlayerProgressRepository = {
      getByPlayerId: vi.fn(async () => existing),
      create: vi.fn(),
      update: vi.fn(),
    };
    const useCase = new GetOrCreatePlayerProgressUseCase(repository);
    const progress = await useCase.execute({ playerId: "user-1" });
    expect(progress.medals).toBe(3);
    expect(progress.playerExperience).toBe(150);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
