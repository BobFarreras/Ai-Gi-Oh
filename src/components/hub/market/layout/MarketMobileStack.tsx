// src/components/hub/market/layout/MarketMobileStack.tsx - Layout móvil del mercado con paneles conmutables por pestañas.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, type PointerEvent } from "react";
import { X } from "lucide-react";
import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { MarketVaultPanel } from "@/components/hub/market/vault/MarketVaultPanel";
import { MarketMobilePacksSection } from "@/components/hub/market/layout/MarketMobilePacksSection";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { cn } from "@/lib/utils";

type MobilePanel = "LISTINGS" | "PACKS" | "VAULT";

interface MarketMobileStackProps {
  selectedCard: ICard | null;
  selectedListing: IMarketCardListing | null;
  listings: IMarketCardListing[];
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  collection: ICollectionCard[];
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
  isBuyingPack: boolean;
  onBuyCard: (listingId: string) => Promise<void>;
  onBuyPack: (packId: string) => Promise<void>;
  onSelectPack: (packId: string) => void;
  onShowFreeListings: () => void;
  onSelectListing: (listing: IMarketCardListing) => void;
  onSelectVaultCard: (card: ICard) => void;
}

const PANEL_TABS: Array<{ id: MobilePanel; label: string }> = [
  { id: "LISTINGS", label: "Mercado" },
  { id: "PACKS", label: "Packs" },
  { id: "VAULT", label: "Almacén" },
];

export function MarketMobileStack(props: MarketMobileStackProps) {
  const [activePanel, setActivePanel] = useState<MobilePanel>("LISTINGS");
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectorOrigin, setInspectorOrigin] = useState({ x: 0, y: 0 });
  const dialogAnimation = useMemo(() => {
    const centerX = typeof window === "undefined" ? 0 : window.innerWidth / 2;
    const centerY = typeof window === "undefined" ? 0 : window.innerHeight / 2;
    return { x: inspectorOrigin.x - centerX, y: inspectorOrigin.y - centerY };
  }, [inspectorOrigin.x, inspectorOrigin.y]);
  const packListings = useMemo(() => {
    if (!props.selectedPackId) return [];
    const selectedPack = props.packs.find((pack) => pack.id === props.selectedPackId);
    if (!selectedPack) return [];
    const packCardIds = new Set(selectedPack.previewCardIds);
    return props.catalogListings.filter((listing) => packCardIds.has(listing.card.id));
  }, [props.catalogListings, props.packs, props.selectedPackId]);

  const capturePointerOrigin = (event: PointerEvent<HTMLDivElement>) => {
    setInspectorOrigin({ x: event.clientX, y: event.clientY });
  };

  const handleSelectListing = (listing: IMarketCardListing) => {
    props.onSelectListing(listing);
    setIsInspectorOpen(true);
  };
  const handleSelectVaultCard = (card: ICard) => {
    props.onSelectVaultCard(card);
    setIsInspectorOpen(true);
  };

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 xl:hidden" onPointerDownCapture={capturePointerOrigin}>
      <nav aria-label="Paneles del mercado" className="home-modern-scroll flex gap-2 overflow-x-auto pb-1">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-label={`Mostrar ${tab.label}`}
            onClick={() => {
              setActivePanel(tab.id);
              if (tab.id === "LISTINGS") props.onShowFreeListings();
            }}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
              activePanel === tab.id
                ? "border-cyan-400 bg-cyan-950/70 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                : "border-cyan-900/40 bg-[#02101f]/70 text-cyan-400/75",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {activePanel === "LISTINGS" ? <MarketListingsPanel listings={props.listings} onSelectCard={handleSelectListing} /> : null}
        {activePanel === "PACKS" ? (
          <MarketMobilePacksSection
            packs={props.packs}
            selectedPackId={props.selectedPackId}
            packListings={packListings}
            isBuyingPack={props.isBuyingPack}
            onSelectPack={props.onSelectPack}
            onBuyPack={props.onBuyPack}
            onSelectPackCard={handleSelectListing}
          />
        ) : null}
        {activePanel === "VAULT" ? (
          <MarketVaultPanel
            collection={props.collection}
            transactions={props.transactions}
            catalogListings={props.catalogListings}
            onSelectCard={handleSelectVaultCard}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {isInspectorOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 top-[74px] z-[220] bg-black/46"
            onClick={() => setIsInspectorOpen(false)}
          >
            <motion.div
              onClick={(event) => event.stopPropagation()}
              initial={{ opacity: 0, scale: 0.18, x: dialogAnimation.x, y: dialogAnimation.y }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="fixed bottom-[max(8px,env(safe-area-inset-bottom))] left-2 right-2 top-[78px] mx-auto flex max-w-lg flex-col overflow-hidden rounded-xl border border-cyan-500/45 bg-[#020a14] shadow-[0_0_40px_rgba(0,0,0,0.65)]"
            >
              <button
                type="button"
                aria-label="Cerrar inspección"
                onClick={() => setIsInspectorOpen(false)}
                className="absolute right-3 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-md border border-cyan-400/60 bg-[#03172b] text-cyan-200"
              >
                <X size={16} />
              </button>
              <div className="min-h-0 flex-1 overflow-hidden">
                <MarketCardInspector
                  selectedCard={props.selectedCard}
                  selectedListing={props.selectedListing}
                  onBuyCard={props.onBuyCard}
                />
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
