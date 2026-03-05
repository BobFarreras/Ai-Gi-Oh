// src/infrastructure/repositories/InMemoryWalletRepository.ts - Repositorio mock del saldo Nexus del jugador.
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { ValidationError } from "@/core/errors/ValidationError";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";

export class InMemoryWalletRepository implements IWalletRepository {
  private readonly wallets = new Map<string, IPlayerWallet>();

  constructor(initialWallets: IPlayerWallet[] = [{ playerId: "local-player", nexus: 1000 }]) {
    for (const wallet of initialWallets) {
      this.wallets.set(wallet.playerId, { ...wallet });
    }
  }

  async getWallet(playerId: string): Promise<IPlayerWallet> {
    const wallet = this.wallets.get(playerId) ?? { playerId, nexus: 0 };
    this.wallets.set(playerId, wallet);
    return { ...wallet };
  }

  async debitNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    const wallet = await this.getWallet(playerId);
    if (amount <= 0) {
      throw new ValidationError("El débito Nexus debe ser positivo.");
    }
    const updated = { ...wallet, nexus: wallet.nexus - amount };
    this.wallets.set(playerId, updated);
    return { ...updated };
  }

  async creditNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    const wallet = await this.getWallet(playerId);
    if (amount <= 0) {
      throw new ValidationError("El crédito Nexus debe ser positivo.");
    }
    const updated = { ...wallet, nexus: wallet.nexus + amount };
    this.wallets.set(playerId, updated);
    return { ...updated };
  }
}
