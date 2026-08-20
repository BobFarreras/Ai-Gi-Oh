// src/core/use-cases/olympus/ResetOlympusBattleUseCase.test.ts - Verifica la recuperación autoritativa de un combate bloqueado.
import { describe, expect, it, vi } from "vitest";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { ResetOlympusBattleUseCase } from "./ResetOlympusBattleUseCase";

describe("ResetOlympusBattleUseCase", () => {
  it("cierra como derrota la batalla pendiente sin consumir otro intento", async () => {
    const forfeited = { battleId: "battle-1", status: "COMPLETED", outcome: "LOSS" };
    const repository = {
      getIssuedBattle: vi.fn().mockResolvedValue({ battleId: "battle-1" }),
      forfeitIssuedBattle: vi.fn().mockResolvedValue(forfeited),
    } as unknown as IOlympusRepository;

    const result = await new ResetOlympusBattleUseCase(repository).execute("player-1");

    expect(repository.forfeitIssuedBattle).toHaveBeenCalledWith("player-1", "battle-1");
    expect(result).toEqual({ battle: forfeited, forfeited: true });
  });

  it("rechaza el reinicio cuando ya no existe una batalla pendiente", async () => {
    const repository = {
      getIssuedBattle: vi.fn().mockResolvedValue(null),
      forfeitIssuedBattle: vi.fn(),
    } as unknown as IOlympusRepository;

    await expect(new ResetOlympusBattleUseCase(repository).execute("player-1"))
      .rejects.toThrow(/no hay un combate pendiente/i);
    expect(repository.forfeitIssuedBattle).not.toHaveBeenCalled();
  });
});
