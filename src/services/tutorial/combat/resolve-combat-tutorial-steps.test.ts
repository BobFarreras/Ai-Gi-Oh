// src/services/tutorial/combat/resolve-combat-tutorial-steps.test.ts - Valida estructura mínima del flujo guiado de combate.
import { describe, expect, it } from "vitest";
import { resolveCombatTutorialSteps } from "@/services/tutorial/combat/resolve-combat-tutorial-steps";

describe("resolveCombatTutorialSteps", () => {
  it("incluye pasos clave del combate con orden estable", () => {
    const steps = resolveCombatTutorialSteps();
    expect(steps[0]?.id).toBe("combat-first-turn-rule");
    expect(steps.some((step) => step.id === "combat-log")).toBe(true);
    expect(steps.at(-1)?.id).toBe("combat-win-condition");
  });
});
