// src/components/hub/market/items/MarketItemsPanel.tsx - Sección de OBJETOS del mercado: caramelos (USB Raro,
// suben de nivel) y objetos de mejora (Núcleo Overclock / Placa Blindada, ATK/DEF permanente).
//
// Los objetos no son cartas, así que tienen su propio panel. La compra es idempotente: cada clic manda una
// clave de operación, de modo que un doble clic o un reintento de red no cobran dos veces.
"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Package, Shield, Swords } from "lucide-react";
import { IShopCandyItem, IShopItems, IShopUpgradeItem } from "@/services/market/shop-items";
import { MarketNexusSpendFloat } from "@/components/hub/market/internal/MarketNexusSpendFloat";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface IMarketItemsPanelProps {
  walletNexus: number;
  onWalletChange: (nexus: number) => void;
  onError: (message: string) => void;
}

interface IBuyableRow {
  id: string;
  name: string;
  subtitle: string;
  icon: typeof Package;
  priceNexus: number;
  imageUrl: string | null;
  owned: number;
  kind: "CANDY" | "UPGRADE";
}

function candyToRow(item: IShopCandyItem): IBuyableRow {
  return { id: item.id, name: item.name, subtitle: `Sube +${item.levels} ${item.levels === 1 ? "nivel" : "niveles"} a una carta`, icon: Package, priceNexus: item.priceNexus, imageUrl: item.imageUrl, owned: item.owned, kind: "CANDY" };
}

function upgradeToRow(item: IShopUpgradeItem): IBuyableRow {
  const isAttack = item.stat === "ATTACK";
  return { id: item.id, name: item.name, subtitle: `+${item.value} ${isAttack ? "ATAQUE" : "DEFENSA"} permanente`, icon: isAttack ? Swords : Shield, priceNexus: item.priceNexus, imageUrl: item.imageUrl, owned: item.owned, kind: "UPGRADE" };
}

function ItemCard({ row, walletNexus, isBuying, spendFloatId, onBuy }: { row: IBuyableRow; walletNexus: number; isBuying: boolean; spendFloatId: number; onBuy: (row: IBuyableRow) => void }) {
  const cannotAfford = walletNexus < row.priceNexus;
  const Icon = row.icon;
  return (
    <motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="relative flex min-w-0 items-center gap-3 overflow-hidden rounded-xl border border-amber-500/35 bg-[#0a0703]/70 p-3">
      <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
        {row.imageUrl ? <Image src={row.imageUrl} alt="" fill sizes="64px" className="object-contain" /> : <Icon className="h-full w-full text-amber-400/60" aria-hidden />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-black uppercase tracking-wide text-amber-100">{row.name}</p>
        <p className="text-[11px] text-slate-300">{row.subtitle}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-slate-500">Tienes: {row.owned}</p>
      </div>
      <button
        type="button"
        disabled={cannotAfford || isBuying}
        onClick={() => onBuy(row)}
        aria-label={`Comprar ${row.name} por ${row.priceNexus} Nexus`}
        className="relative flex min-h-[44px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-300/70 bg-amber-500/15 px-3 font-display text-xs font-black uppercase tracking-wide text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {/* Mismo flotante "-N NX" que las compras de cartas/packs. */}
        <MarketNexusSpendFloat amount={row.priceNexus} triggerId={spendFloatId} className="-right-1 -top-1" />
        <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5" aria-hidden />{row.priceNexus}</span>
        <span className="text-[9px] tracking-widest text-amber-300/80">{isBuying ? "…" : cannotAfford ? "Sin Nexus" : "Comprar"}</span>
      </button>
    </motion.li>
  );
}

export function MarketItemsPanel({ walletNexus, onWalletChange, onError }: IMarketItemsPanelProps) {
  const [items, setItems] = useState<IShopItems | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  // Flotante "-N NX" por objeto: se dispara sobre el objeto recién comprado, igual que en las cartas.
  const [spendFloat, setSpendFloat] = useState<{ id: string; trigger: number }>({ id: "", trigger: 0 });
  const spendTimeoutRef = useRef<number | null>(null);
  const { play } = useHubModuleSfx();

  useEffect(() => {
    let active = true;
    void fetch("/api/market/items", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: IShopItems) => { if (active) setItems({ candies: body.candies ?? [], upgrades: body.upgrades ?? [] }); })
      .catch(() => { if (active) setItems({ candies: [], upgrades: [] }); });
    return () => { active = false; };
  }, []);

  useEffect(() => () => { if (spendTimeoutRef.current !== null) window.clearTimeout(spendTimeoutRef.current); }, []);

  const handleBuy = useCallback(
    async (row: IBuyableRow) => {
      if (buyingId) return;
      setBuyingId(row.id);
      try {
        const response = await fetch("/api/market/buy-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: row.kind, itemId: row.id, operationId: crypto.randomUUID() }),
        });
        const body = (await response.json()) as { nexus?: number; items?: IShopItems; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo comprar el objeto.");
        if (typeof body.nexus === "number") onWalletChange(body.nexus);
        if (body.items) setItems(body.items);
        // Mismo sonido y flotante que las compras de cartas.
        play("BUY_CARD");
        setSpendFloat((previous) => ({ id: row.id, trigger: previous.trigger + 1 }));
        if (spendTimeoutRef.current !== null) window.clearTimeout(spendTimeoutRef.current);
        spendTimeoutRef.current = window.setTimeout(() => setSpendFloat({ id: "", trigger: 0 }), 1280);
      } catch (error) {
        onError(error instanceof Error ? error.message : "No se pudo comprar el objeto.");
      } finally {
        setBuyingId(null);
      }
    },
    [buyingId, onError, onWalletChange, play],
  );

  if (items === null) {
    return <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>;
  }

  const candyRows = items.candies.map(candyToRow);
  const upgradeRows = items.upgrades.map(upgradeToRow);

  return (
    <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-1">
      <section>
        <header className="mb-2 flex items-center gap-2">
          <Package className="h-4 w-4 text-amber-300" aria-hidden />
          <div>
            <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-amber-100">Caramelos de nivel</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/70">Suben de nivel una carta al instante</p>
          </div>
        </header>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {candyRows.map((row) => <ItemCard key={row.id} row={row} walletNexus={walletNexus} isBuying={buyingId === row.id} spendFloatId={spendFloat.id === row.id ? spendFloat.trigger : 0} onBuy={handleBuy} />)}
        </ul>
      </section>

      <section>
        <header className="mb-2 flex items-center gap-2">
          <Swords className="h-4 w-4 text-amber-300" aria-hidden />
          <div>
            <h2 className="font-display text-sm font-black uppercase tracking-[0.18em] text-amber-100">Mejoras de atributos</h2>
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/70">ATK/DEF permanente · se aplican desde el Arsenal</p>
          </div>
        </header>
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {upgradeRows.map((row) => <ItemCard key={row.id} row={row} walletNexus={walletNexus} isBuying={buyingId === row.id} spendFloatId={spendFloat.id === row.id ? spendFloat.trigger : 0} onBuy={handleBuy} />)}
        </ul>
      </section>
    </div>
  );
}
