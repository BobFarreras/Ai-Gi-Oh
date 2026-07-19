// src/components/hub/progression/EventPanel.tsx - Diálogo grande del evento: nombre destacado, saldo de Fragmentos con icono, countdown y tienda de canje con cartas reales.
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { IEventOverview, IEventShopItem } from "@/core/entities/progression/IEvent";
import { IMissionView } from "@/core/entities/progression/IMission";
import { ICard } from "@/core/entities/ICard";
import { ResponsiveGameCard } from "@/components/game/card/ResponsiveGameCard";
import { progressionActionLabel } from "@/core/services/progression/action-labels";
import { track } from "@/services/analytics/client/analytics-buffer";
import { ProgressionDialogShell } from "./internal/ProgressionDialogShell";
import { FragmentIcon } from "./internal/FragmentIcon";

interface IEventPanelProps {
  overview: IEventOverview;
  /** Retos del evento (misiones one-time que dan la moneda): se muestran junto a las reglas por acción. */
  eventMissions: IMissionView[];
  onClose: () => void;
}

function useCardsByids(cardIds: string[]): Map<string, ICard> {
  const [cards, setCards] = useState<Map<string, ICard>>(new Map());
  const uniqueIds = useMemo(() => Array.from(new Set(cardIds.filter(Boolean))), [cardIds]);
  useEffect(() => {
    if (uniqueIds.length === 0) return;
    const controller = new AbortController();
    fetch(`/api/catalog/cards-by-ids?ids=${uniqueIds.join(",")}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCards(new Map(data.map((c: ICard) => [c.id, c])));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [uniqueIds]);
  return cards;
}

function formatRemaining(endsAt: string): string {
  const ms = new Date(endsAt).getTime() - Date.now();
  if (ms <= 0) return "Evento finalizado";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `Termina en ${days}d ${hours}h` : `Termina en ${hours}h`;
}

function ObjectTile({ item, soldOut }: { item: IEventShopItem; soldOut: boolean }) {
  return (
    <div className={`flex aspect-[13/19] w-full flex-col items-center justify-center gap-2 border border-fuchsia-700/40 bg-[#100a20]/80 p-2 text-center ${soldOut ? "opacity-40 grayscale" : "drop-shadow-[0_0_18px_rgba(232,121,249,0.35)]"}`}>
      {item.objectImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.objectImageUrl} alt={item.objectName ?? "Objeto"} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-fuchsia-800/50 text-fuchsia-300 sm:h-20 sm:w-20">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="1.6" strokeLinejoin="round"><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" /><path d="M12 2v9l8-4.5M12 11L4 6.5" /></svg>
        </div>
      )}
      <p className="line-clamp-2 font-display text-[11px] font-bold uppercase tracking-wide text-fuchsia-100 sm:text-xs">{item.objectName ?? "Objeto"}</p>
      {item.objectDetail ? <p className="font-mono text-[10px] uppercase tracking-wider text-emerald-300">{item.objectDetail}</p> : null}
    </div>
  );
}

function ShopItem({ item, balance, onRedeemed, cardMap }: { item: IEventShopItem; balance: number; onRedeemed: (itemId: string, newBalance: number) => void; cardMap: Map<string, ICard> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Aviso de destino tras canjear un objeto (ficha 9b): sin él, el jugador no sabe dónde ha ido a parar.
  const [showObjectDestination, setShowObjectDestination] = useState(false);
  const isCard = item.rewardKind === "CARD";
  const card = item.cardId ? cardMap.get(item.cardId) ?? null : null;
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
      if (!isCard) setShowObjectDestination(true);
      track("event_item_redeemed", "shop", { itemId: item.itemId, cardId: item.cardId ?? item.objectId ?? "", costPoints: item.costPoints });
    } catch {
      setError("No se pudo canjear.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border border-fuchsia-900/40 bg-[#0a0716]/70 p-2 sm:gap-2.5 sm:p-3" style={{ clipPath: "polygon(9px 0,100% 0,100% calc(100% - 9px),calc(100% - 9px) 100%,0 100%,0 9px)" }}>
      <div className="relative mx-auto w-full">
        {isCard ? (
          card ? (
            <div className={`w-full ${soldOut ? "opacity-40 grayscale" : "drop-shadow-[0_0_18px_rgba(232,121,249,0.35)]"}`}>
              <ResponsiveGameCard card={card} />
            </div>
          ) : (
            <div className="flex aspect-[13/19] w-full items-center justify-center border border-slate-700 bg-slate-900 text-[10px] text-slate-500">{item.cardId}</div>
          )
        ) : (
          <ObjectTile item={item} soldOut={soldOut} />
        )}
        {soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold uppercase tracking-widest text-emerald-300">Obtenido</div>
        ) : null}
      </div>
      <p className="text-center font-mono text-[11px] uppercase tracking-wider text-slate-400">{item.owned}/{item.perPlayerLimit} canjeado(s)</p>
      <button
        type="button"
        disabled={busy || soldOut || !affordable}
        className="flex h-10 w-full items-center justify-center gap-1.5 font-display text-sm font-bold uppercase tracking-[0.1em] transition disabled:bg-slate-800 disabled:text-slate-600 enabled:bg-fuchsia-600 enabled:text-white enabled:hover:bg-fuchsia-500"
        style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}
        onClick={handleRedeem}
      >
        {soldOut ? "Agotada" : busy ? "…" : (
          <>
            {item.costPoints}
            <FragmentIcon className="h-4 w-4" />
          </>
        )}
      </button>
      {error ? <p className="text-center text-xs text-rose-300">{error}</p> : null}
      {showObjectDestination ? (
        <p className="text-center text-[11px] leading-snug text-emerald-300">
          Añadido a tus Objetos del arsenal.{" "}
          <Link href="/hub/arsenal?seccion=objetos" className="font-bold text-emerald-200 underline underline-offset-2 hover:text-emerald-100">
            Verlo
          </Link>
        </p>
      ) : null}
    </div>
  );
}

export function EventPanel({ overview, eventMissions, onClose }: IEventPanelProps) {
  const [balance, setBalance] = useState(overview.balance);
  const [items, setItems] = useState(overview.items);
  const [showEarn, setShowEarn] = useState(false);
  const hasEarnInfo = overview.earnRules.length > 0 || eventMissions.length > 0;
  const cardIds = useMemo(() => items.filter((i) => i.rewardKind === "CARD" && i.cardId).map((i) => i.cardId as string), [items]);
  const cardMap = useCardsByids(cardIds);

  function handleRedeemed(itemId: string, newBalance: number) {
    setBalance(newBalance);
    setItems((prev) => prev.map((item) => (item.itemId === itemId ? { ...item, owned: item.owned + 1 } : item)));
  }

  return (
    <ProgressionDialogShell
      title={overview.name}
      subtitle={formatRemaining(overview.endsAt)}
      accent="fuchsia"
      maxWidthClass="max-w-3xl"
      onClose={onClose}
      icon={
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
        </svg>
      }
      headerExtra={
        <div className="flex items-center justify-between border border-fuchsia-700/40 bg-fuchsia-500/10 px-4 py-3" style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}>
          <div className="flex items-center gap-3">
            <FragmentIcon className="h-9 w-9 drop-shadow-[0_0_10px_rgba(232,121,249,0.6)]" />
            <div>
              <p className="font-display text-xs uppercase tracking-[0.2em] text-fuchsia-300">{overview.currencyName}</p>
              <p className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Tu saldo</p>
            </div>
          </div>
          <span className="font-display text-3xl font-black text-fuchsia-100">{balance.toLocaleString()}</span>
        </div>
      }
    >
      {overview.description ? <p className="mb-4 text-sm leading-relaxed text-slate-300">{overview.description}</p> : null}

      {hasEarnInfo ? (
        <div className="mb-5 border border-cyan-900/50 bg-[#03101c]/60" style={{ clipPath: "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)" }}>
          <button type="button" onClick={() => setShowEarn((value) => !value)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-cyan-500/5">
            <h3 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Cómo ganar {overview.currencyName}</h3>
            <svg viewBox="0 0 24 24" className={`h-4 w-4 fill-none stroke-cyan-300 transition-transform ${showEarn ? "rotate-180" : ""}`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <AnimatePresence initial={false}>
            {showEarn ? (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="flex flex-wrap gap-2 px-3.5 pb-3.5">
                  {overview.earnRules.map((rule) => (
                    <div key={rule.actionType} className="flex items-center gap-2 border border-fuchsia-800/40 bg-fuchsia-500/5 px-3 py-1.5" style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}>
                      <span className="text-sm text-slate-200">{progressionActionLabel(rule.actionType)}</span>
                      <span className="flex items-center gap-1 font-display text-sm font-bold text-fuchsia-200">+{rule.pointsPer}<FragmentIcon className="h-3.5 w-3.5" /></span>
                    </div>
                  ))}
                  {eventMissions.map((mission) => (
                    <div key={mission.missionId} className="flex items-center gap-2 border border-fuchsia-800/40 bg-fuchsia-500/5 px-3 py-1.5" style={{ clipPath: "polygon(6px 0,100% 0,100% calc(100% - 6px),calc(100% - 6px) 100%,0 100%,0 6px)" }}>
                      <span className="text-sm text-slate-200">{mission.title}</span>
                      <span className="flex items-center gap-1 font-display text-sm font-bold text-fuchsia-200">+{mission.rewardNexus}<FragmentIcon className="h-3.5 w-3.5" /></span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}

      <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-[0.2em] text-fuchsia-400/90">Tienda de canje</h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4">
        {items.map((item) => (
          <ShopItem key={item.itemId} item={item} balance={balance} onRedeemed={handleRedeemed} cardMap={cardMap} />
        ))}
      </div>
    </ProgressionDialogShell>
  );
}
