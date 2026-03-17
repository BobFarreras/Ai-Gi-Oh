// src/components/game/board/internal/tutorial/tutorial-step-state.test.ts - Verifica avance automático y manual de la secuencia tutorial.
import { describe, expect, it } from "vitest";
import { resolveTutorialGuideSteps } from "./tutorial-step-state";

const BASE_RUNTIME = {
  turn: 1,
  selectedCard: false,
  hasPlayedEntity: false,
  hasBattleResolved: false,
  hasPlayedExecution: false,
  hasFusionSummon: false,
  isGraveyardOpen: false,
  hasReviveInteraction: false,
  isCombatLogOpen: false,
  hasWinner: false,
};

describe("resolveTutorialGuideSteps", () => {
  it("requiere confirmación manual en regla de primer turno", () => {
    const steps = resolveTutorialGuideSteps(BASE_RUNTIME, new Set());
    expect(steps[0]?.isCompleted).toBe(false);
    const completed = resolveTutorialGuideSteps(BASE_RUNTIME, new Set(["first-turn-rule"]));
    expect(completed[0]?.isCompleted).toBe(true);
  });

  it("marca progreso automático por eventos de combate", () => {
    const steps = resolveTutorialGuideSteps(
      {
        ...BASE_RUNTIME,
        selectedCard: true,
        hasPlayedEntity: true,
        hasBattleResolved: true,
        hasPlayedExecution: true,
        hasFusionSummon: true,
        isCombatLogOpen: true,
      },
      new Set(["first-turn-rule", "graveyard-revive"]),
    );
    expect(steps.every((step) => step.id === "victory-condition" || step.isCompleted)).toBe(true);
  });
});
