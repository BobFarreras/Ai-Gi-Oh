// src/core/use-cases/admin/SaveAdminStarterDeckTemplateUseCase.test.ts - Valida persistencia y activación opcional en guardado de plantilla starter.
import { describe, expect, it, vi } from "vitest";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { IAdminStarterDeckRepository } from "@/core/repositories/admin/IAdminStarterDeckRepository";
import { SaveAdminStarterDeckTemplateUseCase } from "@/core/use-cases/admin/SaveAdminStarterDeckTemplateUseCase";

function createRepositoryMock(): IAdminStarterDeckRepository {
  return {
    listTemplateSummaries: vi.fn(),
    getTemplate: vi.fn(),
    saveTemplate: vi.fn(async () => undefined),
    activateTemplate: vi.fn(async () => undefined),
    listAvailableCards: vi.fn(),
  };
}

function createCards(): string[] {
  return Array.from({ length: HOME_DECK_SIZE }, (_, index) => `card-${index + 1}`);
}

describe("SaveAdminStarterDeckTemplateUseCase", () => {
  it("guarda y activa cuando activate=true", async () => {
    const repository = createRepositoryMock();
    const useCase = new SaveAdminStarterDeckTemplateUseCase(repository);
    await useCase.execute({ templateKey: "starter-v2", cardIds: createCards(), activate: true });
    expect(repository.saveTemplate).toHaveBeenCalledWith("starter-v2", createCards());
    expect(repository.activateTemplate).toHaveBeenCalledWith("starter-v2");
  });

  it("solo guarda cuando activate=false", async () => {
    const repository = createRepositoryMock();
    const useCase = new SaveAdminStarterDeckTemplateUseCase(repository);
    await useCase.execute({ templateKey: "starter-v3", cardIds: createCards(), activate: false });
    expect(repository.saveTemplate).toHaveBeenCalledTimes(1);
    expect(repository.activateTemplate).not.toHaveBeenCalled();
  });
});

