// src/core/use-cases/admin/GetAdminAuditLogPageUseCase.test.ts - Asegura validación y normalización de consultas paginadas de auditoría.
import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogReadRepository } from "@/core/repositories/admin/IAdminAuditLogReadRepository";
import { GetAdminAuditLogPageUseCase } from "@/core/use-cases/admin/GetAdminAuditLogPageUseCase";

describe("GetAdminAuditLogPageUseCase", () => {
  it("normaliza page/pageSize antes de consultar repositorio", async () => {
    const repository: IAdminAuditLogReadRepository = {
      listPage: vi.fn(async (query) => ({ items: [], page: query.page, pageSize: query.pageSize, total: 0 })),
    };
    const useCase = new GetAdminAuditLogPageUseCase(repository);
    const result = await useCase.execute({ page: 0, pageSize: 500 });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(100);
  });

  it("lanza ValidationError cuando la fecha from es inválida", async () => {
    const repository: IAdminAuditLogReadRepository = { listPage: vi.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })) };
    const useCase = new GetAdminAuditLogPageUseCase(repository);
    await expect(useCase.execute({ page: 1, pageSize: 20, fromIso: "invalid" })).rejects.toBeInstanceOf(ValidationError);
  });
});

