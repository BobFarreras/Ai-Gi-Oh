// src/core/repositories/IWalletRepository.ts - Contrato de acceso y actualización del saldo Nexus del jugador.
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";

export interface IWalletRepository {
  getWallet(playerId: string): Promise<IPlayerWallet>;
  debitNexus(playerId: string, amount: number): Promise<IPlayerWallet>;
  creditNexus(playerId: string, amount: number): Promise<IPlayerWallet>;
}
