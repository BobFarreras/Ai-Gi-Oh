// src/infrastructure/repositories/InMemoryWalletRepository.test.ts - Verifica reglas de débito/crédito y protección contra saldo negativo en wallet mock.
import { describe, expect, it } from "vitest";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";

describe("InMemoryWalletRepository", () => {
  it("bloquea débito cuando el saldo es insuficiente", async () => {
    const repository = new InMemoryWalletRepository([{ playerId: "player-a", nexus: 50 }]);
    await expect(repository.debitNexus("player-a", 200)).rejects.toThrow("Saldo Nexus insuficiente");
  });
});
