// src/core/use-cases/tutorial/ClaimTutorialCombatRewardUseCase.test.ts - Valida claim idempotente de carta de recompensa para tutorial de combate.
import { describe, expect, it, vi } from "vitest";
import { ClaimTutorialCombatRewardUseCase } from "@/core/use-cases/tutorial/ClaimTutorialCombatRewardUseCase";

describe("ClaimTutorialCombatRewardUseCase", () => {
  it("añade carta y marca claim cuando el nodo de combate está completado", async () => {
    const dependencies = {
      nodeProgressRepository: {
        listCompletedNodeIds: vi.fn().mockResolvedValue(["tutorial-combat-basics"]),
        markNodeCompleted: vi.fn().mockResolvedValue(undefined),
      },
      collectionRepository: {
        getCollection: vi.fn(),
        addCards: vi.fn().mockResolvedValue(undefined),
        consumeCards: vi.fn(),
      },
    };
    const useCase = new ClaimTutorialCombatRewardUseCase(dependencies);
    const result = await useCase.execute({ playerId: "player-1" });
    expect(result).toEqual({ applied: true, rewardCardId: "exec-fusion-gemgpt" });
    expect(dependencies.collectionRepository.addCards).toHaveBeenCalledWith("player-1", ["exec-fusion-gemgpt"]);
    expect(dependencies.nodeProgressRepository.markNodeCompleted).toHaveBeenCalledWith("player-1", "tutorial-combat-reward-gemgpt");
  });

  it("no duplica recompensa cuando el claim ya existe", async () => {
    const dependencies = {
      nodeProgressRepository: {
        listCompletedNodeIds: vi.fn().mockResolvedValue(["tutorial-combat-basics", "tutorial-combat-reward-gemgpt"]),
        markNodeCompleted: vi.fn().mockResolvedValue(undefined),
      },
      collectionRepository: {
        getCollection: vi.fn(),
        addCards: vi.fn().mockResolvedValue(undefined),
        consumeCards: vi.fn(),
      },
    };
    const useCase = new ClaimTutorialCombatRewardUseCase(dependencies);
    const result = await useCase.execute({ playerId: "player-1" });
    expect(result).toEqual({ applied: false, rewardCardId: "exec-fusion-gemgpt" });
    expect(dependencies.collectionRepository.addCards).not.toHaveBeenCalled();
    expect(dependencies.nodeProgressRepository.markNodeCompleted).not.toHaveBeenCalled();
  });
});
