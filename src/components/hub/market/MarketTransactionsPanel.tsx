// src/components/hub/market/MarketTransactionsPanel.tsx - Panel lateral que muestra historial reciente de compras Nexus.
"use client";

import { ReceiptText } from "lucide-react";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";

interface MarketTransactionsPanelProps {
  transactions: IMarketTransaction[];
}

function formatTransactionDate(createdAtIso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(createdAtIso));
}

export function MarketTransactionsPanel({ transactions }: MarketTransactionsPanelProps) {
  const visibleTransactions = transactions.slice(0, 8);

  return (
    <section className="space-y-2 rounded-2xl border border-cyan-800/35 bg-[#031020]/55 p-3">
      <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-200">
        <ReceiptText size={14} /> Historial
      </h2>
      <div className="space-y-2">
        {visibleTransactions.length === 0 && (
          <p className="text-xs text-slate-400">Todavía no hay transacciones registradas.</p>
        )}
        {visibleTransactions.map((transaction) => (
          <article key={transaction.id} className="border border-cyan-900/35 bg-[#071729]/75 p-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200">
              {transaction.transactionType === "BUY_PACK" ? "Compra de sobre" : "Compra de carta"}
            </p>
            <p className="mt-1 text-[11px] text-slate-200">
              {transaction.purchasedCardIds.length} carta(s) · -{transaction.amountNexus} NX
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-wide text-cyan-300/75">
              {formatTransactionDate(transaction.createdAtIso)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
