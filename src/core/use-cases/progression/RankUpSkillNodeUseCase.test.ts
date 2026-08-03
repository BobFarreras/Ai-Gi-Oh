// src/core/use-cases/progression/RankUpSkillNodeUseCase.test.ts - Verifica que los puntos se derivan de la XP
// del servidor (no del cliente) y se pasan a la RPC.
import { describe, expect, it, vi } from "vitest";
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";
import { IRankUpResult } from "@/core/entities/progression/ISkillTreeNode";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { RankUpSkillNodeUseCase } from "./RankUpSkillNodeUseCase";

function progressWith(experience: number | null): IPlayerProgressRepository {
  const progress: IPlayerProgress | null =
    experience === null
      ? null
      : {
          playerId: "p1", hasCompletedTutorial: true, medals: 0, storyChapter: 1,
          playerExperience: experience, updatedAtIso: "2026-07-18T00:00:00.000Z",
        };
  return {
    getByPlayerId: vi.fn(async () => progress),
    create: vi.fn(),
    update: vi.fn(),
  } as unknown as IPlayerProgressRepository;
}

function skillRepoSpy(result: IRankUpResult) {
  const rankUp = vi.fn(async () => result);
  const repo = {
    getActiveCatalog: vi.fn(),
    getPlayerRanks: vi.fn(),
    rankUp,
  } as unknown as ISkillTreeRepository;
  return { repo, rankUp };
}

const ok: IRankUpResult = { ok: true, nodeId: "node-core", rank: 1 };

describe("RankUpSkillNodeUseCase", () => {
  it("deriva los puntos disponibles de la XP del servidor y los pasa a la RPC", async () => {
    // XP 1000 = nivel 2 = 1 punto disponible (curva doblada: FIRST=750, STEP=400).
    const { repo, rankUp } = skillRepoSpy(ok);
    const useCase = new RankUpSkillNodeUseCase(repo, progressWith(1000));
    await useCase.execute({ playerId: "p1", nodeId: "node-core", operationId: "op-1" });
    expect(rankUp).toHaveBeenCalledWith({
      playerId: "p1", nodeId: "node-core", availablePoints: 1, operationId: "op-1",
    });
  });

  it("sin progreso (0 XP) → 0 puntos disponibles", async () => {
    const { repo, rankUp } = skillRepoSpy(ok);
    const useCase = new RankUpSkillNodeUseCase(repo, progressWith(null));
    await useCase.execute({ playerId: "p1", nodeId: "node-core", operationId: "op-1" });
    expect(rankUp).toHaveBeenCalledWith(expect.objectContaining({ availablePoints: 0 }));
  });

  it("devuelve el resultado de la RPC tal cual", async () => {
    const rejected: IRankUpResult = { ok: false, nodeId: "node-econ-socio", rank: 0, reason: "insufficient_points" };
    const { repo } = skillRepoSpy(rejected);
    const useCase = new RankUpSkillNodeUseCase(repo, progressWith(500));
    const result = await useCase.execute({ playerId: "p1", nodeId: "node-econ-socio", operationId: "op-2" });
    expect(result).toEqual(rejected);
  });

  it("nunca lee la XP del cliente: solo del repositorio de progreso", async () => {
    const progressRepo = progressWith(39478); // jugador máximo de prod → nivel 13 → 12 puntos (curva doblada)
    const { repo, rankUp } = skillRepoSpy(ok);
    await new RankUpSkillNodeUseCase(repo, progressRepo).execute({ playerId: "p1", nodeId: "node-core", operationId: "op-3" });
    expect(progressRepo.getByPlayerId).toHaveBeenCalledWith("p1");
    expect(rankUp).toHaveBeenCalledWith(expect.objectContaining({ availablePoints: 12 }));
  });

  it("rechaza entradas vacías", async () => {
    const { repo } = skillRepoSpy(ok);
    const useCase = new RankUpSkillNodeUseCase(repo, progressWith(1000));
    await expect(useCase.execute({ playerId: " ", nodeId: "n", operationId: "o" })).rejects.toThrow();
    await expect(useCase.execute({ playerId: "p1", nodeId: " ", operationId: "o" })).rejects.toThrow();
    await expect(useCase.execute({ playerId: "p1", nodeId: "n", operationId: " " })).rejects.toThrow();
  });
});
