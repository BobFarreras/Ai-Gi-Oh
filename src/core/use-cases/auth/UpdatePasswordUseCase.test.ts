// src/core/use-cases/auth/UpdatePasswordUseCase.test.ts - Asegura validaciones y actualización de contraseña mediante repositorio de auth.
import { describe, expect, it, vi } from "vitest";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { UpdatePasswordUseCase } from "@/core/use-cases/auth/UpdatePasswordUseCase";

function createAuthRepositoryStub(): IAuthRepository {
  return {
    signInWithEmail: vi.fn(),
    signUpWithEmail: vi.fn(),
    requestPasswordRecovery: vi.fn(async () => undefined),
    updatePassword: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    getCurrentSession: vi.fn(async () => null),
  };
}

describe("UpdatePasswordUseCase", () => {
  it("falla cuando contraseña es corta", async () => {
    const useCase = new UpdatePasswordUseCase(createAuthRepositoryStub());
    await expect(useCase.execute({ password: "1234" })).rejects.toThrow("al menos 8 caracteres");
  });

  it("delegada al repositorio cuando la contraseña es válida", async () => {
    const repository = createAuthRepositoryStub();
    const useCase = new UpdatePasswordUseCase(repository);
    await useCase.execute({ password: "12345678" });
    expect(repository.updatePassword).toHaveBeenCalledWith("12345678");
  });
});
