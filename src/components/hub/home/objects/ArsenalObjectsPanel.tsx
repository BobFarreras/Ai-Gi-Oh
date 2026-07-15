// src/components/hub/home/objects/ArsenalObjectsPanel.tsx - Sección de OBJETOS del arsenal: SOLO objetos (con su
// imagen), no cartas. Para usar un objeto sobre una carta se entra desde el botón "Equipar objeto" del detalle
// de la carta, que trae aquí esa carta como objetivo; al elegir el objeto se aplica y se ve la cinemática.
"use client";

import Image from "next/image";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Package, Shield, Swords } from "lucide-react";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopCandyItem, IShopItems, IShopUpgradeItem } from "@/services/market/shop-items";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { ICardUpgradeBonuses, canApplyCardUpgrade } from "@/core/services/progression/card-upgrade-rules";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { ArsenalObjectApplyOverlay, IArsenalObjectApplyResult } from "@/components/hub/home/objects/ArsenalObjectApplyOverlay";

interface IArsenalObjectsPanelProps {
  /** Carta a la que se aplicará el objeto (llega desde "Equipar objeto"); null = solo mirar el inventario. */
  targetCard: ICard | null;
  cardProgressById: Map<string, IPlayerCardProgress>;
  sectionSwitch: ReactNode;
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onError: (message: string) => void;
}

interface ISelectableObject {
  id: string;
  name: string;
  detail: string;
  icon: typeof Package;
  imageUrl: string | null;
  owned: number;
  kind: "CANDY" | "UPGRADE";
  candy?: IShopCandyItem;
  upgrade?: IShopUpgradeItem;
}

function candyOption(item: IShopCandyItem): ISelectableObject {
  return { id: item.id, name: item.name, detail: `+${item.levels} niv.`, icon: Package, imageUrl: item.imageUrl, owned: item.owned, kind: "CANDY", candy: item };
}
function upgradeOption(item: IShopUpgradeItem): ISelectableObject {
  const isAttack = item.stat === "ATTACK";
  return { id: item.id, name: item.name, detail: `+${item.value} ${isAttack ? "ATK" : "DEF"}`, icon: isAttack ? Swords : Shield, imageUrl: item.imageUrl, owned: item.owned, kind: "UPGRADE", upgrade: item };
}

export function ArsenalObjectsPanel({ targetCard, cardProgressById, sectionSwitch, onCardLeveled, onError }: IArsenalObjectsPanelProps) {
  const [items, setItems] = useState<IShopItems | null>(null);
  const [upgradesByCardId, setUpgradesByCardId] = useState<Record<string, ICardUpgradeBonuses>>({});
  const [applying, setApplying] = useState(false);
  const [overlay, setOverlay] = useState<IArsenalObjectApplyResult | null>(null);

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

  const targetProgress = targetCard ? cardProgressById.get(targetCard.id) ?? null : null;
  const targetUpgrades = useMemo<ICardUpgradeBonuses>(
    () => (targetCard ? upgradesByCardId[targetCard.id] : null) ?? { attackBonus: 0, defenseBonus: 0 },
    [targetCard, upgradesByCardId],
  );

  /** ¿Se puede aplicar este objeto a la carta objetivo? (nivel máximo / tope de mejora). */
  const isObjectApplicable = useCallback(
    (option: ISelectableObject): boolean => {
      if (!targetCard) return false;
      if (option.kind === "CANDY") return (targetProgress?.level ?? 0) < getMaxCardLevel();
      return canApplyCardUpgrade(targetCard.cost, option.upgrade!.stat, targetUpgrades, option.upgrade!.value);
    },
    [targetCard, targetProgress, targetUpgrades],
  );

  const handleApply = useCallback(
    async (option: ISelectableObject) => {
      if (!targetCard || applying || !isObjectApplicable(option)) return;
      setApplying(true);
      try {
        if (option.kind === "CANDY") {
          const response = await fetch("/api/progression/candy/consume", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candyId: option.id, cardId: targetCard.id, operationId: crypto.randomUUID() }),
          });
          const body = (await response.json()) as { oldLevel: number; newLevel: number; newXp: number; error?: string };
          if (!response.ok) throw new Error(body.error ?? "No se pudo usar el objeto.");
          onCardLeveled(targetCard.id, body.newLevel, body.newXp);
          setOverlay({
            card: applyCardProgressionToCard(targetCard, { ...(targetProgress ?? { playerId: "", cardId: targetCard.id, versionTier: 0, level: 0, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "" }), level: body.newLevel, xp: body.newXp }, targetUpgrades),
            versionTier: targetProgress?.versionTier ?? 0,
            headline: `Nivel ${body.oldLevel} → ${body.newLevel}`,
            level: body.newLevel,
            xp: body.newXp,
          });
        } else {
          const response = await fetch("/api/progression/upgrade/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: option.id, cardId: targetCard.id, operationId: crypto.randomUUID() }),
          });
          const body = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(body.error ?? "No se pudo aplicar la mejora.");
          const stat = option.upgrade!.stat;
          const nextUpgrades: ICardUpgradeBonuses = {
            attackBonus: targetUpgrades.attackBonus + (stat === "ATTACK" ? option.upgrade!.value : 0),
            defenseBonus: targetUpgrades.defenseBonus + (stat === "DEFENSE" ? option.upgrade!.value : 0),
          };
          setOverlay({
            card: applyCardProgressionToCard(targetCard, targetProgress, nextUpgrades),
            versionTier: targetProgress?.versionTier ?? 0,
            headline: `+${option.upgrade!.value} ${stat === "ATTACK" ? "ATAQUE" : "DEFENSA"}`,
            level: targetProgress?.level ?? 0,
            xp: targetProgress?.xp ?? 0,
          });
        }
        reload();
      } catch (error) {
        onError(error instanceof Error ? error.message : "No se pudo usar el objeto.");
      } finally {
        setApplying(false);
      }
    },
    [applying, isObjectApplicable, onCardLeveled, onError, reload, targetCard, targetProgress, targetUpgrades],
  );

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-amber-300" aria-hidden />
          <h2 className="font-display text-base font-black uppercase tracking-[0.16em] text-amber-100">Objetos</h2>
        </div>
        {sectionSwitch}
      </div>

      {/* Contexto: a qué carta se está equipando (si venimos del botón "Equipar"). */}
      {targetCard ? (
        <p className="shrink-0 rounded-lg border border-amber-400/40 bg-[#1a1206]/60 px-3 py-2 text-center text-xs text-amber-100">
          Elige el objeto para <span className="font-black">{targetCard.name}</span>
        </p>
      ) : (
        <p className="shrink-0 text-center font-mono text-[10px] uppercase tracking-widest text-slate-500">
          Para usar un objeto, pulsa <span className="text-amber-300">Equipar objeto</span> en el detalle de una carta
        </p>
      )}

      {items === null ? (
        <p className="m-auto font-mono text-xs uppercase tracking-widest text-cyan-500/60">Cargando objetos…</p>
      ) : objectOptions.length === 0 ? (
        <div className="m-auto max-w-sm text-center">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-amber-100">No tienes objetos</p>
          <p className="mt-1 text-xs text-slate-400">Consíguelos en la sección Objetos del Mercado: el USB Raro sube de nivel y las mejoras dan ATK/DEF permanente.</p>
        </div>
      ) : (
        <ul className="home-modern-scroll grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
          {objectOptions.map((option) => {
            const Icon = option.icon;
            const applicable = !targetCard || isObjectApplicable(option);
            return (
              <li key={option.id}>
                <button
                  type="button"
                  disabled={!targetCard || applying || !applicable}
                  onClick={() => void handleApply(option)}
                  aria-label={targetCard ? `Usar ${option.name} en ${targetCard.name}` : option.name}
                  className={`flex w-full flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ${
                    targetCard && applicable ? "border-amber-400/50 bg-[#0a0703]/70 hover:border-amber-300 hover:bg-amber-500/15" : "border-amber-500/25 bg-[#0a0703]/50"
                  } disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  <div className="relative h-20 w-20">
                    {option.imageUrl ? <Image src={option.imageUrl} alt="" fill sizes="80px" className="object-contain" /> : <Icon className="h-full w-full text-amber-400/60" aria-hidden />}
                  </div>
                  <span className="font-display text-xs font-black uppercase leading-tight text-amber-100">{option.name}</span>
                  <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-slate-400">
                    <Icon className="h-3 w-3 text-amber-300" aria-hidden />
                    {option.detail} · x{option.owned}
                  </span>
                  {targetCard && !applicable ? <span className="font-mono text-[8px] uppercase tracking-widest text-rose-300/80">tope</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ArsenalObjectApplyOverlay result={overlay} onClose={() => setOverlay(null)} />
    </div>
  );
}
