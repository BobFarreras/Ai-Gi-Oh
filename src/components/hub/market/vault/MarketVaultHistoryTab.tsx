// src/components/hub/market/vault/MarketVaultHistoryTab.tsx - Renderiza la pestaña de historial de compras del mercado.
"use client";

import { motion } from "framer-motion";
import { CalendarDays, CreditCard, Hash, PackageOpen } from "lucide-react";
import { Card } from "@/components/game/card/Card";
import { formatMarketTransactionDate } from "@/components/hub/market/internal/format-market-transaction-date";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";

interface MarketVaultHistoryTabProps {
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
}

export function MarketVaultHistoryTab({ transactions, catalogListings }: MarketVaultHistoryTabProps) {
  const cardMap = new Map(catalogListings.map((listing) => [listing.card.id, listing.card]));

  return (
    <motion.div key="history" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="flex flex-col gap-2 pb-4">
      {transactions.length === 0 && (
        <p className="py-8 text-center font-mono text-xs text-slate-500">[ No hay registros en la cadena de bloques ]</p>
      )}

      {transactions.map((transaction) => {
        const isPack = transaction.transactionType === "BUY_PACK";
        const firstCard = cardMap.get(transaction.purchasedCardIds[0]);
        return (
          <article key={transaction.id} className="flex items-center gap-3 rounded-lg border border-cyan-900/40 bg-[#071321]/80 p-2 shadow-sm transition-colors hover:border-cyan-500/50">
            <div className="flex w-[50px] shrink-0 -space-x-3 pl-1 sm:w-[60px]">
              {transaction.purchasedCardIds.slice(0, 3).map((cardId, index) => {
                const card = cardMap.get(cardId);
                if (!card) return null;
                return (
                  <div key={`${transaction.id}-${cardId}-${index}`} className="relative h-11 w-8 overflow-hidden rounded border border-cyan-700/50 bg-[#02050a] shadow-lg">
                    <div className="pointer-events-none absolute left-0 top-0 h-[340px] w-[260px] origin-top-left scale-[0.12]">
                      <Card card={card} />
                    </div>
                  </div>
                );
              })}
              {transaction.purchasedCardIds.length > 3 && (
                <div className="relative z-[5] flex h-11 w-8 items-center justify-center rounded border border-cyan-800/50 bg-[#020a14] text-[9px] font-bold text-cyan-400 shadow-lg">
                  +{transaction.purchasedCardIds.length - 3}
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="flex items-center gap-1.5">
                {isPack ? <PackageOpen size={12} className="shrink-0 text-fuchsia-400" /> : <CreditCard size={12} className="shrink-0 text-cyan-400" />}
                <h4 className="truncate text-[10px] font-black uppercase tracking-wider text-cyan-100 sm:text-[11px]">
                  {isPack ? "Pack de Datos" : firstCard?.name || "Carta de Red"}
                </h4>
              </div>
              <div className="mt-1 flex items-center gap-3 text-[8px] text-slate-400 sm:text-[9px]">
                <span className="flex items-center gap-1"><CalendarDays size={10} /> {formatMarketTransactionDate(transaction.createdAtIso)}</span>
                <span className="flex items-center gap-1 font-mono text-cyan-600/80"><Hash size={10} /> {transaction.id.slice(0, 6)}</span>
              </div>
            </div>

            <div className="shrink-0 pr-2 text-right">
              <span className="font-mono text-[11px] font-black text-rose-400 drop-shadow-[0_0_5px_rgba(225,29,72,0.4)] sm:text-xs">
                -{transaction.amountNexus} NX
              </span>
            </div>
          </article>
        );
      })}
    </motion.div>
  );
}
