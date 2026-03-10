// src/components/hub/market/MarketCardInspector.tsx - Muestra el detalle de carta seleccionada y compra contextual en el mercado.
"use client";

import { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MarketCardInspectorSelectedView } from "@/components/hub/market/internal/MarketCardInspectorSelectedView";

interface MarketCardInspectorProps {
  selectedCard: ICard | null;
  selectedListing: IMarketCardListing | null;
  isCompactMode?: boolean;
  onBuyCard: (listingId: string) => Promise<boolean>;
}

export function MarketCardInspector({ selectedCard, selectedListing, isCompactMode = false, onBuyCard }: MarketCardInspectorProps) {
  const [floatingSpendId, setFloatingSpendId] = useState(0);
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState(false);
  const [isCardRenderDeferred, setIsCardRenderDeferred] = useState(false);
  const floatingTimeoutRef = useRef<number | null>(null);
  const deferredCardTimeoutRef = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (floatingTimeoutRef.current === null) return;
      window.clearTimeout(floatingTimeoutRef.current);
      if (deferredCardTimeoutRef.current !== null) window.clearTimeout(deferredCardTimeoutRef.current);
    },
    [],
  );
  useEffect(() => {
    if (!isCompactMode || !selectedCard) {
      setIsCardRenderDeferred(false);
      return;
    }
    setIsCardRenderDeferred(true);
    if (deferredCardTimeoutRef.current !== null) window.clearTimeout(deferredCardTimeoutRef.current);
    deferredCardTimeoutRef.current = window.setTimeout(() => {
      setIsCardRenderDeferred(false);
      deferredCardTimeoutRef.current = null;
    }, 220);
  }, [isCompactMode, selectedCard]);
  const handleBuyClick = async (listingId: string) => {
    if (isSubmittingPurchase) return;
    setIsSubmittingPurchase(true);
    let wasBought = false;
    try {
      wasBought = await onBuyCard(listingId);
    } finally {
      setIsSubmittingPurchase(false);
    }
    if (!wasBought) return;
    setFloatingSpendId((previous) => previous + 1);
    if (floatingTimeoutRef.current !== null) window.clearTimeout(floatingTimeoutRef.current);
    floatingTimeoutRef.current = window.setTimeout(() => {
      setFloatingSpendId(0);
      floatingTimeoutRef.current = null;
    }, 1280);
  };

  return (
    <aside className="flex flex-col h-full overflow-hidden p-4 relative">
      <h2 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-cyan-500/80 shrink-0">
        Inspección de Datos
      </h2>

      {selectedCard ? (
        <MarketCardInspectorSelectedView
          selectedCard={selectedCard}
          selectedListing={selectedListing}
          isCompactMode={isCompactMode}
          isCardRenderDeferred={isCardRenderDeferred}
          isSubmittingPurchase={isSubmittingPurchase}
          floatingSpendId={floatingSpendId}
          onBuyClick={handleBuyClick}
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full opacity-30">
          <div className="w-[180px] h-[250px] border border-cyan-500/30 border-dashed rounded-xl flex items-center justify-center bg-cyan-950/10">
            <ScanLine className="w-12 h-12 text-cyan-500/50 animate-pulse" />
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.3em] font-black text-cyan-300 text-center">
            Esperando Selección<br />de Datos...
          </p>
        </div>
      )}
    </aside>
  );
}
