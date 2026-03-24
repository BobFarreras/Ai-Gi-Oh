// src/app/api/tutorial/nodes/complete/internal/process-tutorial-node-completion.test.ts - Verifica completion de nodo tutorial desde capa API.
import { describe, expect, it, vi } from "vitest";
import { processTutorialNodeCompletion } from "./process-tutorial-node-completion";

describe("processTutorialNodeCompletion", () => {
  it("completa nodo válido", async () => {
    const repository = { listCompletedNodeIds: vi.fn(), markNodeCompleted: vi.fn() };
    await expect(
      processTutorialNodeCompletion({
        playerId: "p1",
        nodeId: "tutorial-market-basics",
        nodeProgressRepository: repository,
      }),
    ).resolves.toEqual({ nodeId: "tutorial-market-basics" });
    expect(repository.markNodeCompleted).toHaveBeenCalledWith("p1", "tutorial-market-basics");
  });
});
