// src/app/api/training/tutorial/complete/internal/process-training-tutorial-completion.test.ts - Verifica marcado de tutorial completado para jugador autenticado.
import { describe, expect, it, vi } from "vitest";
import { processTrainingTutorialCompletion } from "./process-training-tutorial-completion";

describe("processTrainingTutorialCompletion", () => {
  it("marca hasCompletedTutorial en true", async () => {
    const repository = {
      getByPlayerId: vi.fn().mockResolvedValue({
        playerId: "p1",
        hasCompletedTutorial: false,
        medals: 0,
        storyChapter: 1,
        playerExperience: 0,
        updatedAtIso: "2026-03-17T10:00:00.000Z",
      }),
      create: vi.fn(),
      update: vi.fn().mockResolvedValue({
        playerId: "p1",
        hasCompletedTutorial: true,
        medals: 0,
        storyChapter: 1,
        playerExperience: 0,
        updatedAtIso: "2026-03-17T11:00:00.000Z",
      }),
    };

    const result = await processTrainingTutorialCompletion({
      playerId: "p1",
      playerProgressRepository: repository,
    });

    expect(result).toEqual({ hasCompletedTutorial: true });
    expect(repository.update).toHaveBeenCalledWith({ playerId: "p1", hasCompletedTutorial: true });
  });
});
