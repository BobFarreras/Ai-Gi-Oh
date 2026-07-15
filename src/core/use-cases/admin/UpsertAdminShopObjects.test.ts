// src/core/use-cases/admin/UpsertAdminShopObjects.test.ts - Validación del CRUD admin de objetos del mercado.
import { describe, expect, it, vi } from "vitest";
import { IAdminShopObjectsRepository } from "@/core/repositories/admin/IAdminShopObjectsRepository";
import { UpsertAdminLevelCandyUseCase } from "@/core/use-cases/admin/UpsertAdminLevelCandyUseCase";
import { UpsertAdminCardUpgradeItemUseCase } from "@/core/use-cases/admin/UpsertAdminCardUpgradeItemUseCase";

function createRepository(): IAdminShopObjectsRepository {
  return {
    listLevelCandies: vi.fn().mockResolvedValue([]),
    listCardUpgradeItems: vi.fn().mockResolvedValue([]),
    upsertLevelCandy: vi.fn().mockResolvedValue(undefined),
    upsertCardUpgradeItem: vi.fn().mockResolvedValue(undefined),
  };
}

describe("UpsertAdminLevelCandyUseCase", () => {
  it("persiste un caramelo válido (recortando nombre y normalizando imagen vacía a null)", async () => {
    const repository = createRepository();
    await new UpsertAdminLevelCandyUseCase(repository).execute({
      id: "candy-usb-raro-6",
      name: "  USB Raro +5 Pro  ",
      levels: 5,
      priceNexus: 15000,
      imageUrl: "  ",
      isActive: true,
    });
    expect(repository.upsertLevelCandy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "USB Raro +5 Pro", imageUrl: null }),
    );
  });

  it("rechaza niveles fuera de 1-5", async () => {
    const repository = createRepository();
    await expect(
      new UpsertAdminLevelCandyUseCase(repository).execute({
        id: "candy-x", name: "X", levels: 6, priceNexus: 0, imageUrl: null, isActive: true,
      }),
    ).rejects.toThrow(/niveles/i);
    expect(repository.upsertLevelCandy).not.toHaveBeenCalled();
  });

  it("rechaza id que no sea slug", async () => {
    const repository = createRepository();
    await expect(
      new UpsertAdminLevelCandyUseCase(repository).execute({
        id: "Candy Con Espacios", name: "X", levels: 1, priceNexus: 0, imageUrl: null, isActive: true,
      }),
    ).rejects.toThrow(/slug/i);
  });

  it("rechaza precio negativo", async () => {
    const repository = createRepository();
    await expect(
      new UpsertAdminLevelCandyUseCase(repository).execute({
        id: "candy-x", name: "X", levels: 1, priceNexus: -5, imageUrl: null, isActive: true,
      }),
    ).rejects.toThrow(/precio/i);
  });
});

describe("UpsertAdminCardUpgradeItemUseCase", () => {
  it("persiste un objeto de mejora válido", async () => {
    const repository = createRepository();
    await new UpsertAdminCardUpgradeItemUseCase(repository).execute({
      id: "item-nucleo-overclock-2", name: "Núcleo Overclock II", stat: "ATTACK", value: 150, priceNexus: 3000, imageUrl: null, isActive: true,
    });
    expect(repository.upsertCardUpgradeItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: "item-nucleo-overclock-2", stat: "ATTACK", value: 150 }),
    );
  });

  it("rechaza valor <= 0", async () => {
    const repository = createRepository();
    await expect(
      new UpsertAdminCardUpgradeItemUseCase(repository).execute({
        id: "item-x", name: "X", stat: "DEFENSE", value: 0, priceNexus: 0, imageUrl: null, isActive: true,
      }),
    ).rejects.toThrow(/valor/i);
  });

  it("rechaza stat inválido", async () => {
    const repository = createRepository();
    await expect(
      new UpsertAdminCardUpgradeItemUseCase(repository).execute({
        id: "item-x", name: "X", stat: "SPEED" as "ATTACK", value: 10, priceNexus: 0, imageUrl: null, isActive: true,
      }),
    ).rejects.toThrow(/ATTACK|DEFENSE/);
  });
});
