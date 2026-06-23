// src/components/hub/progression/EventPanel.tsx - Panel del evento activo: balance de moneda, countdown y tienda de canje de cartas.
"use client";

import { useState } from "react";
import Image from "next/image";
import { IEventOverview, IEventShopItem } from "@/core/entities/progression/IEvent";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { track } from "@/services/analytics/client/analytics-buffer";

interface IEventPanelProps {
  overview: IEventOverview;
  onClose: () => void;
}

function formatRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Finalizado";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `Termina en ${days}d ${hours}h`;
  return `Termina en ${hours}h`;
}

function ShopItem({
  item,
  currencyName,
  balance,
  onRedeemed,
}: {
  item: IEventShopItem;
  currencyName: string;
  balance: number;
  onRedeemed: (itemId: string, newBalance: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = CARD_BY_ID.get(item.cardId);
  const soldOut = item.owned >= item.perPlayerLimit;
  const affordable = balance >= item.costPoints;
  const imageUrl = card?.renderUrl ?? card?.bgUrl ?? null;

  async function handleRedeem() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/progression/events/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.itemId }),
      });
      if (!response.ok) throw new Error("redeem failed");
      const data = (await response.json()) as { balance: number };
      onRedeemed(item.itemId, data.balance);
      track("event_item_redeemed", "shop", { itemId: item.itemId, cardId: item.cardId, costPoints: item.costPoints });
    } catch {
      setError("No se pudo canjear.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-lg border border-slate-700 bg-slate-800/50 p-2">
      <div className="relative mb-2 aspect-[3/4] w-full overflow-hidden rounded-md border border-slate-700 bg-slate-900">
        {imageUrl ? <Image src={imageUrl} alt={card?.name ?? item.cardId} fill sizes="120px" className="object-cover" /> : null}
      </div>
      <p className="truncate text-xs font-bold text-slate-100">{card?.name ?? item.cardId}</p>
      <p className="mb-1 text-[10px] text-slate-400">{item.owned}/{item.perPlayerLimit} canjeada(s)</p>
      <button
        type="button"
        disabled={busy || soldOut || !affordable}
        className="h-8 w-full rounded-md bg-fuchsia-600 text-[11px] font-black uppercase tracking-wide text-white transition hover:bg-fuchsia-500 disabled:bg-slate-700 disabled:text-slate-500"
        onClick={handleRedeem}
      >
        {soldOut ? "Agotada" : busy ? "Canjeando…" : `${item.costPoints} ${currencyName}`}
      </button>
      {error ? <p className="mt-1 text-center text-[10px] text-rose-300">{error}</p> : null}
    </div>
  );
}

export function EventPanel({ overview, onClose }: IEventPanelProps) {
  const [balance, setBalance] = useState(overview.balance);
  const [items, setItems] = useState(overview.items);

  function handleRedeemed(itemId: string, newBalance: number) {
    setBalance(newBalance);
    setItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, owned: item.owned + 1 } : item)));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" role="dialog" aria-modal="true" aria-label="Evento" onClick={onClose}>
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col gap-3 overflow-y-auto rounded-2xl border border-fuchsia-800/60 bg-slate-900 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-black uppercase tracking-widest text-fuchsia-200">{overview.name}</h2>
            <p className="text-[11px] text-slate-400">{formatRemaining(overview.endsAt)}</p>
          </div>
          <button type="button" aria-label="Cerrar" className="h-7 w-7 shrink-0 rounded-md border border-slate-600 text-slate-300 hover:bg-slate-800" onClick={onClose}>✕</button>
        </div>

        {overview.description ? <p className="text-xs text-slate-300">{overview.description}</p> : null}

        <div className="rounded-lg border border-fuchsia-700/50 bg-fuchsia-500/10 px-4 py-2 text-center">
          <p className="text-[10px] uppercase tracking-wider text-fuchsia-300">{overview.currencyName}</p>
          <p className="text-2xl font-black text-fuchsia-100">{balance.toLocaleString()}</p>
        </div>

        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">Tienda</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <ShopItem key={item.itemId} item={item} currencyName={overview.currencyName} balance={balance} onRedeemed={handleRedeemed} />
          ))}
        </div>
      </div>
    </div>
  );
}
