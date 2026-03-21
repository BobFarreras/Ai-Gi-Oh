// src/core/use-cases/tutorial/CompleteTutorialNodeUseCase.test.ts - Verifica validación y persistencia de completion por nodo tutorial.
import { describe, expect, it, vi } from "vitest";
import { CompleteTutorialNodeUseCase } from "./CompleteTutorialNodeUseCase";

describe("CompleteTutorialNodeUseCase", () => {
  it("marca nodo válido no final", async () => {
    const repository = { listCompletedNodeIds: vi.fn(), markNodeCompleted: vi.fn() };
    const useCase = new CompleteTutorialNodeUseCase(repository);
    await expect(useCase.execute({ playerId: "p1", nodeId: "tutorial-arsenal-basics" })).resolves.toEqual({ nodeId: "tutorial-arsenal-basics" });
    expect(repository.markNodeCompleted).toHaveBeenCalledWith("p1", "tutorial-arsenal-basics");
  });
});
