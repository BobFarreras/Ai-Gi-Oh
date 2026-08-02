// src/core/use-cases/olympus/ManageChampionUpgradesUseCase.test.ts - Verifica idempotencia, prerrequisitos y coste de reasignación.
import { describe, expect, it, vi } from "vitest";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { ManageChampionUpgradesUseCase } from "./ManageChampionUpgradesUseCase";
import { olympusCatalog, olympusProgress } from "./internal/olympus-test-doubles";

function repositoryWith(overrides: Partial<IOlympusRepository>): IOlympusRepository {
  return {
    getCatalog: vi.fn().mockResolvedValue(olympusCatalog),
    getUnlockedChampionIds: vi.fn().mockResolvedValue(["gennvim"]),
    getChampionProgress: vi.fn().mockResolvedValue([olympusProgress]),
    getFragmentBalance: vi.fn().mockResolvedValue(200),
    purchaseUpgrade: vi.fn().mockResolvedValue(160),
    respecUpgrades: vi.fn().mockResolvedValue(190),
    ...overrides,
  } as unknown as IOlympusRepository;
}

describe("ManageChampionUpgradesUseCase", () => {
  it("mete el rango en el operationId: sin él, subir el mismo nodo otra vez se deduplicaría", async () => {
    const repository = repositoryWith({});
    const result = await new ManageChampionUpgradesUseCase(repository)
      .purchase("player-1", "gennvim", "gennvim-power-1");

    expect(repository.purchaseUpgrade).toHaveBeenCalledWith(
      "player-1", "gennvim", "gennvim-power-1", "olympus-upgrade:player-1:gennvim:gennvim-power-1:r1",
    );
    expect(result.ascensionFragments).toBe(160);
  });

  it("no compra sin haber desbloqueado al campeón", async () => {
    const repository = repositoryWith({ getUnlockedChampionIds: vi.fn().mockResolvedValue([]) });
    await expect(new ManageChampionUpgradesUseCase(repository)
      .purchase("player-1", "gennvim", "gennvim-power-1")).rejects.toThrow(/derrotar a ese rival/i);
    expect(repository.purchaseUpgrade).not.toHaveBeenCalled();
  });

  it("no compra sin Fragmentos suficientes", async () => {
    const repository = repositoryWith({ getFragmentBalance: vi.fn().mockResolvedValue(10) });
    await expect(new ManageChampionUpgradesUseCase(repository)
      .purchase("player-1", "gennvim", "gennvim-power-1")).rejects.toThrow(/Éter suficiente/i);
    expect(repository.purchaseUpgrade).not.toHaveBeenCalled();
  });

  it("no reasigna un árbol vacío", async () => {
    const repository = repositoryWith({});
    await expect(new ManageChampionUpgradesUseCase(repository).respec("player-1", "gennvim"))
      .rejects.toThrow(/No hay mejoras que reasignar/i);
    expect(repository.respecUpgrades).not.toHaveBeenCalled();
  });

  it("la primera reasignación es gratuita y numera la operación por contador", async () => {
    const invested = { ...olympusProgress, unlockedNodeIds: ["gennvim-power-1"], nodeRanks: { "gennvim-power-1": 1 } };
    const repository = repositoryWith({ getChampionProgress: vi.fn().mockResolvedValue([invested]) });
    const result = await new ManageChampionUpgradesUseCase(repository).respec("player-1", "gennvim");

    expect(repository.respecUpgrades).toHaveBeenCalledWith(
      "player-1", "gennvim", "olympus-respec:player-1:gennvim:0",
    );
    expect(result.quote).toMatchObject({ refund: 30, charge: 0, free: true });
  });

  it("la segunda reasignación cobra y exige saldo para el coste", async () => {
    const invested = {
      ...olympusProgress,
      unlockedNodeIds: ["gennvim-power-1"],
      nodeRanks: { "gennvim-power-1": 1 },
      respecCount: 1,
    };
    const repository = repositoryWith({
      getChampionProgress: vi.fn().mockResolvedValue([invested]),
      getFragmentBalance: vi.fn().mockResolvedValue(0),
    });
    await expect(new ManageChampionUpgradesUseCase(repository).respec("player-1", "gennvim"))
      .rejects.toThrow(/Éter suficiente/i);
    expect(repository.respecUpgrades).not.toHaveBeenCalled();
  });
});
