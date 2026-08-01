// src/components/hub/academy/training/modes/olympus/useOlympusMode.ts - Orquesta catálogo, árbol, batalla y liquidación de Olimpo.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CombatActionJournal } from "@/core/services/match/combat-action-journal";
import { ICombatProof, IMatchActionPayload } from "@/core/entities/match";
import {
  IOlympusBattleRuntime,
  IOlympusOverview,
  IOlympusSettlement,
  completeOlympusBattle,
  fetchOlympusOverview,
  issueOlympusBattle,
  purchaseChampionUpgrade,
  respecChampionUpgrades,
} from "./olympus-api-client";

/** Espaciado mínimo entre avances: el cierre siempre se envía, pase el tiempo que pase. */
const CHECKPOINT_MIN_INTERVAL_MS = 12_000;
const OVERFLOW_MESSAGE = "Este combate superó el límite de acciones registrables. Sal y reanúdalo para poder liquidarlo.";

export function useOlympusMode() {
  const [overview, setOverview] = useState<IOlympusOverview | null>(null);
  const [battle, setBattle] = useState<IOlympusBattleRuntime | null>(null);
  const [settlement, setSettlement] = useState<IOlympusSettlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const journalRef = useRef(new CombatActionJournal());
  const completedRef = useRef(false);
  const lastCheckpointLengthRef = useRef(0);
  const lastCheckpointAtRef = useRef(0);
  // Si el servidor liquida al recibir un avance, se guarda hasta que el tablero termine su animación.
  const pendingSettlementRef = useRef<IOlympusSettlement | null>(null);

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

  /** Emite la batalla (consume intento) o reanuda la pendiente sin gastar otro. */
  const enterBattle = useCallback(async (championId: string, opponentId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const issued = await issueOlympusBattle(championId, opponentId);
      journalRef.current.restore(issued.journalEntries);
      completedRef.current = false;
      pendingSettlementRef.current = null;
      lastCheckpointLengthRef.current = issued.journalEntries.length;
      lastCheckpointAtRef.current = 0;
      setBattle(issued);
      setSettlement(null);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo emitir el combate.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reporta el diario al servidor en cada frontera de turno y al terminar; él decide si eso cierra el
   * combate. Como deriva el turno de la leyenda, ocultar el envío final no evita la derrota.
   */
  const submitJournal = useCallback(async (isFinal: boolean) => {
    if (!battle) return;
    if (completedRef.current) {
      if (isFinal && pendingSettlementRef.current) setSettlement(pendingSettlementRef.current);
      return;
    }
    if (journalRef.current.hasOverflowed()) {
      if (isFinal) setError(OVERFLOW_MESSAGE);
      return;
    }
    const entries = journalRef.current.getEntries();
    if (!isFinal) {
      const isTooSoon = Date.now() - lastCheckpointAtRef.current < CHECKPOINT_MIN_INTERVAL_MS;
      if (entries.length <= lastCheckpointLengthRef.current || isTooSoon) return;
      lastCheckpointLengthRef.current = entries.length;
      lastCheckpointAtRef.current = Date.now();
    }
    if (isFinal) setIsLoading(true);
    const proof: ICombatProof = {
      sessionId: battle.session.id,
      battleId: battle.session.battleId,
      mode: "OLYMPUS",
      snapshotHash: battle.session.snapshotHash,
      protocolVersion: battle.session.protocolVersion,
      entries,
    };
    try {
      const result = await completeOlympusBattle(battle.completionTicket, proof);
      if (!result.settled) return;
      completedRef.current = true;
      pendingSettlementRef.current = result;
      setError(null);
      if (isFinal) setSettlement(result);
    } catch (caught) {
      // Un checkpoint fallido no debe interrumpir el combate; solo el envío final informa al jugador.
      if (isFinal) setError(caught instanceof Error ? caught.message : "No se pudo validar el resultado.");
    } finally {
      if (isFinal) setIsLoading(false);
    }
  }, [battle]);

  /** Registra las acciones del jugador en orden; las de la leyenda las deriva el servidor. */
  const recordAction = useCallback((action: IMatchActionPayload, actorPlayerId?: string) => {
    if (!battle) return;
    const recorded = journalRef.current.append(actorPlayerId ?? battle.session.playerId, action);
    if (!recorded) {
      setError(OVERFLOW_MESSAGE);
      return;
    }
    if (action.type === "NEXT_PHASE") void submitJournal(false);
  }, [battle, submitJournal]);

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

  return {
    overview,
    battle,
    settlement,
    error,
    isLoading,
    reloadOverview,
    enterBattle,
    recordAction,
    completeBattle: useCallback(() => submitJournal(true), [submitJournal]),
    dismissBattle: useCallback(() => { setBattle(null); setSettlement(null); }, []),
    clearError: useCallback(() => setError(null), []),
    purchaseUpgrade: (championId: string, nodeId: string) =>
      runUpgrade(() => purchaseChampionUpgrade(championId, nodeId), "No se pudo comprar la mejora."),
    respecUpgrades: (championId: string) =>
      runUpgrade(() => respecChampionUpgrades(championId), "No se pudo reasignar el árbol."),
  };
}

export type OlympusMode = ReturnType<typeof useOlympusMode>;
