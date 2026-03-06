// src/core/use-cases/auth/SignUpWithEmailUseCase.test.ts - Verifica validaciones y delegación del registro por email.
import { describe, expect, it, vi } from "vitest";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { SignUpWithEmailUseCase } from "@/core/use-cases/auth/SignUpWithEmailUseCase";

function createAuthRepositoryStub(): IAuthRepository {
  return {
    signInWithEmail: vi.fn(async () => ({
      accessToken: "token",
      expiresAtIso: new Date().toISOString(),
      user: { id: "user-1", email: "user@aigi.io", displayName: "User" },
    })),
    signUpWithEmail: vi.fn(async () => ({
      accessToken: "token",
      expiresAtIso: new Date().toISOString(),
      user: { id: "user-1", email: "user@aigi.io", displayName: "User" },
    })),
    signOut: vi.fn(async () => undefined),
    getCurrentSession: vi.fn(async () => null),
  };
}

describe("SignUpWithEmailUseCase", () => {
  it("falla cuando contraseña es corta", async () => {
    const useCase = new SignUpWithEmailUseCase(createAuthRepositoryStub());
    await expect(useCase.execute({ email: "user@aigi.io", password: "1234" })).rejects.toThrow(
      "al menos 8 caracteres",
    );
  });

  it("delegada al repositorio normalizando email", async () => {
    const repository = createAuthRepositoryStub();
    const useCase = new SignUpWithEmailUseCase(repository);
    await useCase.execute({ email: "USER@AIGI.IO ", password: "12345678" });
    expect(repository.signUpWithEmail).toHaveBeenCalledWith({ email: "user@aigi.io", password: "12345678" });
  });
});
