// src/components/hub/onboarding/internal/resolve-onboarding-visibility.test.ts - Cubre reglas de visibilidad del onboarding de Academy.
import { describe, expect, it } from "vitest";
import { resolveOnboardingVisibility } from "./resolve-onboarding-visibility";

describe("resolveOnboardingVisibility", () => {
  it("muestra onboarding cuando todavía no ha visto la intro", () => {
    expect(
      resolveOnboardingVisibility({
        playerId: "p1",
        medals: 0,
        storyChapter: 1,
        hasCompletedTutorial: false,
        hasSeenAcademyIntro: false,
        hasSkippedTutorial: false,
      }),
    ).toBe(true);
  });

  it("oculta onboarding cuando la intro ya fue vista", () => {
    expect(
      resolveOnboardingVisibility({
        playerId: "p1",
        medals: 0,
        storyChapter: 1,
        hasCompletedTutorial: true,
        hasSeenAcademyIntro: true,
        hasSkippedTutorial: false,
      }),
    ).toBe(false);
  });
});
