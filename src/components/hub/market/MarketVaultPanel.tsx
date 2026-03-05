// src/components/hub/market/MarketVaultPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HomeMiniCard } from "@/components/hub/home/HomeMiniCard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { PackageOpen, CreditCard, CalendarDays, Hash } from "lucide-react";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { ICard } from "@/core/entities/ICard";
import { Card } from "@/components/game/card/Card";

interface MarketVaultPanelProps {
  collection: ICollectionCard[];
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
  onSelectCard: (card: ICard) => void;
}

function formatTransactionDate(createdAtIso: string): string {
  const date = new Date(createdAtIso);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date).toUpperCase();
}

export function MarketVaultPanel({ collection, transactions, catalogListings, onSelectCard }: MarketVaultPanelProps) {
  const [activeTab, setActiveTab] = useState<"COLLECTION" | "HISTORY">("COLLECTION");
  
  const orderedCollection = useMemo(
    () => [...collection].sort((left, right) => right.ownedCopies - left.ownedCopies || left.card.name.localeCompare(right.card.name)),
    [collection],
  );

  const cardMap = useMemo(() => {
    const map = new Map<string, ICard>();
    catalogListings.forEach(l => map.set(l.card.id, l.card));
    return map;
  }, [catalogListings]);

  return (
    // REFACTOR CLAVE: flex-1, w-full y h-full obligan a la sección a respetar el límite del Scene
    <section className="flex flex-col flex-1 h-full w-full rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 overflow-hidden">
      
      {/* PESTAÑAS (TABS) */}
      <header className="flex items-center gap-2 border-b border-cyan-900/50 pb-2 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("COLLECTION")}
          className={`flex-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            activeTab === "COLLECTION" 
              ? "border border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
              : "border border-cyan-900/40 text-cyan-500/60 hover:text-cyan-300 hover:bg-cyan-900/20"
          }`}
        >
          Almacén
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`flex-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
            activeTab === "HISTORY" 
              ? "border border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]" 
              : "border border-cyan-900/40 text-cyan-500/60 hover:text-cyan-300 hover:bg-cyan-900/20"
          }`}
        >
          Historial
        </button>
      </header>

      {/* CONTENEDOR CON SCROLL NATIVO */}
      <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-3 pr-2">
        <AnimatePresence mode="wait">
          
          {activeTab === "COLLECTION" ? (
            <motion.div 
              key="collection"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              // Se eliminó h-max para permitir que el scroll fluya con naturalidad
              className="flex flex-wrap gap-3 justify-center w-full pb-4"
            >
              {orderedCollection.map((entry) => (
                <motion.article 
                  key={entry.card.id} 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative w-[88px] aspect-[3/4] cursor-pointer group shrink-0 bg-[#02060d] border border-cyan-900/50 rounded-lg p-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
                  onClick={() => onSelectCard(entry.card)}
                >
                  <div className="relative w-full h-full rounded pointer-events-none overflow-hidden">
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="scale-[0.31] origin-center">
                          <Card card={entry.card} />
                        </div>
                      </div>
                  </div>
                  
                  <div className="absolute -top-2 -right-2 z-10 rounded border border-emerald-500/50 bg-black/95 px-1.5 py-0.5 shadow-md">
                    <span className="text-[9px] font-mono font-black tracking-widest text-emerald-400">
                      x{entry.ownedCopies}
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-lg ring-1 ring-cyan-400/0 group-hover:ring-cyan-400/50 transition-all pointer-events-none" />
                </motion.article>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col gap-2 pb-4"
            >
              {transactions.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-8 font-mono">
                  [ No hay registros en la cadena de bloques ]
                </p>
              )}
              
              {transactions.map((transaction) => {
                const isPack = transaction.transactionType === "BUY_PACK";
                const firstCard = cardMap.get(transaction.purchasedCardIds[0]);
                
                return (
                  // REFACTOR: Recibo horizontal de 1 sola fila
                  <article key={transaction.id} className="flex items-center gap-3 rounded-lg border border-cyan-900/40 bg-[#071321]/80 p-2 shadow-sm hover:border-cyan-500/50 transition-colors">
                    
                    {/* 1. IMÁGENES (A la izquierda) */}
                    <div className="flex shrink-0 -space-x-3 w-[50px] sm:w-[60px] pl-1">
                      {transaction.purchasedCardIds.slice(0, 3).map((cardId, idx) => {
                        const card = cardMap.get(cardId);
                        if (!card) return null;
                        return (
                          <div key={`${transaction.id}-${cardId}-${idx}`} className="relative w-8 h-11 rounded border border-cyan-700/50 overflow-hidden shadow-lg bg-[#02050a] z-[10]">
                            <div className="absolute top-0 left-0 w-[260px] h-[340px] origin-top-left scale-[0.12] pointer-events-none">
                              <Card card={card} />
                            </div>
                          </div>
                        );
                      })}
                      {transaction.purchasedCardIds.length > 3 && (
                        <div className="relative w-8 h-11 rounded border border-cyan-800/50 bg-[#020a14] flex items-center justify-center text-[9px] font-bold text-cyan-400 z-[5] shadow-lg">
                          +{transaction.purchasedCardIds.length - 3}
                        </div>
                      )}
                    </div>

                    {/* 2. INFO DE LA CARTA (Centro expandible) */}
                    <div className="flex flex-1 flex-col min-w-0 justify-center">
                      <div className="flex items-center gap-1.5">
                        {isPack ? <PackageOpen size={12} className="text-fuchsia-400 shrink-0" /> : <CreditCard size={12} className="text-cyan-400 shrink-0" />}
                        <h4 className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-cyan-100 truncate">
                          {isPack ? "Pack de Datos" : firstCard?.name || "Carta de Red"}
                        </h4>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-1 text-[8px] sm:text-[9px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={10} /> {formatTransactionDate(transaction.createdAtIso)}
                        </span>
                        <span className="flex items-center gap-1 font-mono text-cyan-600/80">
                          <Hash size={10} /> {transaction.id.slice(0, 6)}
                        </span>
                      </div>
                    </div>

                    {/* 3. PRECIO (A la derecha) */}
                    <div className="shrink-0 text-right pr-2">
                      <span className="text-[11px] sm:text-xs font-mono font-black text-rose-400 drop-shadow-[0_0_5px_rgba(225,29,72,0.4)]">
                        -{transaction.amountNexus} NX
                      </span>
                    </div>

                  </article>
                );
              })}
            </motion.div>
          )}
          
        </AnimatePresence>
      </div>
    </section>
  );
}