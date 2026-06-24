// src/components/hub/progression/EventPanel.tsx - Diálogo táctico del evento: balance de moneda, countdown y tienda de canje con miniaturas de carta del juego (CardThumbnail).
"use client";

import { useState } from "react";
import { IEventOverview, IEventShopItem } from "@/core/entities/progression/IEvent";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { Card } from "@/components/game/card/Card";
import { track } from "@/services/analytics/client/analytics-buffer";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";

interface IEventPanelProps {
  overview: IEventOverview;
  onClose: () => void;
}

function formatRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Finalizado";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `Termina en ${days}d ${hours}h` : `Termina en ${hours}h`;
}

function ShopItem({
  item,
  balance,
  onRedeemed,
}: {
  item: IEventShopItem;
  balance: number;
  onRedeemed: (itemId: string, newBalance: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const card = CARD_BY_ID.get(item.cardId);
  const soldOut = item.owned >= item.perPlayerLimit;
  const affordable = balance >= item.costPoints;

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
    <div className="flex flex-col gap-2 border border-fuchsia-900/40 bg-[#0a0716]/80 p-2" style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
      <div className="relative mx-auto h-[200px] w-[137px] overflow-hidden">
        {card ? (
          <div style={{ width: 260, height: 380, transform: "scale(0.527)", transformOrigin: "top left" }}>
            <Card card={card} disableHoverEffects disableHologram disableDefaultShadow />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center border border-slate-700 bg-slate-900 text-[10px] text-slate-500">{item.cardId}</div>
        )}
        {soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/65 font-mono text-xs font-black uppercase tracking-widest text-emerald-300">Obtenida</div>
        ) : null}
      </div>
      <p className="text-center font-mono text-[11px] uppercase tracking-wider text-slate-400">{item.owned}/{item.perPlayerLimit}</p>
      <button
        type="button"
        disabled={busy || soldOut || !affordable}
        className="flex h-9 w-full items-center justify-center gap-1 bg-fuchsia-600 font-mono text-sm font-black uppercase tracking-[0.12em] text-white transition hover:bg-fuchsia-500 disabled:bg-slate-800 disabled:text-slate-600"
        style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
        onClick={handleRedeem}
      >
        {soldOut ? "Agotada" : busy ? "…" : `${item.costPoints}`}
        {!soldOut && !busy ? <span className="text-[11px] text-fuchsia-200/80">pts</span> : null}
      </button>
      {error ? <p className="text-center text-xs text-rose-300">{error}</p> : null}
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
    <ProgressionDialogShell
      title={overview.name}
      subtitle={formatRemaining(overview.endsAt)}
      accent="fuchsia"
      onClose={onClose}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
        </svg>
      }
      headerExtra={
        <div className="flex items-center justify-between border border-fuchsia-700/40 bg-fuchsia-500/10 px-4 py-2.5" style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-fuchsia-300">{overview.currencyName}</span>
          <span className="font-mono text-2xl font-black text-fuchsia-100">{balance.toLocaleString()}</span>
        </div>
      }
    >
      {overview.description ? <p className="mb-3 text-sm leading-relaxed text-slate-300">{overview.description}</p> : null}
      <h3 className="mb-2.5 font-mono text-xs font-black uppercase tracking-[0.2em] text-fuchsia-400/80">Tienda de canje</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <ShopItem key={item.itemId} item={item} balance={balance} onRedeemed={handleRedeemed} />
        ))}
      </div>
    </ProgressionDialogShell>
  );
}
