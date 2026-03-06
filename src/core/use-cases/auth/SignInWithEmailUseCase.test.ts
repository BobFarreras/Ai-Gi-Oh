// src/core/use-cases/auth/SignInWithEmailUseCase.test.ts - Verifica validaciones y delegación del login por email.
import { describe, expect, it, vi } from "vitest";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { SignInWithEmailUseCase } from "@/core/use-cases/auth/SignInWithEmailUseCase";

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

describe("SignInWithEmailUseCase", () => {
  it("falla cuando email está vacío", async () => {
    const useCase = new SignInWithEmailUseCase(createAuthRepositoryStub());
    await expect(useCase.execute({ email: " ", password: "123456" })).rejects.toThrow("email es obligatorio");
  });

  it("delegada al repositorio normalizando email", async () => {
    const repository = createAuthRepositoryStub();
    const useCase = new SignInWithEmailUseCase(repository);
    await useCase.execute({ email: "USER@AIGI.IO ", password: "123456" });
    expect(repository.signInWithEmail).toHaveBeenCalledWith({ email: "user@aigi.io", password: "123456" });
  });
});
