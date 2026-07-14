// src/components/hub/market/items/MarketItemsPanel.tsx - Pestaña de OBJETOS del mercado (USB Raro).
//
// Los objetos no son cartas (no tienen ATK/DEF ni se invocan), así que tienen su propio panel en vez de colarse
// en el listado de cartas. La compra es idempotente: cada clic manda una clave de operación, de modo que un
// doble clic o un reintento de red no cobran dos veces.
"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Package } from "lucide-react";
import { IShopItem } from "@/services/market/shop-items";

interface IMarketItemsPanelProps {
  walletNexus: number;
  onWalletChange: (nexus: number) => void;
  onError: (message: string) => void;
}

export function MarketItemsPanel({ walletNexus, onWalletChange, onError }: IMarketItemsPanelProps) {
  const [items, setItems] = useState<IShopItem[] | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/market/items", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { items?: IShopItem[] }) => {
        if (active) setItems(body.items ?? []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleBuy = useCallback(
    async (item: IShopItem) => {
      if (buyingId) return;
      setBuyingId(item.id);
      try {
        const response = await fetch("/api/market/buy-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // La clave de operación es lo que hace la compra idempotente en el servidor.
          body: JSON.stringify({ itemId: item.id, operationId: crypto.randomUUID() }),
        });
        const body = (await response.json()) as { nexus?: number; items?: IShopItem[]; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo comprar el objeto.");
        if (typeof body.nexus === "number") onWalletChange(body.nexus);
        if (body.items) setItems(body.items);
      } catch (error) {
        onError(error instanceof Error ? error.message : "No se pudo comprar el objeto.");
      } finally {
        setBuyingId(null);
      }
    },
    [buyingId, onError, onWalletChange],
  );

  if (items === null) {
    return <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>;
  }

  return (
    <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-1">
      <header className="flex items-center gap-2 px-1">
        <Package className="h-4 w-4 text-amber-300" aria-hidden />
        <div>
          <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-amber-100">Objetos</h2>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/70">
            El USB Raro sube de nivel una carta al instante
          </p>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const cannotAfford = walletNexus < item.priceNexus;
          const isBuying = buyingId === item.id;
          return (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-amber-500/35 bg-[#0a0703]/70 p-3"
            >
              <div className="relative h-16 w-16 shrink-0">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-contain" />
                ) : (
                  <Package className="h-full w-full text-amber-400/60" aria-hidden />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-black uppercase tracking-wide text-amber-100">{item.name}</p>
                <p className="text-[11px] text-slate-300">
                  Sube <span className="font-black text-emerald-300">+{item.levels}</span> {item.levels === 1 ? "nivel" : "niveles"} a una carta
                </p>
                <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  Tienes: {item.owned}
                </p>
              </div>

              <button
                type="button"
                disabled={cannotAfford || isBuying}
                onClick={() => void handleBuy(item)}
                aria-label={`Comprar ${item.name} por ${item.priceNexus} Nexus`}
                className="flex min-h-[44px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-300/70 bg-amber-500/15 px-3 font-display text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5" aria-hidden />
                  {item.priceNexus}
                </span>
                <span className="text-[9px] tracking-widest text-amber-300/80">
                  {isBuying ? "…" : cannotAfford ? "Sin Nexus" : "Comprar"}
                </span>
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
