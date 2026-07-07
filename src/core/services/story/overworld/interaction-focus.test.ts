// src/core/services/story/overworld/interaction-focus.test.ts - Verifica foco de interacción adyacente y por pisada.
import {
  IInteractableTarget,
  resolveFacingPosition,
  resolveFocusedInteractable,
  resolveSteppedInteractable,
} from "@/core/services/story/overworld/interaction-focus";
import { IOverworldProgressState } from "@/core/services/story/overworld/overworld-types";

function buildProgress(partial?: Partial<{ completed: string[] }>): IOverworldProgressState {
  return {
    visitedNodeIds: new Set<string>(),
    interactedNodeIds: new Set<string>(),
    completedNodeIds: new Set<string>(partial?.completed ?? []),
  };
}

const duel: IInteractableTarget = {
  id: "story-ch1-duel-1",
  tileX: 5,
  tileY: 3,
  trigger: "ADJACENT_ACTION",
  requiredNodeIds: [],
};
const gate: IInteractableTarget = {
  id: "gate-bridge",
  tileX: 4,
  tileY: 3,
  trigger: "ADJACENT_ACTION",
  requiredNodeIds: ["story-ch1-duel-1"],
};
const warp: IInteractableTarget = {
  id: "warp-act2",
  tileX: 8,
  tileY: 8,
  trigger: "STEP_ON",
  requiredNodeIds: [],
};

describe("resolveFacingPosition", () => {
  it("devuelve la celda de enfrente por dirección", () => {
    expect(resolveFacingPosition({ tileX: 5, tileY: 5 }, "UP")).toEqual({ tileX: 5, tileY: 4 });
    expect(resolveFacingPosition({ tileX: 5, tileY: 5 }, "RIGHT")).toEqual({ tileX: 6, tileY: 5 });
  });
});

describe("resolveFocusedInteractable", () => {
  const targets = [duel, gate, warp];

  it("enfoca el objeto adyacente hacia el que mira el jugador", () => {
    const focused = resolveFocusedInteractable({
      playerTile: { tileX: 4, tileY: 3 },
      facing: "RIGHT",
      targets,
      progress: buildProgress(),
    });
    expect(focused?.target.id).toBe("story-ch1-duel-1");
    expect(focused?.isBlocked).toBe(false);
  });

  it("no enfoca nada si no mira a un objeto", () => {
    const focused = resolveFocusedInteractable({
      playerTile: { tileX: 4, tileY: 3 },
      facing: "UP",
      targets,
      progress: buildProgress(),
    });
    expect(focused).toBeNull();
  });

  it("marca como bloqueado un objeto gateado sin requisitos cumplidos", () => {
    const focused = resolveFocusedInteractable({
      playerTile: { tileX: 3, tileY: 3 },
      facing: "RIGHT",
      targets,
      progress: buildProgress(),
    });
    expect(focused?.target.id).toBe("gate-bridge");
    expect(focused?.isBlocked).toBe(true);
    expect(focused?.missingRequirements).toEqual(["story-ch1-duel-1"]);
  });

  it("desbloquea el objeto gateado al cumplir el requisito", () => {
    const focused = resolveFocusedInteractable({
      playerTile: { tileX: 3, tileY: 3 },
      facing: "RIGHT",
      targets,
      progress: buildProgress({ completed: ["story-ch1-duel-1"] }),
    });
    expect(focused?.isBlocked).toBe(false);
    expect(focused?.missingRequirements).toEqual([]);
  });

  it("ignora objetos STEP_ON al enfocar por adyacencia", () => {
    const focused = resolveFocusedInteractable({
      playerTile: { tileX: 8, tileY: 7 },
      facing: "DOWN",
      targets,
      progress: buildProgress(),
    });
    expect(focused).toBeNull();
  });
});

describe("resolveSteppedInteractable", () => {
  it("detecta un objeto STEP_ON en la celda actual", () => {
    const stepped = resolveSteppedInteractable({
      playerTile: { tileX: 8, tileY: 8 },
      targets: [duel, warp],
      progress: buildProgress(),
    });
    expect(stepped?.target.id).toBe("warp-act2");
  });

  it("no dispara si la celda actual no tiene objeto STEP_ON", () => {
    const stepped = resolveSteppedInteractable({
      playerTile: { tileX: 5, tileY: 3 },
      targets: [duel, warp],
      progress: buildProgress(),
    });
    expect(stepped).toBeNull();
  });
});
