// src/components/hub/home/objects/use-arsenal-objects.ts - Estado compartido de la sección Objetos del arsenal:
// inventario de objetos, mejoras por carta, la aplicación (con su cinemática) y a qué carta se refresca el nivel.
// Lo usa el Scene para que los DOS flujos de equipar compartan datos y lógica.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopItems } from "@/services/market/shop-items";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { IArsenalObjectApplyResult } from "@/components/hub/home/objects/ArsenalObjectApplyOverlay";
import {
  ISelectableObject,
  applyObjectToCard,
  candyToObject,
  canApplyObjectToCard,
  upgradeToObject,
} from "@/components/hub/home/objects/arsenal-objects-shared";

interface IUseArsenalObjectsParams {
  cardProgressById: Map<string, IPlayerCardProgress>;
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onError: (message: string) => void;
}

export function useArsenalObjects({ cardProgressById, onCardLeveled, onError }: IUseArsenalObjectsParams) {
  const [items, setItems] = useState<IShopItems | null>(null);
  const [upgradesByCardId, setUpgradesByCardId] = useState<Record<string, ICardUpgradeBonuses>>({});
  const [overlay, setOverlay] = useState<IArsenalObjectApplyResult | null>(null);
  const [applying, setApplying] = useState(false);

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

  const objects = useMemo<ISelectableObject[]>(
    () => (items ? [...items.candies.map(candyToObject), ...items.upgrades.map(upgradeToObject)] : []),
    [items],
  );

  const canApply = useCallback(
    (object: ISelectableObject, card: ICard) => canApplyObjectToCard(object, card, cardProgressById.get(card.id) ?? null, upgradesByCardId[card.id]),
    [cardProgressById, upgradesByCardId],
  );

  const apply = useCallback(
    async (object: ISelectableObject, card: ICard) => {
      if (applying) return;
      setApplying(true);
      try {
        const outcome = await applyObjectToCard(object, card, cardProgressById.get(card.id) ?? null, upgradesByCardId[card.id]);
        if (outcome.leveled) onCardLeveled(outcome.leveled.cardId, outcome.leveled.level, outcome.leveled.xp);
        setOverlay(outcome.overlay);
        reload();
      } catch (error) {
        onError(error instanceof Error ? error.message : "No se pudo usar el objeto.");
      } finally {
        setApplying(false);
      }
    },
    [applying, cardProgressById, onCardLeveled, onError, reload, upgradesByCardId],
  );

  return {
    items,
    objects,
    applying,
    overlay,
    closeOverlay: useCallback(() => setOverlay(null), []),
    canApply,
    apply,
  };
}
