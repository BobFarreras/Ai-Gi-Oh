// src/core/services/tutorial/advance-tutorial-flow.test.ts - Verifica avance del motor tutorial por pasos y eventos.
import { describe, expect, it } from "vitest";
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";
import { advanceTutorialFlow, createInitialTutorialFlowState } from "@/core/services/tutorial/advance-tutorial-flow";

const STEPS: ITutorialFlowStep[] = [
  { id: "s1", title: "Paso 1", description: "", targetId: "a", allowedTargetIds: ["a"], completionType: "MANUAL_NEXT" },
  { id: "s2", title: "Paso 2", description: "", targetId: "b", allowedTargetIds: ["b"], completionType: "USER_ACTION", expectedActionId: "CLICK_B" },
  { id: "s3", title: "Paso 3", description: "", targetId: "c", allowedTargetIds: ["c"], completionType: "BOTH", expectedActionId: "CLICK_C" },
];

describe("advanceTutorialFlow", () => {
  it("avanza paso manual con NEXT", () => {
    const state = advanceTutorialFlow(STEPS, createInitialTutorialFlowState(), { type: "NEXT" });
    expect(state.currentStepIndex).toBe(1);
    expect(state.completedStepIds).toEqual(["s1"]);
  });

  it("ignora acción incorrecta en paso USER_ACTION", () => {
    const afterFirst = advanceTutorialFlow(STEPS, createInitialTutorialFlowState(), { type: "NEXT" });
    const blocked = advanceTutorialFlow(STEPS, afterFirst, { type: "ACTION", actionId: "OTHER" });
    expect(blocked.currentStepIndex).toBe(1);
  });

  it("completa tutorial en paso BOTH", () => {
    const afterFirst = advanceTutorialFlow(STEPS, createInitialTutorialFlowState(), { type: "NEXT" });
    const afterSecond = advanceTutorialFlow(STEPS, afterFirst, { type: "ACTION", actionId: "CLICK_B" });
    const done = advanceTutorialFlow(STEPS, afterSecond, { type: "NEXT" });
    expect(done.isFinished).toBe(true);
    expect(done.completedStepIds).toEqual(["s1", "s2", "s3"]);
  });
});
