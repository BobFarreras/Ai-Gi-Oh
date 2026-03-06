// src/components/hub/market/internal/format-market-transaction-date.ts - Formatea fecha de transacción en estilo compacto para panel de historial.
export function formatMarketTransactionDate(createdAtIso: string): string {
  const date = new Date(createdAtIso);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).toUpperCase();
}
