// src/components/hub/home/objects/ArsenalObjectsPanel.tsx - Sección de OBJETOS del arsenal: los objetos que ya
// tiene el jugador y la acción de usarlos sobre una carta (hoy: el USB Raro sube niveles).
//
// Vive aparte del deck-builder porque los objetos no son cartas: aquí no se arma mazo, se consume un objeto
// sobre una carta. El nivel resultante lo calcula el servidor (level-candy-rules); esta UI solo elige y muestra.
"use client";

import Image from "next/image";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopItem } from "@/services/market/shop-items";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";

interface IArsenalObjectsPanelProps {
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  /** El conmutador Cartas/Objetos (se pinta en la cabecera de esta sección para poder volver). */
  sectionSwitch: ReactNode;
  /** Actualiza la progresión de una carta tras usar un caramelo, para que el nivel se refleje sin recargar. */
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onError: (message: string) => void;
}

interface IConsumeResult {
  cardId: string;
  oldLevel: number;
  newLevel: number;
  newXp: number;
  wastedLevels: number;
}

export function ArsenalObjectsPanel({ collection, cardProgressById, sectionSwitch, onCardLeveled, onError }: IArsenalObjectsPanelProps) {
  const [items, setItems] = useState<IShopItem[] | null>(null);
  const [selectedCandyId, setSelectedCandyId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isUsing, setIsUsing] = useState(false);
  const [lastResult, setLastResult] = useState<IConsumeResult | null>(null);

  const reloadItems = useCallback(() => {
    void fetch("/api/market/items", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { items?: IShopItem[] }) => setItems((body.items ?? []).filter((item) => item.owned > 0)))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => reloadItems(), [reloadItems]);

  // Solo las Entity sacan provecho de subir de nivel (ATK/DEF); el resto no gana atributos, así que no se ofrecen.
  const levelableCards = useMemo(
    () => collection.filter((entry) => entry.card.type === "ENTITY"),
    [collection],
  );
  const selectedCard = levelableCards.find((entry) => entry.card.id === selectedCardId) ?? null;
  const selectedCardLevel = selectedCardId ? cardProgressById.get(selectedCardId)?.level ?? 0 : 0;
  const isSelectedCardMaxed = selectedCardLevel >= getMaxCardLevel();
  const canUse = Boolean(selectedCandyId && selectedCard) && !isSelectedCardMaxed && !isUsing;

  const handleUse = useCallback(async () => {
    if (!selectedCandyId || !selectedCardId) return;
    setIsUsing(true);
    setLastResult(null);
    try {
      const response = await fetch("/api/progression/candy/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candyId: selectedCandyId, cardId: selectedCardId, operationId: crypto.randomUUID() }),
      });
      const body = (await response.json()) as IConsumeResult & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "No se pudo usar el objeto.");
      onCardLeveled(selectedCardId, body.newLevel, body.newXp);
      setLastResult(body);
      setSelectedCandyId(null);
      reloadItems();
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo usar el objeto.");
    } finally {
      setIsUsing(false);
    }
  }, [onCardLeveled, onError, reloadItems, selectedCandyId, selectedCardId]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-300" aria-hidden />
          <h2 className="font-display text-base font-black uppercase tracking-[0.16em] text-amber-100">Objetos</h2>
        </div>
        {sectionSwitch}
      </div>

      {items === null ? (
        <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>
      ) : items.length === 0 ? (
        <div className="m-auto max-w-sm text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-amber-100">No tienes objetos</p>
          <p className="mt-1 text-xs text-slate-400">Consigue el USB Raro en la sección Objetos del Mercado para subir de nivel tus cartas al instante.</p>
        </div>
      ) : (
        <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          {/* 1) Elige el objeto */}
          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber-400/80">1 · Elige un objeto</p>
            <ul className="flex flex-wrap gap-2">
              {items.map((item) => {
                const isActive = selectedCandyId === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCandyId(isActive ? null : item.id)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
                        isActive ? "border-amber-300 bg-amber-500/20" : "border-amber-500/35 bg-[#0a0703]/70 hover:border-amber-400/70"
                      }`}
                    >
                      <div className="relative h-9 w-9 shrink-0">
                        {item.imageUrl ? <Image src={item.imageUrl} alt="" fill sizes="36px" className="object-contain" /> : <Package className="h-full w-full text-amber-400/60" />}
                      </div>
                      <span className="text-left">
                        <span className="block font-display text-xs font-black uppercase text-amber-100">{item.name}</span>
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-400">Tienes {item.owned} · +{item.levels} niv.</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 2) Elige la carta */}
          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber-400/80">2 · Elige la carta a subir</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {levelableCards.map((entry) => {
                const progress = cardProgressById.get(entry.card.id);
                const isActive = selectedCardId === entry.card.id;
                return (
                  <li key={entry.card.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCardId(isActive ? null : entry.card.id)}
                      aria-pressed={isActive}
                      className="w-full"
                    >
                      <CardThumbnail
                        card={entry.card}
                        versionTier={progress?.versionTier ?? 0}
                        level={progress?.level ?? 0}
                        xp={progress?.xp ?? 0}
                        isSelected={isActive}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {/* Resultado de la última subida */}
      {lastResult ? (
        <p className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2 text-center font-display text-sm font-bold uppercase tracking-wide text-emerald-200">
          Nivel {lastResult.oldLevel} → {lastResult.newLevel}
          {lastResult.wastedLevels > 0 ? ` (${lastResult.wastedLevels} nivel(es) sin usar: la carta está al máximo)` : ""}
        </p>
      ) : null}

      {/* Acción */}
      {items && items.length > 0 ? (
        <button
          type="button"
          disabled={!canUse}
          onClick={() => void handleUse()}
          className="h-12 w-full shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 font-display text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.4)] transition hover:from-amber-400 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUsing ? "Usando…" : isSelectedCardMaxed ? "La carta está al máximo" : !selectedCandyId ? "Elige un objeto" : !selectedCardId ? "Elige una carta" : "Usar objeto"}
        </button>
      ) : null}
    </div>
  );
}
