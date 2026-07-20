// src/core/use-cases/home/SwapActiveDeckUseCase.test.ts - Verifica que el swap delega en la RPC (repositorio)
// con la identidad del servidor y el operationId, y que rechaza entradas vacías.
import { describe, expect, it, vi } from "vitest";
import { IDeckSwapResult } from "@/core/entities/home/IDeck";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { SwapActiveDeckUseCase } from "./SwapActiveDeckUseCase";

function repoSpy(result: IDeckSwapResult) {
  const swapActiveDeck = vi.fn(async () => result);
  const repo = {
    getDeck: vi.fn(), saveDeck: vi.fn(), getCollection: vi.fn(), getBankDeck: vi.fn(), swapActiveDeck,
  } as unknown as IDeckRepository;
  return { repo, swapActiveDeck };
}

describe("SwapActiveDeckUseCase", () => {
  it("pasa playerId + operationId a la RPC y devuelve su resultado", async () => {
    const { repo, swapActiveDeck } = repoSpy({ ok: true });
    const result = await new SwapActiveDeckUseCase(repo).execute({ playerId: "p1", operationId: "op-1" });
    expect(swapActiveDeck).toHaveBeenCalledWith({ playerId: "p1", operationId: "op-1" });
    expect(result).toEqual({ ok: true });
  });

  it("propaga el rechazo por falta de la llave (nodo no desbloqueado)", async () => {
    const { repo } = repoSpy({ ok: false, reason: "no_second_deck" });
    const result = await new SwapActiveDeckUseCase(repo).execute({ playerId: "p1", operationId: "op-2" });
    expect(result).toEqual({ ok: false, reason: "no_second_deck" });
  });

  it("rechaza entradas vacías", async () => {
    const { repo } = repoSpy({ ok: true });
    await expect(new SwapActiveDeckUseCase(repo).execute({ playerId: " ", operationId: "o" })).rejects.toThrow();
    await expect(new SwapActiveDeckUseCase(repo).execute({ playerId: "p1", operationId: " " })).rejects.toThrow();
  });
});
