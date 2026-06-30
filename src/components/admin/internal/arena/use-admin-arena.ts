// src/components/admin/internal/arena/use-admin-arena.ts - Hook de datos del panel admin de arena: carga el catálogo y expone mutaciones (upsert/delete).
"use client";

import { useCallback, useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import {
  IAdminArenaOpponent,
  IAdminArenaTier,
  IUpsertArenaOpponentCommand,
  IUpsertArenaTierCommand,
  IUpsertArenaVariantCommand,
} from "@/core/entities/training/IAdminArena";

const BASE = "/api/admin/arena";

type ArenaStatus = "loading" | "idle" | "saving" | "error";

export function useAdminArena() {
  const [opponents, setOpponents] = useState<IAdminArenaOpponent[]>([]);
  const [tiers, setTiers] = useState<IAdminArenaTier[]>([]);
  const [validCards, setValidCards] = useState<ICard[]>([]);
  const [status, setStatus] = useState<ArenaStatus>("loading");
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(BASE);
      if (!response.ok) throw new Error("load");
      const data = (await response.json()) as { opponents: IAdminArenaOpponent[]; tiers: IAdminArenaTier[]; validCards: ICard[] };
      setOpponents(data.opponents ?? []);
      setTiers(data.tiers ?? []);
      setValidCards(data.validCards ?? []);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(
    async (path: "upsert" | "delete", body: unknown): Promise<boolean> => {
      setStatus("saving");
      setFeedback(null);
      try {
        const response = await fetch(`${BASE}/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
        if (!response.ok) throw new Error("save");
        await reload();
        setFeedback("Cambios guardados.");
        return true;
      } catch {
        setStatus("error");
        setFeedback("No se pudo guardar.");
        return false;
      }
    },
    [reload],
  );

  return {
    opponents,
    tiers,
    validCards,
    status,
    feedback,
    saveOpponent: (data: IUpsertArenaOpponentCommand) => mutate("upsert", { type: "opponent", data }),
    saveVariant: (data: IUpsertArenaVariantCommand) => mutate("upsert", { type: "variant", data }),
    saveTier: (data: IUpsertArenaTierCommand) => mutate("upsert", { type: "tier", data }),
    remove: (type: "opponent" | "variant" | "tier", id: string | number) => mutate("delete", { type, id }),
  };
}
