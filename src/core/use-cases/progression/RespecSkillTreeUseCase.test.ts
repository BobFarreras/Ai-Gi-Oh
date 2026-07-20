// src/core/use-cases/progression/RespecSkillTreeUseCase.test.ts - Verifica que el respec delega en la RPC
// (repositorio) con la identidad del servidor y el operationId, y que rechaza entradas vacías.
import { describe, expect, it, vi } from "vitest";
import { IRespecResult } from "@/core/entities/progression/ISkillTreeNode";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { RespecSkillTreeUseCase } from "./RespecSkillTreeUseCase";

function repoSpy(result: IRespecResult) {
  const respec = vi.fn(async () => result);
  const repo = { getActiveCatalog: vi.fn(), getPlayerRanks: vi.fn(), rankUp: vi.fn(), respec } as unknown as ISkillTreeRepository;
  return { repo, respec };
}

describe("RespecSkillTreeUseCase", () => {
  it("pasa playerId + operationId a la RPC y devuelve su resultado", async () => {
    const { repo, respec } = repoSpy({ ok: true, cleared: 4 });
    const result = await new RespecSkillTreeUseCase(repo).execute({ playerId: "p1", operationId: "op-1" });
    expect(respec).toHaveBeenCalledWith({ playerId: "p1", operationId: "op-1" });
    expect(result).toEqual({ ok: true, cleared: 4 });
  });

  it("propaga el rechazo por falta de llave", async () => {
    const { repo } = repoSpy({ ok: false, reason: "no_respec_key" });
    const result = await new RespecSkillTreeUseCase(repo).execute({ playerId: "p1", operationId: "op-2" });
    expect(result).toEqual({ ok: false, reason: "no_respec_key" });
  });

  it("rechaza entradas vacías (playerId / operationId)", async () => {
    const { repo } = repoSpy({ ok: true });
    await expect(new RespecSkillTreeUseCase(repo).execute({ playerId: " ", operationId: "o" })).rejects.toThrow();
    await expect(new RespecSkillTreeUseCase(repo).execute({ playerId: "p1", operationId: " " })).rejects.toThrow();
  });
});
