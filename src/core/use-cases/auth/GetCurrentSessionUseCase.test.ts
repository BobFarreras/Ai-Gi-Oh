// src/core/use-cases/auth/GetCurrentSessionUseCase.test.ts - Asegura lectura de sesión actual desde repositorio de auth.
import { describe, expect, it, vi } from "vitest";
import { IAuthRepository } from "@/core/repositories/IAuthRepository";
import { GetCurrentSessionUseCase } from "@/core/use-cases/auth/GetCurrentSessionUseCase";

describe("GetCurrentSessionUseCase", () => {
  it("devuelve la sesión del repositorio", async () => {
    const repository: IAuthRepository = {
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
      getCurrentSession: vi.fn(async () => ({
        accessToken: "token",
        expiresAtIso: "2030-01-01T00:00:00.000Z",
        user: { id: "user-1", email: "user@aigi.io", displayName: null },
      })),
    };
    const useCase = new GetCurrentSessionUseCase(repository);
    const session = await useCase.execute();
    expect(session?.user.id).toBe("user-1");
  });
});
