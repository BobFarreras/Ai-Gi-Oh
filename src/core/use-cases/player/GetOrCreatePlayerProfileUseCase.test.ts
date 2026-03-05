// src/core/use-cases/player/GetOrCreatePlayerProfileUseCase.test.ts - Verifica creación idempotente de perfil de jugador.
import { describe, expect, it, vi } from "vitest";
import { IPlayerProfileRepository } from "@/core/repositories/IPlayerProfileRepository";
import { GetOrCreatePlayerProfileUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProfileUseCase";

describe("GetOrCreatePlayerProfileUseCase", () => {
  it("crea perfil cuando no existe", async () => {
    const repository: IPlayerProfileRepository = {
      getByPlayerId: vi.fn(async () => null),
      create: vi.fn(async (profile) => profile),
      update: vi.fn(),
    };
    const useCase = new GetOrCreatePlayerProfileUseCase(repository);
    const profile = await useCase.execute({ playerId: "user-1", defaultNickname: "Boby" });
    expect(profile.nickname).toBe("Boby");
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it("devuelve perfil existente sin recrear", async () => {
    const existing = {
      playerId: "user-1",
      nickname: "Alpha",
      avatarUrl: null,
      createdAtIso: "2026-01-01T00:00:00.000Z",
      updatedAtIso: "2026-01-01T00:00:00.000Z",
    };
    const repository: IPlayerProfileRepository = {
      getByPlayerId: vi.fn(async () => existing),
      create: vi.fn(),
      update: vi.fn(),
    };
    const useCase = new GetOrCreatePlayerProfileUseCase(repository);
    const profile = await useCase.execute({ playerId: "user-1", defaultNickname: "Ignored" });
    expect(profile.nickname).toBe("Alpha");
    expect(repository.create).not.toHaveBeenCalled();
  });
});
