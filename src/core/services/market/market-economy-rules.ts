// src/core/services/market/market-economy-rules.ts - Reglas puras para validar compras del mercado con moneda Nexus.
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameRuleError } from "@/core/errors/GameRuleError";

export function assertPositiveNexusAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ValidationError("El precio Nexus debe ser un número positivo.");
  }
}

export function assertEnoughNexus(wallet: IPlayerWallet, amount: number): void {
  assertPositiveNexusAmount(amount);
  if (wallet.nexus < amount) {
    throw new GameRuleError("No tienes Nexus suficiente para completar la compra.");
  }
}

export function assertListingAvailable(isAvailable: boolean, stock: number | null): void {
  if (!isAvailable) {
    throw new GameRuleError("Este producto no está disponible actualmente.");
  }
  if (stock !== null && stock <= 0) {
    throw new GameRuleError("Este producto no tiene stock disponible.");
  }
}
