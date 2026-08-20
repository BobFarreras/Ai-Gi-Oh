// src/components/hub/academy/training/modes/olympus/useOlympusMode.ts - Orquesta catálogo, árbol, batalla y liquidación de Olimpo.
"use client";
import { useCallback, useEffect, useState } from "react";
import {
  IOlympusBattleRuntime,
  IOlympusOverview,
  IOlympusSettlement,
  fetchOlympusOverview,
  invalidateChampionDeckCache,
  issueOlympusBattle,
  purchaseChampionUpgrade,
  respecChampionUpgrades,
} from "./olympus-api-client";
import { useOlympusRecovery } from "./internal/use-olympus-recovery";
import { useOlympusSettlement } from "./internal/use-olympus-settlement";

export function useOlympusMode() {
  const [overview, setOverview] = useState<IOlympusOverview | null>(null);
  const [battle, setBattle] = useState<IOlympusBattleRuntime | null>(null);
  const [settlement, setSettlement] = useState<IOlympusSettlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const reloadOverview = useCallback(async () => {
    setIsLoading(true);
    try {
      setOverview(await fetchOlympusOverview());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cargar el Olimpo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadOverview();
  }, [reloadOverview]);

  const { restoreJournal, recordAction, completeBattle, revealSettlement } = useOlympusSettlement({
    battle, setSettlement, setError, setIsLoading,
  });

  /** Emite la batalla (consume intento) o reanuda la pendiente sin gastar otro. */
  const enterBattle = useCallback(async (championId: string, opponentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const issued = await issueOlympusBattle(championId, opponentId);
      restoreJournal(issued.journalEntries);
      setBattle(issued);
      setSettlement(null);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo emitir el combate.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [restoreJournal]);

  const runUpgrade = useCallback(async (operation: () => Promise<unknown>, fallback: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await operation();
      await reloadOverview();
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : fallback);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [reloadOverview]);

  const resetBattle = useOlympusRecovery({ reloadOverview, setBattle, setSettlement, setError, setIsLoading });
  return {
    overview,
    battle,
    settlement,
    error,
    isLoading,
    reloadOverview,
    enterBattle,
    recordAction,
    completeBattle,
    revealSettlement,
    resetBattle,
    dismissBattle: useCallback(() => { setBattle(null); setSettlement(null); }, []),
    clearError: useCallback(() => setError(null), []),
    // Comprar o reasignar reescala el mazo prestado: la vista previa cacheada deja de ser cierta.
    purchaseUpgrade: (championId: string, nodeId: string) =>
      runUpgrade(async () => {
        await purchaseChampionUpgrade(championId, nodeId);
        invalidateChampionDeckCache(championId);
      }, "No se pudo comprar la mejora."),
    respecUpgrades: (championId: string) =>
      runUpgrade(async () => {
        await respecChampionUpgrades(championId);
        invalidateChampionDeckCache(championId);
      }, "No se pudo reasignar el árbol."),
  };
}

export type OlympusMode = ReturnType<typeof useOlympusMode>;
