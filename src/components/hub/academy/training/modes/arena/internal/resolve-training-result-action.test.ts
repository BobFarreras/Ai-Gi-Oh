// src/components/hub/academy/training/modes/arena/internal/resolve-training-result-action.test.ts - Valida la CTA post-combate del modo training.
import { describe, expect, it } from "vitest";
import { resolveTrainingResultAction } from "./resolve-training-result-action";

describe("resolveTrainingResultAction", () => {
  it("sugiere jugar el siguiente tier cuando acaba de desbloquearse", () => {
    const result = resolveTrainingResultAction({ selectedTier: 2, newlyUnlockedTiers: [3] });
    expect(result.label).toBe("Jugar Nivel 3");
    expect(result.href).toBe("/hub/academy/training/arena?tier=3");
  });

  it("elige el menor tier superior cuando llegan varios desbloqueos", () => {
    const result = resolveTrainingResultAction({ selectedTier: 2, newlyUnlockedTiers: [5, 4, 3] });
    expect(result.label).toBe("Jugar Nivel 3");
    expect(result.href).toBe("/hub/academy/training/arena?tier=3");
  });

  it("vuelve a selección cuando no hay tier nuevo", () => {
    const result = resolveTrainingResultAction({ selectedTier: 4, newlyUnlockedTiers: [] });
    expect(result.label).toBe("Volver a selección");
    expect(result.href).toBe("/hub/academy/training/arena?tier=4");
  });
});
