// src/core/use-cases/admin/WriteAdminAuditLogUseCase.test.ts - Verifica validación mínima y escritura de auditoría admin.
import { describe, expect, it, vi } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminAuditLogRepository } from "@/core/repositories/admin/IAdminAuditLogRepository";
import { WriteAdminAuditLogUseCase } from "@/core/use-cases/admin/WriteAdminAuditLogUseCase";

describe("WriteAdminAuditLogUseCase", () => {
  it("persiste la entrada cuando todos los campos requeridos son válidos", async () => {
    const repository: IAdminAuditLogRepository = { write: vi.fn(async () => undefined) };
    const useCase = new WriteAdminAuditLogUseCase(repository);
    await useCase.execute({
      actorUserId: "admin-1",
      action: "ADMIN_CARD_UPSERTED",
      entityType: "cards_catalog",
      entityId: "entity-vscode",
      payload: { type: "ENTITY" },
    });
    expect(repository.write).toHaveBeenCalledTimes(1);
  });

  it("lanza ValidationError cuando falta actorUserId", async () => {
    const repository: IAdminAuditLogRepository = { write: vi.fn(async () => undefined) };
    const useCase = new WriteAdminAuditLogUseCase(repository);
    await expect(
      useCase.execute({
        actorUserId: "   ",
        action: "ADMIN_CARD_UPSERTED",
        entityType: "cards_catalog",
        entityId: "entity-vscode",
        payload: {},
      }),
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

