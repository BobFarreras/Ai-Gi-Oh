// src/components/hub/market/packs/MarketPacksPanel.tsx - Panel de sobres con selección horizontal y compra del pack activo.
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { PackageOpen, X } from "lucide-react";
import { MarketPackCardTile } from "@/components/hub/market/packs/MarketPackCardTile";
import { MarketNexusSpendFloat } from "@/components/hub/market/internal/MarketNexusSpendFloat";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";

interface MarketPacksPanelProps {
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  onSelectPack: (packId: string) => void;
  onClearPackSelection: () => void;
  onBuyPack: (packId: string) => Promise<boolean>;
}

export function MarketPacksPanel({
  packs,
  selectedPackId,
  onSelectPack,
  onClearPackSelection,
  onBuyPack,
}: MarketPacksPanelProps) {
  const [floatingSpendId, setFloatingSpendId] = useState(0);
  const floatingTimeoutRef = useRef<number | null>(null);
  const activePack = packs.find((pack) => pack.id === selectedPackId);
  useEffect(
    () => () => {
      if (floatingTimeoutRef.current === null) return;
      window.clearTimeout(floatingTimeoutRef.current);
    },
    [],
  );
  const handleBuyPack = async () => {
    if (!activePack) return;
    const wasBought = await onBuyPack(activePack.id);
    if (!wasBought) return;
    setFloatingSpendId((previous) => previous + 1);
    if (floatingTimeoutRef.current !== null) window.clearTimeout(floatingTimeoutRef.current);
    floatingTimeoutRef.current = window.setTimeout(() => {
      setFloatingSpendId(0);
      floatingTimeoutRef.current = null;
    }, 1280);
  };

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-cyan-900/50 pb-2">
        <button
          type="button"
          onClick={onClearPackSelection}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${
            selectedPackId === null
              ? "cursor-default border border-cyan-400 bg-cyan-950/80 text-cyan-100 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
              : "cursor-pointer border border-cyan-800/50 bg-[#020a14]/60 text-cyan-500 hover:border-cyan-400 hover:text-cyan-200"
          }`}
        >
          {selectedPackId !== null && <X size={12} />}
          Cartas Sueltas
        </button>

        {activePack ? (
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            type="button"
            onClick={() => void handleBuyPack()}
            className="group relative flex items-center gap-2 overflow-visible rounded-lg border border-fuchsia-400/60 bg-fuchsia-900/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-fuchsia-200 shadow-[0_0_15px_rgba(192,38,211,0.2)] transition-all hover:bg-fuchsia-800/60"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shine_1s_infinite]" />
            <MarketNexusSpendFloat amount={activePack.priceNexus} triggerId={floatingSpendId} className="-right-2 top-0" />
            <PackageOpen size={14} className="text-fuchsia-300" />
            Comprar x {activePack.priceNexus} NX
          </motion.button>
        ) : (
          <span className="pr-2 text-[9px] uppercase tracking-widest text-cyan-500/50">Selecciona un Pack</span>
        )}
      </div>

      <div className="home-modern-scroll min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 pr-2">
        <div className="flex h-full min-w-full w-max items-center gap-4">
          {packs.map((pack) => (
            <MarketPackCardTile
              key={pack.id}
              pack={pack}
              isSelected={selectedPackId === pack.id}
              onSelect={() => onSelectPack(pack.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
