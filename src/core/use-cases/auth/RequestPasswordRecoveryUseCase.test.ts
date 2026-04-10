// src/core/use-cases/auth/RequestPasswordRecoveryUseCase.test.ts - Verifica validaciones y delegación para solicitud de recuperación de contraseña.
import { describe, expect, it, vi } from "vitest";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { RequestPasswordRecoveryUseCase } from "@/core/use-cases/auth/RequestPasswordRecoveryUseCase";

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

describe("RequestPasswordRecoveryUseCase", () => {
  it("falla cuando email está vacío", async () => {
    const useCase = new RequestPasswordRecoveryUseCase(createAuthRepositoryStub());
    await expect(useCase.execute({ email: " ", redirectTo: "https://app.local/reset" })).rejects.toThrow("email");
  });

  it("delegada al repositorio normalizando email y redirectTo", async () => {
    const repository = createAuthRepositoryStub();
    const useCase = new RequestPasswordRecoveryUseCase(repository);
    await useCase.execute({
      email: "USER@AIGI.IO ",
      redirectTo: " https://app.local/auth/callback?next=/reset-password ",
    });
    expect(repository.requestPasswordRecovery).toHaveBeenCalledWith(
      "user@aigi.io",
      "https://app.local/auth/callback?next=/reset-password",
    );
  });
});
