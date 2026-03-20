// src/services/tutorial/arsenal/resolve-arsenal-tutorial-steps.test.ts - Verifica el contrato estable del flujo guiado de Arsenal.
import { describe, expect, it } from "vitest";
import { resolveArsenalTutorialSteps } from "@/services/tutorial/arsenal/resolve-arsenal-tutorial-steps";

describe("resolveArsenalTutorialSteps", () => {
  it("mantiene orden base y pasos críticos del tutorial", () => {
    const steps = resolveArsenalTutorialSteps();
    expect(steps[0]?.id).toBe("arsenal-select-collection-card");
    expect(steps.some((step) => step.id === "arsenal-remove-deck" && step.expectedActionId === "REMOVE_CARD_FROM_DECK")).toBe(true);
    expect(steps.some((step) => step.id === "arsenal-add-deck" && step.expectedActionId === "ADD_CARD_TO_DECK")).toBe(true);
    expect(steps.some((step) => step.id === "arsenal-max-copies-rule" && step.completionType === "MANUAL_NEXT")).toBe(true);
    expect(steps.some((step) => step.id === "arsenal-fusion-recipe-cards" && step.targetId === "tutorial-home-fusion-recipe-cards")).toBe(true);
    expect(steps.some((step) => step.id === "arsenal-open-evolve" && step.expectedActionId === "OPEN_EVOLVE_PANEL")).toBe(true);
    expect(steps.at(-1)?.id).toBe("arsenal-open-evolve");
  });
});
