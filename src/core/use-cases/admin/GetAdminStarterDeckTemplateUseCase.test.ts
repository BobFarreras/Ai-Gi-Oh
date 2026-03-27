// src/core/use-cases/admin/GetAdminStarterDeckTemplateUseCase.test.ts - Verifica resolución de plantilla starter por activa o por clave explícita.
import { describe, expect, it, vi } from "vitest";
import { IAdminStarterDeckRepository } from "@/core/repositories/admin/IAdminStarterDeckRepository";
import { GetAdminStarterDeckTemplateUseCase } from "@/core/use-cases/admin/GetAdminStarterDeckTemplateUseCase";

function createRepositoryMock(): IAdminStarterDeckRepository {
  return {
    listTemplateSummaries: vi.fn(async () => [{ templateKey: "starter-v1", isActive: true }]),
    getTemplate: vi.fn(async () => ({ templateKey: "starter-v1", isActive: true, slots: [] })),
    saveTemplate: vi.fn(),
    activateTemplate: vi.fn(),
    listAvailableCards: vi.fn(),
  };
}

describe("GetAdminStarterDeckTemplateUseCase", () => {
  it("carga la plantilla activa cuando no se indica clave", async () => {
    const repository = createRepositoryMock();
    const useCase = new GetAdminStarterDeckTemplateUseCase(repository);
    const result = await useCase.execute();
    expect(result.template?.templateKey).toBe("starter-v1");
    expect(repository.getTemplate).toHaveBeenCalledWith("starter-v1");
  });

  it("prioriza la plantilla solicitada por parámetro", async () => {
    const repository = createRepositoryMock();
    const useCase = new GetAdminStarterDeckTemplateUseCase(repository);
    await useCase.execute("starter-custom");
    expect(repository.getTemplate).toHaveBeenCalledWith("starter-custom");
  });
});

