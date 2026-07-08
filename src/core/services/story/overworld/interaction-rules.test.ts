// src/core/services/story/overworld/interaction-rules.test.ts - Verifica resolución de requisitos y puertas del overworld.
import {
  isGateOpen,
  isRequirementSatisfied,
  listGateMissingRequirements,
} from "@/core/services/story/overworld/interaction-rules";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";

function buildProgress(partial?: Partial<{
  visited: string[];
  interacted: string[];
  completed: string[];
}>): IOverworldProgressState {
  return {
    visitedNodeIds: new Set(partial?.visited ?? []),
    interactedNodeIds: new Set(partial?.interacted ?? []),
    completedNodeIds: new Set(partial?.completed ?? []),
  };
}

describe("isRequirementSatisfied", () => {
  it("acepta requisitos resueltos en cualquiera de los tres ejes", () => {
    expect(isRequirementSatisfied("nodo-move", buildProgress({ visited: ["nodo-move"] }))).toBe(true);
    expect(isRequirementSatisfied("nodo-event", buildProgress({ interacted: ["nodo-event"] }))).toBe(true);
    expect(isRequirementSatisfied("nodo-duel", buildProgress({ completed: ["nodo-duel"] }))).toBe(true);
  });

  it("rechaza requisitos sin progreso en ningún eje", () => {
    expect(isRequirementSatisfied("nodo-x", buildProgress())).toBe(false);
  });
});

describe("isGateOpen", () => {
  const gate = {
    id: "gate-boss-bridge",
    tileX: 5,
    tileY: 3,
    requiredNodeIds: ["story-ch2-bridge-submission"],
  };

  it("mantiene la puerta cerrada si falta algún requisito", () => {
    expect(isGateOpen(gate, buildProgress())).toBe(false);
  });

  it("abre la puerta al cumplir todos los requisitos", () => {
    expect(isGateOpen(gate, buildProgress({ interacted: ["story-ch2-bridge-submission"] }))).toBe(true);
  });

  it("considera abierta una puerta sin requisitos", () => {
    expect(isGateOpen({ ...gate, requiredNodeIds: [] }, buildProgress())).toBe(true);
  });

  it("exige múltiples llaves de ramas distintas (patrón del Acto 2)", () => {
    const multiKeyGate = {
      ...gate,
      requiredNodeIds: ["story-ch2-branch-lower-up-event", "story-ch2-link-recovered-event"],
    };
    const oneKeyProgress = buildProgress({ interacted: ["story-ch2-branch-lower-up-event"] });
    expect(isGateOpen(multiKeyGate, oneKeyProgress)).toBe(false);
    const bothKeysProgress = buildProgress({
      interacted: ["story-ch2-branch-lower-up-event", "story-ch2-link-recovered-event"],
    });
    expect(isGateOpen(multiKeyGate, bothKeysProgress)).toBe(true);
  });
});

describe("listGateMissingRequirements", () => {
  it("devuelve solo los requisitos pendientes en orden estable", () => {
    const gate = {
      id: "gate-x",
      tileX: 0,
      tileY: 0,
      requiredNodeIds: ["req-a", "req-b", "req-c"],
    };
    const progress = buildProgress({ completed: ["req-b"] });
    expect(listGateMissingRequirements(gate, progress)).toEqual(["req-a", "req-c"]);
  });
});
