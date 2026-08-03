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
  invalidateChampionDeckCache,
  issueOlympusBattle,
  purchaseChampionUpgrade,
  respecChampionUpgrades,
} from "./olympus-api-client";

/** Espaciado mínimo entre avances: el cierre siempre se envía, pase el tiempo que pase. */
const CHECKPOINT_MIN_INTERVAL_MS = 12_000;
const OVERFLOW_MESSAGE = "Este combate superó el límite de acciones registrables. Sal y reanúdalo para poder liquidarlo.";
/** Retomar no gasta otro intento, así que salir y volver es una salida segura para el jugador. */
const UNSETTLED_MESSAGE = "El servidor todavía no da este combate por terminado. Vuelve a pulsar para reintentar; si sigue igual, sal y retómalo: no gasta otro intento.";

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
  const submitJournal = useCallback(async (isFinal: boolean, reveal = false) => {
    if (!battle) return;
    if (completedRef.current) {
      if (reveal && pendingSettlementRef.current) setSettlement(pendingSettlementRef.current);
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
      if (!result.settled) {
        // Mismo agujero que en Supervivencia: sin este aviso, «Ver informe» no hacía nada y sin explicación.
        if (isFinal) setError(UNSETTLED_MESSAGE);
        return;
      }
      completedRef.current = true;
      pendingSettlementRef.current = result;
      setError(null);
      // Liquidar y ENSEÑAR el informe son cosas distintas: el servidor cobra al acabar el duelo, pero la
      // pantalla no cambia hasta que el jugador ha visto la subida de experiencia de sus cartas.
      if (reveal) setSettlement(result);
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
    /** Liquida con el servidor al terminar el duelo, sin sacar al jugador del tablero. */
    completeBattle: useCallback(() => submitJournal(true), [submitJournal]),
    /** Muestra el informe: lo pide el jugador desde el overlay, ya vista la experiencia de sus cartas. */
    revealSettlement: useCallback(() => submitJournal(true, true), [submitJournal]),
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
