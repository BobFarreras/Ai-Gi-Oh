// src/components/admin/internal/pve/use-admin-pve-modes.ts - Hook de datos del panel admin PvE: carga la configuración y expone publicación/edición.
"use client";

import { useCallback, useEffect, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import {
  IAdminPveModesSnapshot,
  IPublishOlympusSettingsCommand,
  IPublishSurvivalRulesetCommand,
  IUpsertOlympusChampionCommand,
  IUpsertOlympusLegendCommand,
  IUpsertOlympusNodeCommand,
} from "@/core/entities/admin/IAdminPveModes";

const BASE = "/api/admin/pve-modes";

const EMPTY: IAdminPveModesSnapshot = {
  survivalRulesets: [], olympusSettings: [], legends: [], champions: [],
  arenaDeckVariantIds: [], arenaOpponentIds: [],
};

export type PveModesStatus = "loading" | "idle" | "saving" | "error";
type UpsertType = "survival-ruleset" | "olympus-settings" | "olympus-legend" | "olympus-champion" | "olympus-node";

export function useAdminPveModes() {
  const [snapshot, setSnapshot] = useState<IAdminPveModesSnapshot>(EMPTY);
  const [validCards, setValidCards] = useState<ICard[]>([]);
  const [status, setStatus] = useState<PveModesStatus>("loading");
  const [feedback, setFeedback] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch(BASE);
      if (!response.ok) throw new Error("load");
      const data = (await response.json()) as IAdminPveModesSnapshot & { validCards?: ICard[] };
      setSnapshot({ ...EMPTY, ...data });
      setValidCards(data.validCards ?? []);
      setStatus("idle");
    } catch {
      setStatus("error");
      setFeedback("No se pudo cargar la configuración PvE.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const mutate = useCallback(
    async (path: "upsert" | "delete", body: unknown, successMessage: string): Promise<boolean> => {
      setStatus("saving");
      setFeedback(null);
      try {
        const response = await fetch(`${BASE}/${path}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        // El servidor explica por qué rechaza; mostrarlo evita el clásico "no se pudo guardar" sin causa.
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) throw new Error(result?.message ?? "save");
        await reload();
        setFeedback(successMessage);
        return true;
      } catch (error) {
        setStatus("error");
        setFeedback(error instanceof Error && error.message !== "save" ? error.message : "No se pudo guardar.");
        return false;
      }
    },
    [reload],
  );

  return {
    ...snapshot,
    validCards,
    status,
    feedback,
    isBusy: status === "saving" || status === "loading",
    reload,
    publishSurvivalRuleset: (data: IPublishSurvivalRulesetCommand) =>
      mutate("upsert", { type: "survival-ruleset" satisfies UpsertType, data }, "Ruleset publicado como versión nueva."),
    publishOlympusSettings: (data: IPublishOlympusSettingsCommand) =>
      mutate("upsert", { type: "olympus-settings" satisfies UpsertType, data }, "Configuración publicada como versión nueva."),
    saveLegend: (data: IUpsertOlympusLegendCommand) =>
      mutate("upsert", { type: "olympus-legend" satisfies UpsertType, data }, "Leyenda guardada."),
    saveChampion: (data: IUpsertOlympusChampionCommand) =>
      mutate("upsert", { type: "olympus-champion" satisfies UpsertType, data }, "Campeón guardado."),
    saveNode: (data: IUpsertOlympusNodeCommand) =>
      mutate("upsert", { type: "olympus-node" satisfies UpsertType, data }, "Nodo guardado."),
    removeLegend: (id: string) => mutate("delete", { type: "legend", id }, "Leyenda retirada."),
    removeNode: (id: string) => mutate("delete", { type: "node", id }, "Nodo retirado."),
  };
}

export type AdminPveModes = ReturnType<typeof useAdminPveModes>;
