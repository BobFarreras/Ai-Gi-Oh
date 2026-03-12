// src/components/hub/market/vault/MarketVaultCollectionTab.tsx - Renderiza la pestaña de almacén con cartas reales y contador de copias.
"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { useProgressiveRenderLimit } from "@/components/hub/internal/useProgressiveRenderLimit";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { ICard } from "@/core/entities/ICard";
import { useEffect, useState } from "react";

interface MarketVaultCollectionTabProps {
  collection: ICollectionCard[];
  onSelectCard: (card: ICard) => void;
  isPerformanceMode: boolean;
}

export function MarketVaultCollectionTab({ collection, onSelectCard, isPerformanceMode }: MarketVaultCollectionTabProps) {
  const [isLiteBackgroundEnabled, setIsLiteBackgroundEnabled] = useState(!isPerformanceMode);
  const renderLimit = useProgressiveRenderLimit({
    total: collection.length,
    initialLimit: isPerformanceMode ? 6 : 16,
    step: isPerformanceMode ? 8 : 12,
    intervalMs: isPerformanceMode ? 90 : 70,
  });
  const visibleCollection = collection.slice(0, renderLimit);
  useEffect(() => {
    if (!isPerformanceMode) return;
    const idleHandle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => setIsLiteBackgroundEnabled(true), { timeout: 1200 })
        : window.setTimeout(() => setIsLiteBackgroundEnabled(true), 900);
    return () => {
      if (typeof idleHandle === "number") {
        window.clearTimeout(idleHandle);
        return;
      }
      window.cancelIdleCallback?.(idleHandle);
    };
  }, [isPerformanceMode]);
  return (
    <motion.div
      key="collection"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="grid w-full grid-cols-4 justify-items-center gap-2 pb-4 xl:grid-cols-4 xl:gap-3"
    >
      {visibleCollection.map((entry) => (
        <article
          key={entry.card.id}
          onClick={() => onSelectCard(entry.card)}
          className="group relative aspect-[3/4] w-full max-w-[86px] cursor-pointer rounded-lg border border-cyan-900/50 bg-[#02060d] p-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.8)]"
        >
          <div className="pointer-events-none relative h-full w-full overflow-hidden rounded">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className={isPerformanceMode ? "origin-center scale-[0.25] sm:scale-[0.27]" : "origin-center scale-[0.31]"}>
                <Card
                  card={entry.card}
                  disableHoverEffects={isPerformanceMode}
                  disableDefaultShadow={isPerformanceMode}
                  isPerformanceMode={isPerformanceMode}
                  showBackgroundInPerformanceMode={isLiteBackgroundEnabled}
                />
              </div>
            </div>
          </div>

          <div className="absolute -right-2 -top-2 z-10 rounded border border-emerald-500/50 bg-black/95 px-1.5 py-0.5 shadow-md">
            <span className="text-[9px] font-mono font-black tracking-widest text-emerald-400">x{entry.ownedCopies}</span>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-cyan-400/0 transition-all group-hover:ring-cyan-400/50" />
        </article>
      ))}
    </motion.div>
  );
}
