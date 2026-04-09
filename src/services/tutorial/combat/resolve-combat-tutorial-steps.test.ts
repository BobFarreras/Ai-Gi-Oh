// src/services/tutorial/combat/resolve-combat-tutorial-steps.test.ts - Valida estructura mínima del flujo guiado de combate.
import { describe, expect, it } from "vitest";
import { resolveCombatTutorialSteps } from "@/services/tutorial/combat/resolve-combat-tutorial-steps";

describe("resolveCombatTutorialSteps", () => {
  it("incluye pasos clave del combate con orden estable", () => {
    const steps = resolveCombatTutorialSteps();
    expect(steps[0]?.id).toBe("combat-ui-history");
    expect(steps.some((step) => step.id === "combat-ui-mute" && step.completionType === "MANUAL_NEXT")).toBe(true);
    expect(steps.some((step) => step.id === "combat-subturns-battle" && step.targetId === "tutorial-board-phase-battle-button")).toBe(true);
    expect(steps.some((step) => step.id === "combat-subturns-pass" && step.targetId === "tutorial-board-phase-pass-button")).toBe(true);
    expect(steps.some((step) => step.id === "combat-opponent-trap-prompt" && step.targetId === "tutorial-board-action-activate-trap-prompt")).toBe(true);
    expect(steps.some((step) => step.id === "combat-rules-timer" && step.targetId === "tutorial-board-turn-timer-panel")).toBe(true);
    expect(steps.some((step) => step.id === "combat-direct-attack-enter-battle" && step.targetId === "tutorial-board-phase-battle-button")).toBe(true);
    expect(steps.some((step) => step.id === "combat-direct-attack-chatgpt" && step.targetId === "tutorial-board-opponent-zone-1")).toBe(true);
    expect(steps.some((step) => step.id === "combat-fusion-select-card" && step.targetId === "tutorial-board-player-entity-card-fusion-gemgpt")).toBe(true);
    expect(steps.some((step) => step.id === "combat-fusion-direct-attack" && step.targetId === "tutorial-board-opponent-zone-1")).toBe(true);
    expect(steps.some((step) => step.id === "combat-rules")).toBe(true);
    expect(steps.some((step) => step.id === "combat-activate-fusion-magic")).toBe(true);
    expect(steps.some((step) => step.id === "combat-result-overview" && step.targetId === "tutorial-board-duel-result-overlay")).toBe(true);
    expect(steps.some((step) => step.id === "combat-result-experience" && step.targetId === "tutorial-board-duel-result-experience")).toBe(true);
    expect(steps.at(-1)?.id).toBe("combat-result-next-steps");
  });
});
