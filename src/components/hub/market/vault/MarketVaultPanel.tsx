// src/components/hub/market/vault/MarketVaultPanel.tsx - Panel lateral con pestañas de almacén e historial para consulta rápida.
"use client";

import { AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import { MarketVaultCollectionTab } from "@/components/hub/market/vault/MarketVaultCollectionTab";
import { MarketVaultHistoryTab } from "@/components/hub/market/vault/MarketVaultHistoryTab";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";

interface MarketVaultPanelProps {
  collection: ICollectionCard[];
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
  onSelectCard: (card: ICard) => void;
}

export function MarketVaultPanel({ collection, transactions, catalogListings, onSelectCard }: MarketVaultPanelProps) {
  const [activeTab, setActiveTab] = useState<"COLLECTION" | "HISTORY">("COLLECTION");
  const { play } = useHubModuleSfx();
  const orderedCollection = useMemo(
    () =>
      [...collection].sort(
        (left, right) => right.ownedCopies - left.ownedCopies || left.card.name.localeCompare(right.card.name),
      ),
    [collection],
  );

  return (
    <section className="flex h-full w-full flex-1 flex-col overflow-hidden rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3">
      <header className="shrink-0 border-b border-cyan-900/50 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (activeTab !== "COLLECTION") play("SECTION_SWITCH");
              setActiveTab("COLLECTION");
            }}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === "COLLECTION"
                ? "border border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "border border-cyan-900/40 text-cyan-500/60 hover:bg-cyan-900/20 hover:text-cyan-300"
            }`}
          >
            Almacén
          </button>
          <button
            type="button"
            onClick={() => {
              if (activeTab !== "HISTORY") play("SECTION_SWITCH");
              setActiveTab("HISTORY");
            }}
            className={`flex-1 rounded-lg py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
              activeTab === "HISTORY"
                ? "border border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                : "border border-cyan-900/40 text-cyan-500/60 hover:bg-cyan-900/20 hover:text-cyan-300"
            }`}
          >
            Historial
          </button>
        </div>
      </header>

      <div className="home-modern-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto pt-3 pr-2">
        <AnimatePresence mode="wait">
          {activeTab === "COLLECTION" ? (
            <MarketVaultCollectionTab collection={orderedCollection} onSelectCard={onSelectCard} />
          ) : (
            <MarketVaultHistoryTab transactions={transactions} catalogListings={catalogListings} />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
