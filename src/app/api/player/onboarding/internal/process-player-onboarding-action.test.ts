// src/app/api/player/onboarding/internal/process-player-onboarding-action.test.ts - Verifica persistencia de acciones de onboarding en progreso de jugador.
import { describe, expect, it, vi } from "vitest";
import { processPlayerOnboardingAction } from "./process-player-onboarding-action";

describe("processPlayerOnboardingAction", () => {
  it("marca intro vista", async () => {
    const update = vi.fn().mockResolvedValue({ playerId: "p1" });
    await processPlayerOnboardingAction({
      playerId: "p1",
      action: "mark_intro_seen",
      progressRepository: {
        getByPlayerId: vi.fn(),
        create: vi.fn(),
        update,
      },
    });
    expect(update).toHaveBeenCalledWith({ playerId: "p1", hasSeenAcademyIntro: true });
  });

  it("marca intro vista y tutorial saltado", async () => {
    const update = vi.fn().mockResolvedValue({ playerId: "p1" });
    await processPlayerOnboardingAction({
      playerId: "p1",
      action: "skip_tutorial",
      progressRepository: {
        getByPlayerId: vi.fn(),
        create: vi.fn(),
        update,
      },
    });
    expect(update).toHaveBeenCalledWith({
      playerId: "p1",
      hasSeenAcademyIntro: true,
      hasSkippedTutorial: true,
    });
  });
});
