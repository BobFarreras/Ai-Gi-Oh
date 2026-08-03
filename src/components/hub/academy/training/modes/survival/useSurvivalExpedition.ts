// src/components/hub/academy/training/modes/survival/useSurvivalExpedition.ts - Orquesta run, batalla, journal y liquidación de Supervivencia.
"use client";
import { useCallback, useRef, useState } from "react";
import { CombatActionJournal } from "@/core/services/match/combat-action-journal";
import { ICombatProof, IMatchActionPayload } from "@/core/entities/match";
import { ISurvivalProgress, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import {
  completeSurvivalBattle,
  issueSurvivalBattle,
  ISurvivalBattleRuntime,
  ISurvivalSettlement,
  startSurvivalRun,
} from "./survival-api-client";

/** Espaciado mínimo entre avances: el cierre siempre se envía, pase el tiempo que pase. */
const CHECKPOINT_MIN_INTERVAL_MS = 12_000;
const OVERFLOW_MESSAGE = "Este combate superó el límite de acciones registrables. Sal y reanúdalo para poder liquidarlo.";

export function useSurvivalExpedition() {
  const [run, setRun] = useState<ISurvivalRun | null>(null);
  const [battle, setBattle] = useState<ISurvivalBattleRuntime | null>(null);
  const [progress, setProgress] = useState<ISurvivalProgress | null>(null);
  const [settlement, setSettlement] = useState<ISurvivalSettlement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [milestoneInterval, setMilestoneInterval] = useState(0);
  const [milestoneHeal, setMilestoneHeal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const journalRef = useRef(new CombatActionJournal());
  const completedRef = useRef(false);
  const lastCheckpointLengthRef = useRef(0);
  const lastCheckpointAtRef = useRef(0);
  // Si el servidor liquida al recibir un avance, se guarda hasta que el tablero termine su animación.
  const pendingSettlementRef = useRef<ISurvivalSettlement | null>(null);

  /** Arranca/reanuda la run y obtiene un snapshot inmutable para el Board. */
  const enterBattle = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const started = await startSurvivalRun();
      setNotice(started.forfeitedPreviousRun
        ? "Tu expedición anterior se cerró como derrota: dejaste un combate sin terminar."
        : null);
      const issued = await issueSurvivalBattle(started.run.id);
      // Retomar un combate a medias parte del avance que el servidor ya registró.
      journalRef.current.restore(issued.journalEntries);
      completedRef.current = false;
      pendingSettlementRef.current = null;
      lastCheckpointLengthRef.current = issued.journalEntries.length;
      lastCheckpointAtRef.current = 0;
      setRun(started.run);
      setProgress(started.progress);
      setMilestoneInterval(started.milestoneInterval);
      setMilestoneHeal(started.milestoneHeal);
      setBattle(issued);
      setSettlement(null);
      return true;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo preparar la expedición.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reporta el diario al servidor. Se llama en cada frontera de turno y al terminar: el servidor decide
   * si eso cierra el combate, de modo que abandonar tras perder no permite repetirlo.
   */
  const submitJournal = useCallback(async (isFinal: boolean, reveal = false) => {
    if (!battle) return;
    if (completedRef.current) {
      // El servidor ya liquidó: el informe se enseña cuando el jugador lo pide, no a media animación.
      if (reveal && pendingSettlementRef.current) setSettlement(pendingSettlementRef.current);
      return;
    }
    if (journalRef.current.hasOverflowed()) {
      if (isFinal) setError(OVERFLOW_MESSAGE);
      return;
    }
    const entries = journalRef.current.getEntries();
    if (!isFinal) {
      // Reportar cada fase saturaría la ruta; basta con consolidar el avance cada pocos segundos.
      const isTooSoon = Date.now() - lastCheckpointAtRef.current < CHECKPOINT_MIN_INTERVAL_MS;
      if (entries.length <= lastCheckpointLengthRef.current || isTooSoon) return;
      lastCheckpointLengthRef.current = entries.length;
      lastCheckpointAtRef.current = Date.now();
    }
    if (isFinal) setIsLoading(true);
    const proof: ICombatProof = {
      sessionId: battle.session.id,
      battleId: battle.session.battleId,
      mode: "SURVIVAL",
      snapshotHash: battle.session.snapshotHash,
      protocolVersion: battle.session.protocolVersion,
      entries,
    };
    try {
      const result = await completeSurvivalBattle(battle.completionTicket, proof);
      if (!result.settled) return;
      completedRef.current = true;
      pendingSettlementRef.current = result;
      setRun(result.run);
      setProgress(result.progress);
      setError(null);
      // Liquidar y ENSEÑAR el informe son cosas distintas: el servidor cobra al acabar el duelo, pero la
      // pantalla no se cambia hasta que el jugador ha visto la subida de experiencia de sus cartas.
      if (reveal) setSettlement(result);
    } catch (caught) {
      // Un checkpoint fallido no debe interrumpir el combate; solo el envío final informa al jugador.
      if (isFinal) setError(caught instanceof Error ? caught.message : "No se pudo validar el resultado.");
    } finally {
      if (isFinal) setIsLoading(false);
    }
  }, [battle]);

  /** Registra las acciones del jugador en el orden real; las del rival las deriva el servidor. */
  const recordAction = useCallback((action: IMatchActionPayload, actorPlayerId?: string) => {
    if (!battle) return;
    const recorded = journalRef.current.append(actorPlayerId ?? battle.session.playerId, action);
    if (!recorded) {
      setError(OVERFLOW_MESSAGE);
      return;
    }
    // Cambiar de fase es la frontera natural del turno: ahí se consolida el avance.
    if (action.type === "NEXT_PHASE") void submitJournal(false);
  }, [battle, submitJournal]);

  /** Liquida con el servidor al terminar el duelo, sin sacar al jugador del tablero. */
  const completeBattle = useCallback(() => submitJournal(true), [submitJournal]);
  /** Muestra el informe: lo pide el jugador desde el overlay de resultado, ya vista la experiencia. */
  const revealSettlement = useCallback(() => submitJournal(true, true), [submitJournal]);

  return {
    run, battle, progress, settlement, error, notice, isLoading, milestoneInterval, milestoneHeal,
    enterBattle, recordAction, completeBattle, revealSettlement,
  };
}
