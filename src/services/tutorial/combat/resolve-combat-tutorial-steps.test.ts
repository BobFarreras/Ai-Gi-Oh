// src/services/tutorial/combat/resolve-combat-tutorial-steps.test.ts - Valida estructura mínima del flujo guiado de combate.
import { describe, expect, it } from "vitest";
import { resolveCombatTutorialSteps } from "@/services/tutorial/combat/resolve-combat-tutorial-steps";

describe("resolveCombatTutorialSteps", () => {
  it("incluye pasos clave del combate con orden estable", () => {
    const steps = resolveCombatTutorialSteps();
    expect(steps[0]?.id).toBe("combat-ui-history");
    expect(steps.some((step) => step.id === "combat-ui-mute" && step.completionType === "USER_ACTION")).toBe(true);
    expect(steps.some((step) => step.targetId === "tutorial-board-phase-invoke-button")).toBe(true);
    expect(steps.some((step) => step.targetId === "tutorial-board-phase-battle-button")).toBe(true);
    expect(steps.some((step) => step.targetId === "tutorial-board-phase-pass-button")).toBe(true);
    expect(steps.some((step) => step.id === "combat-rules")).toBe(true);
    expect(steps.some((step) => step.id === "combat-draw-and-fusion")).toBe(true);
    expect(steps.at(-1)?.id).toBe("combat-defense-attack-example");
  });
});
