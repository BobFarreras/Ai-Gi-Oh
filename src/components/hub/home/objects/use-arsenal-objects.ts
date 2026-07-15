// src/components/hub/home/objects/use-arsenal-objects.ts - Estado compartido de la sección Objetos del arsenal:
// inventario de objetos, la aplicación (con su cinemática) y los avisos para refrescar nivel/mejoras. El mapa de
// mejoras por carta lo posee el Scene (fuente única, también usada por el display del deck/almacén); aquí solo
// se lee y se avisa de los cambios.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IShopItems } from "@/services/market/shop-items";
import { CardUpgradeStat, ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { IArsenalObjectApplyResult } from "@/components/hub/home/objects/ArsenalObjectApplyOverlay";
import {
  ISelectableObject,
  applyObjectToCard,
  candyToObject,
  canApplyObjectToCard,
  upgradeToObject,
} from "@/components/hub/home/objects/arsenal-objects-shared";

interface IUseArsenalObjectsParams {
  /** Cartas BASE (catálogo) por id. La cinemática y la validación deben partir de la carta sin resolver: si se
   *  parte de una ya hidratada (nivel+objetos aplicados), applyCardProgressionToCard vuelve a sumarlos y el valor
   *  se dispara. La progresión se aplica una sola vez, aquí. */
  baseCardById: Map<string, ICard>;
  cardProgressById: Map<string, IPlayerCardProgress>;
  cardUpgradesById: Map<string, ICardUpgradeBonuses>;
  onCardLeveled: (cardId: string, level: number, xp: number) => void;
  onCardUpgraded: (cardId: string, stat: CardUpgradeStat, value: number) => void;
  onError: (message: string) => void;
}

export function useArsenalObjects({ baseCardById, cardProgressById, cardUpgradesById, onCardLeveled, onCardUpgraded, onError }: IUseArsenalObjectsParams) {
  const [items, setItems] = useState<IShopItems | null>(null);
  const [overlay, setOverlay] = useState<IArsenalObjectApplyResult | null>(null);
  const [applying, setApplying] = useState(false);

  const reload = useCallback(() => {
    void fetch("/api/market/items", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: IShopItems) => setItems({ candies: (body.candies ?? []).filter((c) => c.owned > 0), upgrades: (body.upgrades ?? []).filter((u) => u.owned > 0) }))
      .catch(() => setItems({ candies: [], upgrades: [] }));
  }, []);

  useEffect(() => reload(), [reload]);

  const objects = useMemo<ISelectableObject[]>(
    () => (items ? [...items.candies.map(candyToObject), ...items.upgrades.map(upgradeToObject)] : []),
    [items],
  );

  const canApply = useCallback(
    (object: ISelectableObject, card: ICard) => {
      const baseCard = baseCardById.get(card.id) ?? card;
      return canApplyObjectToCard(object, baseCard, cardProgressById.get(card.id) ?? null, cardUpgradesById.get(card.id));
    },
    [baseCardById, cardProgressById, cardUpgradesById],
  );

  const apply = useCallback(
    async (object: ISelectableObject, card: ICard) => {
      if (applying) return;
      setApplying(true);
      try {
        // Partir SIEMPRE de la carta base: el card que llega desde el detalle ya viene con nivel+objetos aplicados.
        const baseCard = baseCardById.get(card.id) ?? card;
        const outcome = await applyObjectToCard(object, baseCard, cardProgressById.get(card.id) ?? null, cardUpgradesById.get(card.id));
        if (outcome.leveled) onCardLeveled(outcome.leveled.cardId, outcome.leveled.level, outcome.leveled.xp);
        if (object.kind === "UPGRADE" && object.upgrade) onCardUpgraded(card.id, object.upgrade.stat, object.upgrade.value);
        setOverlay(outcome.overlay);
        reload();
      } catch (error) {
        onError(error instanceof Error ? error.message : "No se pudo usar el objeto.");
      } finally {
        setApplying(false);
      }
    },
    [applying, baseCardById, cardProgressById, cardUpgradesById, onCardLeveled, onCardUpgraded, onError, reload],
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
