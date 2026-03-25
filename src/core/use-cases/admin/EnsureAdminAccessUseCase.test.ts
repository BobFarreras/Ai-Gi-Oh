// src/core/use-cases/admin/EnsureAdminAccessUseCase.test.ts - Valida autorización admin y rechazo cuando el usuario no pertenece al whitelist.
import { describe, expect, it, vi } from "vitest";
import { AuthorizationError } from "@/core/errors/AuthorizationError";
import { IAdminAccessRepository } from "@/core/repositories/IAdminAccessRepository";
import { EnsureAdminAccessUseCase } from "@/core/use-cases/admin/EnsureAdminAccessUseCase";

describe("EnsureAdminAccessUseCase", () => {
  it("devuelve perfil admin cuando el usuario está autorizado", async () => {
    const repository: IAdminAccessRepository = {
      getAdminProfile: vi.fn(async () => ({ userId: "admin-1", role: "ADMIN" as const })),
    };
    const useCase = new EnsureAdminAccessUseCase(repository);
    await expect(useCase.execute("admin-1")).resolves.toEqual({ userId: "admin-1", role: "ADMIN" });
  });

  it("lanza AuthorizationError cuando el usuario no está autorizado", async () => {
    const repository: IAdminAccessRepository = { getAdminProfile: vi.fn(async () => null) };
    const useCase = new EnsureAdminAccessUseCase(repository);
    await expect(useCase.execute("player-1")).rejects.toBeInstanceOf(AuthorizationError);
  });
});
