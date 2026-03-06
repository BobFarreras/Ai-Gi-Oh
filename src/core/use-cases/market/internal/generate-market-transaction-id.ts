// src/core/use-cases/market/internal/generate-market-transaction-id.ts - Genera IDs únicos para transacciones de mercado con tolerancia a concurrencia.
export function generateMarketTransactionId(prefix: string): string {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  return `tx-${prefix}-${randomPart}`;
}
