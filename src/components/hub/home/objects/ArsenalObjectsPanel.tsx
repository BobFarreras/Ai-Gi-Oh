// src/components/hub/home/objects/ArsenalObjectsPanel.tsx - Sección de OBJETOS del arsenal: los objetos que ya
// tiene el jugador y la acción de usarlos sobre una carta (caramelos → nivel; mejoras → ATK/DEF permanente).
//
// Vive aparte del deck-builder porque los objetos no son cartas: aquí no se arma mazo, se consume un objeto
// sobre una carta. Nivel y tope de mejora los calcula el SERVIDOR; esta UI solo elige y muestra.
"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Package, Shield, Swords } from "lucide-react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopCandyItem, IShopItems, IShopUpgradeItem } from "@/services/market/shop-items";
import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { ICardUpgradeBonuses, canApplyCardUpgrade, resolveCardUpgradeBudget } from "@/core/services/progression/card-upgrade-rules";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

interface IArsenalObjectsPanelProps {
  collection: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  sectionSwitch: ReactNode;
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onError: (message: string) => void;
}

/** Objeto seleccionable en la lista (caramelo o mejora), unificado para el flujo elegir → usar. */
interface ISelectableObject {
  id: string;
  name: string;
  detail: string;
  icon: typeof Package;
  owned: number;
  kind: "CANDY" | "UPGRADE";
  upgrade?: IShopUpgradeItem;
}

function candyOption(item: IShopCandyItem): ISelectableObject {
  return { id: item.id, name: item.name, detail: `+${item.levels} niv.`, icon: Package, owned: item.owned, kind: "CANDY" };
}
function upgradeOption(item: IShopUpgradeItem): ISelectableObject {
  const isAttack = item.stat === "ATTACK";
  return { id: item.id, name: item.name, detail: `+${item.value} ${isAttack ? "ATK" : "DEF"}`, icon: isAttack ? Swords : Shield, owned: item.owned, kind: "UPGRADE", upgrade: item };
}

export function ArsenalObjectsPanel({ collection, cardProgressById, sectionSwitch, onCardLeveled, onError }: IArsenalObjectsPanelProps) {
  const [items, setItems] = useState<IShopItems | null>(null);
  const [upgradesByCardId, setUpgradesByCardId] = useState<Record<string, ICardUpgradeBonuses>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isUsing, setIsUsing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(() => {
    void fetch("/api/market/items", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: IShopItems) => setItems({ candies: (body.candies ?? []).filter((c) => c.owned > 0), upgrades: (body.upgrades ?? []).filter((u) => u.owned > 0) }))
      .catch(() => setItems({ candies: [], upgrades: [] }));
    void fetch("/api/progression/upgrades", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { upgrades?: Record<string, ICardUpgradeBonuses> }) => setUpgradesByCardId(body.upgrades ?? {}))
      .catch(() => setUpgradesByCardId({}));
  }, []);

  useEffect(() => reload(), [reload]);

  const objectOptions = useMemo<ISelectableObject[]>(
    () => (items ? [...items.candies.map(candyOption), ...items.upgrades.map(upgradeOption)] : []),
    [items],
  );
  const selectedObject = objectOptions.find((option) => option.id === selectedObjectId) ?? null;

  // Solo las Entity sacan provecho de subir de nivel o de ATK/DEF; el resto no gana atributos.
  const levelableCards = useMemo(() => collection.filter((entry) => entry.card.type === "ENTITY"), [collection]);
  const selectedCardEntry = levelableCards.find((entry) => entry.card.id === selectedCardId) ?? null;

  const selectedCardLevel = selectedCardId ? cardProgressById.get(selectedCardId)?.level ?? 0 : 0;
  const selectedCardUpgrades = useMemo<ICardUpgradeBonuses>(
    () => (selectedCardId ? upgradesByCardId[selectedCardId] : null) ?? { attackBonus: 0, defenseBonus: 0 },
    [selectedCardId, upgradesByCardId],
  );

  const { canUse, actionLabel } = useMemo(() => {
    if (!selectedObject || !selectedCardEntry) return { canUse: false, actionLabel: !selectedObject ? "Elige un objeto" : "Elige una carta" };
    if (selectedObject.kind === "CANDY") {
      if (selectedCardLevel >= getMaxCardLevel()) return { canUse: false, actionLabel: "La carta está al máximo" };
      return { canUse: true, actionLabel: "Usar objeto" };
    }
    const upgrade = selectedObject.upgrade!;
    if (!canApplyCardUpgrade(selectedCardEntry.card.cost, upgrade.stat, selectedCardUpgrades, upgrade.value)) {
      return { canUse: false, actionLabel: "Tope de mejora alcanzado" };
    }
    return { canUse: true, actionLabel: "Usar objeto" };
  }, [selectedObject, selectedCardEntry, selectedCardLevel, selectedCardUpgrades]);

  const handleUse = useCallback(async () => {
    if (!selectedObject || !selectedCardId || !canUse) return;
    setIsUsing(true);
    setFeedback(null);
    try {
      if (selectedObject.kind === "CANDY") {
        const response = await fetch("/api/progression/candy/consume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candyId: selectedObject.id, cardId: selectedCardId, operationId: crypto.randomUUID() }),
        });
        const body = (await response.json()) as { oldLevel: number; newLevel: number; newXp: number; error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo usar el objeto.");
        onCardLeveled(selectedCardId, body.newLevel, body.newXp);
        setFeedback(`Nivel ${body.oldLevel} → ${body.newLevel}`);
      } else {
        const response = await fetch("/api/progression/upgrade/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: selectedObject.id, cardId: selectedCardId, operationId: crypto.randomUUID() }),
        });
        const body = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(body.error ?? "No se pudo aplicar la mejora.");
        setFeedback(`${selectedObject.detail} aplicado`);
      }
      setSelectedObjectId(null);
      reload();
    } catch (error) {
      onError(error instanceof Error ? error.message : "No se pudo usar el objeto.");
    } finally {
      setIsUsing(false);
    }
  }, [canUse, onCardLeveled, onError, reload, selectedCardId, selectedObject]);

  if (items === null) {
    return <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>;
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-300" aria-hidden />
          <h2 className="font-display text-base font-black uppercase tracking-[0.16em] text-amber-100">Objetos</h2>
        </div>
        {sectionSwitch}
      </div>

      {objectOptions.length === 0 ? (
        <div className="m-auto max-w-sm text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-amber-100">No tienes objetos</p>
          <p className="mt-1 text-xs text-slate-400">Consíguelos en la sección Objetos del Mercado: el USB Raro sube de nivel y las mejoras dan ATK/DEF permanente.</p>
        </div>
      ) : (
        <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber-400/80">1 · Elige un objeto</p>
            <ul className="flex flex-wrap gap-2">
              {objectOptions.map((option) => {
                const isActive = selectedObjectId === option.id;
                const Icon = option.icon;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedObjectId(isActive ? null : option.id)}
                      aria-pressed={isActive}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${isActive ? "border-amber-300 bg-amber-500/20" : "border-amber-500/35 bg-[#0a0703]/70 hover:border-amber-400/70"}`}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                      <span className="text-left">
                        <span className="block font-display text-xs font-black uppercase text-amber-100">{option.name}</span>
                        <span className="block font-mono text-[9px] uppercase tracking-widest text-slate-400">Tienes {option.owned} · {option.detail}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-amber-400/80">2 · Elige la carta</p>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
              {levelableCards.map((entry) => {
                const progress = cardProgressById.get(entry.card.id);
                const isActive = selectedCardId === entry.card.id;
                // La miniatura muestra ATK/DEF YA con nivel + mejoras, para que el jugador vea el efecto real.
                const displayCard = applyCardProgressionToCard(entry.card, progress ?? null, upgradesByCardId[entry.card.id]);
                return (
                  <li key={entry.card.id}>
                    <button type="button" onClick={() => setSelectedCardId(isActive ? null : entry.card.id)} aria-pressed={isActive} className="w-full">
                      <CardThumbnail card={displayCard} versionTier={progress?.versionTier ?? 0} level={progress?.level ?? 0} xp={progress?.xp ?? 0} isSelected={isActive} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {/* Margen de mejora de la carta elegida (solo relevante para objetos de mejora) */}
      {selectedCardEntry && selectedObject?.kind === "UPGRADE" ? (
        <p className="shrink-0 text-center font-mono text-[10px] uppercase tracking-widest text-slate-400">
          Margen · ATK {resolveCardUpgradeBudget(selectedCardEntry.card.cost) - selectedCardUpgrades.attackBonus} · DEF {resolveCardUpgradeBudget(selectedCardEntry.card.cost) - selectedCardUpgrades.defenseBonus}
        </p>
      ) : null}

      {feedback ? (
        <p className="shrink-0 rounded-lg border border-emerald-500/50 bg-emerald-500/10 py-2 text-center font-display text-sm font-bold uppercase tracking-wide text-emerald-200">{feedback}</p>
      ) : null}

      {objectOptions.length > 0 ? (
        <button
          type="button"
          disabled={!canUse || isUsing}
          onClick={() => void handleUse()}
          className="h-12 w-full shrink-0 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 font-display text-sm font-black uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.4)] transition hover:from-amber-400 hover:to-yellow-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isUsing ? "Usando…" : actionLabel}
        </button>
      ) : null}
    </div>
  );
}
