// src/infrastructure/repositories/InMemoryWalletRepository.ts - Repositorio mock del saldo Nexus del jugador.
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { ValidationError } from "@/core/errors/ValidationError";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { InMemoryPlayerPersistenceStore } from "@/infrastructure/repositories/state/InMemoryPlayerPersistenceStore";
import { IPlayerPersistenceStore } from "@/infrastructure/repositories/state/IPlayerPersistenceStore";

export class InMemoryWalletRepository implements IWalletRepository {
  private readonly store: IPlayerPersistenceStore;

  constructor(
    initialWallets: IPlayerWallet[] = [{ playerId: "local-player", nexus: 1000 }],
    store: IPlayerPersistenceStore = new InMemoryPlayerPersistenceStore(),
  ) {
    this.store = store;
    for (const wallet of initialWallets) {
      this.store.saveWallet(wallet);
    }
  }

  async getWallet(playerId: string): Promise<IPlayerWallet> {
    const wallet = this.store.getWallet(playerId) ?? { playerId, nexus: 0 };
    this.store.saveWallet(wallet);
    return { ...wallet };
  }

  async debitNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    const wallet = await this.getWallet(playerId);
    if (amount <= 0) {
      throw new ValidationError("El débito Nexus debe ser positivo.");
    }
    if (wallet.nexus < amount) {
      throw new ValidationError("Saldo Nexus insuficiente para completar el débito.");
    }
    const updated = { ...wallet, nexus: wallet.nexus - amount };
    this.store.saveWallet(updated);
    return { ...updated };
  }

  async creditNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    const wallet = await this.getWallet(playerId);
    if (amount <= 0) {
      throw new ValidationError("El crédito Nexus debe ser positivo.");
    }
    const updated = { ...wallet, nexus: wallet.nexus + amount };
    this.store.saveWallet(updated);
    return { ...updated };
  }
}
